# Kontext

Ultra-fast contextual memory for AI agents. Built on FalkorDB.

## Features

- **🚀 Fast** - Sub-30ms context retrieval
- **🧠 Automatic** - LLM-powered entity and relationship extraction
- **⏰ Temporal** - Track when facts become true or false
- **🔌 Simple** - Three methods: `add()`, `search()`, `getContext()`
- **🔒 Multi-tenant** - Isolated memory per user/agent/session

## Quick Start

```bash
# Start FalkorDB
docker run -p 6379:6379 falkordb/falkordb

# Install
npm install kontext-ts
```

```typescript
import { Kontext } from 'kontext-ts';

const kontext = new Kontext({
  llm: { provider: 'gemini' }
});

// Add memory
await kontext.add('My name is Alice and I work at Acme Corp', { 
  userId: 'alice' 
});

// Retrieve context
const context = await kontext.getContext('Tell me about Alice', { 
  userId: 'alice' 
});
// → "Alice works at Acme Corp"
```

## Why Kontext?

| Feature | Traditional RAG | Kontext |
|---------|-----------------|---------|
| Storage | Vector DB only | Graph + Vector + Text |
| Relationships | ❌ | ✅ Automatic extraction |
| Temporal | ❌ | ✅ Built-in |
| Latency | 50-200ms | **< 30ms** |

## Installation

```bash
npm install kontext-ts
# or
bun add kontext-ts
```

### Prerequisites

- Node.js 20+
- FalkorDB (via Docker)
- LLM API key (Gemini, OpenAI, Anthropic, or Ollama)

## Configuration

```typescript
const kontext = new Kontext({
  // FalkorDB connection (optional, defaults shown)
  falkordb: {
    host: 'localhost',
    port: 6379,
  },
  
  // LLM provider (required)
  llm: {
    provider: 'gemini',  // 'gemini' | 'openai' | 'anthropic' | 'ollama'
    model: 'gemini-2.5-flash',
    // apiKey: auto-detected from environment
  },
});
```

### Environment Variables

```bash
# Gemini (default)
GOOGLE_API_KEY=your-key

# OpenAI
OPENAI_API_KEY=your-key

# Anthropic
ANTHROPIC_API_KEY=your-key

# Ollama (no key needed)
OLLAMA_BASE_URL=http://localhost:11434
```

## API

### `add(messages, options)`

Add messages to memory. Automatically extracts entities and relationships.

```typescript
// From string
await kontext.add('I love pizza', { userId: 'bob' });

// From messages
await kontext.add([
  { role: 'user', content: 'Book a table for 2' },
  { role: 'assistant', content: 'Done!' }
], { userId: 'bob' });

// Async (fire-and-forget)
await kontext.add(messages, { userId: 'bob', async: true });
```

### `search(query, options)`

Search memory for relevant facts and relationships.

```typescript
const results = await kontext.search('food preferences', { 
  userId: 'bob' 
});

// {
//   facts: ['Bob loves pizza'],
//   relations: [{ source: 'Bob', relation: 'LIKES', target: 'Pizza', ... }],
//   entities: [{ name: 'Bob', type: 'Person', ... }],
//   score: 0.95
// }
```

### `getContext(query, options)`

Get formatted context string for agent prompts.

```typescript
const context = await kontext.getContext('Help Bob order food', { 
  userId: 'bob' 
});

// Use in your agent
const prompt = `You are a helpful assistant.

## User Context
${context}

User: ${userMessage}`;
```

### `delete(options)`

Delete all memory for a user/agent/session.

```typescript
await kontext.delete({ userId: 'bob' });
```

## Multi-Tenancy

Memory is isolated by `userId`, `agentId`, or `sessionId`:

```typescript
// User memory (persistent)
await kontext.add(msg, { userId: 'alice' });

// Agent memory (shared across users)
await kontext.add(msg, { agentId: 'support-bot' });

// Session memory (temporary)
await kontext.add(msg, { sessionId: 'sess-123' });
```

## Examples

### Interactive Chat

```bash
bun run examples/chat.ts
```

### Basic Usage

```bash
bun run examples/basic.ts
```

### Hotel Agent (Domain-Specific)

```bash
bun run examples/hotel-agent.ts
```

## Architecture

```
┌─────────────────────────────────────────┐
│              KONTEXT                    │
│                                         │
│   add()      search()     getContext()  │
│     │           │              │        │
│     ▼           ▼              ▼        │
│  ┌─────────────────────────────────┐    │
│  │         MEMORY ENGINE           │    │
│  │  Extract → Store → Search       │    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│  ┌──────────────▼──────────────────┐    │
│  │           FALKORDB              │    │
│  │   Entities + Edges + Episodes   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         LLM PROVIDERS           │    │
│  │  Gemini │ OpenAI │ Anthropic    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Performance

| Operation | Latency |
|-----------|---------|
| `search()` | ~20-30ms |
| `getContext()` | ~25-35ms |
| `add()` (sync) | ~4-8s (LLM extraction) |
| `add()` (async) | ~2ms (fire-and-forget) |

## License

Apache License 2.0
