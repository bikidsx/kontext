import { FalkorClient } from './falkordb/client.js';
import { createLLMClient, type LLMClient } from './llm/index.js';
import { MemoryAdder } from './memory/add.js';
import { MemorySearcher } from './memory/search.js';
import { ContextBuilder } from './memory/context.js';
import type { KontextConfig, Message, AddOptions, SearchOptions, SearchResult } from './types.js';
import { AddOptionsSchema } from './types.js';

export class Kontext {
  private db: FalkorClient;
  private llm: LLMClient;
  private adder: MemoryAdder;
  private searcher: MemorySearcher;
  private contextBuilder: ContextBuilder;
  private connected = false;

  constructor(config: KontextConfig) {
    this.db = new FalkorClient(config.falkordb);
    this.llm = createLLMClient(config.llm);
    this.adder = new MemoryAdder(this.db, this.llm);
    this.searcher = new MemorySearcher(this.db, this.llm);
    this.contextBuilder = new ContextBuilder(this.searcher);
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.db.connect();
      this.connected = true;
    }
  }

  /**
   * Add messages to memory. Extracts entities and relationships automatically.
   * 
   * @param messages - String or array of messages to add
   * @param options - Add options including userId/agentId/sessionId
   * @param options.async - If true, returns immediately and processes in background
   */
  async add(
    messages: string | Message[],
    options: AddOptions
  ): Promise<{ entities: number; edges: number }> {
    await this.ensureConnected();
    
    // Validate options
    AddOptionsSchema.parse(options);

    // Normalize messages
    const normalizedMessages: Message[] = typeof messages === 'string'
      ? [{ role: 'user', content: messages }]
      : messages;

    // If async mode, fire-and-forget
    if (options.async) {
      this.adder.add(normalizedMessages, options).catch((e) => {
        console.error('[Kontext] Background add failed:', e);
      });
      return { entities: 0, edges: 0 }; // Return immediately
    }

    const result = await this.adder.add(normalizedMessages, options);
    
    return {
      entities: result.entities.length,
      edges: result.edges.length,
    };
  }


  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    await this.ensureConnected();
    return this.searcher.search(query, options);
  }

  async getContext(query: string, options: SearchOptions): Promise<string> {
    await this.ensureConnected();
    return this.contextBuilder.getContext(query, options);
  }

  async delete(options: { userId?: string; agentId?: string; sessionId?: string }): Promise<void> {
    await this.ensureConnected();
    const groupId = options.userId ?? options.agentId ?? options.sessionId;
    if (!groupId) {
      throw new Error('At least one of userId, agentId, or sessionId is required');
    }
    await this.db.execute('MATCH (n {groupId: $groupId}) DETACH DELETE n', { groupId });
  }

  async close(): Promise<void> {
    await this.db.close();
    this.connected = false;
  }
}
