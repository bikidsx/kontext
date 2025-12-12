import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Entity {
  uuid: string;
  name: string;
  type: string;
  summary: string;
  groupId: string;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Edge {
  uuid: string;
  sourceUuid: string;
  targetUuid: string;
  name: string;
  fact: string;
  groupId: string;
  embedding?: number[];
  episodes: string[];
  validAt?: Date;
  invalidAt?: Date;
  createdAt: Date;
}

export interface Episode {
  uuid: string;
  content: string;
  source: 'message' | 'document' | 'json';
  groupId: string;
  validAt: Date;
  createdAt: Date;
}


// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  facts: string[];
  relations: Relation[];
  entities: EntitySummary[];
  episodes: EpisodeSummary[];
  score: number;
}

export interface Relation {
  source: string;
  relation: string;
  target: string;
  fact: string;
  validAt?: Date;
}

export interface EntitySummary {
  name: string;
  type: string;
  summary: string;
}

export interface EpisodeSummary {
  content: string;
  validAt: Date;
}

export type SearchMode = 'fast' | 'balanced' | 'deep';

export interface SearchOptions {
  userId?: string;
  agentId?: string;
  sessionId?: string;
  mode?: SearchMode;
  limit?: number;
  asOf?: Date;
}

export interface AddOptions {
  userId?: string;
  agentId?: string;
  sessionId?: string;
  validAt?: Date;
  /** If true, returns immediately and processes in background */
  async?: boolean;
}


// ============================================================================
// Configuration Types
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface FalkorDBConfig {
  host?: string;
  port?: number;
  password?: string;
  database?: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface EmbedderConfig {
  provider: 'openai' | 'gemini' | 'ollama';
  apiKey?: string;
  model?: string;
  dimensions?: number;
}

export interface KontextConfig {
  falkordb?: FalkorDBConfig;
  llm: LLMConfig;
  embedder?: EmbedderConfig;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const AddOptionsSchema = z.object({
  userId: z.string().optional(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  validAt: z.date().optional(),
}).refine(
  (data) => data.userId || data.agentId || data.sessionId,
  { message: 'At least one of userId, agentId, or sessionId is required' }
);


// ============================================================================
// Generic Entity & Relation Types
// ============================================================================

export const DefaultEntityTypes = [
  'Person',
  'User',
  'Organization',
  'Location',
  'Event',
  'Product',
  'Service',
  'Concept',
  'Preference',
  'Document',
  'Task',
  'Project',
] as const;

export type DefaultEntityType = (typeof DefaultEntityTypes)[number];

export const DefaultRelationTypes = [
  'HAS_NAME',
  'WORKS_AT',
  'LOCATED_IN',
  'BELONGS_TO',
  'RELATED_TO',
  'PREFERS',
  'LIKES',
  'DISLIKES',
  'KNOWS',
  'CREATED',
  'OWNS',
  'PARTICIPATED_IN',
  'MENTIONED',
  'IS_PART_OF',
] as const;

export type DefaultRelationType = (typeof DefaultRelationTypes)[number];

// ============================================================================
// Hotel Domain Types (Example Domain)
// ============================================================================

export const HotelEntityTypes = [
  ...DefaultEntityTypes,
  'Guest',
  'Room',
  'Booking',
  'Staff',
  'Amenity',
  'Complaint',
  'Request',
  'Payment',
  'Food',
  'Allergen',
] as const;

export type HotelEntityType = (typeof HotelEntityTypes)[number];

export const HotelRelationTypes = [
  ...DefaultRelationTypes,
  'BOOKED',
  'STAYED_IN',
  'REQUESTED',
  'COMPLAINED_ABOUT',
  'ASSIGNED_TO',
  'HANDLED_BY',
  'PAID_FOR',
  'INCLUDES',
  'IS_ALLERGIC_TO',
] as const;

export type HotelRelationType = (typeof HotelRelationTypes)[number];

// ============================================================================
// LLM Response Types
// ============================================================================

export interface ExtractedEntities {
  entities: Array<{
    name: string;
    type: string;
  }>;
}

export interface ExtractedRelations {
  relations: Array<{
    source: string;
    relation: string;
    target: string;
    fact: string;
  }>;
}

export interface ConflictResolution {
  action: 'keep' | 'update' | 'invalidate';
  reason: string;
}
