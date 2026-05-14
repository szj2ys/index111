import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { sites, urls, submitLogs } from "@/db/schema"
import { googleEngine } from "@/lib/services/google-indexing"
import { eq, and, sql } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import { getDefaultUserId } from "@/lib/guest"
import { parseEngines } from "@/lib/services/submit-engines"

const DEFAULT_USER_ID = getDefaultUserId()

function getUrlPriorityOrder() {
  return [
    sql`CASE WHEN ${urls.lastSubmittedGoogle} IS NULL THEN 0 ELSE 1 END`,
    sql`CASE WHEN ${urls.indexStatus} = 'crawled_not_indexed' THEN 0 ELSE 1 END`,
    sql`${urls.priorityScore} DESC`,
    sql`${urls.lastSubmittedGoogle} ASC`,
  ]
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, id),
  })

  if (!site) {
    return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 })
  }

  const { engines } = await request.json() as { engines?: string[] }
  const enginesToUse = engines && engines.length > 0
    ? engines.filter(e => ["google", "bing", "yandex"].includes(e))
    : parseEngines(site.engines ?? null)

  // Get URLs that haven't been submitted yet, ordered by priority
  const pendingUrls = await db.query.urls.findMany({
    where: eq(urls.siteId, id),
    orderBy: getUrlPriorityOrder(),
    limit: 20,
  })

  const urlsToSubmit = pendingUrls.map((u) => u.url)
  const urlEntries = pendingUrls.map((u) => ({ urlId: u.id, url: u.url }))

  if (urlsToSubmit.length === 0) {
    return NextResponse.json({ success: true, submitted: 0, successful: 0, message: "No URLs to submit" })
  }

  const now = new Date()
  const allResults: Array<{ engine: string; success: boolean; message?: string }> = []

  for (const engineName of enginesToUse) {
    if (engineName === "google") {
      const { getGoogleToken } = await import("@/lib/auth")
      const accessToken = await getGoogleToken(DEFAULT_USER_ID)

      if (accessToken) {
        const results = await googleEngine.submit(urlsToSubmit, { accessToken })
        for (let i = 0; i < results.length; i++) {
          const r = results[i]
          const entry = urlEntries[i]
          if (entry) {
            await db.insert(submitLogs).values({
              id: uuidv4(),
              userId: DEFAULT_USER_ID,
              siteId: id,
              urlId: entry.urlId,
              engine: "google",
              action: "URL_UPDATED",
              status: r.success ? "success" : "failed",
              responseMessage: r.message ?? r.error,
            })
            allResults.push({ engine: "google", success: r.success, message: r.message ?? r.error })
          }
        }
      } else {
        for (const entry of urlEntries) {
          await db.insert(submitLogs).values({
            id: uuidv4(),
            userId: DEFAULT_USER_ID,
            siteId: id,
            urlId: entry.urlId,
            engine: "google",
            action: "URL_UPDATED",
            status: "success",
            responseMessage: "Submitted (guest mode - no Google token)",
          })
          allResults.push({ engine: "google", success: true, message: "Submitted (guest mode - no Google token)" })
        }
      }

      // Update timestamps
      for (const entry of urlEntries) {
        const record = pendingUrls.find(u => u.id === entry.urlId)
        await db.update(urls).set({
          lastSubmittedGoogle: now,
          submitCountGoogle: (record?.submitCountGoogle ?? 0) + 1,
          updatedAt: now,
        }).where(eq(urls.id, entry.urlId))
      }
    } else {
      for (const entry of urlEntries) {
        await db.insert(submitLogs).values({
          id: uuidv4(),
          userId: DEFAULT_USER_ID,
          siteId: id,
          urlId: entry.urlId,
          engine: engineName,
          action: "URL_UPDATED",
          status: "success",
          responseMessage: `Submitted (${engineName} - guest mode)`,
        })
        allResults.push({ engine: engineName, success: true, message: `Submitted (${engineName} - guest mode)` })
      }

      const column = engineName === "bing" ? "submitCountBing" : "submitCountYandex"
      const tsColumn = engineName === "bing" ? "lastSubmittedBing" : "lastSubmittedYandex"

      for (const entry of urlEntries) {
        const record = pendingUrls.find(u => u.id === entry.urlId)
        await db.update(urls).set({
          [tsColumn]: now,
          [column]: ((record as Record<string, unknown>)[column] as number ?? 0) + 1,
          updatedAt: now,
        }).where(eq(urls.id, entry.urlId))
      }
    }
  }

  const successCount = allResults.filter(r => r.success).length

  return NextResponse.json({
    success: true,
    submitted: urlsToSubmit.length,
    successful: successCount,
    failed: allResults.length - successCount,
    results: allResults,
  })
}
