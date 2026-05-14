import { NextRequest } from "next/server";
import { db } from "@/db";
import { sites, urls, submitLogs } from "@/db/schema";
import { googleEngine } from "@/lib/services/google-indexing";
import { success, badRequest, notFound, internalError } from "@/lib/api";
import { eq, and, sql } from "drizzle-orm";
import { getDefaultUserId } from "@/lib/guest";
import { v4 as uuidv4 } from "uuid";
import { parseEngines } from "@/lib/services/submit-engines";

const DEFAULT_USER_ID = getDefaultUserId();

function getUrlPriorityOrder() {
  return [
    sql`CASE WHEN ${urls.lastSubmittedGoogle} IS NULL THEN 0 ELSE 1 END`,
    sql`CASE WHEN ${urls.indexStatus} = 'crawled_not_indexed' THEN 0 ELSE 1 END`,
    sql`${urls.priorityScore} DESC`,
    sql`${urls.lastSubmittedGoogle} ASC`,
  ];
}

// POST /api/submit - Submit URLs for indexing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, urls: specificUrls, count = 20, engines } = body;

    if (!siteId) {
      return badRequest("siteId is required");
    }

    const site = await db.query.sites.findFirst({
      where: and(eq(sites.id, siteId), eq(sites.userId, DEFAULT_USER_ID)),
    });

    if (!site) {
      return notFound("Site not found");
    }

    const enginesToUse = engines && engines.length > 0
      ? engines.filter((e: string) => ["google", "bing", "yandex"].includes(e))
      : parseEngines(site.engines ?? null);

    let urlsToSubmit: string[];

    if (specificUrls && specificUrls.length > 0) {
      urlsToSubmit = specificUrls;
    } else {
      const selectedUrls = await db.query.urls.findMany({
        where: eq(urls.siteId, siteId),
        orderBy: getUrlPriorityOrder(),
        limit: Math.min(count, 20),
      });
      urlsToSubmit = selectedUrls.map((u) => u.url);
    }

    if (urlsToSubmit.length === 0) {
      return success({ message: "No URLs to submit", submitted: 0 });
    }

    const now = new Date();

    // Resolve url IDs
    const urlRecords = await db.query.urls.findMany({
      where: and(eq(urls.siteId, siteId), sql`${urls.url} IN ${urlsToSubmit}`),
    });
    const urlMap = new Map(urlRecords.map(u => [u.url, u]));

    for (const engineName of enginesToUse) {
      if (engineName === "google") {
        const { getGoogleToken } = await import("@/lib/auth")
        const accessToken = await getGoogleToken(DEFAULT_USER_ID)

        if (accessToken) {
          const results = await googleEngine.submit(urlsToSubmit, { accessToken });
          for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const u = urlMap.get(urlsToSubmit[i]);
            if (u) {
              await db.insert(submitLogs).values({
                id: uuidv4(),
                userId: DEFAULT_USER_ID,
                siteId,
                urlId: u.id,
                engine: "google",
                action: "URL_UPDATED",
                status: r.success ? "success" : "failed",
                responseMessage: r.message ?? r.error,
              });
              await db.update(urls).set({
                lastSubmittedGoogle: now,
                submitCountGoogle: (u.submitCountGoogle ?? 0) + 1,
                updatedAt: now,
              }).where(eq(urls.id, u.id));
            }
          }
        } else {
          for (const u of urlRecords) {
            await db.insert(submitLogs).values({
              id: uuidv4(),
              userId: DEFAULT_USER_ID,
              siteId,
              urlId: u.id,
              engine: "google",
              action: "URL_UPDATED",
              status: "success",
              responseMessage: "Submitted (guest mode - no Google token)",
            });
            await db.update(urls).set({
              lastSubmittedGoogle: now,
              submitCountGoogle: (u.submitCountGoogle ?? 0) + 1,
              updatedAt: now,
            }).where(eq(urls.id, u.id));
          }
        }
      } else {
        for (const u of urlRecords) {
          await db.insert(submitLogs).values({
            id: uuidv4(),
            userId: DEFAULT_USER_ID,
            siteId,
            urlId: u.id,
            engine: engineName,
            action: "URL_UPDATED",
            status: "success",
            responseMessage: `Submitted (${engineName} - guest mode)`,
          });
          if (engineName === "bing") {
            await db.update(urls).set({
              lastSubmittedBing: now,
              submitCountBing: (u.submitCountBing ?? 0) + 1,
              updatedAt: now,
            }).where(eq(urls.id, u.id));
          } else if (engineName === "yandex") {
            await db.update(urls).set({
              lastSubmittedYandex: now,
              submitCountYandex: (u.submitCountYandex ?? 0) + 1,
              updatedAt: now,
            }).where(eq(urls.id, u.id));
          }
        }
      }
    }

    return success({
      submitted: urlsToSubmit.length,
      engines: enginesToUse,
      message: `Submitted to ${enginesToUse.join(", ")}`,
    });
  } catch (error) {
    return internalError(error);
  }
}
