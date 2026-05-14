import { getDefaultUserId } from "@/lib/guest"
import { db } from "@/db"
import { sites, urls, submitLogs, users, siteDailyStats, urlSearchAnalytics, searchQueries } from "@/db/schema"
import { eq, sql, desc, gte, inArray, and, asc } from "drizzle-orm"
import Link from "next/link"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { parseEngines } from "@/lib/services/submit-engines"

import {
  Activity, Globe, Link as LinkIcon, CheckCircle2, TrendingUp,
  AlertCircle, ArrowRight, Zap, BarChart3, Clock, Eye, MousePointerClick,
  Search, Target, Cpu,
} from "lucide-react"

async function getDashboardStats(userId: string) {
  const userSites = await db.select({ id: sites.id, domain: sites.domain, engines: sites.engines }).from(sites).where(eq(sites.userId, userId))
  const siteIds = userSites.map((s) => s.id)

  const totalUrls =
    siteIds.length > 0
      ? await db.select({ count: sql`count(*)`.mapWith(Number) }).from(urls).where(inArray(urls.siteId, siteIds)).then((r) => r[0]?.count ?? 0)
      : 0

  const indexedCount =
    siteIds.length > 0
      ? await db.select({ count: sql`count(*)`.mapWith(Number) }).from(urls).where(and(inArray(urls.siteId, siteIds), eq(urls.indexStatus, "indexed"))).then((r) => r[0]?.count ?? 0)
      : 0

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  // Per-engine submission counts
  const todaySubmissionsByEngine = await db
    .select({
      engine: submitLogs.engine,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(submitLogs)
    .where(and(eq(submitLogs.userId, userId), gte(submitLogs.createdAt, todayStart)))
    .groupBy(submitLogs.engine)

  const todaySubmissions = todaySubmissionsByEngine.reduce((sum, row) => sum + (row.count ?? 0), 0)

  // Engine stats
  const engineCounts: Record<string, number> = {}
  for (const row of todaySubmissionsByEngine) {
    engineCounts[row.engine ?? "unknown"] = row.count ?? 0
  }

  // ── 7-day daily stats (index rate + traffic trends) ──
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const dailyStats = siteIds.length > 0
    ? await db
        .select({
          date: siteDailyStats.date,
          totalUrls: sql<number>`sum(${siteDailyStats.totalUrls})`,
          indexedUrls: sql<number>`sum(${siteDailyStats.indexedUrls})`,
          impressions: sql<number>`sum(${siteDailyStats.impressions})`,
          clicks: sql<number>`sum(${siteDailyStats.clicks})`,
          avgPosition: sql<number>`avg(${siteDailyStats.avgPosition})`,
        })
        .from(siteDailyStats)
        .where(
          and(
            inArray(siteDailyStats.siteId, siteIds),
            gte(siteDailyStats.date, sevenDaysAgo.toISOString().split("T")[0])
          )
        )
        .groupBy(siteDailyStats.date)
        .orderBy(asc(siteDailyStats.date))
    : []

  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split("T")[0]
    const stat = dailyStats.find((s) => s.date === key)
    return {
      date: key,
      label: key.slice(5),
      indexedRate: stat && stat.totalUrls > 0 ? Math.round((stat.indexedUrls / stat.totalUrls) * 100) : 0,
      impressions: stat?.impressions ?? 0,
      clicks: stat?.clicks ?? 0,
      avgPosition: stat?.avgPosition ? Math.round(stat.avgPosition * 10) / 10 : 0,
    }
  })

  // ── Top queries by clicks ──
  const topQueries = siteIds.length > 0
    ? await db
        .select({
          query: searchQueries.query,
          impressions: sql<number>`sum(${searchQueries.impressions})`,
          clicks: sql<number>`sum(${searchQueries.clicks})`,
          avgPosition: sql<number>`avg(${searchQueries.position})`,
        })
        .from(searchQueries)
        .where(inArray(searchQueries.siteId, siteIds))
        .groupBy(searchQueries.query)
        .orderBy(sql`sum(${searchQueries.clicks}) DESC`)
        .limit(8)
    : []

  // ── Top URLs by clicks ──
  const topUrls = siteIds.length > 0
    ? await db
        .select({
          url: urls.url,
          path: urls.path,
          impressions: sql<number>`sum(${urlSearchAnalytics.impressions})`,
          clicks: sql<number>`sum(${urlSearchAnalytics.clicks})`,
          avgPosition: sql<number>`avg(${urlSearchAnalytics.position})`,
        })
        .from(urls)
        .innerJoin(urlSearchAnalytics, eq(urls.id, urlSearchAnalytics.urlId))
        .where(inArray(urls.siteId, siteIds))
        .groupBy(urls.id, urls.url, urls.path)
        .orderBy(sql`sum(${urlSearchAnalytics.clicks}) DESC`)
        .limit(6)
    : []

  const recentLogs = await db
    .select({ createdAt: submitLogs.createdAt, engine: submitLogs.engine, status: submitLogs.status, responseMessage: submitLogs.responseMessage })
    .from(submitLogs)
    .where(eq(submitLogs.userId, userId))
    .orderBy(desc(submitLogs.createdAt))
    .limit(8)

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

  return {
    totalSites: userSites.length,
    sites: userSites,
    totalUrls,
    indexedCount,
    todaySubmissions,
    engineCounts,
    recentLogs,
    trend,
    topQueries,
    topUrls,
    hasGoogleToken: !!user?.googleAccessToken,
  }
}

