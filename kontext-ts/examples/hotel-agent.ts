/**
 * Example: Hotel Management AI Agent with Kontext Memory
 * 
 * This shows how to integrate Kontext with an AI agent
 * that handles hotel guest interactions.
 */

import { Kontext } from '../src/index.js';

// Simulated AI agent response (replace with actual LLM call)
async function generateAgentResponse(systemPrompt: string, userMessage: string): Promise<string> {
  console.log('System prompt includes:', systemPrompt.slice(0, 200) + '...');
  return `I understand your request. Based on your preferences, I'll help you with that.`;
}

async function hotelAgent() {
  const kontext = new Kontext({
    llm: { 
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    },
  });

  const guestId = 'guest-maria-garcia';

  try {
    // Simulate previous interactions stored in memory
    console.log('=== Setting up guest history ===\n');
    
    await kontext.add([
      { role: 'user', content: 'I\'m Maria Garcia, checking into room 501.' },
      { role: 'assistant', content: 'Welcome Ms. Garcia! Your suite is ready.' },
    ], { userId: guestId });

    await kontext.add(
      'I need extra towels and I prefer the room temperature at 68°F.',
      { userId: guestId }
    );

    await kontext.add([
      { role: 'user', content: 'Can you recommend a good Italian restaurant nearby?' },
      { role: 'assistant', content: 'I recommend Bella Vista, 5 minutes walk from here.' },
    ], { userId: guestId });

    // New interaction comes in
    console.log('\n=== New Guest Interaction ===\n');
    const newMessage = 'I\'d like to order room service for dinner tonight.';
    console.log('Guest:', newMessage);

    // Get context for the agent
    const context = await kontext.getContext(newMessage, { userId: guestId });
    
    // Build system prompt with context
    const systemPrompt = `You are a helpful hotel concierge AI assistant.

## Guest Context
${context}

## Instructions
- Be warm and personalized
- Reference known preferences when relevant
- Offer proactive suggestions based on history`;

    // Generate response (simulated)
    const response = await generateAgentResponse(systemPrompt, newMessage);
    console.log('Agent:', response);

    // Store the new interaction
    await kontext.add([
      { role: 'user', content: newMessage },
      { role: 'assistant', content: response },
    ], { userId: guestId });

    console.log('\n=== Memory Updated ===');

  } finally {
    await kontext.close();
  }
}

hotelAgent().catch(console.error);
