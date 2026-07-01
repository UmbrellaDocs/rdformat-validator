# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Harden Fixer path handling to block prototype pollution via `__proto__`, `constructor`, and `prototype` path segments

### Changed
- Publish `src/` in the npm package to support source maps
- CI runs on Node.js 24.x
- Jest tests use dedicated `tsconfig.test.json`
- Release process is manual (`npm version` / `npm publish`) instead of semantic-release

## [1.0.1] - 2026-07-01

### Fixed
- Harden Fixer paths against prototype pollution
- Include source files in published package for source map support

## [1.0.0] - 2025-07-19

### Added
- Initial implementation of RDFormat validator
- Core validation engine
- CLI interface
- Library API
- Comprehensive test suite
- Documentation and examples
