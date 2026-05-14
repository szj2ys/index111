import { getDefaultUserId } from "@/lib/guest"

import { db } from "@/db"
import { sites, urls } from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"
import Link from "next/link"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { AddSiteButton } from "@/app/components/add-site-button"

import { ToggleAutoSubmit } from "@/app/components/toggle-auto-submit"
import { Globe, ArrowRight, ExternalLink, Zap, TrendingUp, Link2 } from "lucide-react"

async function getSites(userId: string) {
  const userSites = await db
    .select({ id: sites.id, domain: sites.domain, siteUrl: sites.siteUrl, sitemapUrl: sites.sitemapUrl, autoSubmitEnabled: sites.autoSubmitEnabled, lastSyncedAt: sites.lastSyncedAt, createdAt: sites.createdAt })
    .from(sites)
    .where(eq(sites.userId, userId))

  const sitesWithCounts = await Promise.all(
    userSites.map(async (site) => {
      const urlCount = await db.select({ count: sql<number>`count(*)` }).from(urls).where(eq(urls.siteId, site.id)).then((r) => r[0]?.count ?? 0)
      const indexedCount = await db.select({ count: sql<number>`count(*)` }).from(urls).where(and(eq(urls.siteId, site.id), eq(urls.indexStatus, "indexed"))).then((r) => r[0]?.count ?? 0)
      return { ...site, urlCount, indexedCount }
    })
  )
  return sitesWithCounts
}

export default async function SitesPage() {
  // Guest mode — no auth required
  const userId = getDefaultUserId()
  const userSites = await getSites(userId)

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a]">Sites</h1>
            <p className="text-black/50 mt-1 font-medium text-sm">Manage your websites and sitemaps</p>
          </div>
          <AddSiteButton />
        </div>

        {userSites.length === 0 ? (
          <EmptySitesState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {userSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function SiteCard({ site }: { site: Awaited<ReturnType<typeof getSites>>[number] }) {
  const rate = site.urlCount > 0 ? Math.round((site.indexedCount / site.urlCount) * 100) : 0
  return (
    <div className="group bg-white rounded-3xl border border-black/[0.05] p-7 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 hover:border-black/[0.08] transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg tracking-tight text-black truncate">{site.domain}</h3>
            <ToggleAutoSubmit siteId={site.id} enabled={!!site.autoSubmitEnabled} />
          </div>
          <a href={site.siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-black/35 hover:text-black flex items-center gap-1 transition-colors mt-1 truncate">
            {site.siteUrl}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-black/[0.03] flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-all duration-300">
          <Globe className="w-5 h-5 text-black/30 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-7 grid grid-cols-3 gap-3">
        <StatPill value={site.urlCount} label="URLs" icon={<Link2 className="w-3.5 h-3.5" />} />
        <StatPill value={site.indexedCount} label="Indexed" icon={<TrendingUp className="w-3.5 h-3.5" />} accent />
        <StatPill value={`${rate}%`} label="Rate" icon={<Zap className="w-3.5 h-3.5" />} />
      </div>

      {/* Index Progress */}
      <div className="mt-5">
        <div className="w-full h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
          <div className="h-full bg-[#22c55e] rounded-full transition-all duration-700" style={{ width: `${rate}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between pt-4 border-t border-black/[0.04]">
        <span className="text-[11px] font-bold text-black/30 uppercase tracking-wider">
          Synced {site.lastSyncedAt ? new Date(site.lastSyncedAt).toLocaleDateString() : "Never"}
        </span>
        <Link
          href={`/sites/${site.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-black/50 group-hover:text-black transition-colors"
        >
          Details
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

function StatPill({ value, label, icon, accent }: { value: string | number; label: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 text-center ${accent ? "bg-[#1a1a1a] text-white" : "bg-[#fbfbfa] text-black"}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className={accent ? "text-white/50" : "text-black/30"}>{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accent ? "text-white/45" : "text-black/35"}`}>{label}</span>
      </div>
      <div className="text-xl font-bold tracking-tight">{value}</div>
    </div>
  )
}

function EmptySitesState() {
  return (
    <div className="bg-white rounded-3xl border border-black/[0.05] p-16 text-center max-w-2xl mx-auto mt-12">
      <div className="w-20 h-20 bg-black/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
        <Globe className="w-10 h-10 text-black/20" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-black mb-2">No sites yet</h3>
      <p className="text-black/45 font-medium text-sm mb-8 max-w-md mx-auto">Add your first website to start tracking your pages and automate search engine indexing.</p>
      <div className="flex justify-center">
        <AddSiteButton />
      </div>
    </div>
  )
}
