import { FalkorDB, Graph } from 'falkordb';
import type { FalkorDBConfig } from '../types.js';

// FalkorDB param types
type ParamValue = string | number | boolean | null | number[] | string[];
type QueryParams = Record<string, ParamValue>;

export class FalkorClient {
  private client: FalkorDB | null = null;
  private graph: Graph | null = null;
  private config: Required<FalkorDBConfig>;

  constructor(config: FalkorDBConfig = {}) {
    this.config = {
      host: config.host ?? process.env.FALKORDB_HOST ?? 'localhost',
      port: config.port ?? parseInt(process.env.FALKORDB_PORT ?? '6379'),
      password: config.password ?? process.env.FALKORDB_PASSWORD ?? '',
      database: config.database ?? 'kontext',
    };
  }

  async connect(): Promise<void> {
    if (this.client) return;

    this.client = await FalkorDB.connect({
      socket: {
        host: this.config.host,
        port: this.config.port,
      },
      password: this.config.password || undefined,
    });

    this.graph = this.client.selectGraph(this.config.database);
    await this.ensureIndices();
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.graph = null;
    }
  }

  getGraph(): Graph {
    if (!this.graph) {
      throw new Error('FalkorDB not connected. Call connect() first.');
    }
    return this.graph;
  }


  /**
   * Clean params: remove undefined values and convert dates to ISO strings
   */
  private cleanParams(params: Record<string, unknown>): QueryParams {
    const cleaned: QueryParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        // Filter out undefined from arrays and convert dates
        cleaned[key] = value
          .filter((v): v is NonNullable<typeof v> => v !== undefined)
          .map(v => v instanceof Date ? v.toISOString() : v) as string[] | number[];
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  async query<T = unknown>(cypher: string, params: Record<string, unknown> = {}): Promise<T[]> {
    const graph = this.getGraph();
    const cleanedParams = this.cleanParams(params);
    
    // FalkorDB JS client: graph.query(cypher, { params: {...} })
    const result = await graph.query(cypher, { params: cleanedParams });
    
    // Convert FalkorDB result to array of objects
    const records: T[] = [];
    if (result.data) {
      for (const row of result.data) {
        if (Array.isArray(row)) {
          if (row.length === 1) {
            records.push(row[0] as T);
          } else {
            // Multi-column: create object from header
            const obj: Record<string, unknown> = {};
            const header = (result as { header?: string[] }).header ?? [];
            header.forEach((col: string, i: number) => {
              obj[col] = row[i];
            });
            records.push(obj as T);
          }
        } else {
          records.push(row as T);
        }
      }
    }
    return records;
  }

  async execute(cypher: string, params: Record<string, unknown> = {}): Promise<void> {
    const graph = this.getGraph();
    const cleanedParams = this.cleanParams(params);
    await graph.query(cypher, { params: cleanedParams });
  }


  private async ensureIndices(): Promise<void> {
    const graph = this.getGraph();

    // FalkorDB index syntax
    const indices = [
      // Entity indices
      'CREATE INDEX FOR (e:Entity) ON (e.uuid)',
      'CREATE INDEX FOR (e:Entity) ON (e.groupId)',
      'CREATE INDEX FOR (e:Entity) ON (e.name)',
      // Episode indices
      'CREATE INDEX FOR (ep:Episode) ON (ep.uuid)',
      'CREATE INDEX FOR (ep:Episode) ON (ep.groupId)',
    ];

    for (const query of indices) {
      try {
        await graph.query(query);
      } catch (e) {
        // Index might already exist - that's fine
        const msg = String(e);
        if (!msg.includes('already indexed') && !msg.includes('already exists')) {
          console.warn('Index creation warning:', msg);
        }
      }
    }
  }
}
