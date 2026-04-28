import { getSession } from "@/lib/auth"
import { getGoogleToken } from "@/lib/auth"
import { db } from "@/db"
import { sites, urls, submitLogs, users } from "@/db/schema"
import { eq, sql, desc, gte, inArray, and } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/app/components/dashboard-layout"

async function getDashboardStats(userId: string) {
  const userSites = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.userId, userId))

  const siteIds = userSites.map((s) => s.id)

  const totalUrls =
    siteIds.length > 0
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(urls)
          .where(inArray(urls.siteId, siteIds))
          .then((r) => r[0]?.count ?? 0)
      : 0

  const indexedCount =
    siteIds.length > 0
      ? await db
          .select({ count: sql<number>`count(*)` })
          .from(urls)
          .where(and(inArray(urls.siteId, siteIds), eq(urls.indexStatus, "indexed")))
          .then((r) => r[0]?.count ?? 0)
      : 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todaySubmissions = await db
    .select({ count: sql<number>`count(*)` })
    .from(submitLogs)
    .where(and(eq(submitLogs.userId, userId), gte(submitLogs.createdAt, todayStart)))
    .then((r) => r[0]?.count ?? 0)

  // 7-day trend
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const weekLogs = await db
    .select({
      date: sql<string>`date(${submitLogs.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(submitLogs)
    .where(and(eq(submitLogs.userId, userId), gte(submitLogs.createdAt, sevenDaysAgo)))
    .groupBy(sql`date(${submitLogs.createdAt})`)

  const trendMap = new Map(weekLogs.map((l) => [l.date, l.count]))
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split("T")[0]
    return { date: key, count: trendMap.get(key) ?? 0 }
  })

  const recentLogs = await db
    .select({
      createdAt: submitLogs.createdAt,
      engine: submitLogs.engine,
      status: submitLogs.status,
      responseMessage: submitLogs.responseMessage,
    })
    .from(submitLogs)
    .where(eq(submitLogs.userId, userId))
    .orderBy(desc(submitLogs.createdAt))
    .limit(10)

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return {
    totalSites: userSites.length,
    totalUrls,
    indexedCount,
    todaySubmissions,
    recentLogs,
    trend,
    hasGoogleToken: !!user?.googleAccessToken,
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const stats = await getDashboardStats(session.user.id)

  const maxBar = Math.max(...stats.trend.map((t) => t.count), 1)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Onboarding */}
        {!stats.hasGoogleToken && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-amber-900">Connect Google Search Console</p>
                <p className="text-sm text-amber-700">Sign out and sign back in to grant indexing permissions.</p>
              </div>
            </div>
            <Link
              href="/auth/signin"
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Connect
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <Link
            href="/sites"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Add Site
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Sites" value={stats.totalSites} icon="🌐" />
          <StatCard title="Total URLs" value={stats.totalUrls} icon="🔗" />
          <StatCard title="Indexed" value={stats.indexedCount} icon="✅" accent="emerald" />
          <StatCard title="Today Submissions" value={`${stats.todaySubmissions}/20`} icon="📤" />
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">7-Day Submission Trend</h2>
          <div className="flex items-end gap-3 h-40">
            {stats.trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-emerald-500 rounded-t-md transition-all"
                  style={{ height: `${(t.count / maxBar) * 100}%`, minHeight: t.count > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-slate-400">{t.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {stats.recentLogs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-500">No submissions yet. Add a site to get started.</p>
              </div>
            ) : (
              stats.recentLogs.map((log, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === "success" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm text-slate-900 capitalize">{log.engine}</span>
                    {log.responseMessage && (
                      <span className="text-xs text-slate-400 truncate max-w-xs">{log.responseMessage}</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string
  value: number | string
  icon: string
  accent?: string
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`mt-2 text-3xl font-bold ${accent === "emerald" ? "text-emerald-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  )
}
