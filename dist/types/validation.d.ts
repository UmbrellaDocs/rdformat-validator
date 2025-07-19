/**
 * Core validation interfaces for the RDFormat validator
 */
export interface ValidationError {
    path: string;
    message: string;
    code: string;
    value?: any;
    expected?: string;
}
export interface ValidationWarning {
    path: string;
    message: string;
    code: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationOptions {
    strictMode?: boolean;
    allowExtraFields?: boolean;
}
export interface ParseError {
    message: string;
    line?: number;
    column?: number;
}
export interface ParserResult {
    data: any;
    success: boolean;
    errors?: ParseError[];
}
export interface ParserOptions {
    allowComments?: boolean;
    strictMode?: boolean;
}
export interface AppliedFix {
    path: string;
    message: string;
    before: any;
    after: any;
}
export interface FixResult {
    fixed: boolean;
    data: any;
    appliedFixes: AppliedFix[];
    remainingErrors: ValidationError[];
}
export interface FixerOptions {
    strictMode?: boolean;
    fixLevel?: 'basic' | 'aggressive';
}
export interface RDFormatValidatorOptions {
    strictMode?: boolean;
    allowExtraFields?: boolean;
    fixLevel?: 'basic' | 'aggressive';
}
export interface RDFormatValidatorResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    fixedData?: any;
    appliedFixes?: AppliedFix[];
}
//# sourceMappingURL=validation.d.ts.map