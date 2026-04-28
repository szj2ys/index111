import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { sites, urls, users } from "@/db/schema";
import { submitUrlsBatch } from "@/lib/services/google-indexing";
import { success, unauthorized, badRequest, notFound, internalError } from "@/lib/api";
import { eq, and, sql } from "drizzle-orm";

function getUrlPriorityOrder() {
  return [
    // Priority 1: Never submitted
    sql`CASE WHEN ${urls.lastSubmittedGoogle} IS NULL THEN 0 ELSE 1 END`,
    // Priority 2: crawled_not_indexed status
    sql`CASE WHEN ${urls.indexStatus} = 'crawled_not_indexed' THEN 0 ELSE 1 END`,
    // Priority 3: Higher priority score
    sql`${urls.priorityScore} DESC`,
    // Priority 4: Earlier submission for retry
    sql`${urls.lastSubmittedGoogle} ASC`,
  ];
}

// POST /api/submit - Submit URLs for indexing
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { siteId, urls: specificUrls, count = 20 } = body;

    if (!siteId) {
      return badRequest("siteId is required");
    }

    const site = await db.query.sites.findFirst({
      where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
    });

    if (!site) {
      return notFound("Site not found");
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user?.googleAccessToken) {
      return unauthorized("Google account not connected");
    }

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

    const results = await submitUrlsBatch(
      user.googleAccessToken,
      urlsToSubmit,
      session.user.id,
      siteId
    );

    const now = new Date();
    for (let i = 0; i < results.length; i++) {
      const url = urlsToSubmit[i];
      await db
        .update(urls)
        .set({
          lastSubmittedGoogle: now,
          submitCountGoogle: sql`${urls.submitCountGoogle} + 1`,
          updatedAt: now,
        })
        .where(and(eq(urls.siteId, siteId), eq(urls.url, url)));
    }

    const successCount = results.filter((r) => r.success).length;

    return success({
      submitted: urlsToSubmit.length,
      successful: successCount,
      failed: urlsToSubmit.length - successCount,
      results,
    });
  } catch (error) {
    return internalError(error);
  }
}
