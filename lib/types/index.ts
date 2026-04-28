export interface SiteInput {
  domain: string;
  siteUrl: string;
  sitemapUrl?: string;
  autoSubmitEnabled?: boolean;
}

export interface SubmitRequest {
  siteId: string;
  urls?: string[];
  count?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type IndexStatus =
  | "submitted"
  | "indexed"
  | "crawled_not_indexed"
  | "not_found"
  | "error"
  | null;

export interface SiteUrl {
  id: string;
  siteId: string;
  url: string;
  path: string | null;
  indexStatus: IndexStatus;
  lastSubmittedGoogle: Date | null;
  priorityScore: number | null;
  priority: number | null;
}
