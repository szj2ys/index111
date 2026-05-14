import { google } from "googleapis";
import { db } from "@/db";
import { urls, urlSearchAnalytics, searchQueries, urlStatusHistory, siteDailyStats } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

function createAuth(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export interface GscUrlInspectionResult {
  url: string;
  verdict?: string; // PASS | FAIL | NEUTRAL
  coverageState?: string;
  lastCrawlTime?: string;
  indexingState?: string;
  robotsTxtState?: string;
}

export async function inspectUrl(
  accessToken: string,
  siteUrl: string,
  inspectionUrl: string
): Promise<GscUrlInspectionResult | { error: string }> {
  try {
    const auth = createAuth(accessToken);
    const searchconsole = google.searchconsole({ version: "v1", auth });

    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: { inspectionUrl, siteUrl },
    });

    const result = res.data?.inspectionResult;
    const indexStatus = result?.indexStatusResult;
    const amp = result?.ampResult;

    return {
      url: inspectionUrl,
      verdict: (indexStatus?.verdict as string) || undefined,
      coverageState: (indexStatus?.coverageState as string) || undefined,
      lastCrawlTime: (indexStatus?.lastCrawlTime as string) || undefined,
      indexingState: (indexStatus?.indexingState as string) || undefined,
      robotsTxtState: (indexStatus?.robotsTxtState as string) || undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: message };
  }
}

export async function saveUrlInspection(
  urlId: string,
  result: GscUrlInspectionResult
) {
  if ("error" in result) return;

  const status = inferIndexStatus(result.coverageState, result.indexingState);

  await db.insert(urlStatusHistory).values({
    id: uuidv4(),
    urlId,
    status,
    source: "gsc_url_inspection",
    checkedAt: new Date(),
    metadata: JSON.stringify({
      coverageState: result.coverageState,
      indexingState: result.indexingState,
      robotsTxtState: result.robotsTxtState,
      lastCrawlTime: result.lastCrawlTime,
      verdict: result.verdict,
    }),
  });

  await db
    .update(urls)
    .set({ indexStatus: status, lastStatusCheck: new Date() })
    .where(eq(urls.id, urlId));
}

function inferIndexStatus(coverageState?: string, indexingState?: string): string {
  if (!coverageState) return "unknown";
  const s = coverageState.toLowerCase();
  if (s.includes("indexed")) return "indexed";
  if (s.includes("crawled") && s.includes("not indexed")) return "not_indexed";
  if (s.includes("submitted")) return "pending";
  return "unknown";
}

// ── Search Analytics ────────────────────────────────

export interface SearchAnalyticsRow {
  keys: string[]; // e.g. ["query text", "https://example.com/page"]
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface QueryOptions {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions: ("query" | "page" | "country" | "device")[];
  rowLimit?: number;
  startRow?: number;
}

export async function fetchSearchAnalytics(
  accessToken: string,
  options: QueryOptions
): Promise<SearchAnalyticsRow[]> {
  const auth = createAuth(accessToken);
  const searchconsole = google.searchconsole({ version: "v1", auth });

  const res = await searchconsole.searchanalytics.query({
    siteUrl: options.siteUrl,
    requestBody: {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions,
      rowLimit: options.rowLimit ?? 25000,
      startRow: options.startRow ?? 0,
    },
  });

  return (res.data.rows || []).map((row: any) => ({
    keys: row.keys || [],
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0),
  }));
}

/**
 * Pull and store URL-level analytics for a site.
 * Dimensions: ["page", "date"] to get per-URL per-day granularity.
 */
