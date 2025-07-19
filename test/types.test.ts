/**
 * Basic tests to verify type definitions and interfaces
 */

import { 
  Severity, 
  Diagnostic, 
  DiagnosticResult,
  ValidationError,
  ValidationResult,
  rdformatSchema
} from '../src/index';

describe('RDFormat Types', () => {
  test('Severity enum should have correct values', () => {
    expect(Severity.ERROR).toBe('ERROR');
    expect(Severity.WARNING).toBe('WARNING');
    expect(Severity.INFO).toBe('INFO');
    expect(Severity.UNKNOWN_SEVERITY).toBe('UNKNOWN_SEVERITY');
  });

  test('Should create a valid Diagnostic object', () => {
    const diagnostic: Diagnostic = {
      message: 'Test error message',
      location: {
        path: 'test.js',
        range: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 10 }
        }
      },
      severity: Severity.ERROR
    };

    expect(diagnostic.message).toBe('Test error message');
    expect(diagnostic.location.path).toBe('test.js');
    expect(diagnostic.severity).toBe(Severity.ERROR);
  });

  test('Should create a valid DiagnosticResult object', () => {
    const result: DiagnosticResult = {
      diagnostics: [{
        message: 'Test error',
        location: { path: 'test.js' }
      }]
    };

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toBe('Test error');
  });

  test('Should create a valid ValidationError object', () => {
    const error: ValidationError = {
      path: 'diagnostics[0].message',
      message: 'Missing required property',
      code: 'REQUIRED_PROPERTY'
    };

    expect(error.path).toBe('diagnostics[0].message');
    expect(error.code).toBe('REQUIRED_PROPERTY');
  });

  test('Schema should be defined', () => {
    expect(rdformatSchema).toBeDefined();
    expect(rdformatSchema.type).toBe('object');
    expect(rdformatSchema.properties.diagnostics).toBeDefined();
  });
});