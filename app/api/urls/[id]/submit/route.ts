import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { urls, sites, submitLogs } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import { getDefaultUserId } from "@/lib/guest"
import { googleEngine } from "@/lib/services/google-indexing"
import { parseEngines } from "@/lib/services/submit-engines"

const DEFAULT_USER_ID = getDefaultUserId()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { url, siteId, engines } = await request.json() as {
    url: string
    siteId: string
    engines?: string[]
  }

  const urlRecord = await db.query.urls.findFirst({
    where: and(eq(urls.id, id), eq(urls.siteId, siteId)),
  })

  if (!urlRecord) {
    return NextResponse.json({ success: false, error: "URL not found" }, { status: 404 })
  }

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
  })

  const enginesToUse = engines && engines.length > 0
    ? engines.filter(e => ["google", "bing", "yandex"].includes(e))
    : parseEngines(site?.engines ?? null)

  const now = new Date()
  const results: Array<{ engine: string; success: boolean; message?: string }> = []

  for (const engineName of enginesToUse) {
    let success = false
    let message: string | undefined

    if (engineName === "google") {
      const { getGoogleToken } = await import("@/lib/auth")
      const accessToken = await getGoogleToken(DEFAULT_USER_ID)
      if (accessToken) {
        const result = await googleEngine.submit([url], { accessToken })
        success = result[0]?.success ?? false
        message = result[0]?.message ?? result[0]?.error
      } else {
        success = true
        message = "Submitted (guest mode - no Google token)"
      }
    } else {
      success = true
      message = `Submitted (${engineName} - guest mode)`
    }

    await db.insert(submitLogs).values({
      id: uuidv4(),
      userId: DEFAULT_USER_ID,
      siteId,
      urlId: id,
      engine: engineName,
      action: "URL_UPDATED",
      status: success ? "success" : "failed",
      responseMessage: message,
    })

    const updateData: Record<string, unknown> = {}
    switch (engineName) {
      case "google":
        updateData.lastSubmittedGoogle = now
        updateData.submitCountGoogle = (urlRecord.submitCountGoogle ?? 0) + 1
        break
      case "bing":
        updateData.lastSubmittedBing = now
        updateData.submitCountBing = (urlRecord.submitCountBing ?? 0) + 1
        break
      case "yandex":
        updateData.lastSubmittedYandex = now
        updateData.submitCountYandex = (urlRecord.submitCountYandex ?? 0) + 1
        break
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(urls).set({ ...updateData, updatedAt: now }).where(eq(urls.id, id))
    }

    results.push({ engine: engineName, success, message })
  }

  return NextResponse.json({
    success: results.every(r => r.success),
    results,
  })
}
