import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../types.js';
import { BaseLLMClient } from './base.js';
import { OpenAIClient } from './openai.js';

export class AnthropicClient extends BaseLLMClient {
  private client: Anthropic;
  private model: string;
  private embedder: OpenAIClient; // Anthropic doesn't have embeddings, use OpenAI

  constructor(config: { apiKey?: string; model?: string; openaiKey?: string } = {}) {
    super();
    this.client = new Anthropic({
      apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    this.model = config.model ?? 'claude-3-5-sonnet-latest';
    // Use OpenAI for embeddings since Anthropic doesn't provide them
    this.embedder = new OpenAIClient({ apiKey: config.openaiKey });
  }

  async generateText(messages: Message[]): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const otherMsgs = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemMsg?.content,
      messages: otherMsgs.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find(c => c.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  async generateJSON<T>(messages: Message[]): Promise<T> {
    const jsonMessages = [...messages];
    const lastIdx = jsonMessages.length - 1;
    if (lastIdx >= 0) {
      jsonMessages[lastIdx] = {
        ...jsonMessages[lastIdx],
        content: jsonMessages[lastIdx].content + '\n\nRespond with valid JSON only.',
      };
    }
    const text = await this.generateText(jsonMessages);
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] ?? '{}') as T;
  }

  async embed(text: string): Promise<number[]> {
    return this.embedder.embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embedder.embedBatch(texts);
  }
}
