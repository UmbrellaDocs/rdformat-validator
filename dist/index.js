"use strict";
/**
 * RDFormat Validator - Main entry point
 * Validator for Reviewdog Diagnostic Format
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFormatValidator = void 0;
exports.validate = validate;
exports.validateAndFix = validateAndFix;
exports.isValidRDFormat = isValidRDFormat;
exports.getValidationErrors = getValidationErrors;
exports.validateBatch = validateBatch;
exports.validateAndFixBatch = validateAndFixBatch;
exports.createValidationSummary = createValidationSummary;
exports.formatValidationErrors = formatValidationErrors;
// Export all types and interfaces
__exportStar(require("./types/rdformat"), exports);
__exportStar(require("./types/validation"), exports);
__exportStar(require("./types/schema"), exports);
// Export parser module
__exportStar(require("./parser"), exports);
// Export validator module
__exportStar(require("./validator"), exports);
// Export fixer module
__exportStar(require("./fixer"), exports);
// Export CLI module
__exportStar(require("./cli"), exports);
// Import required modules
const parser_1 = require("./parser");
const validator_1 = require("./validator");
const fixer_1 = require("./fixer");
const schema_1 = require("./types/schema");
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
class RDFormatValidator {
    /**
     * Creates a new RDFormat validator instance
     * @param options - Configuration options for the validator
     * @param options.strictMode - Enable strict validation mode with additional checks
     * @param options.allowExtraFields - Allow extra fields not defined in the RDFormat specification
     * @param options.fixLevel - Level of automatic fixing: 'basic' for safe fixes, 'aggressive' for more extensive fixes
     */
    constructor(options = {}) {
        // Set default options
        this.options = {
            strictMode: false,
            allowExtraFields: true,
            fixLevel: 'basic',
            ...options
        };
        // Initialize components with appropriate options
        this.parser = new parser_1.Parser({
            strictMode: this.options.strictMode
        });
        this.validator = new validator_1.Validator({
            strictMode: this.options.strictMode,
            allowExtraFields: this.options.allowExtraFields
        });
        this.fixer = new fixer_1.Fixer({
            strictMode: this.options.strictMode,
            fixLevel: this.options.fixLevel
        });
    }
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
    async validateString(input, fix = false) {
        try {
            // Parse the input string
            const parseResult = this.parser.parseString(input);
            if (!parseResult.success) {
                // Return parsing errors as validation errors
                return {
                    valid: false,
                    errors: parseResult.errors?.map(parseError => ({
                        path: '',
                        message: parseError.message,
                        code: 'PARSE_ERROR',
                        value: input,
                        expected: 'valid JSON'
                    })) || [],
                    warnings: []
                };
            }
            // Validate the parsed data
            return this.validateObject(parseResult.data, fix);
        }
        catch (error) {
            // Handle unexpected errors
            return {
                valid: false,
                errors: [{
                        path: '',
                        message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        code: 'UNEXPECTED_ERROR',
                        value: input
                    }],
                warnings: []
            };
        }
    }
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
    async validateFile(filePath, fix = false) {
        try {
            // Parse the file
            const parseResult = await this.parser.parseFile(filePath);
            if (!parseResult.success) {
                // Return parsing errors as validation errors
                return {
                    valid: false,
                    errors: parseResult.errors?.map(parseError => ({
                        path: '',
                        message: parseError.message,
                        code: 'PARSE_ERROR',
                        value: filePath,
                        expected: 'valid JSON file'
                    })) || [],
                    warnings: []
                };
            }
            // Validate the parsed data
            return this.validateObject(parseResult.data, fix);
        }
        catch (error) {
            // Handle unexpected errors
            return {
                valid: false,
                errors: [{
                        path: '',
                        message: `Unexpected error during file validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        code: 'UNEXPECTED_ERROR',
                        value: filePath
                    }],
                warnings: []
            };
        }
    }
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
    validateObject(data, fix = false) {
        try {
            // Validate the data
            const validationResult = this.validator.validate(data);
            // If fixing is not requested or validation passed, return the result
            if (!fix || validationResult.valid) {
                return {
                    valid: validationResult.valid,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings
                };
            }
            // Attempt to fix the errors
            const fixResult = this.fixer.fix(data, validationResult);
            // Re-validate the fixed data to get the final result
            const finalValidationResult = this.validator.validate(fixResult.data);
            return {
                valid: finalValidationResult.valid,
                errors: finalValidationResult.errors,
                warnings: finalValidationResult.warnings,
                fixedData: fixResult.fixed ? fixResult.data : undefined,
                appliedFixes: fixResult.appliedFixes.length > 0 ? fixResult.appliedFixes : undefined
            };
        }
        catch (error) {
            // Handle unexpected errors
            return {
                valid: false,
                errors: [{
                        path: '',
                        message: `Unexpected error during object validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        code: 'UNEXPECTED_ERROR',
                        value: data
                    }],
                warnings: []
            };
        }
    }
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
    getSchema() {
        return schema_1.rdformatSchema;
    }
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
    setOptions(options) {
        // Update internal options
        this.options = {
            ...this.options,
            ...options
        };
        // Recreate components with new options
        this.parser = new parser_1.Parser({
            strictMode: this.options.strictMode
        });
        this.validator = new validator_1.Validator({
            strictMode: this.options.strictMode,
            allowExtraFields: this.options.allowExtraFields
        });
        this.fixer = new fixer_1.Fixer({
            strictMode: this.options.strictMode,
            fixLevel: this.options.fixLevel
        });
    }
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
    getOptions() {
        return { ...this.options };
    }
}
exports.RDFormatValidator = RDFormatValidator;
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
async function validate(input, options = {}) {
    const validator = new RDFormatValidator(options);
    if (typeof input === 'string') {
        return validator.validateString(input, false);
    }
    else {
        return Promise.resolve(validator.validateObject(input, false));
    }
}
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
async function validateAndFix(input, options = {}) {
    const validator = new RDFormatValidator(options);
    if (typeof input === 'string') {
        return validator.validateString(input, true);
    }
    else {
        return Promise.resolve(validator.validateObject(input, true));
    }
}
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
async function isValidRDFormat(input, options = {}) {
    const result = await validate(input, options);
    return result.valid;
}
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
async function getValidationErrors(input, options = {}) {
    const result = await validate(input, options);
    return result.errors;
}
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
async function validateBatch(inputs, options = {}) {
    const validator = new RDFormatValidator(options);
    const promises = inputs.map(input => {
        if (typeof input === 'string') {
            return validator.validateString(input, false);
        }
        else {
            return Promise.resolve(validator.validateObject(input, false));
        }
    });
    return Promise.all(promises);
}
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
async function validateAndFixBatch(inputs, options = {}) {
    const validator = new RDFormatValidator(options);
    const promises = inputs.map(input => {
        if (typeof input === 'string') {
            return validator.validateString(input, true);
        }
        else {
            return Promise.resolve(validator.validateObject(input, true));
        }
    });
    return Promise.all(promises);
}
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
function createValidationSummary(results) {
    const summary = {
        totalCount: results.length,
        validCount: 0,
        invalidCount: 0,
        totalErrors: 0,
        totalWarnings: 0,
        totalFixes: 0,
        errorCodes: [],
        warningCodes: []
    };
    const errorCodeSet = new Set();
    const warningCodeSet = new Set();
    for (const result of results) {
        if (result.valid) {
            summary.validCount++;
        }
        else {
            summary.invalidCount++;
        }
        summary.totalErrors += result.errors.length;
        summary.totalWarnings += result.warnings.length;
        if (result.appliedFixes) {
            summary.totalFixes += result.appliedFixes.length;
        }
        // Collect unique error codes
        for (const error of result.errors) {
            errorCodeSet.add(error.code);
        }
        // Collect unique warning codes
        for (const warning of result.warnings) {
            warningCodeSet.add(warning.code);
        }
    }
    summary.errorCodes = Array.from(errorCodeSet).sort();
    summary.warningCodes = Array.from(warningCodeSet).sort();
    return summary;
}
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
function formatValidationErrors(errors, options = {}) {
    const { includeCode = true, includeValue = false, includeExpected = true } = options;
    return errors.map(error => {
        let formatted = error.path ? `${error.path}: ${error.message}` : error.message;
        if (includeCode && error.code) {
            formatted += ` (${error.code})`;
        }
        if (includeExpected && error.expected) {
            formatted += ` - Expected: ${error.expected}`;
        }
        if (includeValue && error.value !== undefined) {
            const valueStr = typeof error.value === 'string'
                ? `"${error.value}"`
                : JSON.stringify(error.value);
            formatted += ` - Got: ${valueStr}`;
        }
        return formatted;
    });
}
//# sourceMappingURL=index.js.map