import { GoogleGenAI } from '@google/genai';
import type { Message } from '../types.js';
import { BaseLLMClient } from './base.js';

export class GeminiClient extends BaseLLMClient {
  private client: GoogleGenAI;
  private model: string;
  private embeddingModel: string;

  constructor(config: { apiKey?: string; model?: string; embeddingModel?: string } = {}) {
    super();
    const apiKey = config.apiKey ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key required. Set GOOGLE_API_KEY or pass apiKey.');
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = config.model ?? 'gemini-2.5-flash';
    this.embeddingModel = config.embeddingModel ?? 'gemini-embedding-001';
  }

  async generateText(messages: Message[]): Promise<string> {
    const { contents, systemInstruction } = this.formatMessages(messages);
    
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        systemInstruction,
      },
    });
    return response.text ?? '';
  }

  async generateJSON<T>(messages: Message[]): Promise<T> {
    const { contents, systemInstruction } = this.formatMessages(messages);
    
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });
    return JSON.parse(response.text ?? '{}') as T;
  }


  async embed(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: this.embeddingModel,
      contents: text.replace(/\n/g, ' ').trim(),
    });
    return response.embeddings?.[0]?.values ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Gemini supports batch embedding
    const results: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embed(text);
      results.push(embedding);
    }
    return results;
  }

  private formatMessages(messages: Message[]) {
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    let systemInstruction: string | undefined;

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    return { contents, systemInstruction };
  }
}
