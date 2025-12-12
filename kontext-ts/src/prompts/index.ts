import { DefaultEntityTypes, DefaultRelationTypes } from '../types.js';

export const ENTITY_EXTRACTION_PROMPT = `You are an entity extraction system for an AI memory system.
Extract all entities (people, places, things, concepts) from the conversation.

Common entity types: ${DefaultEntityTypes.join(', ')}

Rules:
- Extract the entity name exactly as mentioned
- Classify into the most appropriate type (use custom types if needed)
- Include implicit entities (e.g., "my car" → a Product or Thing)
- ALWAYS include "User" as a Person entity to represent the speaker
- Extract any names, places, organizations, preferences, or things mentioned

Respond with JSON:
{
  "entities": [
    { "name": "entity name", "type": "EntityType" }
  ]
}`;

export const RELATION_EXTRACTION_PROMPT = `You are a relationship extraction system for an AI memory system.
Given entities and conversation, extract relationships between them.

Common relationship types: ${DefaultRelationTypes.join(', ')}

Rules:
- Each relationship must connect two extracted entities
- Create a human-readable fact for each relationship
- Facts should be complete sentences
- Use "User" as the source for statements about the speaker (e.g., "my name is X" → User HAS_NAME X)
- Include temporal context if mentioned (dates, times)
- Extract ALL relationships, even simple ones like names and preferences
- Use custom relationship types if the common ones don't fit

Respond with JSON:
{
  "relations": [
    { 
      "source": "entity name",
      "relation": "RELATION_TYPE", 
      "target": "entity name",
      "fact": "Human readable fact sentence"
    }
  ]
}`;


export const CONFLICT_RESOLUTION_PROMPT = `You are a fact conflict resolver for an AI memory system.
Given an existing fact and a new fact, determine if they conflict.

Rules:
- "keep": New fact adds information, doesn't contradict
- "update": New fact updates/corrects the old fact  
- "invalidate": New fact contradicts old fact (old becomes invalid)

Respond with JSON:
{
  "action": "keep" | "update" | "invalidate",
  "reason": "Brief explanation"
}`;

export const CONTEXT_SUMMARY_PROMPT = `You are a context summarizer for an AI memory system.
Given facts and relationships about a user/situation, create a concise summary.

Rules:
- Focus on actionable information
- Highlight preferences and important details
- Note any issues or concerns
- Keep it under 200 words

Respond with a plain text summary.`;

export function buildEntityExtractionMessages(content: string, userId: string) {
  return [
    { role: 'system' as const, content: ENTITY_EXTRACTION_PROMPT },
    { 
      role: 'user' as const, 
      content: `User ID: ${userId}\n\nConversation:\n${content}` 
    },
  ];
}

export function buildRelationExtractionMessages(
  content: string, 
  entities: Array<{ name: string; type: string }>
) {
  return [
    { role: 'system' as const, content: RELATION_EXTRACTION_PROMPT },
    { 
      role: 'user' as const, 
      content: `Entities found: ${JSON.stringify(entities)}\n\nConversation:\n${content}` 
    },
  ];
}

export function buildConflictResolutionMessages(oldFact: string, newFact: string) {
  return [
    { role: 'system' as const, content: CONFLICT_RESOLUTION_PROMPT },
    { 
      role: 'user' as const, 
      content: `Existing fact: "${oldFact}"\n\nNew fact: "${newFact}"` 
    },
  ];
}
