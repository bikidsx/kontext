import type { Message } from '../types.js';

export interface LLMClient {
  generateText(messages: Message[]): Promise<string>;
  generateJSON<T>(messages: Message[], schema?: string): Promise<T>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export abstract class BaseLLMClient implements LLMClient {
  abstract generateText(messages: Message[]): Promise<string>;
  abstract generateJSON<T>(messages: Message[], schema?: string): Promise<T>;
  abstract embed(text: string): Promise<number[]>;
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    // Default: sequential embedding (override for batch support)
    return Promise.all(texts.map(t => this.embed(t)));
  }
}
