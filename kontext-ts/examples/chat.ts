/**
 * Interactive Chat Example with Kontext Memory
 * 
 * Chat with an AI assistant that remembers your conversation.
 * 
 * Run: bun run examples/chat.ts
 */

import 'dotenv/config';
import * as readline from 'readline';
import { Kontext } from '../src/index.js';
import { GeminiClient } from '../src/llm/gemini.js';

const USER_ID = process.env.USER_ID || 'demo-user';

async function main() {
  console.log('🧠 AI Assistant - Powered by Kontext Memory');
  console.log('==========================================');
  console.log(`User: ${USER_ID}`);
  console.log('Type "quit" to exit, "memory" to see stored context\n');

  const kontext = new Kontext({
    llm: { provider: 'gemini', model: 'gemini-2.5-flash' },
  });

  const llm = new GeminiClient();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer));
    });
  };

  try {
    while (true) {
      const userInput = await askQuestion('\n🧑 You: ');
      
      if (userInput.toLowerCase() === 'quit') {
        console.log('\nGoodbye! Your memories have been saved. 👋');
        break;
      }

      if (userInput.toLowerCase() === 'memory') {
        const context = await kontext.getContext('Show all information', { userId: USER_ID });
        console.log('\n📚 Stored Memory:\n' + context);
        continue;
      }

      if (!userInput.trim()) continue;

      // Benchmark: Get context from memory
      const searchStart = performance.now();
      const context = await kontext.getContext(userInput, { userId: USER_ID });
      const searchTime = performance.now() - searchStart;

      // Build prompt with memory context
      const systemPrompt = `You are a friendly AI assistant with persistent memory.
You remember information about the user across conversations.

## User Memory
${context}

## Instructions
- Be warm, helpful, and personalized
- Reference known information when relevant
- Keep responses concise but friendly
- Acknowledge when you learn new information about the user`;

      // Benchmark: Generate response
      const llmStart = performance.now();
      const response = await llm.generateText([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ]);
      const llmTime = performance.now() - llmStart;

      console.log(`\n🤖 Assistant: ${response}`);

      // Show response time (what user actually waits for)
      console.log(`\n⏱️  Search: ${searchTime.toFixed(0)}ms | LLM: ${llmTime.toFixed(0)}ms | Response: ${(searchTime + llmTime).toFixed(0)}ms`);

      // Store conversation (sync to ensure it's saved before next query)
      const saveStart = performance.now();
      await kontext.add([
        { role: 'user', content: userInput },
        { role: 'assistant', content: response },
      ], { userId: USER_ID });
      const saveTime = performance.now() - saveStart;
      console.log(`   💾 Memory saved (${saveTime.toFixed(0)}ms)`);
    }
  } finally {
    rl.close();
    await kontext.close();
  }
}

main().catch(console.error);
