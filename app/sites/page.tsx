import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { sites, urls } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { AddSiteButton } from "@/app/components/add-site-button"
import { ToggleAutoSubmit } from "@/app/components/toggle-auto-submit"

async function getSites(userId: string) {
  const userSites = await db
    .select({
      id: sites.id,
      domain: sites.domain,
      siteUrl: sites.siteUrl,
      sitemapUrl: sites.sitemapUrl,
      autoSubmitEnabled: sites.autoSubmitEnabled,
      lastSyncedAt: sites.lastSyncedAt,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .where(eq(sites.userId, userId))

  const sitesWithCounts = await Promise.all(
    userSites.map(async (site) => {
      const urlCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(urls)
        .where(eq(urls.siteId, site.id))
        .then((r) => r[0]?.count ?? 0)
      const indexedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(urls)
        .where(eq(urls.siteId, site.id))
        .where(eq(urls.indexStatus, "indexed"))
        .then((r) => r[0]?.count ?? 0)
      return { ...site, urlCount, indexedCount }
    })
  )

  return sitesWithCounts
}

export default async function SitesPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const userSites = await getSites(session.user.id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Sites</h1>
          <AddSiteButton />
        </div>

        {userSites.length === 0 ? (
          <EmptySitesState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userSites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{site.domain}</h3>
                    <a
                      href={site.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-500 hover:text-emerald-600"
                    >
                      {site.siteUrl}
                    </a>
                  </div>
                  <ToggleAutoSubmit siteId={site.id} enabled={!!site.autoSubmitEnabled} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-slate-900">{site.urlCount}</div>
                    <div className="text-xs text-slate-500">URLs</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-emerald-600">{site.indexedCount}</div>
                    <div className="text-xs text-emerald-600">Indexed</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-slate-900">
                      {site.urlCount > 0 ? Math.round((site.indexedCount / site.urlCount) * 100) : 0}%
                    </div>
                    <div className="text-xs text-slate-500">Rate</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Synced: {site.lastSyncedAt ? new Date(site.lastSyncedAt).toLocaleDateString() : "Never"}
                  </span>
                  <Link
                    href={`/sites/${site.id}`}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function EmptySitesState() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">No sites yet</h3>
      <p className="text-slate-500 mb-6">Add your first website to start indexing.</p>
      <AddSiteButton />
    </div>
  )
}
