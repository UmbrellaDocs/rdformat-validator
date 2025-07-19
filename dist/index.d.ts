/**
 * RDFormat Validator - Main entry point
 * Validator for Reviewdog Diagnostic Format
 */
export * from './types/rdformat';
export * from './types/validation';
export * from './types/schema';
export * from './parser';
export declare class RDFormatValidator {
    constructor(options?: any);
}
export declare function validate(input: string | object, options?: any): Promise<any>;
export declare function validateAndFix(input: string | object, options?: any): Promise<any>;
//# sourceMappingURL=index.d.ts.map