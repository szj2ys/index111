import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { urls, sites } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { inspectUrl, saveUrlInspection } from "@/lib/services/gsc-search-analytics"
import { getDefaultUserId } from "@/lib/guest"

const DEFAULT_USER_ID = getDefaultUserId()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { url, siteId } = await request.json()

  const { getGoogleToken } = await import("@/lib/auth")
  const accessToken = await getGoogleToken(DEFAULT_USER_ID)

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Google token not found (guest mode)" }, { status: 403 })
  }

  try {
    const urlRecord = await db.query.urls.findFirst({
      where: and(eq(urls.id, id), eq(urls.siteId, siteId)),
    })

    if (!urlRecord) {
      return NextResponse.json({ success: false, error: "URL not found" }, { status: 404 })
    }

    const site = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
    })

    const gscSiteUrl = site?.gscSiteUrl || site?.siteUrl
    if (!gscSiteUrl) {
      return NextResponse.json({ success: false, error: "Site not configured for GSC" }, { status: 400 })
    }

    const result = await inspectUrl(accessToken, gscSiteUrl, urlRecord.url)

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    await saveUrlInspection(id, result)

    return NextResponse.json({
      success: true,
      status: result.indexingState || result.coverageState || "unknown",
      details: {
        coverageState: result.coverageState,
        indexingState: result.indexingState,
        lastCrawlTime: result.lastCrawlTime,
        robotsTxtState: result.robotsTxtState,
        verdict: result.verdict,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
