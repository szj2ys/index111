-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  token_expires_at INTEGER,
  plan_tier TEXT DEFAULT 'free',
  plan_purchased_at INTEGER,
  max_sites INTEGER DEFAULT 1,
  max_urls_per_site INTEGER DEFAULT 1000,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  site_url TEXT NOT NULL,
  sitemap_url TEXT,
  is_gsc_verified INTEGER DEFAULT 0,
  gsc_site_url TEXT,
  auto_submit_enabled INTEGER DEFAULT 1,
  last_synced_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, domain)
);

-- URLs table
CREATE TABLE IF NOT EXISTS urls (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  url TEXT NOT NULL,
  path TEXT,
  lastmod INTEGER,
  changefreq TEXT,
  priority REAL,
  index_status TEXT,
  last_status_check INTEGER,
  last_submitted_google INTEGER,
  last_submitted_bing INTEGER,
  submit_count_google INTEGER DEFAULT 0,
  submit_count_bing INTEGER DEFAULT 0,
  priority_score INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, url)
);

-- Submit logs table
CREATE TABLE IF NOT EXISTS submit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  site_id TEXT REFERENCES sites(id),
  url_id TEXT REFERENCES urls(id),
  engine TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  response_message TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Daily reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  report_date TEXT NOT NULL,
  sites_count INTEGER,
  urls_submitted INTEGER,
  urls_indexed INTEGER,
  new_404s INTEGER,
  quota_used_google INTEGER,
  quota_used_bing INTEGER,
  report_data TEXT,
  sent_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, report_date)
);

-- System config table
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_site_id ON urls(site_id);
CREATE INDEX IF NOT EXISTS idx_urls_priority_score ON urls(site_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_submit_logs_user_id ON submit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_submit_logs_created_at ON submit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON daily_reports(user_id);
