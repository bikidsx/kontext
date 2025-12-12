import type { FalkorClient } from '../falkordb/client.js';
import type { LLMClient } from '../llm/base.js';
import type { SearchOptions, SearchResult, Relation, EntitySummary } from '../types.js';
import { QUERIES } from '../falkordb/queries.js';

interface RawSearchResult {
  fact: string;
  sourceEntity: string;
  sourceType: string;
  targetEntity: string;
  targetType: string;
  relation: string;
  validAt?: string;
}

export class MemorySearcher {
  constructor(
    private db: FalkorClient,
    _llm: LLMClient // Reserved for future vector search
  ) {}

  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    const groupId = options.userId ?? options.agentId ?? options.sessionId;
    if (!groupId) {
      throw new Error('At least one of userId, agentId, or sessionId is required');
    }

    const limit = options.limit ?? 20;

    // Always get all edges for the group first (most reliable)
    let rawResults = await this.getAllEdges(groupId, limit);
    
    // If we have a specific query and results, try to filter/rank by relevance
    if (rawResults.length === 0) {
      // Try text-based search as fallback
      rawResults = await this.searchByText(query, groupId, limit);
    }

    return this.formatResults(rawResults);
  }

  private async searchByText(query: string, groupId: string, limit: number): Promise<RawSearchResult[]> {
    try {
      return await this.db.query<RawSearchResult>(QUERIES.searchByEntityName, {
        query,
        groupId,
        limit,
      });
    } catch (e) {
      console.error('Text search failed:', e);
      return [];
    }
  }

  private async getAllEdges(groupId: string, limit: number): Promise<RawSearchResult[]> {
    try {
      return await this.db.query<RawSearchResult>(QUERIES.searchEdges, {
        groupId,
        limit,
      });
    } catch (e) {
      console.error('Edge search failed:', e);
      return [];
    }
  }


  private formatResults(rawResults: RawSearchResult[]): SearchResult {
    const facts: string[] = [];
    const relations: Relation[] = [];
    const entitiesMap = new Map<string, EntitySummary>();

    for (const r of rawResults) {
      // Add fact
      if (r.fact && !facts.includes(r.fact)) {
        facts.push(r.fact);
      }

      // Add relation
      if (r.sourceEntity && r.targetEntity && r.relation) {
        relations.push({
          source: r.sourceEntity,
          relation: r.relation,
          target: r.targetEntity,
          fact: r.fact,
          validAt: r.validAt ? new Date(r.validAt) : undefined,
        });
      }

      // Collect unique entities
      if (r.sourceEntity && !entitiesMap.has(r.sourceEntity)) {
        entitiesMap.set(r.sourceEntity, {
          name: r.sourceEntity,
          type: r.sourceType ?? 'Entity',
          summary: '',
        });
      }
      if (r.targetEntity && !entitiesMap.has(r.targetEntity)) {
        entitiesMap.set(r.targetEntity, {
          name: r.targetEntity,
          type: r.targetType ?? 'Entity',
          summary: '',
        });
      }
    }

    return {
      facts,
      relations,
      entities: Array.from(entitiesMap.values()),
      episodes: [],
      score: rawResults.length > 0 ? 1 : 0,
    };
  }
}
