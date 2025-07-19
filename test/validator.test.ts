/**
 * Unit tests for the validator module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Validator, ValidationErrorCode, validate, validateField } from '../src/validator/index';
import { ValidationOptions, ValidationResult } from '../src/types/validation';
import { rdformatSchema, diagnosticSchema } from '../src/types/schema';
import * as fs from 'fs';
import * as path from 'path';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('constructor', () => {
    it('should create validator with default options', () => {
      const v = new Validator();
      expect(v).toBeInstanceOf(Validator);
      expect(v.getSchema()).toBeDefined();
    });

    it('should create validator with custom options', () => {
      const options: ValidationOptions = {
        strictMode: true,
        allowExtraFields: false
      };
      const v = new Validator(options);
      expect(v).toBeInstanceOf(Validator);
    });
  });

  describe('validate method', () => {
    describe('null and undefined input handling', () => {
      it('should reject null input', () => {
        const result = validator.validate(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.NULL_INPUT);
        expect(result.errors[0].path).toBe('');
      });

      it('should reject undefined input', () => {
        const result = validator.validate(undefined);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.NULL_INPUT);
      });
    });

    describe('empty input handling', () => {
      it('should reject empty string', () => {
        const result = validator.validate('');
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.EMPTY_INPUT);
      });

      it('should reject whitespace-only string', () => {
        const result = validator.validate('   \n\t  ');
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.EMPTY_INPUT);
      });

      it('should reject empty object', () => {
        const result = validator.validate({});
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.EMPTY_INPUT);
      });

      it('should reject empty array', () => {
        const result = validator.validate([]);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.EMPTY_ARRAY);
      });
    });

    describe('valid RDFormat data', () => {
      it('should validate single diagnostic', () => {
        const diagnostic = {
          message: 'Test error',
          location: {
            path: 'src/test.js',
            range: {
              start: { line: 1, column: 1 }
            }
          }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate array of diagnostics', () => {
        const diagnostics = [
          {
            message: 'Test error 1',
            location: { path: 'src/test1.js' }
          },
          {
            message: 'Test error 2',
            location: { path: 'src/test2.js' }
          }
        ];
        const result = validator.validate(diagnostics);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate diagnostic result', () => {
        const diagnosticResult = {
          diagnostics: [
            {
              message: 'Test error',
              location: { path: 'src/test.js' }
            }
          ]
        };
        const result = validator.validate(diagnosticResult);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate complex diagnostic with all fields', () => {
        const diagnostic = {
          message: 'Line too long',
          location: {
            path: 'src/main.js',
            range: {
              start: { line: 10, column: 1 },
              end: { line: 10, column: 120 }
            }
          },
          severity: 'WARNING',
          source: {
            name: 'eslint',
            url: 'https://eslint.org'
          },
          code: {
            value: 'max-len',
            url: 'https://eslint.org/docs/rules/max-len'
          },
          suggestions: [
            {
              range: {
                start: { line: 10, column: 80 },
                end: { line: 10, column: 80 }
              },
              text: '\n  '
            }
          ],
          original_output: 'Line 10: Line too long (120 characters)',
          related_locations: [
            {
              message: 'Related issue',
              location: { path: 'src/related.js' }
            }
          ]
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('invalid RDFormat data', () => {
      it('should reject diagnostic missing message', () => {
        const diagnostic = {
          location: { path: 'src/test.js' }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE)).toBe(true);
      });

      it('should reject diagnostic missing location', () => {
        const diagnostic = {
          message: 'Test error'
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION)).toBe(true);
      });

      it('should reject diagnostic with empty path', () => {
        const diagnostic = {
          message: 'Test error',
          location: { path: '' }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.EMPTY_STRING)).toBe(true);
      });

      it('should reject diagnostic with invalid severity', () => {
        const diagnostic = {
          message: 'Test error',
          location: { path: 'src/test.js' },
          severity: 'INVALID_SEVERITY'
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_SEVERITY)).toBe(true);
      });

      it('should reject diagnostic with wrong message type', () => {
        const diagnostic = {
          message: 123,
          location: { path: 'src/test.js' }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.TYPE_MISMATCH)).toBe(true);
      });

      it('should reject diagnostic with invalid line number', () => {
        const diagnostic = {
          message: 'Test error',
          location: {
            path: 'src/test.js',
            range: {
              start: { line: 0 }
            }
          }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_POSITION)).toBe(true);
      });

      it('should reject diagnostic with invalid column number', () => {
        const diagnostic = {
          message: 'Test error',
          location: {
            path: 'src/test.js',
            range: {
              start: { line: 1, column: 0 }
            }
          }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_POSITION)).toBe(true);
      });
    });

    describe('edge case handling', () => {
      it('should handle partial diagnostic objects', () => {
        const partialDiagnostic = {
          message: 'Test error'
          // missing location
        };
        const result = validator.validate(partialDiagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION)).toBe(true);
      });

      it('should handle diagnostic result with empty diagnostics array', () => {
        const diagnosticResult = {
          diagnostics: []
        };
        const result = validator.validate(diagnosticResult);
        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.code === ValidationErrorCode.EMPTY_ARRAY)).toBe(true);
      });

      it('should handle diagnostic result with non-array diagnostics', () => {
        const diagnosticResult = {
          diagnostics: 'not-an-array'
        };
        const result = validator.validate(diagnosticResult);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.TYPE_MISMATCH)).toBe(true);
      });

      it('should handle range without start position', () => {
        const diagnostic = {
          message: 'Test error',
          location: {
            path: 'src/test.js',
            range: {
              end: { line: 1, column: 10 }
            }
          }
        };
        const result = validator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_RANGE)).toBe(true);
      });
    });

    describe('strict mode behavior', () => {
      it('should reject unknown properties in strict mode', () => {
        const strictValidator = new Validator({ strictMode: true, allowExtraFields: false });
        const diagnostic = {
          message: 'Test error',
          location: { path: 'src/test.js' },
          unknownField: 'should cause error'
        };
        const result = strictValidator.validate(diagnostic);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ValidationErrorCode.UNKNOWN_PROPERTY)).toBe(true);
      });

      it('should warn about unknown properties in non-strict mode', () => {
        const lenientValidator = new Validator({ strictMode: false, allowExtraFields: true });
        const diagnostic = {
          message: 'Test error',
          location: { path: 'src/test.js' },
          unknownField: 'should cause warning'
        };
        const result = lenientValidator.validate(diagnostic);
        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.code === ValidationErrorCode.UNKNOWN_PROPERTY)).toBe(true);
      });
    });
  });

  describe('validateField method', () => {
    it('should validate individual field against schema', () => {
      const result = validator.validateField('test.message', 'Test message', { type: 'string' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid field type', () => {
      const result = validator.validateField('test.message', 123, { type: 'string' });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ValidationErrorCode.TYPE_MISMATCH);
    });

    it('should validate field with constraints', () => {
      const result = validator.validateField('test.line', 5, { 
        type: 'number', 
        minimum: 1 
      });
      expect(result.valid).toBe(true);
    });

    it('should reject field violating constraints', () => {
      const result = validator.validateField('test.line', 0, { 
        type: 'number', 
        minimum: 1 
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCode.MIN_VALUE_VIOLATION);
    });
  });

  describe('setOptions method', () => {
    it('should update validation options', () => {
      validator.setOptions({ strictMode: true });
      const diagnostic = {
        message: 'Test error',
        location: { path: 'src/test.js' },
        unknownField: 'should cause error'
      };
      const result = validator.validate(diagnostic);
      expect(result.errors.some(e => e.code === ValidationErrorCode.UNKNOWN_PROPERTY)).toBe(true);
    });
  });

  describe('getSchema method', () => {
    it('should return the current schema', () => {
      const schema = validator.getSchema();
      expect(schema).toBeDefined();
      expect(schema).toBe(rdformatSchema);
    });
  });
});

describe('convenience functions', () => {
  describe('validate function', () => {
    it('should validate data with default options', () => {
      const diagnostic = {
        message: 'Test error',
        location: { path: 'src/test.js' }
      };
      const result = validate(diagnostic);
      expect(result.valid).toBe(true);
    });

    it('should validate data with custom options', () => {
      const diagnostic = {
        message: 'Test error',
        location: { path: 'src/test.js' },
        unknownField: 'test'
      };
      const result = validate(diagnostic, { strictMode: true, allowExtraFields: false });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === ValidationErrorCode.UNKNOWN_PROPERTY)).toBe(true);
    });
  });

  describe('validateField function', () => {
    it('should validate field with default options', () => {
      const result = validateField('test', 'value', { type: 'string' });
      expect(result.valid).toBe(true);
    });

    it('should validate field with custom options', () => {
      const result = validateField('test', 123, { type: 'string' }, { strictMode: true });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCode.TYPE_MISMATCH);
    });
  });
});

describe('integration with test fixtures', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  let fixtureValidator: Validator;

  beforeEach(() => {
    fixtureValidator = new Validator();
  });

  it('should validate valid-rdformat.json', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'valid-rdformat.json'), 'utf8'));
    const result = fixtureValidator.validate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate valid-diagnostic-result.json', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'valid-diagnostic-result.json'), 'utf8'));
    const result = fixtureValidator.validate(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid-missing-message.json', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'invalid-missing-message.json'), 'utf8'));
    const result = fixtureValidator.validate(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: any) => e.code === ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE)).toBe(true);
  });

  it('should reject invalid-missing-location.json', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'invalid-missing-location.json'), 'utf8'));
    const result = fixtureValidator.validate(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: any) => e.code === ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION)).toBe(true);
  });

  it('should reject invalid-empty-path.json', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'invalid-empty-path.json'), 'utf8'));
    const result = fixtureValidator.validate(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: any) => e.code === ValidationErrorCode.EMPTY_STRING)).toBe(true);
  });

  it('should reject invalid-wrong-types.json', () => {
    const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, 'invalid-wrong-types.json'), 'utf8'));
    const result = fixtureValidator.validate(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: any) => e.code === ValidationErrorCode.TYPE_MISMATCH)).toBe(true);
    expect(result.errors.some((e: any) => e.code === ValidationErrorCode.INVALID_SEVERITY)).toBe(true);
  });
});

describe('error message quality', () => {
  let errorValidator: Validator;

  beforeEach(() => {
    errorValidator = new Validator();
  });

  it('should provide helpful error messages', () => {
    const diagnostic = {
      message: 123,
      location: { path: '' }
    };
    const result = errorValidator.validate(diagnostic);
    
    expect(result.errors).toHaveLength(2);
    
    const typeError = result.errors.find((e: any) => e.code === ValidationErrorCode.TYPE_MISMATCH);
    expect(typeError?.message).toContain('Expected string');
    expect(typeError?.message).toContain('got number');
    
    const emptyError = result.errors.find((e: any) => e.code === ValidationErrorCode.EMPTY_STRING);
    expect(emptyError?.message).toContain('cannot be empty');
  });

  it('should provide path information in error messages', () => {
    const diagnosticResult = {
      diagnostics: [
        {
          message: 'Test',
          location: {
            path: 'test.js',
            range: {
              start: { line: 0 }
            }
          }
        }
      ]
    };
    const result = errorValidator.validate(diagnosticResult);
    
    const positionError = result.errors.find((e: any) => e.code === ValidationErrorCode.INVALID_POSITION);
    expect(positionError?.path).toContain('diagnostics[0].location.range.start.line');
    expect(positionError?.message).toContain('positive integer');
  });
});