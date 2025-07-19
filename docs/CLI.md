# CLI Documentation

## Overview

The RDFormat Validator CLI provides a command-line interface for validating JSON data against the Reviewdog Diagnostic Format specification. It supports both file input and stdin, offers automatic fixing capabilities, and provides flexible output formatting options.

## Installation

### Global Installation (Recommended for CLI usage)

```bash
npm install -g @umbrelladocs/rdformat-validator
```

After global installation, the `rdformat-validator` command will be available system-wide.

### Local Installation

```bash
npm install @umbrelladocs/rdformat-validator
```

With local installation, run via npx:

```bash
npx @umbrelladocs/rdformat-validator [options] [files...]
```

## Basic Usage

### Validate a Single File

```bash
rdformat-validator diagnostics.json
```

### Validate Multiple Files

```bash
rdformat-validator file1.json file2.json file3.json
```

### Validate from Standard Input

```bash
cat diagnostics.json | rdformat-validator
echo '{"diagnostics": []}' | rdformat-validator
```

## Command-Line Options

### General Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help information | |
| `--version` | `-V` | Show version number | |

### Input/Output Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output <file>` | `-o` | Write output to file instead of stdout | stdout |
| `--format <format>` | | Output format: `json` or `text` | `text` |

### Validation Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--fix` | `-f` | Attempt to automatically fix common issues | `false` |
| `--strict` | | Enable strict validation mode | `false` |
| `--no-extra-fields` | | Disallow extra fields not in specification | allow extra fields |
| `--fix-level <level>` | | Fix level: `basic` or `aggressive` | `basic` |

### Output Control Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--verbose` | `-v` | Enable verbose output with detailed error information | `false` |
| `--silent` | `-s` | Suppress non-error output | `false` |

## Detailed Option Descriptions

### `--fix` / `-f`

Enables automatic fixing of common RDFormat issues. When enabled:
- Missing required fields are added with appropriate default values
- Type mismatches are corrected where possible
- Invalid enum values are replaced with valid alternatives
- Malformed structures are normalized

**Example:**
```bash
rdformat-validator --fix input.json
```

### `--strict`

Enables strict validation mode with additional checks:
- More stringent validation rules
- Stricter type checking
- Additional format validations

**Example:**
```bash
rdformat-validator --strict diagnostics.json
```

### `--no-extra-fields`

By default, the validator allows extra fields not defined in the RDFormat specification (they generate warnings). This option makes extra fields cause validation errors instead.

**Example:**
```bash
rdformat-validator --no-extra-fields --strict diagnostics.json
```

### `--fix-level <level>`

Controls the aggressiveness of automatic fixing:

- **`basic`** (default): Only applies safe, conservative fixes
  - Add missing required fields with safe defaults
  - Fix obvious type mismatches (string to number, etc.)
  - Normalize case for enum values

- **`aggressive`**: Applies more extensive fixes that may change semantics
  - Attempts to infer missing information from context
  - More liberal type coercion
  - Structural corrections

**Examples:**
```bash
rdformat-validator --fix --fix-level basic input.json
rdformat-validator --fix --fix-level aggressive input.json
```

### `--format <format>`

Controls the output format:

- **`text`** (default): Human-readable text output with colors (when supported)
- **`json`**: Structured JSON output suitable for programmatic processing

**Examples:**
```bash
rdformat-validator --format json diagnostics.json
rdformat-validator --format text --verbose diagnostics.json
```

### `--output <file>` / `-o`

Redirects output to a file instead of stdout. Creates the directory structure if needed.

**Examples:**
```bash
rdformat-validator --output results.txt diagnostics.json
rdformat-validator --format json --output results.json diagnostics.json
```

### `--verbose` / `-v`

Enables detailed output including:
- Individual file processing status
- Complete error and warning details with paths and codes
- Applied fix information
- Processing statistics

**Example:**
```bash
rdformat-validator --verbose diagnostics.json
```

### `--silent` / `-s`

Suppresses all non-error output. Only critical errors are displayed. Useful for automated scripts where you only care about the exit code.

**Example:**
```bash
rdformat-validator --silent diagnostics.json
```

## Exit Codes

The CLI uses standard exit codes to indicate the result:

| Exit Code | Meaning |
|-----------|---------|
| `0` | Success - All files are valid |
| `1` | Validation failed - One or more files have errors |
| `1` | Fatal error - File not found, permission denied, invalid arguments, etc. |

## Output Formats

### Text Format (Default)

The default text format provides human-readable output with colors (when the terminal supports them):

