# RDFormat Validator

A NodeJS library and CLI tool for validating JSON data against the [Reviewdog Diagnostic Format](https://github.com/reviewdog/reviewdog/blob/master/proto/rdf/reviewdog.proto) specification.

## Features

- ✅ **JSON Schema Validation** - Validates against the official RDFormat specification
- 🔧 **Automatic Fixing** - Attempts to fix common formatting issues
- 📝 **Detailed Error Reporting** - Provides clear error messages with location information
- 🎯 **TypeScript Support** - Full type definitions included
- 🖥️ **CLI Tool** - Standalone command-line interface
- 📚 **Library Usage** - Import as a module in your NodeJS projects
- 🔄 **Multiple Input Formats** - Supports single diagnostics, arrays, and structured results

## Installation

### As a Library

```bash
npm install @umbrelladocs/rdformat-validator
```

### As a CLI Tool

```bash
# Install globally
npm install -g @umbrelladocs/rdformat-validator

# Or use with npx
npx @umbrelladocs/rdformat-validator --help
```

## Quick Start

### Library Usage

```typescript
import { validate, validateAndFix, RDFormatValidator } from 'rdformat-validator';

```typescript
import { validate, validateAndFix, RDFormatValidator } from '@umbrelladocs/rdformat-validator';

// Quick validation
const result = await validate('{"diagnostics": []}');
console.log(result.valid); // true

// Validation with automatic fixing
const fixResult = await validateAndFix(invalidData, { fixLevel: 'basic' });
if (fixResult.fixedData) {
  console.log('Fixed data:', fixResult.fixedData);
}

// Using the main validator class
const validator = new RDFormatValidator({
  strictMode: true,
  allowExtraFields: false
});

const result = await validator.validateFile('./diagnostics.json');
```

### CLI Usage

```bash
# Validate a single file
rdformat-validator diagnostics.json

# Validate multiple files
rdformat-validator file1.json file2.json

# Validate from stdin
cat diagnostics.json | rdformat-validator

# Validate and fix issues
rdformat-validator --fix diagnostics.json

# Output in JSON format
rdformat-validator --format json diagnostics.json

# Strict validation mode
rdformat-validator --strict --no-extra-fields diagnostics.json
```

## RDFormat Overview

The Reviewdog Diagnostic Format (RDFormat) is a standardized JSON format for representing code analysis results. It supports two main structures:

### 1. Diagnostic Array Format
An array of individual diagnostic objects:

```json
[
  {
    "message": "Line too long",
    "location": {
      "path": "src/main.js",
      "range": {
        "start": { "line": 10, "column": 1 },
        "end": { "line": 10, "column": 120 }
      }
    },
    "severity": "WARNING",
    "source": {
      "name": "eslint",
      "url": "https://eslint.org"
    }
  }
]
```

### 2. Diagnostic Result Format
A structured result object containing diagnostics and metadata:

```json
{
  "diagnostics": [
    {
      "message": "Missing semicolon",
      "location": {
        "path": "src/app.js",
        "range": {
          "start": { "line": 15, "column": 25 }
        }
      },
      "severity": "ERROR",
      "source": {
        "name": "jshint"
      }
    }
  ],
  "source": {
    "name": "multi-linter",
    "url": "https://example.com/multi-linter"
  },
  "severity": "ERROR"
}
```

## Library API

### Main Classes

#### `RDFormatValidator`

The primary validator class providing comprehensive validation functionality.

```typescript
const validator = new RDFormatValidator({
  strictMode: false,        // Enable strict validation
  allowExtraFields: true,   // Allow extra fields not in spec
  fixLevel: 'basic'         // Fix level: 'basic' or 'aggressive'
});
```

**Methods:**
- `validateString(input: string, fix?: boolean)` - Validate JSON string
- `validateFile(filePath: string, fix?: boolean)` - Validate JSON file
- `validateObject(data: any, fix?: boolean)` - Validate JavaScript object
- `getSchema()` - Get the JSON schema used for validation
- `setOptions(options)` - Update validator options

### Convenience Functions

#### `validate(input, options?)`
Simple validation without fixing:

```typescript
const result = await validate('{"diagnostics": []}');
console.log(result.valid); // boolean
console.log(result.errors); // ValidationError[]
console.log(result.warnings); // ValidationWarning[]
```

#### `validateAndFix(input, options?)`
Validation with automatic fixing:

```typescript
const result = await validateAndFix(invalidData, { fixLevel: 'aggressive' });
if (result.fixedData) {
  console.log('Data was fixed:', result.fixedData);
  console.log('Applied fixes:', result.appliedFixes);
}
```

#### `isValidRDFormat(input, options?)`
Quick validation check:

```typescript
const isValid = await isValidRDFormat(data);
console.log(isValid); // boolean
```

### Batch Processing

#### `validateBatch(inputs, options?)`
Validate multiple inputs simultaneously:

```typescript
const results = await validateBatch([
  '{"diagnostics": []}',
  { diagnostics: [] },
  invalidData
]);

results.forEach((result, index) => {
  console.log(`Input ${index}: ${result.valid ? 'valid' : 'invalid'}`);
});
```

#### `validateAndFixBatch(inputs, options?)`
Batch validation with fixing:

```typescript
const results = await validateAndFixBatch(inputs, { fixLevel: 'basic' });
```

### Utility Functions

#### `createValidationSummary(results)`
Create a summary of validation results:

```typescript
const summary = createValidationSummary(results);
console.log(`Valid: ${summary.validCount}/${summary.totalCount}`);
console.log(`Total errors: ${summary.totalErrors}`);
```

#### `formatValidationErrors(errors, options?)`
Format errors for display:

```typescript
const formattedErrors = formatValidationErrors(result.errors, {
  includeCode: true,
  includeExpected: true
});
formattedErrors.forEach(error => console.log(error));
```

## CLI Reference

### Basic Usage

```bash
rdformat-validator [options] [files...]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --fix` | Attempt to automatically fix common issues | `false` |
| `-o, --output <file>` | Output file (default: stdout) | - |
| `-v, --verbose` | Enable verbose output | `false` |
| `-s, --silent` | Suppress non-error output | `false` |
| `--format <format>` | Output format: `json` or `text` | `text` |
| `--strict` | Enable strict validation mode | `false` |
| `--no-extra-fields` | Disallow extra fields not in specification | `false` |
| `--fix-level <level>` | Fix level: `basic` or `aggressive` | `basic` |

### Examples

#### Basic Validation
```bash
# Validate a single file
rdformat-validator diagnostics.json

# Validate multiple files
rdformat-validator file1.json file2.json file3.json

# Validate from stdin
cat diagnostics.json | rdformat-validator
echo '{"diagnostics": []}' | rdformat-validator
```

#### Validation with Fixing
```bash
# Fix common issues
rdformat-validator --fix diagnostics.json

# Aggressive fixing
rdformat-validator --fix --fix-level aggressive diagnostics.json

# Save fixed output to file
rdformat-validator --fix --output fixed.json diagnostics.json
```

#### Output Formats
```bash
# JSON output format
rdformat-validator --format json diagnostics.json

# Verbose text output
rdformat-validator --verbose diagnostics.json

# Silent mode (only errors)
rdformat-validator --silent diagnostics.json
```

#### Strict Validation
```bash
# Strict mode with no extra fields
rdformat-validator --strict --no-extra-fields diagnostics.json

# Combine with other options
rdformat-validator --strict --verbose --format json diagnostics.json
```

### Exit Codes

- `0` - Success (all files are valid)
- `1` - Validation errors found or other errors occurred

## Configuration Options

### Validation Options

```typescript
interface RDFormatValidatorOptions {
  strictMode?: boolean;        // Enable strict validation (default: false)
  allowExtraFields?: boolean;  // Allow extra fields (default: true)
  fixLevel?: 'basic' | 'aggressive'; // Fix level (default: 'basic')
}
```

### Fix Levels

- **`basic`** - Safe fixes that don't change data semantics
  - Add missing required fields with sensible defaults
  - Fix simple type mismatches (string to number, etc.)
  - Correct basic structural issues

- **`aggressive`** - More extensive fixes that may change data
  - Remove invalid fields
  - Restructure nested objects
  - Apply more complex transformations

## Error Handling

### Validation Errors

```typescript
interface ValidationError {
  path: string;        // JSON path to error location
  message: string;     // Human-readable error message
  code: string;        // Error code for programmatic handling
  value?: any;         // The value that caused the error
  expected?: string;   // Description of expected value/format
}
```

### Common Error Codes

- `REQUIRED_PROPERTY` - Missing required field
- `INVALID_TYPE` - Wrong data type
- `INVALID_FORMAT` - Invalid format (e.g., invalid enum value)
- `PARSE_ERROR` - JSON parsing error
- `UNEXPECTED_ERROR` - Unexpected system error

### Error Examples

```typescript
const result = await validate(invalidData);
if (!result.valid) {
  result.errors.forEach(error => {
    console.log(`${error.path}: ${error.message} (${error.code})`);
  });
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import {
  RDFormatValidator,
  RDFormatValidatorOptions,
  RDFormatValidatorResult,
  ValidationError,
  ValidationWarning,
  Diagnostic,
  DiagnosticResult,
  Location,
  Range,
  Position,
  Severity,
  Source,
  Code,
  Suggestion
} from 'rdformat-validator';
```

## Integration Examples

### CI/CD Pipeline

```bash
#!/bin/bash
# Validate diagnostic output in CI
if ! rdformat-validator --silent diagnostics.json; then
  echo "Invalid RDFormat data detected"
  exit 1
fi
```

### Node.js Script

```javascript
const { validateFile } = require('rdformat-validator');

async function validateDiagnostics() {
  try {
    const result = await validateFile('./output/diagnostics.json');
    if (!result.valid) {
      console.error('Validation failed:', result.errors);
      process.exit(1);
    }
    console.log('Diagnostics are valid!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

validateDiagnostics();
```

### Express.js Middleware

```javascript
const { validate } = require('rdformat-validator');

function validateRDFormat(req, res, next) {
  validate(req.body)
    .then(result => {
      if (!result.valid) {
        return res.status(400).json({
          error: 'Invalid RDFormat data',
          details: result.errors
        });
      }
      next();
    })
    .catch(next);
}

app.post('/diagnostics', validateRDFormat, (req, res) => {
  // Handle valid RDFormat data
  res.json({ status: 'success' });
});
```

## Requirements

- Node.js 14.0.0 or higher
- TypeScript 5.8+ (for development)

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Links

- [Reviewdog Project](https://github.com/reviewdog/reviewdog)
- [RDFormat Specification](https://github.com/reviewdog/reviewdog/blob/master/proto/rdf/reviewdog.proto)
- [NPM Package](https://www.npmjs.com/package/rdformat-validator)