import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { urls, submitLogs } from "@/db/schema"
import { submitUrlToGoogle } from "@/lib/services/google-indexing"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { url, siteId } = await request.json()

  const urlRecord = await db.query.urls.findFirst({
    where: and(eq(urls.id, id), eq(urls.siteId, siteId)),
  })

  if (!urlRecord) {
    return NextResponse.json({ success: false, error: "URL not found" }, { status: 404 })
  }

  const { getGoogleToken } = await import("@/lib/auth")
  const accessToken = await getGoogleToken(session.user.id)

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Google token not found" }, { status: 403 })
  }

  const result = await submitUrlToGoogle(accessToken, url)

  const now = new Date()
  await db.insert(submitLogs).values({
    id: uuidv4(),
    userId: session.user.id,
    siteId,
    urlId: id,
    engine: "google",
    action: "URL_UPDATED",
    status: result.success ? "success" : "failed",
    responseMessage: result.message || result.error,
  })

  if (result.success) {
    await db
      .update(urls)
      .set({
        lastSubmittedGoogle: now,
        submitCountGoogle: (urlRecord.submitCountGoogle ?? 0) + 1,
        updatedAt: now,
      })
      .where(eq(urls.id, id))
  }

  return NextResponse.json({ success: result.success, result, error: result.error })
}
