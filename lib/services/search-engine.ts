export interface SubmitResult {
  success: boolean;
  url: string;
  message?: string;
  error?: string;
}

export interface EngineConfig {
  apiKey?: string;
  accessToken?: string;
  siteUrl?: string;
  [key: string]: unknown;
}

export interface SearchEngine {
  readonly name: string;
  submit(urls: string[], config: EngineConfig): Promise<SubmitResult[]>;
}
