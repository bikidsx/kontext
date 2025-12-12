# Contributing to Kontext

Thank you for your interest in contributing to Kontext! We welcome contributions from the community.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Provide clear reproduction steps
- Include relevant environment details (OS, Node version, etc.)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with clear messages (`git commit -m "feat: add new feature"`)
6. Push to your fork (`git push origin feature/your-feature`)
7. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Development Setup

```bash
# Clone the repo
git clone https://github.com/bikidsx/kontext.git
cd kontext

# Start FalkorDB
docker-compose up -d

# Install dependencies
cd kontext-ts
bun install

# Run examples
bun run examples/basic.ts
```

### Code Style

- Use TypeScript
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and small

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
