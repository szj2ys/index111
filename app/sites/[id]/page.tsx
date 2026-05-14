import { getDefaultUserId } from "@/lib/guest"
import { db } from "@/db"
import { sites, urls, urlSearchAnalytics, searchQueries } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import Link from "next/link"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { UrlActions } from "@/app/components/url-actions"
import { SubmitAllButton } from "@/app/components/submit-all-button"
import { SyncAnalyticsButton } from "@/app/components/sync-analytics-button"
import { parseEngines } from "@/lib/services/submit-engines"
import {
  ArrowLeft, Globe, ExternalLink, Activity, CheckCircle2, Link as LinkIcon,
  AlertCircle, Eye, MousePointerClick, Search, TrendingUp, Cpu,
} from "lucide-react"

async function getSiteWithAnalytics(userId: string, siteId: string) {
  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, userId)),
  })
  if (!site) return null

  const siteUrls = await db.query.urls.findMany({
    where: eq(urls.siteId, siteId),
    with: { searchAnalytics: true },
  })

  const topQueries = await db
    .select({
      query: searchQueries.query,
      impressions: sql<number>`sum(${searchQueries.impressions})`,
      clicks: sql<number>`sum(${searchQueries.clicks})`,
      avgPosition: sql<number>`avg(${searchQueries.position})`,
    })
    .from(searchQueries)
    .where(eq(searchQueries.siteId, siteId))
    .groupBy(searchQueries.query)
    .orderBy(sql`sum(${searchQueries.clicks}) DESC`)
    .limit(10)

  const dailyStats = await db
    .select({
      date: sql<string>`date`,
      impressions: sql<number>`sum(impressions)`,
      clicks: sql<number>`sum(clicks)`,
      indexedUrls: sql<number>`sum(indexed_urls)`,
      totalUrls: sql<number>`sum(total_urls)`,
    })
    .from(sql`site_daily_stats`)
    .where(eq(sql`site_id`, siteId))
    .groupBy(sql`date`)
    .orderBy(desc(sql`date`))
    .limit(7)

  return { site, urls: siteUrls, topQueries, dailyStats: dailyStats.reverse() }
}

function getStatusBadgeClass(status: string | null): string {
  switch (status) {
    case "indexed":
      return "bg-[#22c55e]/10 text-[#15803d] border-[#22c55e]/20"
    case "not_indexed":
      return "bg-red-50 text-red-700 border-red-200"
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-black/[0.03] text-black/50 border-black/[0.06]"
  }
}

function EngineBadge({ name, count, lastAt }: { name: string; count: number; lastAt: Date | null }) {
  const label = name.charAt(0).toUpperCase() + name.slice(1)
  const lastText = lastAt
    ? new Date(lastAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—"
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/[0.06] bg-black/[0.02] text-[11px] font-bold uppercase tracking-wider text-black/50">
      <Cpu className="w-3 h-3 text-black/30" />
      <span>{label}</span>
      <span className="text-black/30">{count}</span>
      <span className="text-black/20">{lastText}</span>
    </div>
  )
}

