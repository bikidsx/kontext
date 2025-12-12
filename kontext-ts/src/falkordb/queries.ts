// ============================================================================
// Cypher Queries for FalkorDB
// ============================================================================

export const QUERIES = {
  // Entity operations
  createEntity: `
    MERGE (e:Entity {uuid: $uuid})
    SET e.name = $name,
        e.type = $type,
        e.summary = $summary,
        e.groupId = $groupId,
        e.createdAt = $createdAt,
        e.updatedAt = $updatedAt
    RETURN e
  `,

  findEntityByName: `
    MATCH (e:Entity)
    WHERE e.name = $name AND e.groupId = $groupId
    RETURN e.uuid AS uuid, e.name AS name, e.type AS type, 
           e.summary AS summary, e.groupId AS groupId,
           e.createdAt AS createdAt, e.updatedAt AS updatedAt
    LIMIT 1
  `,

  // Episode operations
  createEpisode: `
    CREATE (ep:Episode {
      uuid: $uuid,
      content: $content,
      source: $source,
      groupId: $groupId,
      validAt: $validAt,
      createdAt: $createdAt
    })
    RETURN ep
  `,

  // Edge (relationship) operations
  createEdge: `
    MATCH (source:Entity {uuid: $sourceUuid})
    MATCH (target:Entity {uuid: $targetUuid})
    CREATE (source)-[r:RELATES_TO {
      uuid: $uuid,
      name: $name,
      fact: $fact,
      groupId: $groupId,
      episodes: $episodes,
      validAt: $validAt,
      createdAt: $createdAt
    }]->(target)
    RETURN r
  `,

  // Link episode to entity
  linkEpisodeToEntity: `
    MATCH (ep:Episode {uuid: $episodeUuid})
    MATCH (e:Entity {uuid: $entityUuid})
    MERGE (ep)-[:MENTIONS]->(e)
  `,

  // Search: Get all edges for a group (simple search without vector)
  searchEdges: `
    MATCH (source:Entity)-[r:RELATES_TO]->(target:Entity)
    WHERE r.groupId = $groupId
      AND (r.invalidAt IS NULL)
    RETURN 
      r.fact AS fact,
      source.name AS sourceEntity,
      source.type AS sourceType,
      target.name AS targetEntity,
      target.type AS targetType,
      r.name AS relation,
      r.validAt AS validAt
    ORDER BY r.createdAt DESC
    LIMIT $limit
  `,

  // Search by entity name or fact text (text match)
  searchByEntityName: `
    MATCH (source:Entity)-[r:RELATES_TO]->(target:Entity)
    WHERE r.groupId = $groupId
      AND r.invalidAt IS NULL
      AND (
        toLower(source.name) CONTAINS toLower($query)
        OR toLower(target.name) CONTAINS toLower($query)
        OR toLower(r.fact) CONTAINS toLower($query)
        OR toLower(r.name) CONTAINS toLower($query)
      )
    RETURN DISTINCT
      r.fact AS fact,
      source.name AS sourceEntity,
      source.type AS sourceType,
      target.name AS targetEntity,
      target.type AS targetType,
      r.name AS relation,
      r.validAt AS validAt
    LIMIT $limit
  `,

  // Get entity with relationships
  getEntityContext: `
    MATCH (e:Entity {uuid: $uuid})
    OPTIONAL MATCH (e)-[r:RELATES_TO]->(target:Entity)
    WHERE r.invalidAt IS NULL
    OPTIONAL MATCH (source:Entity)-[r2:RELATES_TO]->(e)
    WHERE r2.invalidAt IS NULL
    RETURN e,
      collect(DISTINCT {relation: r.name, target: target.name, fact: r.fact}) AS outgoing,
      collect(DISTINCT {relation: r2.name, source: source.name, fact: r2.fact}) AS incoming
  `,

  // Delete all data for a group
  deleteGroup: `
    MATCH (n)
    WHERE n.groupId = $groupId
    DETACH DELETE n
  `,

  // Invalidate an edge
  invalidateEdge: `
    MATCH ()-[r:RELATES_TO {uuid: $uuid}]->()
    SET r.invalidAt = $invalidAt
    RETURN r
  `,
} as const;