```
RDFormat Validation Results
==========================

Files processed: 2
Valid files: 1
Invalid files: 1
Total errors: 3
Total warnings: 1

File Results:
-------------
✓ valid-file.json
✗ invalid-file.json (3 errors, 1 warning)

✗ Some files have validation errors
```

#### Verbose Text Format

With `--verbose`, additional details are shown:

```
RDFormat Validation Results
==========================

Files processed: 1
Valid files: 0
Invalid files: 1
Total errors: 2
Total warnings: 1
Total fixes applied: 1

File Results:
-------------
✗ diagnostics.json (2 errors, 1 warning, 1 fix)
  Errors:
    ✗ diagnostics[0].location: Missing required field 'path' (MISSING_FIELD)
    ✗ diagnostics[0].severity: Invalid enum value 'CRITICAL' (INVALID_ENUM_VALUE)
  Warnings:
    ⚠ diagnostics[0].custom_field: Extra field not in specification (EXTRA_FIELD)
  Fixes Applied:
    ✓ diagnostics[0].location.path: Added default value

✗ Some files have validation errors
```

### JSON Format

With `--format json`, structured output is provided:

```json
{
  "success": false,
  "filesProcessed": 1,
  "validFiles": 0,
  "invalidFiles": 1,
  "totalErrors": 2,
  "totalWarnings": 1,
  "totalFixes": 1,
  "fileResults": [
    {
      "file": "diagnostics.json",
      "valid": false,
      "errors": 2,
      "warnings": 1,
      "fixes": 1,
      "errorDetails": [
        {
          "path": "diagnostics[0].location",
          "message": "Missing required field 'path'",
          "code": "MISSING_FIELD"
        },
        {
          "path": "diagnostics[0].severity",
          "message": "Invalid enum value 'CRITICAL'",
          "code": "INVALID_ENUM_VALUE"
        }
      ],
      "warningDetails": [
        {
          "path": "diagnostics[0].custom_field",
          "message": "Extra field not in specification",
          "code": "EXTRA_FIELD"
        }
      ],
      "fixDetails": [
        {
          "path": "diagnostics[0].location.path",
          "message": "Added default value"
        }
      ]
    }
  ]
}
```

## Common Usage Patterns

### 1. Basic Validation

Validate a single file and get human-readable results:

```bash
rdformat-validator diagnostics.json
```

### 2. Batch Validation

Validate multiple files at once:

```bash
rdformat-validator reports/*.json
```

### 3. Validation with Fixing

Validate and automatically fix common issues:

```bash
rdformat-validator --fix diagnostics.json
```

### 4. Strict Validation

Perform strict validation without allowing extra fields:

```bash
rdformat-validator --strict --no-extra-fields diagnostics.json
```

### 5. Automated Processing

For use in scripts or CI/CD pipelines:

```bash
# Silent mode - only exit code matters
rdformat-validator --silent diagnostics.json
echo $? # Check exit code

# JSON output for programmatic processing
rdformat-validator --format json --output results.json diagnostics.json
```

### 6. Detailed Debugging

Get comprehensive information about validation issues:

```bash
rdformat-validator --verbose --format text diagnostics.json
```

### 7. Pipeline Processing

Validate data from a pipeline:

```bash
curl -s https://api.example.com/diagnostics | rdformat-validator
cat raw-data.json | jq '.diagnostics' | rdformat-validator
```

### 8. Save Fixed Data

Validate, fix, and save the corrected data:

```bash
rdformat-validator --fix --format json --output fixed-diagnostics.json diagnostics.json
```

## Integration Examples

### CI/CD Integration (GitHub Actions)

```yaml
name: Validate RDFormat
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @umbrelladocs/rdformat-validator
      - run: rdformat-validator --strict reports/*.json
```

### CI/CD Integration (Jenkins)

```groovy
pipeline {
    agent any
    stages {
        stage('Validate RDFormat') {
            steps {
                sh 'npm install -g @umbrelladocs/rdformat-validator'
                sh 'rdformat-validator --format json --output validation-results.json reports/*.json'
                archiveArtifacts artifacts: 'validation-results.json'
            }
        }
    }
}
```

### Makefile Integration

```makefile
.PHONY: validate-diagnostics
validate-diagnostics:
	@echo "Validating diagnostic files..."
	@rdformat-validator --strict reports/*.json

.PHONY: fix-diagnostics
fix-diagnostics:
	@echo "Fixing diagnostic files..."
	@for file in reports/*.json; do \
		rdformat-validator --fix --output "$$file.fixed" "$$file"; \
	done
```

### NPM Scripts

