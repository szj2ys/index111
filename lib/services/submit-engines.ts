import { db } from "@/db";
import { urls, submitLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface SubmissionLogResult {
  engine: string;
  urlId: string;
  url: string;
  success: boolean;
}

export async function logSubmissions({
  entries,
  engines,
  siteId,
  userId,
}: {
  entries: Array<{ urlId: string; url: string }>;
  engines: string[];
  siteId: string;
  userId: string;
}): Promise<SubmissionLogResult[]> {
  const now = new Date();
  const results: SubmissionLogResult[] = [];

  for (const { urlId, url } of entries) {
    for (const engine of engines) {
      await db.insert(submitLogs).values({
        id: uuidv4(),
        userId,
        siteId,
        urlId,
        engine,
        action: "URL_UPDATED",
        status: "success",
        responseMessage: `Submitted (${engine})`,
      });

      results.push({ engine, urlId, url, success: true });
    }
  }

  for (const { urlId } of entries) {
    const updateData: Record<string, unknown> = { updatedAt: now };
    for (const engine of engines) {
      switch (engine) {
        case "google":
          updateData.lastSubmittedGoogle = now;
          updateData.submitCountGoogle = sql`${urls.submitCountGoogle} + 1`;
          break;
        case "bing":
          updateData.lastSubmittedBing = now;
          updateData.submitCountBing = sql`${urls.submitCountBing} + 1`;
          break;
        case "yandex":
          updateData.lastSubmittedYandex = now;
          updateData.submitCountYandex = sql`${urls.submitCountYandex} + 1`;
          break;
      }
    }
    await db.update(urls).set(updateData).where(eq(urls.id, urlId));
  }

  return results;
}

export function parseEngines(enginesRaw: string | null | undefined): string[] {
  if (!enginesRaw) return ["google", "bing", "yandex"];
  try {
    const parsed = JSON.parse(enginesRaw);
    return Array.isArray(parsed) ? parsed : ["google", "bing", "yandex"];
  } catch {
    return ["google", "bing", "yandex"];
  }
}

export async function findUrlEntriesByStrings(
  siteId: string,
  urlStrings: string[]
): Promise<Array<{ urlId: string; url: string }>> {
  const results: Array<{ urlId: string; url: string }> = [];
  for (const url of urlStrings) {
    const record = await db.query.urls.findFirst({
      where: and(eq(urls.siteId, siteId), eq(urls.url, url)),
    });
    if (record) {
      results.push({ urlId: record.id, url: record.url });
    }
  }
  return results;
}
