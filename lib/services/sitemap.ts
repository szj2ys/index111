import { XMLParser } from "fast-xml-parser";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface ParsedSitemap {
  urls: SitemapUrl[];
  isSitemapIndex: boolean;
  sitemaps?: string[];
}

interface XmlUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface XmlSitemapEntry {
  loc: string;
}

function normalizeToArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function parseSitemap(sitemapUrl: string): Promise<ParsedSitemap> {
  const response = await fetch(sitemapUrl, {
    headers: { "User-Agent": "Index111 Bot" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
  });

  const parsed = parser.parse(xml);

  if (parsed.sitemapindex?.sitemap) {
    const sitemaps = normalizeToArray<XmlSitemapEntry>(parsed.sitemapindex.sitemap);
    return {
      urls: [],
      isSitemapIndex: true,
      sitemaps: sitemaps.map((s) => s.loc),
    };
  }

  const rawUrls = normalizeToArray<XmlUrlEntry>(parsed.urlset?.url);

  return {
    urls: rawUrls.map((u) => ({
      loc: u.loc,
      lastmod: u.lastmod,
      changefreq: u.changefreq,
      priority: u.priority,
    })),
    isSitemapIndex: false,
  };
}

export async function fetchAllSitemapUrls(sitemapUrl: string): Promise<SitemapUrl[]> {
  const result = await parseSitemap(sitemapUrl);

  if (!result.isSitemapIndex) {
    return result.urls;
  }

  const allUrls: SitemapUrl[] = [];

  for (const childSitemap of result.sitemaps ?? []) {
    try {
      const child = await parseSitemap(childSitemap);
      if (!child.isSitemapIndex) {
        allUrls.push(...child.urls);
      }
    } catch (error) {
      console.error(`Failed to fetch child sitemap ${childSitemap}:`, error);
    }
  }

  return allUrls;
}
