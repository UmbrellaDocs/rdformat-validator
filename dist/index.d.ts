/**
 * RDFormat Validator - Main entry point
 * Validator for Reviewdog Diagnostic Format
 */
export * from './types/rdformat';
export * from './types/validation';
export * from './types/schema';
export * from './parser/index';
export * from './validator/index';
export * from './fixer/index';
export * from './cli/index';
import { RDFormatValidatorOptions, RDFormatValidatorResult } from './types/validation';
import { JSONSchema } from './types/schema';
/**
 * Main RDFormat Validator class providing comprehensive validation functionality
 *
 * This class serves as the primary interface for validating JSON data against the
 * Reviewdog Diagnostic Format specification. It supports validation of strings,
 * files, and JavaScript objects, with optional automatic fixing of common issues.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const validator = new RDFormatValidator();
 * const result = await validator.validateString('{"diagnostics": []}');
 *
 * // With options
 * const strictValidator = new RDFormatValidator({
 *   strictMode: true,
 *   allowExtraFields: false
 * });
 *
 * // With automatic fixing
 * const fixResult = await validator.validateString(jsonString, true);
 * if (fixResult.fixedData) {
 *   console.log('Fixed data:', fixResult.fixedData);
 * }
 * ```
 */
export declare class RDFormatValidator {
    private parser;
    private validator;
    private fixer;
    private options;
    /**
     * Creates a new RDFormat validator instance
     * @param options - Configuration options for the validator
     * @param options.strictMode - Enable strict validation mode with additional checks
     * @param options.allowExtraFields - Allow extra fields not defined in the RDFormat specification
     * @param options.fixLevel - Level of automatic fixing: 'basic' for safe fixes, 'aggressive' for more extensive fixes
     */
    constructor(options?: RDFormatValidatorOptions);
    /**
     * Validates a JSON string against the RDFormat specification
     *
     * Parses the input string as JSON and validates it against the RDFormat schema.
     * Supports both single diagnostic objects and arrays of diagnostics.
     *
     * @param input - JSON string to validate (must be valid JSON)
     * @param fix - Whether to attempt automatic fixing of common errors (default: false)
     * @returns Promise resolving to validation result with errors, warnings, and optional fixes
     *
     * @example
     * ```typescript
     * const validator = new RDFormatValidator();
     *
     * // Validate without fixing
     * const result = await validator.validateString('{"diagnostics": []}');
     * console.log(result.valid); // true or false
     *
     * // Validate with automatic fixing
     * const fixResult = await validator.validateString(invalidJson, true);
     * if (fixResult.fixedData) {
     *   console.log('Corrected data:', fixResult.fixedData);
     * }
     * ```
     */
    validateString(input: string, fix?: boolean): Promise<RDFormatValidatorResult>;
    /**
     * Validates a file containing RDFormat JSON data
     *
     * Reads and parses a JSON file from the filesystem, then validates it against
     * the RDFormat specification. The file must contain valid JSON data.
     *
     * @param filePath - Path to the JSON file to validate (relative or absolute)
     * @param fix - Whether to attempt automatic fixing of common errors (default: false)
     * @returns Promise resolving to validation result with errors, warnings, and optional fixes
     *
     * @example
     * ```typescript
     * const validator = new RDFormatValidator();
     *
     * // Validate a file
     * const result = await validator.validateFile('./diagnostics.json');
     * if (!result.valid) {
     *   console.log('Validation errors:', result.errors);
     * }
     *
     * // Validate and fix a file
     * const fixResult = await validator.validateFile('./diagnostics.json', true);
     * if (fixResult.fixedData) {
     *   // Write the fixed data back to file or use it
     *   console.log('Fixed data:', fixResult.fixedData);
     * }
     * ```
     */
    validateFile(filePath: string, fix?: boolean): Promise<RDFormatValidatorResult>;
    /**
     * Validates a JavaScript object against the RDFormat specification
     *
     * Validates a pre-parsed JavaScript object against the RDFormat schema.
     * This method is useful when you already have parsed JSON data or when
     * working with objects constructed programmatically.
     *
     * @param data - JavaScript object to validate (should conform to RDFormat structure)
     * @param fix - Whether to attempt automatic fixing of common errors (default: false)
     * @returns Validation result with errors, warnings, and optional fixes
     *
     * @example
     * ```typescript
     * const validator = new RDFormatValidator();
     *
     * const diagnosticData = {
     *   diagnostics: [{
     *     message: "Unused variable",
     *     location: { path: "src/main.ts" }
     *   }]
     * };
     *
     * const result = validator.validateObject(diagnosticData);
     * if (result.valid) {
     *   console.log('Valid RDFormat data');
     * } else {
     *   console.log('Validation errors:', result.errors);
     * }
     * ```
     */
    validateObject(data: any, fix?: boolean): RDFormatValidatorResult;
    /**
     * Gets the JSON schema used for validation
     *
     * Returns the complete JSON Schema definition used to validate RDFormat data.
     * This can be useful for external validation tools or for understanding the
     * expected structure of RDFormat data.
     *
     * @returns The RDFormat JSON schema object
     *
     * @example
     * ```typescript
     * const validator = new RDFormatValidator();
     * const schema = validator.getSchema();
     * console.log('Schema title:', schema.title);
     * console.log('Schema description:', schema.description);
     * ```
     */
    getSchema(): JSONSchema;
    /**
     * Updates the validator options and reinitializes internal components
     *
     * Changes the configuration options for the validator. This will recreate
     * the internal parser, validator, and fixer components with the new settings.
     *
     * @param options - New options to apply (will be merged with existing options)
     *
     * @example
     * ```typescript
     * const validator = new RDFormatValidator();
     *
     * // Change to strict mode
     * validator.setOptions({ strictMode: true });
     *
     * // Allow extra fields and use aggressive fixing
     * validator.setOptions({
     *   allowExtraFields: true,
     *   fixLevel: 'aggressive'
     * });
     * ```
     */
    setOptions(options: RDFormatValidatorOptions): void;
    /**
     * Gets the current validator options
     *
     * Returns a copy of the current configuration options. The returned object
     * includes all options with their current values, including defaults.
     *
     * @returns Current validator options (with all defaults filled in)
     *
     * @example
     * ```typescript
     * const validator = new RDFormatValidator({ strictMode: true });
     * const options = validator.getOptions();
     * console.log(options.strictMode); // true
     * console.log(options.allowExtraFields); // true (default)
     * console.log(options.fixLevel); // 'basic' (default)
     * ```
     */
    getOptions(): Required<RDFormatValidatorOptions>;
}
/**
 * Convenience function for simple validation without fixing
 *
 * This is a simplified interface for validating RDFormat data without needing
 * to create a validator instance. It accepts either a JSON string or a
 * JavaScript object and validates it against the RDFormat specification.
 *
 * @param input - JSON string or JavaScript object to validate
 * @param options - Optional validation configuration
 * @returns Promise resolving to validation result (without fixes)
 *
 * @example
 * ```typescript
 * // Validate a JSON string
 * const result1 = await validate('{"diagnostics": []}');
 *
 * // Validate an object
 * const diagnosticData = { diagnostics: [] };
 * const result2 = await validate(diagnosticData);
 *
 * // Validate with custom options
 * const result3 = await validate(jsonString, { strictMode: true });
 *
 * if (result1.valid) {
 *   console.log('Valid RDFormat data');
 * } else {
 *   console.log('Validation errors:', result1.errors);
 * }
 * ```
 */
