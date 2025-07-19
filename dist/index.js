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
// Import required modules
const parser_1 = require("./parser");
const validator_1 = require("./validator");
const fixer_1 = require("./fixer");
const schema_1 = require("./types/schema");
/**
 * Main RDFormat Validator class providing comprehensive validation functionality
 */
class RDFormatValidator {
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
     * @param input - JSON string to validate
     * @param fix - Whether to attempt automatic fixing of errors
     * @returns Promise resolving to validation result
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
     * @param filePath - Path to the file to validate
     * @param fix - Whether to attempt automatic fixing of errors
     * @returns Promise resolving to validation result
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
     * @param data - Object to validate
     * @param fix - Whether to attempt automatic fixing of errors
     * @returns Validation result
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
     * @returns The RDFormat JSON schema
     */
    getSchema() {
        return schema_1.rdformatSchema;
    }
    /**
     * Updates the validator options
     * @param options - New options to apply
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
     * @returns Current options
     */
    getOptions() {
        return { ...this.options };
    }
}
exports.RDFormatValidator = RDFormatValidator;
/**
 * Convenience function for simple validation
 * @param input - String or object to validate
 * @param options - Validation options
 * @returns Promise resolving to validation result
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
 * @param input - String or object to validate and fix
 * @param options - Validation options
 * @returns Promise resolving to validation result with fixes applied
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
//# sourceMappingURL=index.js.map