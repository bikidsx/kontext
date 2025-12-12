# Kontext

Ultra-fast contextual memory for AI agents.

## What is Kontext?

Kontext is a memory framework that gives AI agents persistent, structured memory. It automatically extracts entities and relationships from conversations and stores them in a knowledge graph for fast retrieval.

**Key Features:**
- Sub-30ms context retrieval
- Automatic entity/relationship extraction via LLM
- Temporal tracking (when facts become true/false)
- Multi-tenant isolation
- Simple 3-method API

## Quick Start

```bash
# Start FalkorDB
docker compose up -d

# Install dependencies
cd kontext && bun install

# Set your API key
echo "GOOGLE_API_KEY=your-key" > .env

# Run the chat example
bun run examples/chat.ts
```

## Usage

```typescript
import { Kontext } from 'kontext-ts';

const kontext = new Kontext({
  llm: { provider: 'gemini' }
});

// Store memory
await kontext.add('My name is Alice, I work at Acme Corp', { 
  userId: 'alice' 
});

// Retrieve context
const context = await kontext.getContext('Tell me about Alice', { 
  userId: 'alice' 
});
// → "Alice works at Acme Corp"
```

## Project Structure

```
├── kontext/           # Main package
│   ├── src/           # Source code
│   ├── examples/      # Usage examples
│   └── docs/          # Documentation site
├── docker-compose.yml # FalkorDB setup
└── README.md
```

## Documentation

See [kontext/README.md](./kontext/README.md) for full documentation.

## License

MIT

