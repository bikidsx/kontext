import OpenAI from 'openai';
import type { Message } from '../types.js';
import { BaseLLMClient } from './base.js';

export class OpenAIClient extends BaseLLMClient {
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;

  constructor(config: { apiKey?: string; model?: string; embeddingModel?: string } = {}) {
    super();
    this.client = new OpenAI({
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
    });
    this.model = config.model ?? 'gpt-4o-mini';
    this.embeddingModel = config.embeddingModel ?? 'text-embedding-3-small';
  }

  async generateText(messages: Message[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    });
    return response.choices[0]?.message?.content ?? '';
  }

  async generateJSON<T>(messages: Message[]): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      response_format: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as T;
  }


  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text.replace(/\n/g, ' ').trim(),
    });
    return response.data[0]?.embedding ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts.map(t => t.replace(/\n/g, ' ').trim()),
    });
    return response.data.map(d => d.embedding);
  }
}
