import type { SearchResult } from '../types.js';
import { MemorySearcher } from './search.js';
import type { SearchOptions } from '../types.js';

export class ContextBuilder {
  constructor(private searcher: MemorySearcher) {}

  async getContext(query: string, options: SearchOptions): Promise<string> {
    const results = await this.searcher.search(query, {
      ...options,
      mode: options.mode ?? 'balanced',
      limit: options.limit ?? 15,
    });

    return this.formatContext(results);
  }

  formatContext(results: SearchResult): string {
    const sections: string[] = [];

    // Facts section
    if (results.facts.length > 0) {
      sections.push('## Known Facts\n' + results.facts.map(f => `- ${f}`).join('\n'));
    }

    // Relationships section
    if (results.relations.length > 0) {
      const uniqueRelations = this.dedupeRelations(results.relations);
      sections.push(
        '## Relationships\n' +
        uniqueRelations.map(r => `- ${r.source} → ${r.relation} → ${r.target}`).join('\n')
      );
    }

    // Entities section
    if (results.entities.length > 0) {
      sections.push(
        '## Entities\n' +
        results.entities.map(e => `- ${e.name} (${e.type})`).join('\n')
      );
    }

    if (sections.length === 0) {
      return 'No relevant context found.';
    }

    return sections.join('\n\n');
  }

  private dedupeRelations(relations: SearchResult['relations']) {
    const seen = new Set<string>();
    return relations.filter(r => {
      const key = `${r.source}-${r.relation}-${r.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
