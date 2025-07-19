/**
 * RDFormat Validator - Main entry point
 * Validator for Reviewdog Diagnostic Format
 */
export * from './types/rdformat';
export * from './types/validation';
export * from './types/schema';
export * from './parser';
export * from './validator';
export * from './fixer';
import { RDFormatValidatorOptions, RDFormatValidatorResult } from './types/validation';
import { JSONSchema } from './types/schema';
/**
 * Main RDFormat Validator class providing comprehensive validation functionality
 */
export declare class RDFormatValidator {
    private parser;
    private validator;
    private fixer;
    private options;
    constructor(options?: RDFormatValidatorOptions);
    /**
     * Validates a JSON string against the RDFormat specification
     * @param input - JSON string to validate
     * @param fix - Whether to attempt automatic fixing of errors
     * @returns Promise resolving to validation result
     */
    validateString(input: string, fix?: boolean): Promise<RDFormatValidatorResult>;
    /**
     * Validates a file containing RDFormat JSON data
     * @param filePath - Path to the file to validate
     * @param fix - Whether to attempt automatic fixing of errors
     * @returns Promise resolving to validation result
     */
    validateFile(filePath: string, fix?: boolean): Promise<RDFormatValidatorResult>;
    /**
     * Validates a JavaScript object against the RDFormat specification
     * @param data - Object to validate
     * @param fix - Whether to attempt automatic fixing of errors
     * @returns Validation result
     */
    validateObject(data: any, fix?: boolean): RDFormatValidatorResult;
    /**
     * Gets the JSON schema used for validation
     * @returns The RDFormat JSON schema
     */
    getSchema(): JSONSchema;
    /**
     * Updates the validator options
     * @param options - New options to apply
     */
    setOptions(options: RDFormatValidatorOptions): void;
    /**
     * Gets the current validator options
     * @returns Current options
     */
    getOptions(): Required<RDFormatValidatorOptions>;
}
/**
 * Convenience function for simple validation
 * @param input - String or object to validate
 * @param options - Validation options
 * @returns Promise resolving to validation result
 */
export declare function validate(input: string | object, options?: RDFormatValidatorOptions): Promise<RDFormatValidatorResult>;
/**
 * Convenience function for validation with automatic fixing
 * @param input - String or object to validate and fix
 * @param options - Validation options
 * @returns Promise resolving to validation result with fixes applied
 */
export declare function validateAndFix(input: string | object, options?: RDFormatValidatorOptions): Promise<RDFormatValidatorResult>;
//# sourceMappingURL=index.d.ts.map