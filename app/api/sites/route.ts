import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites, urls, users } from "@/db/schema";
import { fetchAllSitemapUrls } from "@/lib/services/sitemap";
import { success, badRequest, internalError } from "@/lib/api";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDefaultUserId } from "@/lib/guest";

const DEFAULT_USER_ID = getDefaultUserId();

// GET /api/sites - List all sites for the current user
export async function GET(request: NextRequest) {
  try {
    const userSites = await db.query.sites.findMany({
      where: eq(sites.userId, DEFAULT_USER_ID),
      with: { urls: true },
    });

    return success(userSites);
  } catch (error) {
    return internalError(error);
  }
}

function normalizeUrl(input: string): { siteUrl: string; domain: string } {
  let url = input.trim().toLowerCase();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  const parsed = new URL(url);
  const domain = parsed.hostname.replace(/^www\./, "");
  return { siteUrl: parsed.origin, domain };
}

async function discoverSitemap(siteUrl: string): Promise<string | null> {
  const candidates = [
    `${siteUrl}/sitemap.xml`,
    `${siteUrl}/sitemap_index.xml`,
    `${siteUrl}/sitemap-index.xml`,
    `${siteUrl}/sitemap/sitemap.xml`,
  ];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        method: "HEAD",
        headers: { "User-Agent": "Index111 Bot" },
      });
      if (res.ok) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

function calculatePriorityScore(entry: { priority?: string; changefreq?: string; lastmod?: string }): number {
  let score = 0;

  if (entry.priority) {
    score += parseFloat(entry.priority) * 50;
  }

  const freqScores: Record<string, number> = {
    always: 20, hourly: 18, daily: 15, weekly: 10, monthly: 5, yearly: 2, never: 0,
  };
  if (entry.changefreq) {
    score += freqScores[entry.changefreq] || 0;
  }

  if (entry.lastmod) {
    const days = Math.floor((Date.now() - new Date(entry.lastmod).getTime()) / (1000 * 60 * 60 * 24));
    if (days < 7) score += 15;
    else if (days < 30) score += 10;
    else if (days < 90) score += 5;
  }

  return Math.min(100, Math.round(score));
}

// POST /api/sites - Add a new site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return badRequest("Website URL is required");
    }

    const { domain, siteUrl } = normalizeUrl(url);

    const user = await db.query.users.findFirst({
      where: eq(users.id, DEFAULT_USER_ID),
    });

    const maxSites = user?.maxSites ?? 5;

    const existingSites = await db.query.sites.findMany({
      where: eq(sites.userId, DEFAULT_USER_ID),
    });

    if (existingSites.length >= maxSites) {
      return NextResponse.json(
        { success: false, error: { code: "QUOTA_EXCEEDED", message: `Site limit reached (max ${maxSites})` } },
        { status: 403 }
      );
    }

    const sitemapUrl = await discoverSitemap(siteUrl);
    const siteId = uuidv4();
    const now = new Date();

    await db.insert(sites).values({
      id: siteId,
      userId: DEFAULT_USER_ID,
      domain,
      siteUrl,
      sitemapUrl: sitemapUrl || null,
      autoSubmitEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    if (sitemapUrl) {
      try {
        const sitemapUrls = await fetchAllSitemapUrls(sitemapUrl);
        const maxUrls = user?.maxUrlsPerSite ?? 1000;

        const urlsToInsert = sitemapUrls.slice(0, maxUrls).map((u) => ({
          id: uuidv4(),
          siteId,
          url: u.loc,
          path: new URL(u.loc).pathname,
          lastmod: u.lastmod ? new Date(u.lastmod) : null,
          changefreq: u.changefreq || null,
          priority: u.priority ? parseFloat(u.priority) : null,
          priorityScore: calculatePriorityScore(u),
          createdAt: now,
          updatedAt: now,
        }));

        if (urlsToInsert.length > 0) {
          await db.insert(urls).values(urlsToInsert);
        }

        await db.update(sites).set({ lastSyncedAt: now }).where(eq(sites.id, siteId));
      } catch (error) {
        console.error("Failed to parse sitemap:", error);
      }
    }

    const createdSite = await db.query.sites.findFirst({
      where: eq(sites.id, siteId),
    });

    return success(createdSite);
  } catch (error) {
    return internalError(error);
  }
}
