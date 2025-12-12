import { v4 as uuidv4 } from 'uuid';
import type { FalkorClient } from '../falkordb/client.js';
import type { LLMClient } from '../llm/base.js';
import type { Message, AddOptions, ExtractedEntities, ExtractedRelations, Entity, Edge, Episode } from '../types.js';
import { QUERIES } from '../falkordb/queries.js';
import { buildEntityExtractionMessages, buildRelationExtractionMessages } from '../prompts/index.js';

export class MemoryAdder {
  constructor(
    private db: FalkorClient,
    private llm: LLMClient
  ) {}

  async add(messages: Message[], options: AddOptions): Promise<{ entities: Entity[]; edges: Edge[]; episode: Episode }> {
    const groupId = options.userId ?? options.agentId ?? options.sessionId!;
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const validAt = options.validAt ?? new Date();

    // 1. Create episode
    const episode = await this.createEpisode(content, groupId, validAt);

    // 2. Extract entities via LLM
    const extractedEntities = await this.extractEntities(content, groupId);
    
    // 3. Store entities
    const entities = await this.storeEntities(extractedEntities, groupId, episode.uuid);

    // 4. Extract relationships via LLM
    const extractedRelations = await this.extractRelations(content, extractedEntities);

    // 5. Store edges
    const edges = await this.storeEdges(extractedRelations, entities, groupId, episode.uuid, validAt);

    return { entities, edges, episode };
  }

  private async createEpisode(content: string, groupId: string, validAt: Date): Promise<Episode> {
    const episode: Episode = {
      uuid: uuidv4(),
      content,
      source: 'message',
      groupId,
      validAt,
      createdAt: new Date(),
    };

    await this.db.execute(QUERIES.createEpisode, {
      uuid: episode.uuid,
      content: episode.content,
      source: episode.source,
      groupId: episode.groupId,
      validAt: episode.validAt.toISOString(),
      createdAt: episode.createdAt.toISOString(),
    });

    return episode;
  }


  private async extractEntities(content: string, groupId: string): Promise<Array<{ name: string; type: string }>> {
    try {
      const messages = buildEntityExtractionMessages(content, groupId);
      const result = await this.llm.generateJSON<ExtractedEntities>(messages);
      return result.entities ?? [];
    } catch (e) {
      console.error('Entity extraction failed:', e);
      return [];
    }
  }

  private async extractRelations(
    content: string, 
    entities: Array<{ name: string; type: string }>
  ): Promise<Array<{ source: string; relation: string; target: string; fact: string }>> {
    if (entities.length < 2) return [];
    try {
      const messages = buildRelationExtractionMessages(content, entities);
      const result = await this.llm.generateJSON<ExtractedRelations>(messages);
      return result.relations ?? [];
    } catch (e) {
      console.error('Relation extraction failed:', e);
      return [];
    }
  }

  private async storeEntities(
    extracted: Array<{ name: string; type: string }>,
    groupId: string,
    episodeUuid: string
  ): Promise<Entity[]> {
    const entities: Entity[] = [];

    for (const ext of extracted) {
      // Check if entity already exists
      const existing = await this.db.query<{ uuid: string; name: string; type: string }>(
        QUERIES.findEntityByName, 
        { name: ext.name, groupId }
      );

      let entity: Entity;
      if (existing.length > 0) {
        entity = {
          uuid: existing[0].uuid,
          name: existing[0].name,
          type: existing[0].type,
          summary: '',
          groupId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        entity = {
          uuid: uuidv4(),
          name: ext.name,
          type: ext.type,
          summary: '',
          groupId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.db.execute(QUERIES.createEntity, {
          uuid: entity.uuid,
          name: entity.name,
          type: entity.type,
          summary: entity.summary,
          groupId: entity.groupId,
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        });
      }

      // Link episode to entity
      await this.db.execute(QUERIES.linkEpisodeToEntity, {
        episodeUuid,
        entityUuid: entity.uuid,
      });

      entities.push(entity);
    }

    return entities;
  }


  private async storeEdges(
    relations: Array<{ source: string; relation: string; target: string; fact: string }>,
    entities: Entity[],
    groupId: string,
    episodeUuid: string,
    validAt: Date
  ): Promise<Edge[]> {
    const edges: Edge[] = [];
    const entityMap = new Map(entities.map(e => [e.name.toLowerCase(), e]));

    for (const rel of relations) {
      const sourceEntity = entityMap.get(rel.source.toLowerCase());
      const targetEntity = entityMap.get(rel.target.toLowerCase());

      if (!sourceEntity || !targetEntity) {
        console.warn(`Skipping relation: entity not found for ${rel.source} -> ${rel.target}`);
        continue;
      }

      const edge: Edge = {
        uuid: uuidv4(),
        sourceUuid: sourceEntity.uuid,
        targetUuid: targetEntity.uuid,
        name: rel.relation,
        fact: rel.fact,
        groupId,
        episodes: [episodeUuid],
        validAt,
        createdAt: new Date(),
      };

      try {
        await this.db.execute(QUERIES.createEdge, {
          uuid: edge.uuid,
          sourceUuid: edge.sourceUuid,
          targetUuid: edge.targetUuid,
          name: edge.name,
          fact: edge.fact,
          groupId: edge.groupId,
          episodes: edge.episodes,
          validAt: edge.validAt?.toISOString() ?? null,
          createdAt: edge.createdAt.toISOString(),
        });
        edges.push(edge);
      } catch (e) {
        console.error('Failed to create edge:', e);
      }
    }

    return edges;
  }
}
