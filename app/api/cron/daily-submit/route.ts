import { NextResponse } from "next/server";
import { db } from "@/db";
import { sites, users } from "@/db/schema";
import { inspectUrl, saveUrlInspection, syncUrlAnalytics, syncQueryAnalytics, aggregateSiteDailyStats } from "@/lib/services/gsc-search-analytics";
import { eq, and, sql, or } from "drizzle-orm";
import { processSiteDaily } from "@/lib/services/daily-submit";
import { engines as searchEnginesMap } from "@/lib/services/engines";

// ── Cron: daily submit + index status check + analytics sync ──
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  const results: Array<
    | { siteId: string; submitted: number; successful?: number; failed?: number; inspected?: number; analyticsSynced?: boolean; perEngine: Record<string, any> }
    | { siteId: string; error: string }
  > = [];

  try {
    const autoSubmitSites = await db.query.sites.findMany({
      where: eq(sites.autoSubmitEnabled, true),
    });

    for (const site of autoSubmitSites) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, site.userId),
      });

      if (!user) {
        continue;
      }

      const gscSiteUrl = site.gscSiteUrl || site.siteUrl;
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // ── 1. Submit pending URLs (multi-engine) ──
      const submitResult = await processSiteDaily(
        db,
        site,
        user,
        searchEnginesMap,
        now,
        {
          googleQuota: 200,
          bingQuota: 100,
          yandexQuota: 100,
        }
      );

      // ── 2. Check index status for recently submitted / uncertain URLs ──
      let inspectedCount = 0;
      if (gscSiteUrl && user?.googleAccessToken) {
        try {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
          
          // Execute using drizzle API
          const checkCandidates = await db.query.urls.findMany({
            where: (urls) => and(
              eq(urls.siteId, site.id),
              or(
                eq(urls.indexStatus, "pending"),
                eq(urls.indexStatus, "unknown"),
                eq(urls.indexStatus, "not_indexed"),
                and(
                  sql`${urls.lastSubmittedGoogle} IS NOT NULL`,
                  sql`${urls.lastSubmittedGoogle} > ${sevenDaysAgo.toISOString()}`,
                  or(
                    eq(urls.indexStatus, "pending"),
                    eq(urls.indexStatus, "unknown"),
                  )
                )
              )
            ),
            limit: 50,
          });

          for (const u of checkCandidates) {
            const result = await inspectUrl(user.googleAccessToken, gscSiteUrl, u.url);
            if (!("error" in result)) {
              await saveUrlInspection(u.id, result);
              inspectedCount++;
              if (inspectedCount % 10 === 0) {
                await new Promise((r) => setTimeout(r, 500));
              }
            }
          }
        } catch (error: unknown) {
          console.error("Index status check error for site", site.id, error);
        }
      }

      // ── 3. Sync analytics from GSC ──
      let analyticsSynced = false;
      if (gscSiteUrl && user?.googleAccessToken) {
        try {
          const startDate = new Date(now.getTime() - 3 * 86400000).toISOString().split("T")[0];
          await syncUrlAnalytics(user.googleAccessToken, site.id, gscSiteUrl, startDate, today);
          await syncQueryAnalytics(user.googleAccessToken, site.id, gscSiteUrl, startDate, today);

          for (let i = 0; i < 3; i++) {
            const d = new Date(now.getTime() - i * 86400000).toISOString().split("T")[0];
            await aggregateSiteDailyStats(site.id, d);
          }
          analyticsSynced = true;
        } catch (error: unknown) {
          console.error("Analytics sync error for site", site.id, error);
        }
      }

      results.push({
        siteId: site.id,
        submitted: submitResult.submitted,
        successful: submitResult.successful,
        failed: submitResult.failed,
        perEngine: submitResult.perEngine,
        inspected: inspectedCount,
        analyticsSynced,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        sitesProcessed: autoSubmitSites.length,
        results,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily cron error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
