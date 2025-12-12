import { Ollama } from 'ollama';
import type { Message } from '../types.js';
import { BaseLLMClient } from './base.js';

export class OllamaClient extends BaseLLMClient {
  private client: Ollama;
  private model: string;
  private embeddingModel: string;

  constructor(config: { host?: string; model?: string; embeddingModel?: string } = {}) {
    super();
    this.client = new Ollama({
      host: config.host ?? process.env.OLLAMA_HOST ?? 'http://localhost:11434',
    });
    this.model = config.model ?? 'llama3.2';
    this.embeddingModel = config.embeddingModel ?? 'nomic-embed-text';
  }

  async generateText(messages: Message[]): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
    return response.message.content;
  }

  async generateJSON<T>(messages: Message[]): Promise<T> {
    const response = await this.client.chat({
      model: this.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      format: 'json',
    });
    return JSON.parse(response.message.content) as T;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embed({
      model: this.embeddingModel,
      input: text.replace(/\n/g, ' ').trim(),
    });
    return response.embeddings[0] ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embed({
      model: this.embeddingModel,
      input: texts.map(t => t.replace(/\n/g, ' ').trim()),
    });
    return response.embeddings;
  }
}
