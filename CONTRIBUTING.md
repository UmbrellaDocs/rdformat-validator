# Contributing to RDFormat Validator

We welcome contributions to the RDFormat Validator project! This document provides guidelines for contributing.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/rdformat-validator.git
   cd rdformat-validator
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes**
   - Write your code following the existing style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run validate:full  # Runs type-check, lint, and tests
   npm run build         # Ensure build works
   ```

4. **Commit Your Changes**
   We use [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new validation rule for diagnostics"
   git commit -m "fix: handle empty source paths correctly"
   git commit -m "docs: update API documentation for validator"
   ```

5. **Push and Create PR**
   ```bash
   git push origin your-branch-name
   ```
   Then create a pull request from your fork.

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

### Examples
```bash
feat: add support for nested diagnostic validation
fix: handle malformed JSON gracefully
docs: add examples for CLI usage
test: add integration tests for fixer module
```

## Code Style

- We use ESLint for code linting
- TypeScript strict mode is enabled
- Follow existing patterns in the codebase
- Write meaningful variable and function names
- Add JSDoc comments for public APIs

## Testing

- Write unit tests for all new functionality
- Ensure existing tests continue to pass
- Add integration tests for complex features
- Test both success and error cases

### Test Structure
```
test/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── fixtures/       # Test data files
```

## Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update CLI documentation in docs/CLI.md
- Add examples for new functionality

## Release Process

We use [semantic-release](https://github.com/semantic-release/semantic-release) for automated releases:

1. Commits to `main` trigger automated releases
2. Version numbers follow [Semantic Versioning](https://semver.org/)
3. CHANGELOG.md is automatically updated
4. Packages are published to npm automatically

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Join discussions in existing issues

Thank you for contributing! 🎉
