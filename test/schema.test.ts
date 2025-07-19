/**
 * Comprehensive tests for RDFormat JSON schema validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  rdformatSchema,
  positionSchema,
  rangeSchema,
  locationSchema,
  sourceSchema,
  codeSchema,
  suggestionSchema,
  relatedLocationSchema,
  diagnosticSchema,
  severityEnum,
  getSchema,
  isValidSchema,
  JSONSchema
} from '../src/types/schema';

// Simple JSON schema validator for testing
function validateAgainstSchema(data: any, schema: JSONSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  function validate(value: any, schema: JSONSchema, path: string = ''): void {
    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        errors.push(`${path}: expected ${schema.type}, got ${actualType}`);
        return;
      }
    }
    
    // Required properties validation
    if (schema.type === 'object' && schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value)) {
          errors.push(`${path}: missing required property '${requiredProp}'`);
        }
      }
    }
    
    // Properties validation
    if (schema.type === 'object' && schema.properties && value) {
      for (const [propName, propValue] of Object.entries(value)) {
        const propSchema = schema.properties[propName];
        if (propSchema) {
          validate(propValue, propSchema, path ? `${path}.${propName}` : propName);
        } else if (schema.additionalProperties === false) {
          errors.push(`${path}: unexpected property '${propName}'`);
        }
      }
    }
    
    // Array items validation
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        validate(item, schema.items!, `${path}[${index}]`);
      });
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path}: value '${value}' not in enum [${schema.enum.join(', ')}]`);
    }
    
    // String constraints
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${path}: string too short (${value.length} < ${schema.minLength})`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`${path}: string too long (${value.length} > ${schema.maxLength})`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${path}: string does not match pattern ${schema.pattern}`);
      }
    }
    
    // Number constraints
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.minimum && value < schema.minimum) {
        errors.push(`${path}: number too small (${value} < ${schema.minimum})`);
      }
      if (schema.maximum && value > schema.maximum) {
        errors.push(`${path}: number too large (${value} > ${schema.maximum})`);
      }
    }
    
    // OneOf validation (simplified)
    if (schema.oneOf) {
      let validCount = 0;
      let allErrors: string[] = [];
      for (const subSchema of schema.oneOf) {
        const subResult = validateAgainstSchema(value, subSchema);
        if (subResult.valid) {
          validCount++;
        } else {
          allErrors.push(...subResult.errors);
        }
      }
      if (validCount === 0) {
        errors.push(`${path}: value does not match any schema in oneOf`);
        // Add specific errors from sub-schemas for debugging
        errors.push(...allErrors.slice(0, 5)); // Limit to first 5 errors to avoid spam
      } else if (validCount > 1) {
        errors.push(`${path}: value matches multiple schemas in oneOf (${validCount})`);
      }
      // If validCount === 1, it's valid, so we don't add any errors
      return; // Don't continue with other validations for oneOf
    }
  }
  
  validate(data, schema);
  return { valid: errors.length === 0, errors };
}

describe('RDFormat Schema Structure', () => {
  test('Main schema should have correct structure', () => {
    expect(rdformatSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(rdformatSchema.title).toBe('Reviewdog Diagnostic Format');
    expect(rdformatSchema.oneOf).toBeDefined();
    expect(rdformatSchema.oneOf).toHaveLength(3);
  });

  test('Individual schemas should be valid', () => {
    expect(isValidSchema(positionSchema)).toBe(true);
    expect(isValidSchema(rangeSchema)).toBe(true);
    expect(isValidSchema(locationSchema)).toBe(true);
    expect(isValidSchema(sourceSchema)).toBe(true);
    expect(isValidSchema(codeSchema)).toBe(true);
    expect(isValidSchema(suggestionSchema)).toBe(true);
    expect(isValidSchema(relatedLocationSchema)).toBe(true);
    expect(isValidSchema(diagnosticSchema)).toBe(true);
  });

  test('Severity enum should contain all valid values', () => {
    expect(severityEnum).toContain('UNKNOWN_SEVERITY');
    expect(severityEnum).toContain('ERROR');
    expect(severityEnum).toContain('WARNING');
    expect(severityEnum).toContain('INFO');
    expect(severityEnum).toHaveLength(4);
  });

  test('getSchema utility should return correct schemas', () => {
    expect(getSchema('position')).toBe(positionSchema);
    expect(getSchema('range')).toBe(rangeSchema);
    expect(getSchema('location')).toBe(locationSchema);
    expect(getSchema('source')).toBe(sourceSchema);
    expect(getSchema('code')).toBe(codeSchema);
    expect(getSchema('suggestion')).toBe(suggestionSchema);
    expect(getSchema('relatedLocation')).toBe(relatedLocationSchema);
    expect(getSchema('diagnostic')).toBe(diagnosticSchema);
    expect(getSchema('rdformat')).toBe(rdformatSchema);
    expect(getSchema('nonexistent')).toBeUndefined();
  });
});

describe('Position Schema Validation', () => {
  test('Valid position should pass validation', () => {
    const validPosition = { line: 10, column: 5 };
    const result = validateAgainstSchema(validPosition, positionSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('Position with only line should pass validation', () => {
    const validPosition = { line: 1 };
    const result = validateAgainstSchema(validPosition, positionSchema);
    expect(result.valid).toBe(true);
  });

  test('Position without line should fail validation', () => {
    const invalidPosition = { column: 5 };
    const result = validateAgainstSchema(invalidPosition, positionSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(": missing required property 'line'");
  });

  test('Position with invalid line type should fail validation', () => {
    const invalidPosition = { line: "not-a-number" };
    const result = validateAgainstSchema(invalidPosition, positionSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("line: expected number, got string");
  });

  test('Position with line less than 1 should fail validation', () => {
    const invalidPosition = { line: 0 };
    const result = validateAgainstSchema(invalidPosition, positionSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("line: number too small (0 < 1)");
  });
});

describe('Range Schema Validation', () => {
  test('Valid range should pass validation', () => {
    const validRange = {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 10 }
    };
    const result = validateAgainstSchema(validRange, rangeSchema);
    expect(result.valid).toBe(true);
  });

  test('Range with only start should pass validation', () => {
    const validRange = { start: { line: 1 } };
    const result = validateAgainstSchema(validRange, rangeSchema);
    expect(result.valid).toBe(true);
  });

  test('Range without start should fail validation', () => {
    const invalidRange = { end: { line: 1 } };
    const result = validateAgainstSchema(invalidRange, rangeSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(": missing required property 'start'");
  });
});

describe('Location Schema Validation', () => {
  test('Valid location should pass validation', () => {
    const validLocation = {
      path: "src/main.js",
      range: {
        start: { line: 1, column: 1 }
      }
    };
    const result = validateAgainstSchema(validLocation, locationSchema);
    expect(result.valid).toBe(true);
  });

  test('Location with only path should pass validation', () => {
    const validLocation = { path: "src/main.js" };
    const result = validateAgainstSchema(validLocation, locationSchema);
    expect(result.valid).toBe(true);
  });

  test('Location without path should fail validation', () => {
    const invalidLocation = { range: { start: { line: 1 } } };
    const result = validateAgainstSchema(invalidLocation, locationSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(": missing required property 'path'");
  });

  test('Location with empty path should fail validation', () => {
    const invalidLocation = { path: "" };
    const result = validateAgainstSchema(invalidLocation, locationSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("path: string too short (0 < 1)");
  });
});

describe('Source Schema Validation', () => {
  test('Valid source should pass validation', () => {
    const validSource = {
      name: "eslint",
      url: "https://eslint.org"
    };
    const result = validateAgainstSchema(validSource, sourceSchema);
    expect(result.valid).toBe(true);
  });

  test('Source with only name should pass validation', () => {
    const validSource = { name: "eslint" };
    const result = validateAgainstSchema(validSource, sourceSchema);
    expect(result.valid).toBe(true);
  });

  test('Source without name should fail validation', () => {
    const invalidSource = { url: "https://eslint.org" };
    const result = validateAgainstSchema(invalidSource, sourceSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(": missing required property 'name'");
  });

  test('Source with invalid URL should fail validation', () => {
    const invalidSource = {
      name: "eslint",
      url: "not-a-url"
    };
    const result = validateAgainstSchema(invalidSource, sourceSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("url: string does not match pattern ^https?://.+");
  });
});

describe('Diagnostic Schema Validation', () => {
  test('Valid diagnostic should pass validation', () => {
    const validDiagnostic = {
      message: "Line too long",
      location: {
        path: "src/main.js",
        range: {
          start: { line: 10, column: 1 }
        }
      },
      severity: "WARNING"
    };
    const result = validateAgainstSchema(validDiagnostic, diagnosticSchema);
    expect(result.valid).toBe(true);
  });

  test('Diagnostic without message should fail validation', () => {
    const invalidDiagnostic = {
      location: { path: "src/main.js" }
    };
    const result = validateAgainstSchema(invalidDiagnostic, diagnosticSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(": missing required property 'message'");
  });

  test('Diagnostic without location should fail validation', () => {
    const invalidDiagnostic = {
      message: "Test error"
    };
    const result = validateAgainstSchema(invalidDiagnostic, diagnosticSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(": missing required property 'location'");
  });

  test('Diagnostic with invalid severity should fail validation', () => {
    const invalidDiagnostic = {
      message: "Test error",
      location: { path: "src/main.js" },
      severity: "INVALID_SEVERITY"
    };
    const result = validateAgainstSchema(invalidDiagnostic, diagnosticSchema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("severity: value 'INVALID_SEVERITY' not in enum [UNKNOWN_SEVERITY, ERROR, WARNING, INFO]");
  });
});

describe('Test Fixtures Validation', () => {
  function loadFixture(filename: string): any {
    const fixturePath = path.join(__dirname, 'fixtures', filename);
    const content = fs.readFileSync(fixturePath, 'utf8');
    return JSON.parse(content);
  }

  test('Valid RDFormat fixture should pass validation', () => {
    const fixture = loadFixture('valid-rdformat.json');
    const result = validateAgainstSchema(fixture, rdformatSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('Valid diagnostic result fixture should pass validation', () => {
    const fixture = loadFixture('valid-diagnostic-result.json');
    const result = validateAgainstSchema(fixture, rdformatSchema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('Invalid fixture with missing message should fail validation', () => {
    const fixture = loadFixture('invalid-missing-message.json');
    const result = validateAgainstSchema(fixture, rdformatSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes("missing required property 'message'"))).toBe(true);
  });

  test('Invalid fixture with missing location should fail validation', () => {
    const fixture = loadFixture('invalid-missing-location.json');
    const result = validateAgainstSchema(fixture, rdformatSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes("missing required property 'location'"))).toBe(true);
  });

  test('Invalid fixture with wrong types should fail validation', () => {
    const fixture = loadFixture('invalid-wrong-types.json');
    const result = validateAgainstSchema(fixture, rdformatSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('Invalid fixture with empty path should fail validation', () => {
    const fixture = loadFixture('invalid-empty-path.json');
    const result = validateAgainstSchema(fixture, rdformatSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes("string too short"))).toBe(true);
  });
});

describe('Edge Cases', () => {
  test('Empty object should fail validation', () => {
    const result = validateAgainstSchema({}, rdformatSchema);
    expect(result.valid).toBe(false);
  });

  test('Array of mixed valid and invalid diagnostics should fail validation', () => {
    const mixedArray = [
      {
        message: "Valid diagnostic",
        location: { path: "src/test.js" }
      },
      {
        // Missing message and location
        severity: "ERROR"
      }
    ];
    const result = validateAgainstSchema(mixedArray, rdformatSchema);
    expect(result.valid).toBe(false);
  });

  test('Diagnostic with all optional fields should pass validation', () => {
    const fullDiagnostic = {
      message: "Complex error",
      location: {
        path: "src/complex.js",
        range: {
          start: { line: 10, column: 5 },
          end: { line: 10, column: 15 }
        }
      },
      severity: "ERROR",
      source: {
        name: "custom-linter",
        url: "https://example.com/linter"
      },
      code: {
        value: "CUSTOM_001",
        url: "https://example.com/docs/CUSTOM_001"
      },
      suggestions: [
        {
          range: {
            start: { line: 10, column: 5 },
            end: { line: 10, column: 15 }
          },
          text: "fixedCode"
        }
      ],
      original_output: "10:5-15 error Complex error CUSTOM_001",
      related_locations: [
        {
          message: "Related issue here",
          location: {
            path: "src/related.js",
            range: {
              start: { line: 5, column: 1 }
            }
          }
        }
      ]
    };
    const result = validateAgainstSchema(fullDiagnostic, diagnosticSchema);
    expect(result.valid).toBe(true);
  });

  test('Diagnostic result with empty diagnostics array should pass validation', () => {
    const emptyResult = {
      diagnostics: [],
      source: { name: "test-linter" }
    };
    const result = validateAgainstSchema(emptyResult, rdformatSchema);
    expect(result.valid).toBe(true);
  });
});