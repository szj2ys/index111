import { SearchEngine, SubmitResult, EngineConfig } from "./search-engine";
import { googleEngine } from "./google-indexing";
import { bingEngine } from "./bing-indexing";
import { yandexEngine } from "./yandex-indexing";

export const engines: Record<string, SearchEngine> = {
  google: googleEngine,
  bing: bingEngine,
  yandex: yandexEngine,
};

export function getEngine(name: string): SearchEngine | undefined {
  return engines[name];
}

export const ALL_ENGINES = ["google", "bing", "yandex"] as const;
export type EngineName = (typeof ALL_ENGINES)[number];

export function isValidEngine(name: string): name is EngineName {
  return ALL_ENGINES.includes(name as EngineName);
}
