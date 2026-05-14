import type { SearchEngine, SubmitResult, EngineConfig } from "./search-engine";

const YANDEX_API_BASE = "https://api.webmaster.yandex.net/v4";

export const yandexEngine: SearchEngine = {
  name: "yandex",
  async submit(urls: string[], config: EngineConfig): Promise<SubmitResult[]> {
    const apiKey = config.apiKey as string | undefined;
    const userId = config.userId as string | undefined;
    const hostId = config.hostId as string | undefined;

    if (!apiKey) {
      throw new Error("Yandex engine requires apiKey in config");
    }
    if (!userId) {
      throw new Error("Yandex engine requires userId in config");
    }
    if (!hostId) {
      throw new Error("Yandex engine requires hostId in config");
    }

    const results: SubmitResult[] = [];

    for (const url of urls) {
      const endpoint = `${YANDEX_API_BASE}/user/${encodeURIComponent(userId)}/hosts/${encodeURIComponent(hostId)}/recrawl/queue`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `OAuth ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          results.push({
            success: true,
            url,
            message: "Submitted successfully",
          });
        } else {
          const errorText = await response.text().catch(() => "Unknown error");
          results.push({
            success: false,
            url,
            error: `Yandex API error: ${response.status} ${response.statusText} — ${errorText}`,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ success: false, url, error: message });
      }
    }

    return results;
  },
};
