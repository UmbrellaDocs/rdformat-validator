/**
 * Unit tests for the Fixer module
 */

import { Fixer, createFixer, fixData } from '../src/fixer/index';
import { ValidationError, ValidationResult, FixerOptions } from '../src/types/validation';
import { ValidationErrorCode } from '../src/validator/index';

describe('Fixer', () => {
    let fixer: Fixer;

    beforeEach(() => {
        fixer = new Fixer();
    });

    describe('constructor', () => {
        it('should create fixer with default options', () => {
            const defaultFixer = new Fixer();
            expect(defaultFixer).toBeInstanceOf(Fixer);
        });

        it('should create fixer with custom options', () => {
            const options: FixerOptions = {
                strictMode: true,
                fixLevel: 'aggressive'
            };
            const customFixer = new Fixer(options);
            expect(customFixer).toBeInstanceOf(Fixer);
        });
    });

    describe('canFix', () => {
        it('should return true for fixable type mismatch errors', () => {
            const error: ValidationError = {
                path: 'test',
                code: ValidationErrorCode.TYPE_MISMATCH,
                message: 'Type mismatch',
                value: '123',
                expected: 'number'
            };

            expect(fixer.canFix(error)).toBe(true);
        });

        it('should return true for missing property errors', () => {
            const error: ValidationError = {
                path: 'message',
                code: ValidationErrorCode.REQUIRED_PROPERTY_MISSING,
                message: 'Missing required property',
                expected: 'string'
            };

            expect(fixer.canFix(error)).toBe(true);
        });

        it('should return true for RDFormat specific errors', () => {
            const messageError: ValidationError = {
                path: 'message',
                code: ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                message: 'Missing diagnostic message'
            };

            const locationError: ValidationError = {
                path: 'location',
                code: ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION,
                message: 'Missing diagnostic location'
            };

            const severityError: ValidationError = {
                path: 'severity',
                code: ValidationErrorCode.INVALID_SEVERITY,
                message: 'Invalid severity',
                value: 'error'
            };

            expect(fixer.canFix(messageError)).toBe(true);
            expect(fixer.canFix(locationError)).toBe(true);
            expect(fixer.canFix(severityError)).toBe(true);
        });

        it('should return false for unfixable errors', () => {
            const error: ValidationError = {
                path: 'test',
                code: 'UNKNOWN_ERROR' as ValidationErrorCode,
                message: 'Unknown error'
            };

            expect(fixer.canFix(error)).toBe(false);
        });

        it('should respect fix level for aggressive fixes', () => {
            const basicFixer = new Fixer({ fixLevel: 'basic' });
            const aggressiveFixer = new Fixer({ fixLevel: 'aggressive' });

            const emptyStringError: ValidationError = {
                path: 'message',
                code: ValidationErrorCode.EMPTY_STRING,
                message: 'Empty string',
                value: ''
            };

            expect(basicFixer.canFix(emptyStringError)).toBe(false);
            expect(aggressiveFixer.canFix(emptyStringError)).toBe(true);
        });
    });

    describe('fix', () => {
        it('should fix type mismatch errors', () => {
            const data = { value: '123' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'value',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: '123',
                    expected: 'number'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.value).toBe(123);
            expect(result.appliedFixes).toHaveLength(1);
            expect(result.appliedFixes[0].path).toBe('value');
            expect(result.appliedFixes[0].before).toBe('123');
            expect(result.appliedFixes[0].after).toBe(123);
            expect(result.remainingErrors).toHaveLength(0);
        });

        it('should fix missing required properties', () => {
            const data = {};
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'message',
                    code: ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                    message: 'Missing diagnostic message'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.message).toBe('No message provided');
            expect(result.appliedFixes).toHaveLength(1);
            expect(result.appliedFixes[0].path).toBe('message');
            expect(result.appliedFixes[0].after).toBe('No message provided');
            expect(result.remainingErrors).toHaveLength(0);
        });

        it('should fix invalid severity values', () => {
            const data = { severity: 'error' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'severity',
                    code: ValidationErrorCode.INVALID_SEVERITY,
                    message: 'Invalid severity',
                    value: 'error'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.severity).toBe('ERROR');
            expect(result.appliedFixes).toHaveLength(1);
            expect(result.appliedFixes[0].before).toBe('error');
            expect(result.appliedFixes[0].after).toBe('ERROR');
        });

        it('should handle multiple errors', () => {
            const data = { severity: 'warn' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [
                    {
                        path: 'message',
                        code: ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                        message: 'Missing message'
                    },
                    {
                        path: 'severity',
                        code: ValidationErrorCode.INVALID_SEVERITY,
                        message: 'Invalid severity',
                        value: 'warn'
                    }
                ],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.message).toBe('No message provided');
            expect(result.data.severity).toBe('WARNING');
            expect(result.appliedFixes).toHaveLength(2);
            expect(result.remainingErrors).toHaveLength(0);
        });

        it('should preserve unfixable errors', () => {
            const data = { test: 'value' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [
                    {
                        path: 'message',
                        code: ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                        message: 'Missing message'
                    },
                    {
                        path: 'test',
                        code: 'UNFIXABLE_ERROR' as ValidationErrorCode,
                        message: 'Unfixable error'
                    }
                ],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.message).toBe('No message provided');
            expect(result.appliedFixes).toHaveLength(1);
            expect(result.remainingErrors).toHaveLength(1);
            expect(result.remainingErrors[0].code).toBe('UNFIXABLE_ERROR');
        });

        it('should not modify original data', () => {
            const originalData = { value: '123' };
            const data = { ...originalData };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'value',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: '123',
                    expected: 'number'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(originalData.value).toBe('123');
            expect(result.data.value).toBe(123);
        });
    });

    describe('type coercion fixes', () => {
        it('should convert string to number', () => {
            const data = { line: '42' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'line',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: '42',
                    expected: 'number'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.line).toBe(42);
            expect(typeof result.data.line).toBe('number');
        });

        it('should convert number to string', () => {
            const data = { message: 123 };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'message',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: 123,
                    expected: 'string'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.message).toBe('123');
            expect(typeof result.data.message).toBe('string');
        });

        it('should convert boolean to string', () => {
            const data = { path: true };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'path',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: true,
                    expected: 'string'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.path).toBe('true');
        });

        it('should convert single value to array', () => {
            const data = { diagnostics: { message: 'test' } };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'diagnostics',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: { message: 'test' },
                    expected: 'array'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(Array.isArray(result.data.diagnostics)).toBe(true);
            expect(result.data.diagnostics).toEqual([{ message: 'test' }]);
        });
    });

    describe('missing property fixes', () => {
        it('should add missing message with default value', () => {
            const data = { location: { path: 'test.js' } };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'message',
                    code: ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                    message: 'Missing message'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.message).toBe('No message provided');
        });

        it('should add missing location with default value', () => {
            const data = { message: 'test message' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'location',
                    code: ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION,
                    message: 'Missing location'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.location).toEqual({ path: 'unknown' });
        });

        it('should add missing nested properties', () => {
            const data = { location: {} };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'location.path',
                    code: ValidationErrorCode.REQUIRED_PROPERTY_MISSING,
                    message: 'Missing path',
                    expected: 'string'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.location.path).toBe('unknown');
        });

        it('should create nested structure when needed', () => {
            const data = {};
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'location.range.start.line',
                    code: ValidationErrorCode.REQUIRED_PROPERTY_MISSING,
                    message: 'Missing line',
                    expected: 'number'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.location.range.start.line).toBe(1);
        });
    });

    describe('aggressive fixes', () => {
        let aggressiveFixer: Fixer;

        beforeEach(() => {
            aggressiveFixer = new Fixer({ fixLevel: 'aggressive' });
        });

        it('should fix empty strings in aggressive mode', () => {
            const data = { message: '' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'message',
                    code: ValidationErrorCode.EMPTY_STRING,
                    message: 'Empty string',
                    value: ''
                }],
                warnings: []
            };

            const result = aggressiveFixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.message).toBe('No message provided');
        });

        it('should fix invalid position values in aggressive mode', () => {
            const data = { location: { range: { start: { line: 0 } } } };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'location.range.start.line',
                    code: ValidationErrorCode.INVALID_POSITION,
                    message: 'Invalid position',
                    value: 0
                }],
                warnings: []
            };

            const result = aggressiveFixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.location.range.start.line).toBe(1);
        });

        it('should fix number violations in aggressive mode', () => {
            const data = { location: { range: { start: { line: -5 } } } };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'location.range.start.line',
                    code: ValidationErrorCode.MIN_VALUE_VIOLATION,
                    message: 'Number must be at least 1, but got -5',
                    value: -5
                }],
                warnings: []
            };

            const result = aggressiveFixer.fix(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.location.range.start.line).toBe(1);
        });
    });

    describe('severity normalization', () => {
        const severityTestCases = [
            { input: 'error', expected: 'ERROR' },
            { input: 'err', expected: 'ERROR' },
            { input: 'fatal', expected: 'ERROR' },
            { input: 'warning', expected: 'WARNING' },
            { input: 'warn', expected: 'WARNING' },
            { input: 'caution', expected: 'WARNING' },
            { input: 'info', expected: 'INFO' },
            { input: 'information', expected: 'INFO' },
            { input: 'note', expected: 'INFO' },
            { input: 'unknown', expected: 'UNKNOWN_SEVERITY' },
            { input: 123, expected: 'UNKNOWN_SEVERITY' }
        ];

        severityTestCases.forEach(({ input, expected }) => {
            it(`should normalize severity '${input}' to '${expected}'`, () => {
                const data = { severity: input };
                const validationResult: ValidationResult = {
                    valid: false,
                    errors: [{
                        path: 'severity',
                        code: ValidationErrorCode.INVALID_SEVERITY,
                        message: 'Invalid severity',
                        value: input
                    }],
                    warnings: []
                };

                const result = fixer.fix(data, validationResult);

                expect(result.data.severity).toBe(expected);
            });
        });
    });

    describe('edge cases', () => {
        it('should handle null and undefined values', () => {
            const data = { message: null };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'message',
                    code: ValidationErrorCode.TYPE_MISMATCH,
                    message: 'Type mismatch',
                    value: null,
                    expected: 'string'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.message).toBe('');
        });

        it('should handle empty validation result', () => {
            const data = { message: 'test' };
            const validationResult: ValidationResult = {
                valid: true,
                errors: [],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.fixed).toBe(false);
            expect(result.appliedFixes).toHaveLength(0);
            expect(result.remainingErrors).toHaveLength(0);
            expect(result.data).toEqual(data);
        });

        it('should handle complex nested paths', () => {
            const data = { diagnostics: [{ location: { range: {} } }] };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'diagnostics[0].location.range.start.line',
                    code: ValidationErrorCode.REQUIRED_PROPERTY_MISSING,
                    message: 'Missing line',
                    expected: 'number'
                }],
                warnings: []
            };

            const result = fixer.fix(data, validationResult);

            expect(result.data.diagnostics[0].location.range.start.line).toBe(1);
        });
    });

    describe('convenience functions', () => {
        it('should create fixer with createFixer function', () => {
            const options: FixerOptions = { fixLevel: 'aggressive' };
            const createdFixer = createFixer(options);
            
            expect(createdFixer).toBeInstanceOf(Fixer);
        });

        it('should fix data with fixData function', () => {
            const data = { severity: 'error' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'severity',
                    code: ValidationErrorCode.INVALID_SEVERITY,
                    message: 'Invalid severity',
                    value: 'error'
                }],
                warnings: []
            };

            const result = fixData(data, validationResult);

            expect(result.fixed).toBe(true);
            expect(result.data.severity).toBe('ERROR');
        });

        it('should fix data with options using fixData function', () => {
            const data = { message: '' };
            const validationResult: ValidationResult = {
                valid: false,
                errors: [{
                    path: 'message',
                    code: ValidationErrorCode.EMPTY_STRING,
                    message: 'Empty string',
                    value: ''
                }],
                warnings: []
            };

            const result = fixData(data, validationResult, { fixLevel: 'aggressive' });

            expect(result.fixed).toBe(true);
            expect(result.data.message).toBe('No message provided');
        });
    });
});