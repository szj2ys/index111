import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { DEFAULT_USER_ID } from "@/lib/guest";

const sqlite = new Database(process.env.DATABASE_URL?.replace("file:", "") || "./sqlite.db");

export const db = drizzle(sqlite, { schema });

// ── Seed default guest user on startup ────────────────────────────
function seedGuestUser() {
  const existing = sqlite.prepare("SELECT id FROM users WHERE id = ?").get(DEFAULT_USER_ID);
  if (!existing) {
    sqlite.prepare(`
      INSERT INTO users (id, email, name, plan_tier, max_sites, max_urls_per_site, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      DEFAULT_USER_ID,
      "guest@index111.local",
      "Guest",
      "guest",
      999,
      9999,
      Date.now(),
      Date.now()
    );
  } else {
    sqlite.prepare(`
      UPDATE users SET max_sites = ?, max_urls_per_site = ? WHERE id = ?
    `).run(999, 9999, DEFAULT_USER_ID);
  }
}

seedGuestUser();
