import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { sites, urls } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { UrlActions } from "@/app/components/url-actions"
import { SubmitAllButton } from "@/app/components/submit-all-button"

async function getSite(userId: string, siteId: string) {
  return db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, userId)),
    with: { urls: true },
  })
}

function getStatusBadgeClass(status: string | null): string {
  switch (status) {
    case "indexed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "not_indexed":
      return "bg-red-100 text-red-800 border-red-200"
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200"
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user?.id) redirect("/auth/signin")

  const { id } = await params
  const site = await getSite(session.user.id, id)

  if (!site) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Site not found</h2>
            <p className="text-slate-500 mb-6">This site doesn&apos;t exist or you don&apos;t have access.</p>
            <Link href="/sites" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Back to Sites
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const siteUrls = site.urls ?? []
  const indexedCount = siteUrls.filter((u) => u.indexStatus === "indexed").length
  const submittedCount = siteUrls.filter((u) => u.lastSubmittedGoogle).length
  const pendingCount = siteUrls.filter((u) => u.indexStatus === "pending").length
  const indexRate = siteUrls.length > 0 ? Math.round((indexedCount / siteUrls.length) * 100) : 0

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/sites" className="text-slate-500 hover:text-slate-900">Sites</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium">{site.domain}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{site.domain}</h1>
              <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-emerald-600">
                {site.siteUrl}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${site.autoSubmitEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
                {site.autoSubmitEnabled ? "Auto Submit On" : "Auto Submit Off"}
              </span>
              <SubmitAllButton siteId={site.id} urlCount={siteUrls.length - submittedCount} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <StatBox label="Total URLs" value={siteUrls.length} />
            <StatBox label="Indexed" value={indexedCount} color="emerald" />
            <StatBox label="Submitted" value={submittedCount} color="blue" />
            <StatBox label="Pending" value={pendingCount} color="amber" />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Index Rate</span>
              <span className="font-semibold text-slate-900">{indexRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${indexRate}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">URLs</h2>
            <span className="text-sm text-slate-500">{siteUrls.length} total</span>
          </div>

          {siteUrls.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>No URLs found. The sitemap may be empty or unavailable.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {siteUrls.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900 truncate max-w-xs">
                        <a href={u.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">{u.path || u.url}</a>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClass(u.indexStatus)}`}>
                          {u.indexStatus || "unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {u.lastSubmittedGoogle ? new Date(u.lastSubmittedGoogle).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">{u.submitCountGoogle ?? 0}</td>
                      <td className="px-6 py-3 text-right">
                        <UrlActions urlId={u.id} url={u.url} siteId={site.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatBox({ label, value, color = "slate" }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = { slate: "text-slate-900", emerald: "text-emerald-600", blue: "text-blue-600", amber: "text-amber-600" }
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className={`text-2xl font-bold ${colorMap[color] || colorMap.slate}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}
