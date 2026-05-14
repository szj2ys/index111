import { eq, and, sql } from "drizzle-orm";
import { urls, submitLogs } from "@/db/schema";
import type { db as DbType } from "@/db";
import type { sites, users } from "@/db/schema";
import type { SearchEngine, SubmitResult } from "./search-engine";
import { v4 as uuidv4 } from "uuid";

function getUrlPriorityOrder() {
  return [
    sql`CASE WHEN ${urls.lastSubmittedGoogle} IS NULL THEN 0 ELSE 1 END`,
    sql`CASE WHEN ${urls.indexStatus} = 'crawled_not_indexed' THEN 0 ELSE 1 END`,
    sql`${urls.priorityScore} DESC`,
    sql`${urls.lastSubmittedGoogle} ASC`,
  ];
}

function parseEngines(enginesJson: string | null): ("google" | "bing" | "yandex")[] {
  if (!enginesJson) return ["google", "bing", "yandex"];
  try {
    const parsed = JSON.parse(enginesJson);
    if (Array.isArray(parsed)) return parsed as ("google" | "bing" | "yandex")[];
  } catch {
    // fall through
  }
  return ["google", "bing", "yandex"];
}

export interface DailySubmitResult {
  siteId: string;
  submitted: number;
  successful?: number;
  failed?: number;
  perEngine: Record<string, { submitted: number; successful: number }>;
}

export async function processSiteDaily(
  db: typeof DbType,
  site: typeof sites.$inferSelect,
  user: typeof users.$inferSelect,
  enginesMap: Record<string, SearchEngine>,
  now: Date,
  quotas: { googleQuota?: number; bingQuota?: number; yandexQuota?: number } = {}
): Promise<DailySubmitResult> {
  const enabledEngines = parseEngines(site.engines);
  const perEngine: Record<string, { submitted: number; successful: number }> = {
    google: { submitted: 0, successful: 0 },
    bing: { submitted: 0, successful: 0 },
    yandex: { submitted: 0, successful: 0 },
  };

  // Fetch URLs sorted by priority (only once, slice per engine quota)
  const allUrls = await db.query.urls.findMany({
    where: eq(urls.siteId, site.id),
    orderBy: getUrlPriorityOrder(),
  });

  if (allUrls.length === 0) {
    return { siteId: site.id, submitted: 0, successful: 0, failed: 0, perEngine };
  }

  const urlStrings = allUrls.map((u) => u.url);

  for (const engineName of enabledEngines) {
    const engine = enginesMap[engineName];
    if (!engine) continue;

    // Determine quota and slice URLs
    let quota: number;
    let lastSubmittedCol: "lastSubmittedGoogle" | "lastSubmittedBing" | "lastSubmittedYandex";
    let submitCountCol: "submitCountGoogle" | "submitCountBing" | "submitCountYandex";

    switch (engineName) {
      case "google":
        quota = quotas.googleQuota ?? 200;
        if (!user.googleAccessToken) continue;
        lastSubmittedCol = "lastSubmittedGoogle";
        submitCountCol = "submitCountGoogle";
        break;
      case "bing":
        quota = quotas.bingQuota ?? 100;
        lastSubmittedCol = "lastSubmittedBing";
        submitCountCol = "submitCountBing";
        break;
      case "yandex":
        quota = quotas.yandexQuota ?? 100;
        lastSubmittedCol = "lastSubmittedYandex";
        submitCountCol = "submitCountYandex";
        break;
      default:
        continue;
    }

    const engineUrls = urlStrings.slice(0, quota);
    if (engineUrls.length === 0) continue;

    let engineResults: SubmitResult[];
    try {
      switch (engineName) {
        case "google":
          engineResults = await engine.submit(engineUrls, {
            accessToken: user.googleAccessToken!,
          });
          break;
        case "bing":
          engineResults = await engine.submit(engineUrls, {
            apiKey: process.env.BING_API_KEY,
            siteUrl: site.siteUrl,
          });
          break;
        case "yandex":
          engineResults = await engine.submit(engineUrls, {
            apiKey: process.env.YANDEX_API_KEY,
            userId: process.env.YANDEX_USER_ID,
            hostId: process.env.YANDEX_HOST_ID,
          });
          break;
        default:
          continue;
      }
    } catch (error: unknown) {
      console.error(`${engineName} submit error for site`, site.id, error);
      continue;
    }

    for (let i = 0; i < engineUrls.length; i++) {
      const url = engineUrls[i];
      const result = engineResults[i];

      await db.insert(submitLogs).values({
        id: uuidv4(),
        userId: site.userId,
        siteId: site.id,
        engine: engineName,
        action: "URL_UPDATED",
        status: result?.success ? "success" : "failed",
        responseMessage: result?.message || result?.error,
        createdAt: now,
        updatedAt: now,
      });

      if (result?.success) {
        await db
          .update(urls)
          .set({
            [lastSubmittedCol]: now,
            [submitCountCol]: sql`${urls[submitCountCol]} + 1`,
            updatedAt: now,
          })
          .where(and(eq(urls.siteId, site.id), eq(urls.url, url)));
      }
    }

    const successCount = engineResults.filter((r) => r?.success).length;
    perEngine[engineName] = { submitted: engineUrls.length, successful: successCount };
  }

  const totalSubmitted = Object.values(perEngine).reduce((sum, e) => sum + e.submitted, 0);
  const totalSuccessful = Object.values(perEngine).reduce((sum, e) => sum + e.successful, 0);

  return {
    siteId: site.id,
    submitted: totalSubmitted,
    successful: totalSuccessful,
    failed: totalSubmitted - totalSuccessful,
    perEngine,
  };
}
