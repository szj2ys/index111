import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  planTier: text("plan_tier").default("free"),
  planPurchasedAt: integer("plan_purchased_at", { mode: "timestamp" }),
  maxSites: integer("max_sites").default(1),
  maxUrlsPerSite: integer("max_urls_per_site").default(1000),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  siteUrl: text("site_url").notNull(),
  sitemapUrl: text("sitemap_url"),
  isGscVerified: integer("is_gsc_verified", { mode: "boolean" }).default(false),
  gscSiteUrl: text("gsc_site_url"),
  engines: text("engines").default('["google","bing","yandex"]'),
  autoSubmitEnabled: integer("auto_submit_enabled", { mode: "boolean" }).default(true),
  autoCrawlEnabled: integer("auto_crawl_enabled", { mode: "boolean" }).default(true),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  lastCrawledAt: integer("last_crawled_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const urls = sqliteTable("urls", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  path: text("path"),
  lastmod: integer("lastmod", { mode: "timestamp" }),
  changefreq: text("changefreq"),
  priority: real("priority"),
  indexStatus: text("index_status"),
  lastStatusCheck: integer("last_status_check", { mode: "timestamp" }),
  lastSubmittedGoogle: integer("last_submitted_google", { mode: "timestamp" }),
  lastSubmittedBing: integer("last_submitted_bing", { mode: "timestamp" }),
  lastSubmittedYandex: integer("last_submitted_yandex", { mode: "timestamp" }),
  submitCountGoogle: integer("submit_count_google").default(0),
  submitCountBing: integer("submit_count_bing").default(0),
  submitCountYandex: integer("submit_count_yandex").default(0),
  priorityScore: integer("priority_score").default(0),
  // ── Crawler fields ───────────────────────────────────────────────
  discoveredAt: integer("discovered_at", { mode: "timestamp" }),
  source: text("source").default("manual"), // 'sitemap', 'crawl', 'manual'
  crawlPriority: integer("crawl_priority").default(50),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ── Crawl Jobs ─────────────────────────────────────────────────────
export const crawlJobs = sqliteTable("crawl_jobs", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  status: text("status").default("pending"), // pending, running, completed, failed
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  urlsDiscovered: integer("urls_discovered").default(0),
  urlsUpdated: integer("urls_updated").default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ── URL Index Status History ───────────────────────────────────────
export const urlStatusHistory = sqliteTable("url_status_history", {
  id: text("id").primaryKey(),
  urlId: text("url_id").notNull().references(() => urls.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // indexed, not_indexed, pending, unknown
  source: text("source").notNull(), // gsc_url_inspection, gsc_search_analytics, manual, cron
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull(),
  metadata: text("metadata"), // JSON: { coverageState, robotsTxtState, ... }
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ── URL Search Analytics (URL-level traffic) ───────────────────────
export const urlSearchAnalytics = sqliteTable("url_search_analytics", {
  id: text("id").primaryKey(),
  urlId: text("url_id").notNull().references(() => urls.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  ctr: real("ctr").default(0),
  position: real("position").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ── Search Queries (keyword-level data) ─────────────────────────────
export const searchQueries = sqliteTable("search_queries", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  urlId: text("url_id").references(() => urls.id, { onDelete: "cascade" }), // null = site-level aggregate
  query: text("query").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  ctr: real("ctr").default(0),
  position: real("position").default(0),
  country: text("country"),
  device: text("device"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// ── Site Daily Aggregates ───────────────────────────────────────────
export const siteDailyStats = sqliteTable("site_daily_stats", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  totalUrls: integer("total_urls").default(0),
  indexedUrls: integer("indexed_urls").default(0),
  submittedUrls: integer("submitted_urls").default(0),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  avgPosition: real("avg_position").default(0),
  newQueries: integer("new_queries").default(0),
  reportData: text("report_data"), // JSON for extensibility
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const submitLogs = sqliteTable("submit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  siteId: text("site_id").references(() => sites.id),
  urlId: text("url_id").references(() => urls.id),
  engine: text("engine").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  responseCode: integer("response_code"),
  responseMessage: text("response_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const dailyReports = sqliteTable("daily_reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  reportDate: text("report_date").notNull(),
  sitesCount: integer("sites_count"),
  urlsSubmitted: integer("urls_submitted"),
  urlsIndexed: integer("urls_indexed"),
  new404s: integer("new_404s"),
  quotaUsedGoogle: integer("quota_used_google"),
  quotaUsedBing: integer("quota_used_bing"),
  reportData: text("report_data"),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const systemConfig = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

import { relations } from "drizzle-orm";

export const sitesRelations = relations(sites, ({ many }) => ({
  urls: many(urls),
  queries: many(searchQueries),
  dailyStats: many(siteDailyStats),
  crawlJobs: many(crawlJobs),
}));

export const urlsRelations = relations(urls, ({ one, many }) => ({
  site: one(sites, { fields: [urls.siteId], references: [sites.id] }),
  statusHistory: many(urlStatusHistory),
  searchAnalytics: many(urlSearchAnalytics),
  queries: many(searchQueries),
}));

// Relations for new tables
export const urlStatusHistoryRelations = relations(urlStatusHistory, ({ one }) => ({
  url: one(urls, { fields: [urlStatusHistory.urlId], references: [urls.id] }),
}));

export const urlSearchAnalyticsRelations = relations(urlSearchAnalytics, ({ one }) => ({
  url: one(urls, { fields: [urlSearchAnalytics.urlId], references: [urls.id] }),
}));

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  site: one(sites, { fields: [searchQueries.siteId], references: [sites.id] }),
  url: one(urls, { fields: [searchQueries.urlId], references: [urls.id] }),
}));

export const siteDailyStatsRelations = relations(siteDailyStats, ({ one }) => ({
  site: one(sites, { fields: [siteDailyStats.siteId], references: [sites.id] }),
}));

export const crawlJobsRelations = relations(crawlJobs, ({ one }) => ({
  site: one(sites, { fields: [crawlJobs.siteId], references: [sites.id] }),
}));