function EngineBadges({ enabled, urlStats }: {
  enabled: string[]
  urlStats: { google: { count: number; lastAt: Date | null }; bing: { count: number; lastAt: Date | null }; yandex: { count: number; lastAt: Date | null } }
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider mr-1">Engines</span>
      {enabled.includes("google") && <EngineBadge name="google" count={urlStats.google.count} lastAt={urlStats.google.lastAt} />}
      {enabled.includes("bing") && <EngineBadge name="bing" count={urlStats.bing.count} lastAt={urlStats.bing.lastAt} />}
      {enabled.includes("yandex") && <EngineBadge name="yandex" count={urlStats.yandex.count} lastAt={urlStats.yandex.lastAt} />}
    </div>
  )
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = getDefaultUserId()
  const data = await getSiteWithAnalytics(userId, id)

  if (!data) {
    return (
      <DashboardLayout>
        <div className="max-w-[1000px] mx-auto">
          <div className="bg-white rounded-3xl border border-black/[0.05] p-16 text-center shadow-sm mt-12">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-black mb-2">Site not found</h2>
            <p className="text-black/45 font-medium mb-8">This site doesn&apos;t exist or you don&apos;t have access.</p>
            <Link href="/sites" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white text-sm font-bold rounded-full hover:bg-black transition-all shadow-lg shadow-black/10">
              <ArrowLeft className="w-4 h-4" />Back to Sites
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { site, urls: siteUrls, topQueries, dailyStats } = data
  const indexedCount = siteUrls.filter((u) => u.indexStatus === "indexed").length
  const submittedCount = siteUrls.filter((u) => u.lastSubmittedGoogle).length
  const indexRate = siteUrls.length > 0 ? Math.round((indexedCount / siteUrls.length) * 100) : 0

  const enabledEngines = parseEngines(site.engines)

  const urlStats = {
    google: {
      count: siteUrls.reduce((s, u) => s + (u.submitCountGoogle ?? 0), 0),
      lastAt: siteUrls.length > 0
        ? siteUrls.reduce((max, u) => {
            const t = u.lastSubmittedGoogle ? new Date(u.lastSubmittedGoogle).getTime() : 0
            return t > max ? t : max
          }, 0) || null
        : null,
    },
    bing: {
      count: siteUrls.reduce((s, u) => s + (u.submitCountBing ?? 0), 0),
      lastAt: siteUrls.length > 0
        ? siteUrls.reduce((max, u) => {
            const t = u.lastSubmittedBing ? new Date(u.lastSubmittedBing).getTime() : 0
            return t > max ? t : max
          }, 0) || null
        : null,
    },
    yandex: {
      count: siteUrls.reduce((s, u) => s + (u.submitCountYandex ?? 0), 0),
      lastAt: siteUrls.length > 0
        ? siteUrls.reduce((max, u) => {
            const t = u.lastSubmittedYandex ? new Date(u.lastSubmittedYandex).getTime() : 0
            return t > max ? t : max
          }, 0) || null
        : null,
    },
  }

  const totalClicks = siteUrls.reduce((sum, u) => {
    const latest = u.searchAnalytics?.[u.searchAnalytics.length - 1]
    return sum + (latest?.clicks ?? 0)
  }, 0)
  const totalImpressions = siteUrls.reduce((sum, u) => {
    const latest = u.searchAnalytics?.[u.searchAnalytics.length - 1]
    return sum + (latest?.impressions ?? 0)
  }, 0)

  return (
    <DashboardLayout>
      <div className="max-w-[1000px] mx-auto space-y-6 pb-12">
        <Link href="/sites" className="inline-flex items-center gap-1.5 text-xs font-bold text-black/35 hover:text-black transition-colors -ml-1 p-1.5 rounded-lg hover:bg-black/[0.03] uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />All Sites
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/[0.03] to-transparent rounded-bl-full pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-black">{site.domain}</h1>
                <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-sm font-medium text-black/40 hover:text-black transition-colors group">
                  {site.siteUrl}<ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${site.autoSubmitEnabled ? "bg-[#22c55e]/10 text-[#15803d] border-[#22c55e]/20" : "bg-black/[0.03] text-black/45 border-black/[0.06]"}`}>
                  {site.autoSubmitEnabled ? "Auto On" : "Auto Off"}
                </span>
                <SyncAnalyticsButton siteId={site.id} />
                <SubmitAllButton siteId={site.id} urlCount={siteUrls.length - submittedCount} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
              <StatBox label="Total URLs" value={siteUrls.length} icon={<LinkIcon className="w-4 h-4" />} />
              <StatBox label="Indexed" value={indexedCount} accent icon={<CheckCircle2 className="w-4 h-4" />} />
              <StatBox label="Impressions" value={totalImpressions} icon={<Eye className="w-4 h-4" />} />
              <StatBox label="Clicks" value={totalClicks} icon={<MousePointerClick className="w-4 h-4" />} />
            </div>

            <EngineBadges enabled={enabledEngines} urlStats={urlStats} />

            <div className="mt-6 pt-6 border-t border-black/[0.04]">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Index Rate</span>
                <span className="text-2xl font-bold text-black">{indexRate}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded-full transition-all duration-1000 ease-out" style={{ width: `${indexRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Queries */}
        {topQueries.length > 0 && (
          <div className="bg-white rounded-3xl border border-black/[0.05] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-black/40" />
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Top Search Queries</h2>
              </div>
              <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">By clicks</span>
            </div>
            <div className="space-y-3">
              {topQueries.map((q, i) => (
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
          </div>
        )}

        {/* URLs Table with Analytics */}
        <div className="bg-white rounded-3xl border border-black/[0.05] shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-5 border-b border-black/[0.04] flex items-center justify-between bg-white/50">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-black/40" />URLs
            </h2>
            <span className="px-3 py-1 bg-black/[0.03] rounded-full text-[11px] font-bold text-black/45 uppercase tracking-wider">{siteUrls.length} total</span>
          </div>

          {siteUrls.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-4">
                <LinkIcon className="w-8 h-8 text-black/15" />
              </div>
              <p className="text-black/40 font-medium text-sm">No URLs found. The sitemap may be empty or unavailable.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black/[0.04]">
                <thead className="bg-[#fbfbfa]">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-black/35 uppercase tracking-wider">Path</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-black/35 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-black/35 uppercase tracking-wider">Engines</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-black/35 uppercase tracking-wider">Impressions</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-black/35 uppercase tracking-wider">Clicks</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-black/35 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] bg-white">
                  {siteUrls.map((u) => {
                    const latest = u.searchAnalytics?.[u.searchAnalytics.length - 1]
                    const engineTags = []
                    if (u.lastSubmittedGoogle) engineTags.push("G")
                    if (u.lastSubmittedBing) engineTags.push("B")
                    if (u.lastSubmittedYandex) engineTags.push("Y")
                    return (
                      <tr key={u.id} className="hover:bg-black/[0.015] transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-black max-w-[200px] truncate">
                          <a href={u.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4 decoration-black/15 group-hover:decoration-black/30 transition-colors">{u.path || u.url}</a>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(u.indexStatus)}`}>{u.indexStatus || "unknown"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {engineTags.map((tag) => (
                              <span key={tag} className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-black/[0.05] text-[10px] font-bold text-black/40">
                                {tag}
                              </span>
                            ))}
                            {engineTags.length === 0 && <span className="text-[11px] font-bold text-black/20 uppercase tracking-wider">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-black/40">{latest?.impressions ?? "—"}</td>
                        <td className="px-6 py-4 text-sm font-bold text-black/40">{latest?.clicks ?? "—"}</td>
                        <td className="px-6 py-4 text-right"><UrlActions urlId={u.id} url={u.url} siteId={site.id} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatBox({ label, value, icon, accent, warn }: { label: string; value: number; icon?: React.ReactNode; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border transition-all duration-300 ${accent ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : warn ? "bg-red-50 text-red-800 border-red-100" : "bg-[#fbfbfa] text-black border-black/[0.04]"}`}>
      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${accent ? "text-white/45" : warn ? "text-red-400" : "text-black/40"}`}>
        {icon && <span className={accent ? "text-white/45" : warn ? "text-red-400" : "text-black/35"}>{icon}</span>}{label}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  )
}
