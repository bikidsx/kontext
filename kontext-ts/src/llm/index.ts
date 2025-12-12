export { BaseLLMClient, type LLMClient } from './base.js';
export { OpenAIClient } from './openai.js';
export { AnthropicClient } from './anthropic.js';
export { GeminiClient } from './gemini.js';
export { OllamaClient } from './ollama.js';

import type { LLMConfig } from '../types.js';
import type { LLMClient } from './base.js';
import { OpenAIClient } from './openai.js';
import { AnthropicClient } from './anthropic.js';
import { GeminiClient } from './gemini.js';
import { OllamaClient } from './ollama.js';

export function createLLMClient(config: LLMConfig): LLMClient {
  switch (config.provider) {
    case 'openai':
      return new OpenAIClient({ apiKey: config.apiKey, model: config.model });
    case 'anthropic':
      return new AnthropicClient({ apiKey: config.apiKey, model: config.model });
    case 'gemini':
      return new GeminiClient({ apiKey: config.apiKey, model: config.model });
    case 'ollama':
      return new OllamaClient({ host: config.baseUrl, model: config.model });
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}