```json
{
  "scripts": {
    "validate": "rdformat-validator reports/*.json",
    "validate:strict": "rdformat-validator --strict --no-extra-fields reports/*.json",
    "validate:fix": "rdformat-validator --fix reports/*.json",
    "validate:ci": "rdformat-validator --silent --format json --output validation-results.json reports/*.json"
  }
}
```

## Error Handling and Troubleshooting

### Common Error Messages

#### File Not Found
```
Error processing file.json: File not found: file.json
```
**Solution:** Check that the file path is correct and the file exists.

#### Permission Denied
```
Error processing file.json: Permission denied: file.json
```
**Solution:** Check file permissions. Use `chmod +r file.json` to make it readable.

#### Invalid JSON
```
✗ <stdin> (1 error)
  Errors:
    ✗ : Unexpected token } in JSON at position 15 (PARSE_ERROR)
```
**Solution:** Fix the JSON syntax errors in the input file.

#### No Input Provided
```
Error: No input provided. Please provide input via stdin or specify files to validate.
```
**Solution:** Either specify files as arguments or pipe data to stdin.

### Debug Tips

1. **Use verbose mode** to get detailed error information:
   ```bash
   rdformat-validator --verbose problematic-file.json
   ```

2. **Check the JSON syntax** first if you get parse errors:
   ```bash
   jq '.' < your-file.json
   ```

3. **Use strict mode** to catch additional issues:
   ```bash
   rdformat-validator --strict your-file.json
   ```

4. **Try automatic fixing** for common issues:
   ```bash
   rdformat-validator --fix --verbose your-file.json
   ```

## Advanced Usage

### Custom Validation Workflows

#### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Validate RDFormat files before commit

files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.json$')

if [ -n "$files" ]; then
    echo "Validating RDFormat files..."
    for file in $files; do
        if ! rdformat-validator --strict "$file"; then
            echo "RDFormat validation failed for $file"
            exit 1
        fi
    done
    echo "All RDFormat files are valid."
fi
```

#### Batch Processing Script

```bash
#!/bin/bash
# Process all JSON files in a directory

directory="${1:-./reports}"
output_dir="./validated"

mkdir -p "$output_dir"

for file in "$directory"/*.json; do
    if [ -f "$file" ]; then
        basename=$(basename "$file")
        echo "Processing $basename..."

        rdformat-validator --fix --format json \
            --output "$output_dir/${basename%.json}.validated.json" \
            "$file"

        if [ $? -eq 0 ]; then
            echo "✓ $basename validated successfully"
        else
            echo "✗ $basename validation failed"
        fi
    fi
done
```

### Environment Variables

The CLI respects these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NO_COLOR` | Disable colored output | `false` |
| `FORCE_COLOR` | Force colored output even when not a TTY | `false` |

**Examples:**
```bash
# Disable colors
NO_COLOR=1 rdformat-validator diagnostics.json

# Force colors when redirecting output
FORCE_COLOR=1 rdformat-validator diagnostics.json | less -R
```

## Performance Considerations

### Large Files

For large files, consider:

1. **Use silent mode** to reduce output overhead:
   ```bash
   rdformat-validator --silent large-file.json
   ```

2. **Process files individually** rather than all at once for better error isolation:
   ```bash
   for file in *.json; do rdformat-validator "$file"; done
   ```

3. **Use JSON output format** for programmatic processing (faster than text parsing):
   ```bash
   rdformat-validator --format json --output results.json large-file.json
   ```

### Memory Usage

The CLI loads entire files into memory. For very large files (>100MB), consider:

1. **Processing files separately** rather than as a batch
2. **Using streaming tools** to split large files before validation
3. **Monitoring memory usage** in resource-constrained environments

## Shell Completion

### Bash Completion

Add to your `.bashrc`:

```bash
# Basic file completion for rdformat-validator
complete -f rdformat-validator
```

### Zsh Completion

Add to your `.zshrc`:

```zsh
# Enable file completion
compdef _files rdformat-validator
```

## Summary

The RDFormat Validator CLI provides a comprehensive command-line interface for validating Reviewdog Diagnostic Format data. Key features include:

- **Flexible input**: Files or stdin
- **Automatic fixing**: Basic and aggressive repair modes
- **Multiple output formats**: Human-readable text and structured JSON
- **Strict validation**: Enhanced error checking
- **Batch processing**: Handle multiple files efficiently
- **CI/CD friendly**: Appropriate exit codes and silent mode
- **Detailed reporting**: Verbose mode with complete error information

The tool is designed to integrate seamlessly into development workflows, CI/CD pipelines, and automated processing systems while providing clear, actionable feedback for developers.
