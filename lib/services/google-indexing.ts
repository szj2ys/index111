import { google } from "googleapis";
import { db } from "@/db";
import { submitLogs } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

const indexing = google.indexing({ version: "v3" });

export interface SubmitResult {
  success: boolean;
  url: string;
  message?: string;
  error?: string;
}

interface IndexingMetadata {
  urlNotificationMetadata?: {
    latestUpdate?: { type: string };
  };
}

function createAuth(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export async function submitUrlToGoogle(
  accessToken: string,
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<SubmitResult> {
  try {
    const auth = createAuth(accessToken);
    const response = await indexing.urlNotifications.publish({
      auth,
      requestBody: { url, type },
    });

    const metadata = response.data as IndexingMetadata;
    const updateType = metadata.urlNotificationMetadata?.latestUpdate?.type;

    return {
      success: true,
      url,
      message: `Submitted successfully: ${updateType}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, url, error: message };
  }
}

export async function submitUrlsBatch(
  accessToken: string,
  urls: string[],
  userId: string,
  siteId: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<SubmitResult[]> {
  const results: SubmitResult[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await submitUrlToGoogle(accessToken, url, type);
    results.push(result);

    await db.insert(submitLogs).values({
      id: uuidv4(),
      userId,
      siteId,
      engine: "google",
      action: type,
      status: result.success ? "success" : "failed",
      responseMessage: result.message || result.error,
    });

    // Rate limit delay between requests (skip for the last one)
    if (i < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

export async function getUrlIndexingStatus(
  accessToken: string,
  url: string
): Promise<IndexingMetadata | { error: string }> {
  try {
    const auth = createAuth(accessToken);
    const response = await indexing.urlNotifications.getMetadata({ auth, url });
    return response.data as IndexingMetadata;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: message };
  }
}