export declare function validate(input: string | object, options?: RDFormatValidatorOptions): Promise<RDFormatValidatorResult>;
/**
 * Convenience function for validation with automatic fixing
 *
 * This function validates RDFormat data and automatically attempts to fix
 * common issues. It's useful when you want both validation and fixing in
 * a single operation without managing a validator instance.
 *
 * @param input - JSON string or JavaScript object to validate and fix
 * @param options - Optional validation configuration (including fix level)
 * @returns Promise resolving to validation result with fixes applied
 *
 * @example
 * ```typescript
 * // Validate and fix a JSON string
 * const result1 = await validateAndFix('{"diagnostics": []}');
 *
 * // Validate and fix an object with aggressive fixing
 * const result2 = await validateAndFix(diagnosticData, {
 *   fixLevel: 'aggressive'
 * });
 *
 * if (result1.fixedData) {
 *   console.log('Data was fixed:', result1.fixedData);
 *   console.log('Applied fixes:', result1.appliedFixes);
 * }
 *
 * if (result1.valid) {
 *   console.log('Data is now valid');
 * } else {
 *   console.log('Remaining errors:', result1.errors);
 * }
 * ```
 */
export declare function validateAndFix(input: string | object, options?: RDFormatValidatorOptions): Promise<RDFormatValidatorResult>;
/**
 * Utility function to check if data is valid RDFormat without detailed results
 *
 * This is a lightweight function that returns only a boolean indicating whether
 * the input data is valid RDFormat. Use this when you only need to know if
 * data is valid and don't need detailed error information.
 *
 * @param input - JSON string or JavaScript object to check
 * @param options - Optional validation configuration
 * @returns Promise resolving to true if valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid1 = await isValidRDFormat('{"diagnostics": []}');
 * const isValid2 = await isValidRDFormat({ diagnostics: [] });
 *
 * if (isValid1) {
 *   console.log('Data is valid RDFormat');
 * }
 * ```
 */
