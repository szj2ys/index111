import type { SearchEngine, SubmitResult, EngineConfig } from "./search-engine";

const BING_API_BASE = "https://ssl.bing.com/webmaster/api.svc/json";

export const bingEngine: SearchEngine = {
  name: "bing",
  async submit(urls: string[], config: EngineConfig): Promise<SubmitResult[]> {
    const apiKey = config.apiKey;
    const siteUrl = config.siteUrl;
    if (!apiKey) {
      throw new Error("Bing engine requires apiKey in config");
    }

    const results: SubmitResult[] = [];

    // Use batch endpoint for 2+ URLs, single endpoint for 1 URL
    if (urls.length === 1) {
      const url = urls[0];
      const endpoint = `${BING_API_BASE}/SubmitUrl?apikey=${encodeURIComponent(apiKey)}`;
      const body = JSON.stringify({ siteUrl: siteUrl || url, url });

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (response.ok) {
          results.push({
            success: true,
            url,
            message: "Submitted successfully",
          });
        } else {
          results.push({
            success: false,
            url,
            error: `Bing API error: ${response.status} ${response.statusText}`,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ success: false, url, error: message });
      }
    } else {
      // Batch endpoint
      const endpoint = `${BING_API_BASE}/SubmitUrlBatch?apikey=${encodeURIComponent(apiKey)}`;
      const body = JSON.stringify({
        siteUrl: siteUrl || urls[0],
        urlList: urls,
      });

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (response.ok) {
          for (const url of urls) {
            results.push({
              success: true,
              url,
              message: "Submitted successfully",
            });
          }
        } else {
          const errorText = `${response.status} ${response.statusText}`;
          for (const url of urls) {
            results.push({
              success: false,
              url,
              error: `Bing API error: ${errorText}`,
            });
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        for (const url of urls) {
          results.push({ success: false, url, error: message });
        }
      }
    }

    return results;
  },
};
