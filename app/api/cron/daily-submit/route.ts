import { NextResponse } from "next/server";
import { db } from "@/db";
import { sites, urls, users, submitLogs } from "@/db/schema";
import { submitUrlsBatch } from "@/lib/services/google-indexing";
import { eq, and, sql } from "drizzle-orm";

function getUrlPriorityOrder() {
  return [
    sql`CASE WHEN ${urls.lastSubmittedGoogle} IS NULL THEN 0 ELSE 1 END`,
    sql`CASE WHEN ${urls.indexStatus} = 'crawled_not_indexed' THEN 0 ELSE 1 END`,
    sql`${urls.priorityScore} DESC`,
    sql`${urls.lastSubmittedGoogle} ASC`,
  ];
}

// Daily cron job to auto-submit URLs
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  const results: Array<
    | { siteId: string; submitted: number; successful?: number; failed?: number }
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

      if (!user?.googleAccessToken) {
        results.push({ siteId: site.id, error: "No Google access token" });
        continue;
      }

      try {
        const urlsToSubmit = await db.query.urls.findMany({
          where: eq(urls.siteId, site.id),
          orderBy: getUrlPriorityOrder(),
          limit: 20,
        });

        if (urlsToSubmit.length === 0) {
          results.push({ siteId: site.id, submitted: 0 });
          continue;
        }

        const urlStrings = urlsToSubmit.map((u) => u.url);
        const submitResults = await submitUrlsBatch(
          user.googleAccessToken,
          urlStrings,
          site.userId,
          site.id
        );

        const now = new Date();
        for (let i = 0; i < urlStrings.length; i++) {
          await db
            .update(urls)
            .set({
              lastSubmittedGoogle: now,
              submitCountGoogle: sql`${urls.submitCountGoogle} + 1`,
              updatedAt: now,
            })
            .where(and(eq(urls.siteId, site.id), eq(urls.url, urlStrings[i])));
        }

        const successCount = submitResults.filter((r) => r.success).length;
        results.push({
          siteId: site.id,
          submitted: urlStrings.length,
          successful: successCount,
          failed: urlStrings.length - successCount,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ siteId: site.id, error: message });
      }
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
    console.error("Daily submit cron error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
