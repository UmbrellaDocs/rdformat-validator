/**
 * Core validation interfaces for the RDFormat validator
 */

/**
 * Represents a validation error found during RDFormat validation
 */
export interface ValidationError {
  /** JSON path to the location of the error in the input data */
  path: string;
  /** Human-readable description of the validation error */
  message: string;
  /** Machine-readable error code for programmatic handling */
  code: string;
  /** The actual value that caused the validation error */
  value?: any;
  /** Description of the expected value or format */
  expected?: string;
}

/**
 * Represents a validation warning (non-critical issue) found during validation
 */
export interface ValidationWarning {
  /** JSON path to the location of the warning in the input data */
  path: string;
  /** Human-readable description of the validation warning */
  message: string;
  /** Machine-readable warning code for programmatic handling */
  code: string;
}

/**
 * Result of a validation operation containing errors and warnings
 */
export interface ValidationResult {
  /** Whether the validation passed without errors */
  valid: boolean;
  /** Array of validation errors found */
  errors: ValidationError[];
  /** Array of validation warnings found */
  warnings: ValidationWarning[];
}

/**
 * Configuration options for the validator
 */
export interface ValidationOptions {
  /** Enable strict validation mode with additional checks */
  strictMode?: boolean;
  /** Allow extra fields not defined in the RDFormat specification */
  allowExtraFields?: boolean;
}

/**
 * Represents an error that occurred during JSON parsing
 */
export interface ParseError {
  /** Description of the parsing error */
  message: string;
  /** Line number where the error occurred (if available) */
  line?: number;
  /** Column number where the error occurred (if available) */
  column?: number;
}

/**
 * Result of a parsing operation
 */
export interface ParserResult {
  /** The parsed data object (if parsing succeeded) */
  data: any;
  /** Whether the parsing operation was successful */
  success: boolean;
  /** Array of parsing errors (if parsing failed) */
  errors?: ParseError[];
}

/**
 * Configuration options for the parser
 */
export interface ParserOptions {
  /** Allow JSON comments in the input */
  allowComments?: boolean;
  /** Enable strict parsing mode */
  strictMode?: boolean;
}

/**
 * Represents a fix that was applied to correct a validation error
 */
export interface AppliedFix {
  /** JSON path where the fix was applied */
  path: string;
  /** Description of what was fixed */
  message: string;
  /** The original value before the fix */
  before: any;
  /** The new value after the fix */
  after: any;
}

/**
 * Result of an automatic fixing operation
 */
export interface FixResult {
  /** Whether any fixes were successfully applied */
  fixed: boolean;
  /** The data with fixes applied */
  data: any;
  /** Array of fixes that were applied */
  appliedFixes: AppliedFix[];
  /** Array of errors that could not be automatically fixed */
  remainingErrors: ValidationError[];
}

/**
 * Configuration options for the fixer
 */
export interface FixerOptions {
  /** Enable strict fixing mode */
  strictMode?: boolean;
  /** Level of fixing to apply: 'basic' for safe fixes, 'aggressive' for more extensive fixes */
  fixLevel?: 'basic' | 'aggressive';
}

/**
 * Configuration options for the main RDFormat validator
 */
export interface RDFormatValidatorOptions {
  /** Enable strict validation mode with additional checks */
  strictMode?: boolean;
  /** Allow extra fields not defined in the RDFormat specification */
  allowExtraFields?: boolean;
  /** Level of automatic fixing to apply: 'basic' for safe fixes, 'aggressive' for more extensive fixes */
  fixLevel?: 'basic' | 'aggressive';
}

/**
 * Complete result of an RDFormat validation operation, including optional fix information
 */
export interface RDFormatValidatorResult {
  /** Whether the validation passed without errors */
  valid: boolean;
  /** Array of validation errors found */
  errors: ValidationError[];
  /** Array of validation warnings found */
  warnings: ValidationWarning[];
  /** The corrected data (only present if fixes were applied and successful) */
  fixedData?: any;
  /** Array of fixes that were applied (only present if fixes were requested and applied) */
  appliedFixes?: AppliedFix[];
}