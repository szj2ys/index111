import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { sites, urls, submitLogs } from "@/db/schema"
import { submitUrlsBatch } from "@/lib/services/google-indexing"
import { eq, and, sql } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, id), eq(sites.userId, session.user.id)),
  })

  if (!site) {
    return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 })
  }

  const { getGoogleToken } = await import("@/lib/auth")
  const accessToken = await getGoogleToken(session.user.id)

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Google token not found" }, { status: 403 })
  }

  // Get URLs that haven't been submitted yet, ordered by priority
  const pendingUrls = await db.query.urls.findMany({
    where: eq(urls.siteId, id),
    orderBy: [
      sql`CASE WHEN ${urls.lastSubmittedGoogle} IS NULL THEN 0 ELSE 1 END`,
      sql`${urls.priorityScore} DESC`,
    ],
    limit: 20,
  })

  const urlsToSubmit = pendingUrls.map((u) => u.url)

  if (urlsToSubmit.length === 0) {
    return NextResponse.json({ success: true, submitted: 0, successful: 0, message: "No URLs to submit" })
  }

  const results = await submitUrlsBatch(accessToken, urlsToSubmit, session.user.id, id)
  const successCount = results.filter((r) => r.success).length

  return NextResponse.json({
    success: true,
    submitted: urlsToSubmit.length,
    successful: successCount,
    failed: urlsToSubmit.length - successCount,
  })
}