export async function syncUrlAnalytics(
  accessToken: string,
  siteId: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const rows = await fetchSearchAnalytics(accessToken, {
    siteUrl,
    startDate,
    endDate,
    dimensions: ["page", "date"] as any,
    rowLimit: 25000,
  });

  // Get URL id mapping for this site
  const siteUrls = await db.query.urls.findMany({
    where: eq(urls.siteId, siteId),
  });
  const urlByPath = new Map(siteUrls.map((u) => [u.url, u.id]));

  for (const row of rows) {
    const pageUrl = row.keys[0];
    const date = row.keys[1];
    const urlId = urlByPath.get(pageUrl);

    if (!urlId || !date) continue;

    // Upsert via delete+insert (SQLite lacks ON CONFLICT)
    await db
      .delete(urlSearchAnalytics)
      .where(
        and(
          eq(urlSearchAnalytics.urlId, urlId),
          eq(urlSearchAnalytics.date, date)
        )
      );

    await db.insert(urlSearchAnalytics).values({
      id: uuidv4(),
      urlId,
      date,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: Math.round(row.ctr * 10000) / 10000, // 4 decimals
      position: Math.round(row.position * 100) / 100,
    });
  }

  return rows.length;
}

/**
 * Pull and store query-level analytics for a site.
 * Dimensions: ["query", "page", "date"]
 */
export async function syncQueryAnalytics(
  accessToken: string,
  siteId: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const rows = await fetchSearchAnalytics(accessToken, {
    siteUrl,
    startDate,
    endDate,
    dimensions: ["query", "page", "date"] as any,
    rowLimit: 25000,
  });

  const siteUrls = await db.query.urls.findMany({
    where: eq(urls.siteId, siteId),
  });
  const urlByPath = new Map(siteUrls.map((u) => [u.url, u.id]));

  for (const row of rows) {
    const query = row.keys[0];
    const pageUrl = row.keys[1];
    const date = row.keys[2];
    const urlId = urlByPath.get(pageUrl);

    if (!query || !date) continue;

    await db
      .delete(searchQueries)
      .where(
        and(
          eq(searchQueries.siteId, siteId),
          eq(searchQueries.query, query),
          eq(searchQueries.date, date),
          urlId
            ? eq(searchQueries.urlId, urlId)
            : sql`1=1`
        )
      );

    await db.insert(searchQueries).values({
      id: uuidv4(),
      siteId,
      urlId: urlId || null,
      query,
      date,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: Math.round(row.ctr * 10000) / 10000,
      position: Math.round(row.position * 100) / 100,
    });
  }

  return rows.length;
}

/**
 * Aggregate site-level daily stats from url_search_analytics.
 */
export async function aggregateSiteDailyStats(siteId: string, date: string) {
  const stats = await db
    .select({
      impressions: sql<number>`COALESCE(SUM(${urlSearchAnalytics.impressions}), 0)`,
      clicks: sql<number>`COALESCE(SUM(${urlSearchAnalytics.clicks}), 0)`,
      avgPosition: sql<number>`COALESCE(AVG(${urlSearchAnalytics.position}), 0)`,
    })
    .from(urlSearchAnalytics)
    .innerJoin(urls, eq(urlSearchAnalytics.urlId, urls.id))
    .where(and(eq(urls.siteId, siteId), eq(urlSearchAnalytics.date, date)));

  const urlStats = await db
    .select({
      total: sql<number>`count(*)`,
      indexed: sql<number>`sum(CASE WHEN ${urls.indexStatus} = 'indexed' THEN 1 ELSE 0 END)`,
      submitted: sql<number>`sum(CASE WHEN ${urls.lastSubmittedGoogle} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(urls)
    .where(eq(urls.siteId, siteId));

  const s = stats[0];
  const u = urlStats[0];

  await db
    .delete(siteDailyStats)
    .where(and(eq(siteDailyStats.siteId, siteId), eq(siteDailyStats.date, date)));

  await db.insert(siteDailyStats).values({
    id: uuidv4(),
    siteId,
    date,
    totalUrls: u.total ?? 0,
    indexedUrls: u.indexed ?? 0,
    submittedUrls: u.submitted ?? 0,
    impressions: s.impressions ?? 0,
    clicks: s.clicks ?? 0,
    avgPosition: Math.round((s.avgPosition ?? 0) * 100) / 100,
  });
}

export async function listGscSites(accessToken: string): Promise<string[]> {
  try {
    const auth = createAuth(accessToken);
    const searchconsole = google.searchconsole({ version: "v1", auth });
    const res = await searchconsole.sites.list();
    return (res.data.siteEntry || []).map((s: any) => s.siteUrl as string);
  } catch {
    return [];
  }
}
