/**
 * Basic usage examples for RDFormat Validator
 */

const { RDFormatValidator, validate, validateAndFix } = require('../dist/index');

async function demonstrateBasicUsage() {
  console.log('=== RDFormat Validator Basic Usage Examples ===\n');

  // Create a validator instance
  const validator = new RDFormatValidator({
    strictMode: false,
    allowExtraFields: true,
    fixLevel: 'basic'
  });

  // Example 1: Validate a valid RDFormat object
  console.log('1. Validating a valid RDFormat object:');
  const validData = {
    diagnostics: [
      {
        message: 'Unused variable detected',
        location: {
          path: 'src/main.js',
          range: {
            start: { line: 10, column: 5 },
            end: { line: 10, column: 15 }
          }
        },
        severity: 'WARNING',
        source: {
          name: 'eslint',
          url: 'https://eslint.org'
        }
      }
    ]
  };

  const result1 = validator.validateObject(validData);
  console.log('Valid:', result1.valid);
  console.log('Errors:', result1.errors.length);
  console.log('Warnings:', result1.warnings.length);
  console.log();

  // Example 2: Validate an invalid RDFormat object
  console.log('2. Validating an invalid RDFormat object:');
  const invalidData = {
    diagnostics: [
      {
        // Missing required 'message' field
        location: {
          path: 'src/main.js'
        }
      }
    ]
  };

  const result2 = validator.validateObject(invalidData);
  console.log('Valid:', result2.valid);
  console.log('Errors:', result2.errors.length);
  if (result2.errors.length > 0) {
    console.log('First error:', result2.errors[0].message);
  }
  console.log();

  // Example 3: Validate and fix the invalid object
  console.log('3. Validating and fixing the invalid object:');
  const result3 = validator.validateObject(invalidData, true);
  console.log('Valid after fixing:', result3.valid);
  console.log('Applied fixes:', result3.appliedFixes?.length || 0);
  if (result3.appliedFixes && result3.appliedFixes.length > 0) {
    console.log('First fix:', result3.appliedFixes[0].message);
  }
  console.log('Fixed data:', JSON.stringify(result3.fixedData, null, 2));
  console.log();

  // Example 4: Validate a JSON string
  console.log('4. Validating a JSON string:');
  const jsonString = JSON.stringify({
    diagnostics: [
      {
        message: 'Syntax error',
        location: { path: 'test.js' }
      }
    ]
  });

  const result4 = await validator.validateString(jsonString);
  console.log('Valid:', result4.valid);
  console.log('Errors:', result4.errors.length);
  console.log();

  // Example 5: Using convenience functions
  console.log('5. Using convenience functions:');
  
  // Simple validation
  const result5 = await validate(validData);
  console.log('Convenience validate - Valid:', result5.valid);

  // Validation with fixing
  const result6 = await validateAndFix(invalidData);
  console.log('Convenience validateAndFix - Valid:', result6.valid);
  console.log('Applied fixes:', result6.appliedFixes?.length || 0);
  console.log();

  // Example 6: Custom options
  console.log('6. Using custom options:');
  const strictValidator = new RDFormatValidator({
    strictMode: true,
    allowExtraFields: false,
    fixLevel: 'aggressive'
  });

  const dataWithExtraField = {
    diagnostics: [
      {
        message: 'Test error',
        location: { path: 'test.js' },
        extraField: 'This should cause an error in strict mode'
      }
    ]
  };

  const result7 = strictValidator.validateObject(dataWithExtraField);
  console.log('Strict mode - Valid:', result7.valid);
  console.log('Strict mode - Errors:', result7.errors.length);
  console.log();

  console.log('=== Examples completed ===');
}

// Run the examples
demonstrateBasicUsage().catch(console.error);