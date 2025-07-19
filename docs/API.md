# API Documentation

## Table of Contents

- [RDFormatValidator Class](#rdformatvalidator-class)
- [Convenience Functions](#convenience-functions)
- [Utility Functions](#utility-functions)
- [Types and Interfaces](#types-and-interfaces)
- [Error Codes](#error-codes)
- [Examples](#examples)

## RDFormatValidator Class

The main class for validating JSON data against the Reviewdog Diagnostic Format specification.

### Constructor

```typescript
constructor(options?: RDFormatValidatorOptions)
```

Creates a new RDFormat validator instance with optional configuration.

**Parameters:**
- `options` - Configuration options for the validator

**Options:**
- `strictMode?: boolean` - Enable strict validation mode with additional checks (default: `false`)
- `allowExtraFields?: boolean` - Allow extra fields not defined in the RDFormat specification (default: `true`)
- `fixLevel?: 'basic' | 'aggressive'` - Level of automatic fixing (default: `'basic'`)

**Example:**
```typescript
// Basic validator
const validator = new RDFormatValidator();

// Strict validator with aggressive fixing
const strictValidator = new RDFormatValidator({
  strictMode: true,
  allowExtraFields: false,
  fixLevel: 'aggressive'
});
```

### Methods

#### validateString()

```typescript
async validateString(input: string, fix?: boolean): Promise<RDFormatValidatorResult>
```

Validates a JSON string against the RDFormat specification.

**Parameters:**
- `input: string` - JSON string to validate (must be valid JSON)
- `fix?: boolean` - Whether to attempt automatic fixing of common errors (default: `false`)

**Returns:** Promise resolving to `RDFormatValidatorResult`

**Example:**
```typescript
const validator = new RDFormatValidator();

// Basic validation
const result = await validator.validateString('{"diagnostics": []}');
console.log(result.valid); // true

// With automatic fixing
const fixResult = await validator.validateString(invalidJson, true);
if (fixResult.fixedData) {
  console.log('Fixed data:', fixResult.fixedData);
}
```

#### validateFile()

```typescript
async validateFile(filePath: string, fix?: boolean): Promise<RDFormatValidatorResult>
```

Validates a file containing RDFormat JSON data.

**Parameters:**
- `filePath: string` - Path to the JSON file to validate (relative or absolute)
- `fix?: boolean` - Whether to attempt automatic fixing of common errors (default: `false`)

**Returns:** Promise resolving to `RDFormatValidatorResult`

**Example:**
```typescript
const validator = new RDFormatValidator();

// Validate a file
const result = await validator.validateFile('./diagnostics.json');
if (!result.valid) {
  console.log('Validation errors:', result.errors);
}

// Validate and fix
const fixResult = await validator.validateFile('./diagnostics.json', true);
if (fixResult.fixedData) {
  console.log('Fixed data:', fixResult.fixedData);
}
```

#### validateObject()

```typescript
validateObject(data: any, fix?: boolean): RDFormatValidatorResult
```

Validates a JavaScript object against the RDFormat specification.

**Parameters:**
- `data: any` - JavaScript object to validate
- `fix?: boolean` - Whether to attempt automatic fixing of common errors (default: `false`)

**Returns:** `RDFormatValidatorResult`

**Example:**
```typescript
const validator = new RDFormatValidator();

const diagnosticData = {
  diagnostics: [{
    message: "Unused variable",
    location: { path: "src/main.ts" }
  }]
};

const result = validator.validateObject(diagnosticData);
if (result.valid) {
  console.log('Valid RDFormat data');
}
```

#### getSchema()

```typescript
getSchema(): JSONSchema
```

Gets the JSON schema used for validation.

**Returns:** The RDFormat JSON schema object

**Example:**
```typescript
const validator = new RDFormatValidator();
const schema = validator.getSchema();
console.log('Schema title:', schema.title);
```

#### setOptions()

```typescript
setOptions(options: RDFormatValidatorOptions): void
```

Updates the validator options and reinitializes internal components.

**Parameters:**
- `options: RDFormatValidatorOptions` - New options to apply (merged with existing options)

**Example:**
```typescript
const validator = new RDFormatValidator();

// Change to strict mode
validator.setOptions({ strictMode: true });

// Update multiple options
validator.setOptions({
  allowExtraFields: false,
  fixLevel: 'aggressive'
});
```

#### getOptions()

```typescript
getOptions(): Required<RDFormatValidatorOptions>
```

Gets the current validator options.

**Returns:** Current validator options with all defaults filled in

**Example:**
```typescript
const validator = new RDFormatValidator({ strictMode: true });
const options = validator.getOptions();
console.log(options.strictMode); // true
console.log(options.allowExtraFields); // true (default)
console.log(options.fixLevel); // 'basic' (default)
```

## Convenience Functions

### validate()

```typescript
async function validate(
  input: string | object,
  options?: RDFormatValidatorOptions
): Promise<RDFormatValidatorResult>
```

Convenience function for simple validation without fixing.

**Parameters:**
- `input: string | object` - JSON string or JavaScript object to validate
- `options?: RDFormatValidatorOptions` - Optional validation configuration

**Returns:** Promise resolving to validation result (without fixes)

**Example:**
```typescript
// Validate a JSON string
const result1 = await validate('{"diagnostics": []}');

// Validate an object
const diagnosticData = { diagnostics: [] };
const result2 = await validate(diagnosticData);

// Validate with custom options
const result3 = await validate(jsonString, { strictMode: true });
```

### validateAndFix()

```typescript
async function validateAndFix(
  input: string | object,
  options?: RDFormatValidatorOptions
): Promise<RDFormatValidatorResult>
```

Convenience function for validation with automatic fixing.

**Parameters:**
- `input: string | object` - JSON string or JavaScript object to validate and fix
- `options?: RDFormatValidatorOptions` - Optional validation configuration

**Returns:** Promise resolving to validation result with fixes applied

**Example:**
```typescript
// Validate and fix a JSON string
const result = await validateAndFix('{"diagnostics": []}');

// With aggressive fixing
const result2 = await validateAndFix(diagnosticData, {
  fixLevel: 'aggressive'
});

if (result.fixedData) {
  console.log('Data was fixed:', result.fixedData);
  console.log('Applied fixes:', result.appliedFixes);
}
```

## Utility Functions

### isValidRDFormat()

```typescript
async function isValidRDFormat(
  input: string | object,
  options?: RDFormatValidatorOptions
): Promise<boolean>
```

Utility function to check if data is valid RDFormat without detailed results.

**Parameters:**
- `input: string | object` - JSON string or JavaScript object to check
- `options?: RDFormatValidatorOptions` - Optional validation configuration

**Returns:** Promise resolving to `true` if valid, `false` otherwise

**Example:**
```typescript
const isValid1 = await isValidRDFormat('{"diagnostics": []}');
const isValid2 = await isValidRDFormat({ diagnostics: [] });

if (isValid1) {
  console.log('Data is valid RDFormat');
}
```

### getValidationErrors()

```typescript
async function getValidationErrors(
  input: string | object,
  options?: RDFormatValidatorOptions
): Promise<ValidationError[]>
```

Utility function to get only validation errors without warnings.

**Parameters:**
- `input: string | object` - JSON string or JavaScript object to validate
- `options?: RDFormatValidatorOptions` - Optional validation configuration

**Returns:** Promise resolving to array of validation errors

**Example:**
```typescript
const errors = await getValidationErrors(invalidData);
if (errors.length > 0) {
  console.log('Found errors:', errors.map(e => e.message));
}
```

### validateBatch()

```typescript
async function validateBatch(
  inputs: (string | object)[],
  options?: RDFormatValidatorOptions
): Promise<RDFormatValidatorResult[]>
```

Utility function to validate multiple inputs in batch.

**Parameters:**
- `inputs: (string | object)[]` - Array of JSON strings or JavaScript objects to validate
- `options?: RDFormatValidatorOptions` - Optional validation configuration applied to all inputs

**Returns:** Promise resolving to array of validation results

**Example:**
```typescript
const inputs = [
  '{"diagnostics": []}',
  { diagnostics: [{ message: "test", location: { path: "file.js" } }] },
  '{"invalid": "data"}'
];

const results = await validateBatch(inputs);
results.forEach((result, index) => {
  console.log(`Input ${index}: ${result.valid ? 'valid' : 'invalid'}`);
});
```

### validateAndFixBatch()

```typescript
async function validateAndFixBatch(
  inputs: (string | object)[],
  options?: RDFormatValidatorOptions
): Promise<RDFormatValidatorResult[]>
```

Utility function to validate and fix multiple inputs in batch.

**Parameters:**
- `inputs: (string | object)[]` - Array of JSON strings or JavaScript objects to validate and fix
- `options?: RDFormatValidatorOptions` - Optional validation configuration applied to all inputs

**Returns:** Promise resolving to array of validation results with fixes

**Example:**
```typescript
const inputs = [
  '{"diagnostics": []}',
  '{"diagnostics": [{"message": "test"}]}' // missing location
];

const results = await validateAndFixBatch(inputs, { fixLevel: 'basic' });
results.forEach((result, index) => {
  if (result.fixedData) {
    console.log(`Input ${index} was fixed:`, result.fixedData);
  }
});
```

### createValidationSummary()

```typescript
function createValidationSummary(results: RDFormatValidatorResult[]): ValidationSummary
```

Utility function to create a summary of validation results.

**Parameters:**
- `results: RDFormatValidatorResult[]` - Array of validation results to summarize

**Returns:** Summary object with validation statistics

**Return Type:**
```typescript
interface ValidationSummary {
  totalCount: number;
  validCount: number;
  invalidCount: number;
  totalErrors: number;
  totalWarnings: number;
  totalFixes: number;
  errorCodes: string[];
  warningCodes: string[];
}
```

**Example:**
```typescript
const results = await validateBatch(inputs);
const summary = createValidationSummary(results);

console.log(`Valid: ${summary.validCount}/${summary.totalCount}`);
console.log(`Total errors: ${summary.totalErrors}`);
console.log(`Total warnings: ${summary.totalWarnings}`);
```

### formatValidationErrors()

```typescript
function formatValidationErrors(
  errors: ValidationError[],
  options?: FormatOptions
): string[]
```

Utility function to format validation errors for display.

**Parameters:**
- `errors: ValidationError[]` - Array of validation errors to format
- `options?: FormatOptions` - Formatting options

**Options:**
- `includeCode?: boolean` - Include error codes in output (default: `true`)
- `includeValue?: boolean` - Include actual values in output (default: `false`)
- `includeExpected?: boolean` - Include expected values in output (default: `true`)

**Returns:** Array of formatted error strings

**Example:**
```typescript
const result = await validate(invalidData);
const formattedErrors = formatValidationErrors(result.errors);
formattedErrors.forEach(error => console.log(error));

// With custom formatting
const customFormatted = formatValidationErrors(result.errors, {
  includeValue: true,
  includeCode: false
});
```

## Types and Interfaces

### Core Result Types

#### RDFormatValidatorResult

```typescript
interface RDFormatValidatorResult {
  /** Whether the validation passed without errors */
  valid: boolean;
  /** Array of validation errors found */
  errors: ValidationError[];
  /** Array of validation warnings found */
  warnings: ValidationWarning[];
  /** The corrected data (only present if fixes were applied and successful) */
  fixedData?: any;
  /** Array of fixes that were applied (only present if fixes were requested and applied) */
  appliedFixes?: AppliedFix[];
}
```

#### ValidationError

```typescript
interface ValidationError {
  /** JSON path to the location of the error in the input data */
  path: string;
  /** Human-readable description of the validation error */
  message: string;
  /** Machine-readable error code for programmatic handling */
  code: string;
  /** The actual value that caused the validation error */
  value?: any;
  /** Description of the expected value or format */
  expected?: string;
}
```

#### ValidationWarning

```typescript
interface ValidationWarning {
  /** JSON path to the location of the warning in the input data */
  path: string;
  /** Human-readable description of the validation warning */
  message: string;
  /** Machine-readable warning code for programmatic handling */
  code: string;
}
```

#### AppliedFix

```typescript
interface AppliedFix {
  /** JSON path where the fix was applied */
  path: string;
  /** Description of what was fixed */
  message: string;
  /** The original value before the fix */
  before: any;
  /** The new value after the fix */
  after: any;
}
```

### Configuration Types

#### RDFormatValidatorOptions

```typescript
interface RDFormatValidatorOptions {
  /** Enable strict validation mode with additional checks */
  strictMode?: boolean;
  /** Allow extra fields not defined in the RDFormat specification */
  allowExtraFields?: boolean;
  /** Level of automatic fixing to apply: 'basic' for safe fixes, 'aggressive' for more extensive fixes */
  fixLevel?: 'basic' | 'aggressive';
}
```

### RDFormat Data Types

#### Diagnostic

```typescript
interface Diagnostic {
  /** Human-readable diagnostic message */
  message: string;
  /** Location of the diagnostic in source code */
  location: Location;
  /** Severity level of the diagnostic */
  severity?: Severity;
  /** Optional source identifier */
  source?: string;
  /** Optional diagnostic code */
  code?: DiagnosticCode;
  /** Optional suggestions for fixing the issue */
  suggestions?: Suggestion[];
  /** Optional original output text */
  original_output?: string;
}
```

#### Location

```typescript
interface Location {
  /** File path relative to the project root */
  path: string;
  /** Optional range within the file */
  range?: Range;
}
```

#### Range

```typescript
interface Range {
  /** Starting position of the range */
  start: Position;
  /** Ending position of the range (optional, defaults to start position) */
  end?: Position;
}
```

#### Position

```typescript
interface Position {
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based, optional) */
  column?: number;
}
```

#### Severity

```typescript
enum Severity {
  /** Unknown or unspecified severity level */
  UNKNOWN_SEVERITY = 'UNKNOWN_SEVERITY',
  /** Error level - indicates a problem that must be fixed */
  ERROR = 'ERROR',
  /** Warning level - indicates a potential issue */
  WARNING = 'WARNING',
  /** Info level - provides informational feedback */
  INFO = 'INFO'
}
```

## Error Codes

The validator uses specific error codes to identify different types of validation failures:

### Common Error Codes

- `PARSE_ERROR` - Invalid JSON syntax
- `MISSING_FIELD` - Required field is missing
- `INVALID_TYPE` - Field has wrong data type
- `INVALID_VALUE` - Field value is invalid
- `EMPTY_ARRAY` - Array field is empty when values are required
- `INVALID_ARRAY_ITEM` - Array contains invalid items
- `INVALID_ENUM_VALUE` - Value not in allowed enum values
- `INVALID_RANGE` - Range has invalid start/end positions
- `INVALID_POSITION` - Position has invalid line/column values
- `UNEXPECTED_ERROR` - Unexpected internal error

### Warning Codes

- `EXTRA_FIELD` - Extra field not in specification (when `allowExtraFields` is true)
- `DEPRECATED_FIELD` - Field is deprecated but still supported
- `EMPTY_STRING` - String field is empty but not required

## Examples

### Basic Usage

```typescript
import { RDFormatValidator } from '@umbrelladocs/rdformat-validator';

const validator = new RDFormatValidator();

// Validate a simple diagnostic
const diagnosticData = {
  diagnostics: [{
    message: "Unused variable 'x'",
    location: {
      path: "src/main.ts",
      range: {
        start: { line: 10, column: 5 },
        end: { line: 10, column: 6 }
      }
    },
    severity: "WARNING"
  }]
};

const result = validator.validateObject(diagnosticData);
if (result.valid) {
  console.log('✓ Valid RDFormat data');
} else {
  console.log('✗ Validation failed:');
  result.errors.forEach(error => {
    console.log(`  ${error.path}: ${error.message}`);
  });
}
```

### File Validation with Fixing

```typescript
import { RDFormatValidator } from '@umbrelladocs/rdformat-validator';

async function validateAndFixFile(filePath: string) {
  const validator = new RDFormatValidator({
    strictMode: true,
    fixLevel: 'aggressive'
  });

  const result = await validator.validateFile(filePath, true);

  if (result.valid) {
    console.log('✓ File is valid');
  } else if (result.fixedData) {
    console.log('✓ File was fixed:');
    console.log(`  Applied ${result.appliedFixes?.length || 0} fixes`);
    console.log('Fixed data:', JSON.stringify(result.fixedData, null, 2));
  } else {
    console.log('✗ File has unfixable errors:');
    result.errors.forEach(error => {
      console.log(`  ${error.path}: ${error.message}`);
    });
  }
}

validateAndFixFile('./diagnostics.json');
```

### Batch Processing

```typescript
import { validateBatch, createValidationSummary } from '@umbrelladocs/rdformat-validator';

async function validateMultipleFiles() {
  const files = [
    './file1.json',
    './file2.json',
    './file3.json'
  ];

  // Read and validate all files
  const fileContents = await Promise.all(
    files.map(file => fs.readFile(file, 'utf8'))
  );

  const results = await validateBatch(fileContents, {
    strictMode: true
  });

  // Create summary
  const summary = createValidationSummary(results);

  console.log(`Validation Summary:`);
  console.log(`  Total files: ${summary.totalCount}`);
  console.log(`  Valid: ${summary.validCount}`);
  console.log(`  Invalid: ${summary.invalidCount}`);
  console.log(`  Total errors: ${summary.totalErrors}`);

  if (summary.errorCodes.length > 0) {
    console.log(`  Error types: ${summary.errorCodes.join(', ')}`);
  }
}
```

### Custom Error Handling

```typescript
import { validate, formatValidationErrors } from '@umbrelladocs/rdformat-validator';

async function handleValidation(data: any) {
  try {
    const result = await validate(data, { strictMode: true });

    if (result.valid) {
      return { success: true, data };
    } else {
      // Format errors for user display
      const formattedErrors = formatValidationErrors(result.errors, {
        includeValue: true,
        includeCode: true
      });

      return {
        success: false,
        errors: formattedErrors,
        warnings: result.warnings
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Validation failed: ${error.message}`]
    };
  }
}
```

### Integration with CI/CD

```typescript
import { validateFile } from '@umbrelladocs/rdformat-validator';

async function validateInCI(filePath: string): Promise<boolean> {
  const result = await validateFile(filePath, {
    strictMode: true,
    allowExtraFields: false
  });

  if (result.valid) {
    console.log('✓ RDFormat validation passed');
    return true;
  } else {
    console.error('✗ RDFormat validation failed:');
    result.errors.forEach(error => {
      console.error(`  ERROR: ${error.path}: ${error.message}`);
    });

    result.warnings.forEach(warning => {
      console.warn(`  WARNING: ${warning.path}: ${warning.message}`);
    });

    return false;
  }
}

// Usage in CI script
validateInCI('./output/diagnostics.json').then(isValid => {
  process.exit(isValid ? 0 : 1);
});
```