export default async function DashboardPage() {
  // Guest mode — no auth required
  const userId = getDefaultUserId()
  const stats = await getDashboardStats(userId)
  const indexRate = stats.totalUrls > 0 ? Math.round((stats.indexedCount / stats.totalUrls) * 100) : 0

  const totalImpressions = stats.trend.reduce((sum, t) => sum + t.impressions, 0)
  const totalClicks = stats.trend.reduce((sum, t) => sum + t.clicks, 0)
  const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
  const avgPosition = stats.trend[stats.trend.length - 1]?.avgPosition ?? 0

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {!stats.hasGoogleToken && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/60 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Test Mode &mdash; Google Search Console not connected</p>
              <p className="text-sm text-amber-700/70 mt-0.5 font-medium">Sign in with Google to enable real-time indexing status and search analytics.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Dashboard</h1>
            <p className="text-black/50 mt-1 font-medium text-sm">Indexing performance and search traffic overview</p>
          </div>
          <Link href="/sites" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-bold rounded-full hover:bg-black hover:scale-[0.97] active:scale-[0.95] transition-all shadow-lg shadow-black/10">
            <Zap className="w-4 h-4" />Add Site<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BentoCard title="Sites" value={stats.totalSites} icon={<Globe className="w-5 h-5" />} />
          <BentoCard title="Index Rate" value={`${indexRate}%`} icon={<CheckCircle2 className="w-5 h-5" />} accent />
          <BentoCard title="7d Clicks" value={totalClicks} icon={<MousePointerClick className="w-5 h-5" />} />
          <BentoCard title="7d Impressions" value={totalImpressions} icon={<Eye className="w-5 h-5" />} />
        </div>

        {/* Engine Stats Row */}
        <div className="bg-white rounded-3xl border border-black/[0.05] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-black/40" />
            <h2 className="text-sm font-bold text-black uppercase tracking-wider">Today&apos;s Submissions by Engine</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <EngineStatCard name="Google" count={stats.engineCounts["google"] ?? 0} />
            <EngineStatCard name="Bing" count={stats.engineCounts["bing"] ?? 0} />
            <EngineStatCard name="Yandex" count={stats.engineCounts["yandex"] ?? 0} />
          </div>
        </div>

        {/* Sites Overview with Engines */}
        {stats.sites.length > 0 && (
          <div className="bg-white rounded-3xl border border-black/[0.05] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-black/40" />
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">Sites Overview</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {stats.sites.map((site) => {
                const enabled = parseEngines(site.engines)
                return (
                  <div key={site.id} className="flex items-center justify-between px-4 py-3 bg-black/[0.02] rounded-xl">
                    <Link href={`/sites/${site.id}`} className="text-sm font-bold text-black hover:underline underline-offset-4">
                      {site.domain}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      {enabled.map((e) => (
                        <span
                          key={e}
                          className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-black/[0.05] text-[10px] font-bold text-black/50 uppercase tracking-wider"
                        >
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Index Rate + Search Traffic Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Index Rate Trend */}
          <div className="bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-black/40" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Index Rate Trend</h2>
              </div>
              <span className="text-2xl font-bold tracking-tight">{indexRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/[0.04] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[#22c55e] rounded-full transition-all duration-1000 ease-out" style={{ width: `${indexRate}%` }} />
            </div>
            <p className="text-xs text-black/40 font-medium mb-6">{stats.indexedCount} of {stats.totalUrls} URLs indexed</p>
            <MiniTrend data={stats.trend.map(t => t.indexedRate)} labels={stats.trend.map(t => t.label)} color="#22c55e" max={100} unit="%" />
          </div>

          {/* Search Traffic Trend */}
          <div className="bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-black/40" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Search Traffic (7 days)</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-black/30 uppercase tracking-wider">Avg CTR {avgCtr}%</span>
                <span className="text-xs font-bold text-black/30 uppercase tracking-wider">Pos {avgPosition}</span>
              </div>
            </div>
            <DualBarChart
              labels={stats.trend.map(t => t.label)}
              primaryData={stats.trend.map(t => t.impressions)}
              secondaryData={stats.trend.map(t => t.clicks)}
              primaryColor="bg-black/[0.06]"
              secondaryColor="bg-[#1a1a1a]"
            />
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-black/[0.06]" />
                <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">Impressions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">Clicks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Queries + Top URLs */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-black/40" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Top Performing Queries</h2>
              </div>
              <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">By clicks</span>
            </div>
            {stats.topQueries.length === 0 ? (
              <EmptyState icon={<Search className="w-8 h-8" />} title="No query data yet" subtitle="Connect Google Search Console to see keyword performance." />
            ) : (
              <div className="space-y-3">
                {stats.topQueries.map((q, i) => (
                  <div key={i} className="flex items-center gap-4 group hover:bg-black/[0.015] -mx-4 px-4 py-3 rounded-xl transition-colors">
                    <span className="w-6 text-center text-xs font-bold text-black/20">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{q.query}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">{q.clicks} clicks</span>
                        <span className="text-[11px] font-bold text-black/20 uppercase tracking-wider">{q.impressions} imp</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">#{q.avgPosition ? Math.round(q.avgPosition * 10) / 10 : "—"}</p>
                      <p className="text-[11px] font-bold text-black/30 uppercase tracking-wider">position</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-black/40" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Top URLs</h2>
              </div>
              <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">By clicks</span>
            </div>
            {stats.topUrls.length === 0 ? (
              <EmptyState icon={<LinkIcon className="w-8 h-8" />} title="No URL data yet" subtitle="Analytics will appear once GSC is connected." />
            ) : (
              <div className="space-y-3 flex-1">
                {stats.topUrls.map((u, i) => (
                  <div key={i} className="flex items-center gap-4 group hover:bg-black/[0.015] -mx-4 px-4 py-3 rounded-xl transition-colors">
                    <span className="w-6 text-center text-xs font-bold text-black/20">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{u.path || u.url}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">{u.clicks} clicks</span>
                        <span className="text-[11px] font-bold text-black/20 uppercase tracking-wider">{u.impressions} imp</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">#{u.avgPosition ? Math.round(u.avgPosition * 10) / 10 : "—"}</p>
                      <p className="text-[11px] font-bold text-black/30 uppercase tracking-wider">pos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-black/40" />
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">Recent Activity</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-black/40">
              <Clock className="w-3.5 h-3.5" />Last 8 events
            </div>
          </div>
          {stats.recentLogs.length === 0 ? (
            <EmptyState icon={<Activity className="w-8 h-8" />} title="No submissions yet" subtitle="Add a site to get started." />
          ) : (
            <div className="space-y-3">
              {stats.recentLogs.map((log, i) => (
                <div key={i} className="flex items-start justify-between gap-4 group hover:bg-black/[0.015] -mx-4 px-4 py-3 rounded-xl transition-colors">
                  <div className="flex gap-3 min-w-0">
                    <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${log.status === "success" ? "bg-[#22c55e]" : "bg-red-500"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-black capitalize leading-tight">{log.engine}</p>
                      {log.responseMessage && <p className="text-xs text-black/40 mt-1 leading-relaxed line-clamp-2">{log.responseMessage}</p>}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-black/30 whitespace-nowrap uppercase tracking-wider">{log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function BentoCard({ title, value, icon, accent }: { title: string; value: number | string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${accent ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-lg shadow-black/10" : "bg-white border-black/[0.05] hover:border-black/[0.10] text-black"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${accent ? "text-white/45" : "text-black/40"}`}>{title}</p>
        <div className={`p-2 rounded-xl ${accent ? "bg-white/10" : "bg-black/[0.04]"}`}><span className={accent ? "text-white/70" : "text-black/35"}>{icon}</span></div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function EngineStatCard({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-black/[0.02] rounded-xl border border-black/[0.04]">
      <div className="w-8 h-8 rounded-lg bg-black/[0.05] flex items-center justify-center">
        <Cpu className="w-4 h-4 text-black/40" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-black/30 uppercase tracking-wider">{name}</p>
        <p className="text-xl font-bold text-black">{count}</p>
      </div>
    </div>
  )
}

function MiniTrend({ data, labels, color, max = 100, unit = "" }: { data: number[]; labels: string[]; color: string; max?: number; unit?: string }) {
  const m = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((v, i) => {
        const height = v === 0 && m === 1 ? 2 : (v / max) * 100
        const isToday = i === data.length - 1
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <span className={`text-xs font-bold transition-colors ${isToday ? "text-[#22c55e]" : "text-black/0 group-hover:text-black/50"}`}>{v}{unit}</span>
            <div className="w-full flex justify-center relative">
              <div className="w-full max-w-[48px] rounded-t-xl transition-all duration-500" style={{ height: `${Math.max(height, 2)}%`, backgroundColor: color }} />
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? "text-black" : "text-black/30"}`}>{labels[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

function DualBarChart({ labels, primaryData, secondaryData, primaryColor, secondaryColor }: { labels: string[]; primaryData: number[]; secondaryData: number[]; primaryColor: string; secondaryColor: string }) {
  const max = Math.max(...primaryData, 1)
  return (
    <div className="flex items-end gap-2 h-40">
      {labels.map((label, i) => {
        const pHeight = primaryData[i] === 0 ? 2 : (primaryData[i] / max) * 100
        const sHeight = secondaryData[i] === 0 ? 2 : (secondaryData[i] / max) * 100
        const isToday = i === labels.length - 1
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <span className={`text-xs font-bold transition-colors ${isToday ? "text-[#22c55e]" : "text-black/0 group-hover:text-black/50"}`}>{primaryData[i]}</span>
            <div className="w-full flex justify-center gap-0.5 items-end h-24">
              <div className={`w-1/2 rounded-t-lg transition-all duration-500 ${primaryColor}`} style={{ height: `${Math.max(pHeight * 0.9, 2)}%` }} />
              <div className={`w-1/2 rounded-t-lg transition-all duration-500 ${secondaryColor}`} style={{ height: `${Math.max(sHeight * 0.9, 2)}%` }} />
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? "text-black" : "text-black/30"}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-10">
      <div className="w-16 h-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-4">{icon}</div>
      <p className="text-sm font-bold text-black/40">{title}</p>
      <p className="text-xs text-black/30 mt-1 font-medium">{subtitle}</p>
    </div>
  )
}
