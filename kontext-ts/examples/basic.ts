/**
 * Basic Kontext Example
 * 
 * Demonstrates core memory operations: add, search, getContext
 * 
 * Run: bun run examples/basic.ts
 */

import 'dotenv/config';
import { Kontext } from '../src/index.js';

async function main() {
  // Initialize Kontext
  const kontext = new Kontext({
    falkordb: {
      host: 'localhost',
      port: 6379,
    },
    llm: {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    },
  });

  const userId = 'demo-user';

  try {
    // Add a conversation with personal info
    console.log('Adding personal info...');
    await kontext.add([
      { role: 'user', content: 'Hi, my name is Alice and I work at Acme Corp as a software engineer.' },
      { role: 'assistant', content: 'Nice to meet you, Alice! Software engineering at Acme Corp sounds exciting.' },
    ], { userId });

    // Add preferences
    console.log('Adding preferences...');
    await kontext.add(
      'I prefer dark mode in all my apps. I also love coffee but I\'m lactose intolerant.',
      { userId }
    );

    // Add more context
    console.log('Adding more context...');
    await kontext.add([
      { role: 'user', content: 'I\'m working on a machine learning project right now.' },
      { role: 'assistant', content: 'That\'s great! What kind of ML project are you working on?' },
    ], { userId });

    // Search for relevant context
    console.log('\nSearching for user info...');
    const results = await kontext.search('What does Alice do for work?', { userId });
    console.log('Search results:', JSON.stringify(results, null, 2));

    // Get formatted context for an agent
    console.log('\nGetting context for agent...');
    const context = await kontext.getContext('Help Alice with her day', { userId });
    console.log('Agent context:\n', context);

  } finally {
    await kontext.close();
  }
}

main().catch(console.error);