export declare function isValidRDFormat(input: string | object, options?: RDFormatValidatorOptions): Promise<boolean>;
/**
 * Utility function to get only validation errors without warnings
 *
 * Returns just the validation errors from the input, filtering out warnings.
 * This is useful when you want to focus only on critical issues that prevent
 * the data from being valid RDFormat.
 *
 * @param input - JSON string or JavaScript object to validate
 * @param options - Optional validation configuration
 * @returns Promise resolving to array of validation errors
 *
 * @example
 * ```typescript
 * const errors = await getValidationErrors(invalidData);
 * if (errors.length > 0) {
 *   console.log('Found errors:', errors.map(e => e.message));
 * }
 * ```
 */
export declare function getValidationErrors(input: string | object, options?: RDFormatValidatorOptions): Promise<import('./types/validation').ValidationError[]>;
/**
 * Utility function to validate multiple inputs in batch
 *
 * Validates multiple RDFormat inputs simultaneously and returns results for each.
 * This is more efficient than validating each input separately when you have
 * multiple files or data objects to validate.
 *
 * @param inputs - Array of JSON strings or JavaScript objects to validate
 * @param options - Optional validation configuration applied to all inputs
 * @returns Promise resolving to array of validation results
 *
 * @example
 * ```typescript
 * const inputs = [
 *   '{"diagnostics": []}',
 *   { diagnostics: [{ message: "test", location: { path: "file.js" } }] },
 *   '{"invalid": "data"}'
 * ];
 *
 * const results = await validateBatch(inputs);
 * results.forEach((result, index) => {
 *   console.log(`Input ${index}: ${result.valid ? 'valid' : 'invalid'}`);
 * });
 * ```
 */
export declare function validateBatch(inputs: (string | object)[], options?: RDFormatValidatorOptions): Promise<RDFormatValidatorResult[]>;
/**
 * Utility function to validate and fix multiple inputs in batch
 *
 * Validates and attempts to fix multiple RDFormat inputs simultaneously.
 * This combines batch processing with automatic fixing capabilities.
 *
 * @param inputs - Array of JSON strings or JavaScript objects to validate and fix
 * @param options - Optional validation configuration applied to all inputs
 * @returns Promise resolving to array of validation results with fixes
 *
 * @example
 * ```typescript
 * const inputs = [
 *   '{"diagnostics": []}',
 *   '{"diagnostics": [{"message": "test"}]}' // missing location
 * ];
 *
 * const results = await validateAndFixBatch(inputs, { fixLevel: 'basic' });
 * results.forEach((result, index) => {
 *   if (result.fixedData) {
 *     console.log(`Input ${index} was fixed:`, result.fixedData);
 *   }
 * });
 * ```
 */
export declare function validateAndFixBatch(inputs: (string | object)[], options?: RDFormatValidatorOptions): Promise<RDFormatValidatorResult[]>;
/**
 * Utility function to create a summary of validation results
 *
 * Creates a summary object with counts of valid/invalid results, total errors,
 * and other statistics. This is useful for reporting and monitoring purposes.
 *
 * @param results - Array of validation results to summarize
 * @returns Summary object with validation statistics
 *
 * @example
 * ```typescript
 * const results = await validateBatch(inputs);
 * const summary = createValidationSummary(results);
 *
 * console.log(`Valid: ${summary.validCount}/${summary.totalCount}`);
 * console.log(`Total errors: ${summary.totalErrors}`);
 * console.log(`Total warnings: ${summary.totalWarnings}`);
 * ```
 */
export declare function createValidationSummary(results: RDFormatValidatorResult[]): {
    totalCount: number;
    validCount: number;
    invalidCount: number;
    totalErrors: number;
    totalWarnings: number;
    totalFixes: number;
    errorCodes: string[];
    warningCodes: string[];
};
/**
 * Utility function to format validation errors for display
 *
 * Formats validation errors into human-readable strings suitable for console
 * output or user interfaces. Each error includes the path, message, and
 * optional context information.
 *
 * @param errors - Array of validation errors to format
 * @param options - Formatting options
 * @returns Array of formatted error strings
 *
 * @example
 * ```typescript
 * const result = await validate(invalidData);
 * const formattedErrors = formatValidationErrors(result.errors);
 * formattedErrors.forEach(error => console.log(error));
 * ```
 */
export declare function formatValidationErrors(errors: import('./types/validation').ValidationError[], options?: {
    includeCode?: boolean;
    includeValue?: boolean;
    includeExpected?: boolean;
}): string[];
//# sourceMappingURL=index.d.ts.map