/**
 * Integration tests for the main RDFormatValidator class
 */

import { 
  RDFormatValidator, 
  validate, 
  validateAndFix,
  isValidRDFormat,
  getValidationErrors,
  validateBatch,
  validateAndFixBatch,
  createValidationSummary,
  formatValidationErrors
} from '../src/index';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('RDFormatValidator Integration Tests', () => {
  let validator: RDFormatValidator;

  beforeEach(() => {
    validator = new RDFormatValidator();
  });

  describe('validateString method', () => {
    it('should validate a valid RDFormat string', async () => {
      const validRDFormat = JSON.stringify({
        diagnostics: [
          {
            message: 'Test error',
            location: {
              path: 'test.js',
              range: {
                start: { line: 1, column: 1 }
              }
            }
          }
        ]
      });

      const result = await validator.validateString(validRDFormat);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle invalid JSON strings', async () => {
      const invalidJson = '{ invalid json }';
      
      const result = await validator.validateString(invalidJson);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('PARSE_ERROR');
    });

    it('should validate and fix invalid RDFormat string', async () => {
      const invalidRDFormat = JSON.stringify({
        diagnostics: [
          {
            // Missing required message field
            location: {
              path: 'test.js'
            }
          }
        ]
      });

      const result = await validator.validateString(invalidRDFormat, true);
      
      expect(result.fixedData).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
      expect(result.appliedFixes!.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', async () => {
      const result = await validator.validateString('');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validateFile method', () => {
    it('should validate a valid RDFormat file', async () => {
      const filePath = join(__dirname, 'fixtures', 'valid-rdformat.json');
      
      const result = await validator.validateFile(filePath);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid RDFormat files', async () => {
      const filePath = join(__dirname, 'fixtures', 'invalid-missing-message.json');
      
      const result = await validator.validateFile(filePath);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle non-existent files', async () => {
      const filePath = join(__dirname, 'fixtures', 'non-existent.json');
      
      const result = await validator.validateFile(filePath);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('PARSE_ERROR');
    });

    it('should validate and fix invalid RDFormat file', async () => {
      const filePath = join(__dirname, 'fixtures', 'invalid-missing-message.json');
      
      const result = await validator.validateFile(filePath, true);
      
      expect(result.fixedData).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
    });
  });

  describe('validateObject method', () => {
    it('should validate a valid RDFormat object', () => {
      const validRDFormat = {
        diagnostics: [
          {
            message: 'Test error',
            location: {
              path: 'test.js',
              range: {
                start: { line: 1, column: 1 }
              }
            }
          }
        ]
      };

      const result = validator.validateObject(validRDFormat);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid RDFormat objects', () => {
      const invalidRDFormat = {
        diagnostics: [
          {
            // Missing required message field
            location: {
              path: 'test.js'
            }
          }
        ]
      };

      const result = validator.validateObject(invalidRDFormat);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate and fix invalid RDFormat object', () => {
      const invalidRDFormat = {
        diagnostics: [
          {
            // Missing required message field
            location: {
              path: 'test.js'
            }
          }
        ]
      };

      const result = validator.validateObject(invalidRDFormat, true);
      
      expect(result.fixedData).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
      expect(result.appliedFixes!.length).toBeGreaterThan(0);
    });

    it('should handle null input', () => {
      const result = validator.validateObject(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle undefined input', () => {
      const result = validator.validateObject(undefined);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('options management', () => {
    it('should initialize with default options', () => {
      const options = validator.getOptions();
      
      expect(options.strictMode).toBe(false);
      expect(options.allowExtraFields).toBe(true);
      expect(options.fixLevel).toBe('basic');
    });

    it('should accept custom options in constructor', () => {
      const customValidator = new RDFormatValidator({
        strictMode: true,
        allowExtraFields: false,
        fixLevel: 'aggressive'
      });
      
      const options = customValidator.getOptions();
      
      expect(options.strictMode).toBe(true);
      expect(options.allowExtraFields).toBe(false);
      expect(options.fixLevel).toBe('aggressive');
    });

    it('should update options with setOptions', () => {
      validator.setOptions({
        strictMode: true,
        fixLevel: 'aggressive'
      });
      
      const options = validator.getOptions();
      
      expect(options.strictMode).toBe(true);
      expect(options.allowExtraFields).toBe(true); // Should keep existing value
      expect(options.fixLevel).toBe('aggressive');
    });

    it('should affect validation behavior when options change', () => {
      const dataWithExtraField = {
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' },
            extraField: 'should cause warning'
          }
        ]
      };

      // Test with default options (allowExtraFields: true)
      let result = validator.validateObject(dataWithExtraField);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Test with strict mode (allowExtraFields: false)
      validator.setOptions({ strictMode: true, allowExtraFields: false });
      result = validator.validateObject(dataWithExtraField);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getSchema method', () => {
    it('should return the RDFormat schema', () => {
      const schema = validator.getSchema();
      
      expect(schema).toBeDefined();
      expect(schema.oneOf).toBeDefined();
      expect(Array.isArray(schema.oneOf)).toBe(true);
    });
  });
});

describe('Convenience Functions', () => {
  describe('validate function', () => {
    it('should validate string input', async () => {
      const validRDFormat = JSON.stringify({
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' }
          }
        ]
      });

      const result = await validate(validRDFormat);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate object input', async () => {
      const validRDFormat = {
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' }
          }
        ]
      };

      const result = await validate(validRDFormat);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept custom options', async () => {
      const dataWithExtraField = {
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' },
            extraField: 'should cause error in strict mode'
          }
        ]
      };

      const result = await validate(dataWithExtraField, {
        strictMode: true,
        allowExtraFields: false
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateAndFix function', () => {
    it('should validate and fix string input', async () => {
      const invalidRDFormat = JSON.stringify({
        diagnostics: [
          {
            // Missing required message field
            location: { path: 'test.js' }
          }
        ]
      });

      const result = await validateAndFix(invalidRDFormat);
      
      expect(result.fixedData).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
      expect(result.appliedFixes!.length).toBeGreaterThan(0);
    });

    it('should validate and fix object input', async () => {
      const invalidRDFormat = {
        diagnostics: [
          {
            // Missing required message field
            location: { path: 'test.js' }
          }
        ]
      };

      const result = await validateAndFix(invalidRDFormat);
      
      expect(result.fixedData).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
      expect(result.appliedFixes!.length).toBeGreaterThan(0);
    });

    it('should accept custom options', async () => {
      const invalidRDFormat = {
        diagnostics: [
          {
            location: { path: '' } // Empty path should be fixed in aggressive mode
          }
        ]
      };

      const result = await validateAndFix(invalidRDFormat, {
        fixLevel: 'aggressive'
      });
      
      expect(result.fixedData).toBeDefined();
      expect(result.appliedFixes).toBeDefined();
    });
  });

  describe('isValidRDFormat function', () => {
    it('should return true for valid RDFormat string', async () => {
      const validRDFormat = JSON.stringify({
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' }
          }
        ]
      });

      const isValid = await isValidRDFormat(validRDFormat);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid RDFormat string', async () => {
      const invalidRDFormat = JSON.stringify({
        diagnostics: [
          {
            // Missing required message field
            location: { path: 'test.js' }
          }
        ]
      });

      const isValid = await isValidRDFormat(invalidRDFormat);
      expect(isValid).toBe(false);
    });

    it('should return true for valid RDFormat object', async () => {
      const validRDFormat = {
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' }
          }
        ]
      };

      const isValid = await isValidRDFormat(validRDFormat);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid RDFormat object', async () => {
      const invalidRDFormat = {
        diagnostics: [
          {
            // Missing required message field
            location: { path: 'test.js' }
          }
        ]
      };

      const isValid = await isValidRDFormat(invalidRDFormat);
      expect(isValid).toBe(false);
    });
  });

  describe('getValidationErrors function', () => {
    it('should return empty array for valid RDFormat', async () => {
      const validRDFormat = {
        diagnostics: [
          {
            message: 'Test error',
            location: { path: 'test.js' }
          }
        ]
      };

      const errors = await getValidationErrors(validRDFormat);
      expect(errors).toHaveLength(0);
    });

    it('should return validation errors for invalid RDFormat', async () => {
      const invalidRDFormat = {
        diagnostics: [
          {
            // Missing required message field
            location: { path: 'test.js' }
          }
        ]
      };

      const errors = await getValidationErrors(invalidRDFormat);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toHaveProperty('path');
      expect(errors[0]).toHaveProperty('message');
      expect(errors[0]).toHaveProperty('code');
    });

    it('should work with string input', async () => {
      const invalidRDFormat = JSON.stringify({
        diagnostics: [
          {
            location: { path: 'test.js' }
          }
        ]
      });

      const errors = await getValidationErrors(invalidRDFormat);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateBatch function', () => {
    it('should validate multiple valid inputs', async () => {
      const inputs = [
        JSON.stringify({
          diagnostics: [
            {
              message: 'Test error 1',
              location: { path: 'test1.js' }
            }
          ]
        }),
        {
          diagnostics: [
            {
              message: 'Test error 2',
              location: { path: 'test2.js' }
            }
          ]
        }
      ];

      const results = await validateBatch(inputs);
      
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });

    it('should validate multiple mixed inputs', async () => {
      const inputs = [
        JSON.stringify({
          diagnostics: [
            {
              message: 'Valid error',
              location: { path: 'test.js' }
            }
          ]
        }),
        {
          diagnostics: [
            {
              // Missing required message field
              location: { path: 'test.js' }
            }
          ]
        },
        '{ invalid json }'
      ];

      const results = await validateBatch(inputs);
      
      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(false);
      expect(results[2].errors[0].code).toBe('PARSE_ERROR');
    });

    it('should handle empty input array', async () => {
      const results = await validateBatch([]);
      expect(results).toHaveLength(0);
    });

    it('should accept custom options', async () => {
      const inputs = [
        {
          diagnostics: [
            {
              message: 'Test error',
              location: { path: 'test.js' },
              extraField: 'should cause error in strict mode'
            }
          ]
        }
      ];

      const results = await validateBatch(inputs, {
        strictMode: true,
        allowExtraFields: false
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(false);
      expect(results[0].errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateAndFixBatch function', () => {
    it('should validate and fix multiple inputs', async () => {
      const inputs = [
        JSON.stringify({
          diagnostics: [
            {
              // Missing required message field
              location: { path: 'test1.js' }
            }
          ]
        }),
        {
          diagnostics: [
            {
              // Missing required message field
              location: { path: 'test2.js' }
            }
          ]
        }
      ];

      const results = await validateAndFixBatch(inputs);
      
      expect(results).toHaveLength(2);
      expect(results[0].fixedData).toBeDefined();
      expect(results[0].appliedFixes).toBeDefined();
      expect(results[1].fixedData).toBeDefined();
      expect(results[1].appliedFixes).toBeDefined();
    });

    it('should handle mixed valid and invalid inputs', async () => {
      const inputs = [
        {
          diagnostics: [
            {
              message: 'Valid error',
              location: { path: 'test.js' }
            }
          ]
        },
        {
          diagnostics: [
            {
              // Missing required message field
              location: { path: 'test.js' }
            }
          ]
        }
      ];

      const results = await validateAndFixBatch(inputs);
      
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[0].fixedData).toBeUndefined(); // No fixes needed
      expect(results[1].fixedData).toBeDefined(); // Fixes applied
    });

    it('should accept custom options', async () => {
      const inputs = [
        {
          diagnostics: [
            {
              location: { path: '' } // Empty path should be fixed in aggressive mode
            }
          ]
        }
      ];

      const results = await validateAndFixBatch(inputs, {
        fixLevel: 'aggressive'
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].fixedData).toBeDefined();
      expect(results[0].appliedFixes).toBeDefined();
    });
  });

  describe('createValidationSummary function', () => {
    it('should create summary for all valid results', () => {
      const results = [
        {
          valid: true,
          errors: [],
          warnings: []
        },
        {
          valid: true,
          errors: [],
          warnings: []
        }
      ];

      const summary = createValidationSummary(results);
      
      expect(summary.totalCount).toBe(2);
      expect(summary.validCount).toBe(2);
      expect(summary.invalidCount).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.totalWarnings).toBe(0);
      expect(summary.totalFixes).toBe(0);
      expect(summary.errorCodes).toHaveLength(0);
      expect(summary.warningCodes).toHaveLength(0);
    });

    it('should create summary for mixed results', () => {
      const results = [
        {
          valid: true,
          errors: [],
          warnings: [
            { path: 'test.js', message: 'Warning 1', code: 'WARN_1' }
          ]
        },
        {
          valid: false,
          errors: [
            { path: 'test.js', message: 'Error 1', code: 'ERR_1' },
            { path: 'test.js', message: 'Error 2', code: 'ERR_2' }
          ],
          warnings: [
            { path: 'test.js', message: 'Warning 2', code: 'WARN_1' }
          ],
          appliedFixes: [
            { path: 'test.js', message: 'Fixed something', before: 'old', after: 'new' }
          ]
        }
      ];

      const summary = createValidationSummary(results);
      
      expect(summary.totalCount).toBe(2);
      expect(summary.validCount).toBe(1);
      expect(summary.invalidCount).toBe(1);
      expect(summary.totalErrors).toBe(2);
      expect(summary.totalWarnings).toBe(2);
      expect(summary.totalFixes).toBe(1);
      expect(summary.errorCodes).toEqual(['ERR_1', 'ERR_2']);
      expect(summary.warningCodes).toEqual(['WARN_1']);
    });

    it('should handle empty results array', () => {
      const summary = createValidationSummary([]);
      
      expect(summary.totalCount).toBe(0);
      expect(summary.validCount).toBe(0);
      expect(summary.invalidCount).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.totalWarnings).toBe(0);
      expect(summary.totalFixes).toBe(0);
      expect(summary.errorCodes).toHaveLength(0);
      expect(summary.warningCodes).toHaveLength(0);
    });
  });

  describe('formatValidationErrors function', () => {
    it('should format errors with default options', () => {
      const errors = [
        {
          path: 'diagnostics[0].message',
          message: 'Missing required property',
          code: 'REQUIRED_PROPERTY',
          expected: 'string'
        },
        {
          path: '',
          message: 'Invalid JSON format',
          code: 'PARSE_ERROR'
        }
      ];

      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toContain('diagnostics[0].message: Missing required property');
      expect(formatted[0]).toContain('(REQUIRED_PROPERTY)');
      expect(formatted[0]).toContain('Expected: string');
      expect(formatted[1]).toBe('Invalid JSON format (PARSE_ERROR)');
    });

    it('should format errors with custom options', () => {
      const errors = [
        {
          path: 'diagnostics[0].message',
          message: 'Missing required property',
          code: 'REQUIRED_PROPERTY',
          value: null,
          expected: 'string'
        }
      ];

      const formatted = formatValidationErrors(errors, {
        includeCode: false,
        includeValue: true,
        includeExpected: false
      });
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toContain('diagnostics[0].message: Missing required property');
      expect(formatted[0]).not.toContain('(REQUIRED_PROPERTY)');
      expect(formatted[0]).not.toContain('Expected:');
      expect(formatted[0]).toContain('Got: null');
    });

    it('should handle errors without path', () => {
      const errors = [
        {
          path: '',
          message: 'Global error',
          code: 'GLOBAL_ERROR'
        }
      ];

      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toBe('Global error (GLOBAL_ERROR)');
    });

    it('should handle empty errors array', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toHaveLength(0);
    });
  });
});

describe('Error Handling', () => {
  let validator: RDFormatValidator;

  beforeEach(() => {
    validator = new RDFormatValidator();
  });

  it('should handle unexpected errors gracefully in validateString', async () => {
    // Mock the parser to throw an error
    const originalParseString = validator['parser'].parseString;
    validator['parser'].parseString = jest.fn().mockImplementation(() => {
      throw new Error('Unexpected parser error');
    });

    const result = await validator.validateString('{}');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('UNEXPECTED_ERROR');

    // Restore original method
    validator['parser'].parseString = originalParseString;
  });

  it('should handle unexpected errors gracefully in validateFile', async () => {
    // Mock the parser to throw an error
    const originalParseFile = validator['parser'].parseFile;
    validator['parser'].parseFile = jest.fn().mockImplementation(() => {
      throw new Error('Unexpected file error');
    });

    const result = await validator.validateFile('test.json');
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('UNEXPECTED_ERROR');

    // Restore original method
    validator['parser'].parseFile = originalParseFile;
  });

  it('should handle unexpected errors gracefully in validateObject', () => {
    // Mock the validator to throw an error
    const originalValidate = validator['validator'].validate;
    validator['validator'].validate = jest.fn().mockImplementation(() => {
      throw new Error('Unexpected validation error');
    });

    const result = validator.validateObject({});
    
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('UNEXPECTED_ERROR');

    // Restore original method
    validator['validator'].validate = originalValidate;
  });
});