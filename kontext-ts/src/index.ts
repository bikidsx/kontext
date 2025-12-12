// Main export
export { Kontext } from './kontext.js';

// Types
export type {
  Message,
  Entity,
  Edge,
  Episode,
  SearchResult,
  SearchOptions,
  AddOptions,
  SearchMode,
  Relation,
  EntitySummary,
  EpisodeSummary,
  KontextConfig,
  LLMConfig,
  LLMProvider,
  FalkorDBConfig,
  EmbedderConfig,
  HotelEntityType,
  HotelRelationType,
} from './types.js';

// Constants
export { HotelEntityTypes, HotelRelationTypes } from './types.js';

// LLM Clients (for advanced usage)
export { OpenAIClient } from './llm/openai.js';
export { AnthropicClient } from './llm/anthropic.js';
export { GeminiClient } from './llm/gemini.js';
export { OllamaClient } from './llm/ollama.js';
export { createLLMClient } from './llm/index.js';
export type { LLMClient } from './llm/base.js';

// FalkorDB Client (for advanced usage)
export { FalkorClient } from './falkordb/client.js';
