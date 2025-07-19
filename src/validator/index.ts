/**
 * Core validator module for RDFormat validation
 */

import { JSONSchema, rdformatSchema } from '../types/schema';
import {
    ValidationOptions,
    ValidationResult,
    ValidationError,
    ValidationWarning
} from '../types/validation';

/**
 * Error codes for different types of validation failures
 */
export enum ValidationErrorCode {
    // Input validation errors
    NULL_INPUT = 'NULL_INPUT',
    EMPTY_INPUT = 'EMPTY_INPUT',
    INVALID_JSON = 'INVALID_JSON',

    // Type validation errors
    TYPE_MISMATCH = 'TYPE_MISMATCH',

    // Schema validation errors
    ONEOF_VALIDATION_FAILED = 'ONEOF_VALIDATION_FAILED',
    ENUM_VALIDATION_FAILED = 'ENUM_VALIDATION_FAILED',

    // String validation errors
    MIN_LENGTH_VIOLATION = 'MIN_LENGTH_VIOLATION',
    MAX_LENGTH_VIOLATION = 'MAX_LENGTH_VIOLATION',
    PATTERN_MISMATCH = 'PATTERN_MISMATCH',
    EMPTY_STRING = 'EMPTY_STRING',

    // Number validation errors
    MIN_VALUE_VIOLATION = 'MIN_VALUE_VIOLATION',
    MAX_VALUE_VIOLATION = 'MAX_VALUE_VIOLATION',
    INVALID_NUMBER = 'INVALID_NUMBER',

    // Object validation errors
    REQUIRED_PROPERTY_MISSING = 'REQUIRED_PROPERTY_MISSING',
    UNKNOWN_PROPERTY = 'UNKNOWN_PROPERTY',
    INVALID_OBJECT_STRUCTURE = 'INVALID_OBJECT_STRUCTURE',

    // Array validation errors
    INVALID_ARRAY_ITEM = 'INVALID_ARRAY_ITEM',
    EMPTY_ARRAY = 'EMPTY_ARRAY',

    // RDFormat specific errors
    INVALID_SEVERITY = 'INVALID_SEVERITY',
    INVALID_LOCATION = 'INVALID_LOCATION',
    INVALID_RANGE = 'INVALID_RANGE',
    INVALID_POSITION = 'INVALID_POSITION',
    MISSING_DIAGNOSTIC_MESSAGE = 'MISSING_DIAGNOSTIC_MESSAGE',
    MISSING_DIAGNOSTIC_LOCATION = 'MISSING_DIAGNOSTIC_LOCATION'
}

/**
 * Enhanced error reporter for detailed validation feedback
 */
export class ErrorReporter {
    private strictMode: boolean;

    constructor(strictMode: boolean = false) {
        this.strictMode = strictMode;
    }

    /**
     * Creates a detailed validation error with context
     */
    createError(
        path: string,
        code: ValidationErrorCode,
        value: any,
        context?: {
            expected?: string;
            constraint?: string | number;
            suggestion?: string;
        }
    ): ValidationError {
        const error: ValidationError = {
            path,
            code,
            value,
            message: this.getErrorMessage(code, path, value, context),
            expected: context?.expected
        };

        return error;
    }

    /**
     * Creates a validation warning
     */
    createWarning(
        path: string,
        code: ValidationErrorCode,
        message?: string
    ): ValidationWarning {
        return {
            path,
            code,
            message: message || this.getWarningMessage(code, path)
        };
    }

    /**
     * Gets a human-readable error message based on the error code
     */
    private getErrorMessage(
        code: ValidationErrorCode,
        path: string,
        value: any,
        context?: {
            expected?: string;
            constraint?: string | number;
            suggestion?: string;
        }
    ): string {
        const pathDisplay = path ? ` at '${path}'` : '';

        switch (code) {
            case ValidationErrorCode.NULL_INPUT:
                return 'Input cannot be null or undefined. Please provide valid RDFormat data.';

            case ValidationErrorCode.EMPTY_INPUT:
                return 'Input cannot be empty. Please provide valid RDFormat data.';

            case ValidationErrorCode.TYPE_MISMATCH:
                return `Expected ${context?.expected || 'different type'}${pathDisplay}, but got ${typeof value}. ${context?.suggestion || ''}`;

            case ValidationErrorCode.REQUIRED_PROPERTY_MISSING:
                const propName = path.split('.').pop() || path.split('[').pop()?.replace(']', '');
                return `Missing required property '${propName}'${pathDisplay}. This field is mandatory in RDFormat.`;

            case ValidationErrorCode.UNKNOWN_PROPERTY:
                const unknownProp = path.split('.').pop() || path.split('[').pop()?.replace(']', '');
                return `Unknown property '${unknownProp}'${pathDisplay}. This property is not part of the RDFormat specification.`;

            case ValidationErrorCode.ENUM_VALIDATION_FAILED:
                return `Invalid value '${value}'${pathDisplay}. ${context?.expected || 'Must be one of the allowed values'}.`;

            case ValidationErrorCode.MIN_LENGTH_VIOLATION:
                return `String${pathDisplay} must be at least ${context?.constraint} characters long, but got ${typeof value === 'string' ? value.length : 0} characters.`;

            case ValidationErrorCode.MAX_LENGTH_VIOLATION:
                return `String${pathDisplay} must be at most ${context?.constraint} characters long, but got ${typeof value === 'string' ? value.length : 0} characters.`;

            case ValidationErrorCode.PATTERN_MISMATCH:
                return `String${pathDisplay} does not match the required format. ${context?.expected || 'Please check the pattern requirements'}.`;

            case ValidationErrorCode.EMPTY_STRING:
                return `String${pathDisplay} cannot be empty. Please provide a non-empty value.`;

            case ValidationErrorCode.MIN_VALUE_VIOLATION:
                return `Number${pathDisplay} must be at least ${context?.constraint}, but got ${value}.`;

            case ValidationErrorCode.MAX_VALUE_VIOLATION:
                return `Number${pathDisplay} must be at most ${context?.constraint}, but got ${value}.`;

            case ValidationErrorCode.ONEOF_VALIDATION_FAILED:
                return `Value${pathDisplay} does not match any of the expected RDFormat structures. Please ensure your data follows one of the supported formats (single diagnostic, array of diagnostics, or diagnostic result).`;

            case ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE:
                return `Diagnostic${pathDisplay} is missing the required 'message' field. Every diagnostic must have a descriptive message.`;

            case ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION:
                return `Diagnostic${pathDisplay} is missing the required 'location' field. Every diagnostic must specify where the issue was found.`;

            case ValidationErrorCode.INVALID_LOCATION:
                return `Location${pathDisplay} is invalid. A location must have a 'path' field and optionally a 'range' field.`;

            case ValidationErrorCode.INVALID_RANGE:
                return `Range${pathDisplay} is invalid. A range must have a 'start' position and optionally an 'end' position.`;

            case ValidationErrorCode.INVALID_POSITION:
                return `Position${pathDisplay} is invalid. A position must have a positive integer (1-based line number) and optionally a column number.`;

            case ValidationErrorCode.INVALID_SEVERITY:
                return `Severity${pathDisplay} must be one of: UNKNOWN_SEVERITY, ERROR, WARNING, INFO. Got '${value}'.`;

            default:
                return `Validation failed${pathDisplay}: ${context?.expected || 'Invalid value'}.`;
        }
    }

    /**
     * Gets a human-readable warning message
     */
    private getWarningMessage(code: ValidationErrorCode, path: string): string {
        const pathDisplay = path ? ` at '${path}'` : '';

        switch (code) {
            case ValidationErrorCode.UNKNOWN_PROPERTY:
                const propName = path.split('.').pop() || path.split('[').pop()?.replace(']', '');
                return `Property '${propName}'${pathDisplay} is not part of the RDFormat specification but will be ignored.`;

            default:
                return `Warning${pathDisplay}: Potential issue detected.`;
        }
    }
}

export class Validator {
    private options: ValidationOptions;
    private schema: JSONSchema;
    private errorReporter: ErrorReporter;

    constructor(options: ValidationOptions = {}) {
        this.options = {
            strictMode: false,
            allowExtraFields: true,
            ...options
        };
        this.schema = rdformatSchema;
        this.errorReporter = new ErrorReporter(this.options.strictMode || false);
    }

    /**
     * Validates data against the RDFormat schema
     */
    validate(data: any): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Handle null or undefined input
        if (data === null || data === undefined) {
            errors.push(this.errorReporter.createError('', ValidationErrorCode.NULL_INPUT, data, {
                expected: 'valid RDFormat data'
            }));
            return { valid: false, errors, warnings };
        }

        // Handle empty input
        if (typeof data === 'string' && data.trim() === '') {
            errors.push(this.errorReporter.createError('', ValidationErrorCode.EMPTY_INPUT, data, {
                expected: 'non-empty RDFormat data'
            }));
            return { valid: false, errors, warnings };
        }

        // Handle empty objects
        if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
            errors.push(this.errorReporter.createError('', ValidationErrorCode.EMPTY_INPUT, data, {
                expected: 'non-empty RDFormat object'
            }));
            return { valid: false, errors, warnings };
        }

        // Handle empty arrays
        if (Array.isArray(data) && data.length === 0) {
            errors.push(this.errorReporter.createError('', ValidationErrorCode.EMPTY_ARRAY, data, {
                expected: 'non-empty array of diagnostics'
            }));
            return { valid: false, errors, warnings };
        }

        // Validate against the schema
        this.validateValue(data, this.schema, '', errors, warnings);

        // Add additional RDFormat-specific validation for better error messages
        this.addRDFormatSpecificValidation(data, '', errors, warnings);

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Performs additional edge case validation specific to RDFormat
     */
    private performEdgeCaseValidation(
        data: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Handle partial diagnostic objects
        if (this.isPartialDiagnostic(data)) {
            this.validatePartialDiagnostic(data, path, errors, warnings);
        }

        // Handle arrays of partial diagnostics
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (this.isPartialDiagnostic(data[i])) {
                    this.validatePartialDiagnostic(data[i], this.joinPath(path, i.toString()), errors, warnings);
                }
            }
        }

        // Handle diagnostic result objects
        if (this.isDiagnosticResult(data)) {
            this.validateDiagnosticResult(data, path, errors, warnings);
        }
    }

    /**
     * Checks if an object appears to be a partial diagnostic
     */
    private isPartialDiagnostic(obj: any): boolean {
        return typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            !obj.hasOwnProperty('diagnostics') && // Not a diagnostic result
            (obj.hasOwnProperty('message') ||
                obj.hasOwnProperty('location') ||
                obj.hasOwnProperty('severity') ||
                obj.hasOwnProperty('source'));
    }

    /**
     * Checks if an object appears to be a diagnostic result
     */
    private isDiagnosticResult(obj: any): boolean {
        return typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            obj.hasOwnProperty('diagnostics');
    }

    /**
     * Validates partial diagnostic objects and provides helpful error messages
     */
    private validatePartialDiagnostic(
        diagnostic: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Check for missing required fields with specific error messages
        if (!diagnostic.hasOwnProperty('message')) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'message'),
                ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                undefined,
                {
                    expected: 'string containing the diagnostic message'
                }
            ));
        }

        if (!diagnostic.hasOwnProperty('location')) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'location'),
                ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION,
                undefined,
                {
                    expected: 'object with path and optional range'
                }
            ));
        }

        // Validate location structure if present
        if (diagnostic.location && typeof diagnostic.location === 'object') {
            this.validateLocationStructure(diagnostic.location, this.joinPath(path, 'location'), errors, warnings);
        }

        // Validate severity if present
        if (diagnostic.severity && !['UNKNOWN_SEVERITY', 'ERROR', 'WARNING', 'INFO'].includes(diagnostic.severity)) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'severity'),
                ValidationErrorCode.INVALID_SEVERITY,
                diagnostic.severity,
                {
                    expected: 'one of: UNKNOWN_SEVERITY, ERROR, WARNING, INFO'
                }
            ));
        }
    }

    /**
     * Validates diagnostic result structure
     */
    private validateDiagnosticResult(
        result: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (!Array.isArray(result.diagnostics)) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'diagnostics'),
                ValidationErrorCode.TYPE_MISMATCH,
                result.diagnostics,
                {
                    expected: 'array',
                    suggestion: 'The diagnostics field must be an array of diagnostic objects.'
                }
            ));
        } else if (result.diagnostics.length === 0) {
            warnings.push(this.errorReporter.createWarning(
                this.joinPath(path, 'diagnostics'),
                ValidationErrorCode.EMPTY_ARRAY,
                'Diagnostic result contains no diagnostics. This may be intentional but is unusual.'
            ));
        }
    }

    /**
     * Validates location structure for common issues
     */
    private validateLocationStructure(
        location: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (!location.path || typeof location.path !== 'string') {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'path'),
                ValidationErrorCode.INVALID_LOCATION,
                location.path,
                {
                    expected: 'non-empty string representing the file path'
                }
            ));
        } else if (location.path.trim() === '') {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'path'),
                ValidationErrorCode.EMPTY_STRING,
                location.path,
                {
                    expected: 'non-empty file path'
                }
            ));
        }

        // Validate range if present
        if (location.range) {
            this.validateRangeStructure(location.range, this.joinPath(path, 'range'), errors, warnings);
        }
    }

    /**
     * Validates range structure for common issues
     */
    private validateRangeStructure(
        range: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (!range.start) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'start'),
                ValidationErrorCode.INVALID_RANGE,
                range.start,
                {
                    expected: 'position object with line number'
                }
            ));
        } else {
            this.validatePositionStructure(range.start, this.joinPath(path, 'start'), errors, warnings);
        }

        if (range.end) {
            this.validatePositionStructure(range.end, this.joinPath(path, 'end'), errors, warnings);
        }
    }

    /**
     * Validates position structure for common issues
     */
    private validatePositionStructure(
        position: any,
        path: string,
        errors: ValidationError[],
        _warnings: ValidationWarning[]
    ): void {
        if (typeof position.line !== 'number' || position.line < 1) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'line'),
                ValidationErrorCode.INVALID_POSITION,
                position.line,
                {
                    expected: 'positive integer (1-based line number)'
                }
            ));
        }

        if (position.column !== undefined && (typeof position.column !== 'number' || position.column < 1)) {
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'column'),
                ValidationErrorCode.INVALID_POSITION,
                position.column,
                {
                    expected: 'positive integer (1-based column number) or undefined'
                }
            ));
        }
    }

    /**
     * Validates a specific field at a given path
     */
    validateField(path: string, value: any, schema: JSONSchema): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        this.validateValue(value, schema, path, errors, warnings);

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Internal method to validate a value against a schema
     */
    private validateValue(
        value: any,
        schema: JSONSchema,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Handle oneOf schema (multiple possible formats)
        if (schema.oneOf) {
            let validationPassed = false;
            const allErrors: ValidationError[] = [];
            let bestErrors: ValidationError[] = [];
            let bestWarnings: ValidationWarning[] = [];
            let bestScore = -1;

            // Sort schemas by likelihood based on the input type
            const sortedSchemas = this.sortSchemasByLikelihood(schema.oneOf, value);



            for (let i = 0; i < sortedSchemas.length; i++) {
                const subSchema = sortedSchemas[i];
                const subErrors: ValidationError[] = [];
                const subWarnings: ValidationWarning[] = [];

                this.validateValue(value, subSchema, path, subErrors, subWarnings);

                if (subErrors.length === 0) {
                    validationPassed = true;
                    warnings.push(...subWarnings);
                    break;
                } else {
                    allErrors.push(...subErrors);
                    // Score based on how well the schema matches (fewer errors = better match)
                    const score = this.calculateSchemaMatchScore(value, subSchema, subErrors);
                    if (bestScore === -1 || score > bestScore) {
                        bestScore = score;
                        bestErrors = [...subErrors];
                        bestWarnings = [...subWarnings];
                    }
                }
            }

            if (!validationPassed) {
                // Add the most specific errors instead of a generic oneOf error
                errors.push(...bestErrors);
                warnings.push(...bestWarnings);
            }
            return;
        }

        // Handle type validation
        if (schema.type) {
            if (!this.validateType(value, schema.type)) {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.TYPE_MISMATCH, value, {
                    expected: schema.type,
                    suggestion: `Please provide a ${schema.type} value.`
                }));
                return;
            }
        }

        // Handle enum validation
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(this.errorReporter.createError(path, ValidationErrorCode.ENUM_VALIDATION_FAILED, value, {
                expected: `one of: ${schema.enum.join(', ')}`
            }));
            return;
        }

        // Handle string constraints
        if (schema.type === 'string' && typeof value === 'string') {
            // Check for empty strings first (more specific than minLength)
            if (schema.minLength !== undefined && schema.minLength > 0 && value.trim() === '') {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.EMPTY_STRING, value, {
                    expected: 'non-empty string'
                }));
            } else if (schema.minLength !== undefined && value.length < schema.minLength) {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.MIN_LENGTH_VIOLATION, value, {
                    constraint: schema.minLength,
                    expected: `string with minimum length ${schema.minLength}`
                }));
            }

            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.MAX_LENGTH_VIOLATION, value, {
                    constraint: schema.maxLength,
                    expected: `string with maximum length ${schema.maxLength}`
                }));
            }

            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.PATTERN_MISMATCH, value, {
                    expected: `string matching pattern: ${schema.pattern}`
                }));
            }
        }

        // Handle number constraints
        if (schema.type === 'number' && typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.MIN_VALUE_VIOLATION, value, {
                    constraint: schema.minimum,
                    expected: `number >= ${schema.minimum}`
                }));
            }

            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(this.errorReporter.createError(path, ValidationErrorCode.MAX_VALUE_VIOLATION, value, {
                    constraint: schema.maximum,
                    expected: `number <= ${schema.maximum}`
                }));
            }
        }

        // Handle object validation
        if (schema.type === 'object' && typeof value === 'object' && value !== null) {
            this.validateObject(value, schema, path, errors, warnings);
        }

        // Handle array validation
        if (schema.type === 'array' && Array.isArray(value)) {
            this.validateArray(value, schema, path, errors, warnings);
        }
    }

    /**
     * Validates an object against an object schema
     */
    private validateObject(
        obj: any,
        schema: JSONSchema,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Check required properties
        if (schema.required) {
            for (const requiredProp of schema.required) {
                if (!(requiredProp in obj)) {
                    errors.push(this.errorReporter.createError(
                        this.joinPath(path, requiredProp),
                        ValidationErrorCode.REQUIRED_PROPERTY_MISSING,
                        undefined,
                        {
                            expected: `object with required property '${requiredProp}'`
                        }
                    ));
                }
            }
        }

        // Validate properties
        if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                if (propName in obj) {
                    this.validateValue(
                        obj[propName],
                        propSchema,
                        this.joinPath(path, propName),
                        errors,
                        warnings
                    );
                }
            }
        }

        // Handle extra properties
        if (schema.properties && (schema.additionalProperties === false || !this.options.allowExtraFields)) {
            const allowedProps = new Set(Object.keys(schema.properties));
            for (const propName of Object.keys(obj)) {
                if (!allowedProps.has(propName)) {
                    if (this.options.strictMode) {
                        errors.push(this.errorReporter.createError(
                            this.joinPath(path, propName),
                            ValidationErrorCode.UNKNOWN_PROPERTY,
                            obj[propName],
                            {
                                expected: 'property not present'
                            }
                        ));
                    } else {
                        warnings.push(this.errorReporter.createWarning(
                            this.joinPath(path, propName),
                            ValidationErrorCode.UNKNOWN_PROPERTY
                        ));
                    }
                }
            }
        }
    }

    /**
     * Validates an array against an array schema
     */
    private validateArray(
        arr: any[],
        schema: JSONSchema,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (schema.items) {
            for (let i = 0; i < arr.length; i++) {
                this.validateValue(
                    arr[i],
                    schema.items,
                    this.joinPath(path, i.toString()),
                    errors,
                    warnings
                );
            }
        }
    }

    /**
     * Validates the type of a value
     */
    private validateType(value: any, expectedType: string): boolean {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array':
                return Array.isArray(value);
            case 'null':
                return value === null;
            default:
                return false;
        }
    }

    /**
     * Joins path segments for error reporting
     */
    private joinPath(basePath: string, segment: string): string {
        if (!basePath) return segment;
        if (/^\d+$/.test(segment)) {
            return `${basePath}[${segment}]`;
        }
        return `${basePath}.${segment}`;
    }

    /**
     * Adds RDFormat-specific validation for better error messages
     */
    private addRDFormatSpecificValidation(
        data: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Only add specific validation if we don't already have errors for the same issues
        const _existingErrorPaths = new Set(errors.map(e => e.path));

        // Handle single diagnostic objects
        if (this.isPartialDiagnostic(data)) {
            // Replace generic REQUIRED_PROPERTY_MISSING with specific diagnostic errors
            if (!data.hasOwnProperty('message')) {
                // Remove generic error and add specific one
                const genericIndex = errors.findIndex(e => e.path === this.joinPath(path, 'message') && e.code === ValidationErrorCode.REQUIRED_PROPERTY_MISSING);
                if (genericIndex >= 0) {
                    errors.splice(genericIndex, 1);
                }
                errors.push(this.errorReporter.createError(
                    this.joinPath(path, 'message'),
                    ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE,
                    undefined,
                    {
                        expected: 'string containing the diagnostic message'
                    }
                ));
            }

            if (!data.hasOwnProperty('location')) {
                // Remove generic error and add specific one
                const genericIndex = errors.findIndex(e => e.path === this.joinPath(path, 'location') && e.code === ValidationErrorCode.REQUIRED_PROPERTY_MISSING);
                if (genericIndex >= 0) {
                    errors.splice(genericIndex, 1);
                }
                errors.push(this.errorReporter.createError(
                    this.joinPath(path, 'location'),
                    ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION,
                    undefined,
                    {
                        expected: 'object with path and optional range'
                    }
                ));
            }

            // Add specific validation for diagnostic fields
            if (data.location && typeof data.location === 'object') {
                this.addLocationSpecificValidation(data.location, this.joinPath(path, 'location'), errors, warnings);
            }

            // Add specific severity validation
            if (data.severity && !['UNKNOWN_SEVERITY', 'ERROR', 'WARNING', 'INFO'].includes(data.severity)) {
                // Replace generic enum error with specific severity error
                const enumErrorIndex = errors.findIndex(e => e.path === this.joinPath(path, 'severity') && e.code === ValidationErrorCode.ENUM_VALIDATION_FAILED);
                if (enumErrorIndex >= 0) {
                    errors.splice(enumErrorIndex, 1);
                }
                errors.push(this.errorReporter.createError(
                    this.joinPath(path, 'severity'),
                    ValidationErrorCode.INVALID_SEVERITY,
                    data.severity,
                    {
                        expected: 'one of: UNKNOWN_SEVERITY, ERROR, WARNING, INFO'
                    }
                ));
            }
        }

        // Handle arrays of diagnostics
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                if (this.isPartialDiagnostic(data[i])) {
                    this.addRDFormatSpecificValidation(data[i], this.joinPath(path, i.toString()), errors, warnings);
                }
            }
        }

        // Handle diagnostic result objects
        if (this.isDiagnosticResult(data)) {
            if (Array.isArray(data.diagnostics)) {
                for (let i = 0; i < data.diagnostics.length; i++) {
                    this.addRDFormatSpecificValidation(data.diagnostics[i], this.joinPath(path, `diagnostics[${i}]`), errors, warnings);
                }

                // Add warning for empty diagnostics array
                if (data.diagnostics.length === 0) {
                    warnings.push(this.errorReporter.createWarning(
                        this.joinPath(path, 'diagnostics'),
                        ValidationErrorCode.EMPTY_ARRAY,
                        'Diagnostic result contains no diagnostics. This may be intentional but is unusual.'
                    ));
                }
            }
        }
    }

    /**
     * Adds location-specific validation for better error messages
     */
    private addLocationSpecificValidation(
        location: any,
        path: string,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Add specific validation for ranges and positions
        if (location.range && typeof location.range === 'object') {
            if (!location.range.start) {
                // Replace generic error with specific range error
                const genericIndex = errors.findIndex(e => e.path === this.joinPath(path, 'range.start') && e.code === ValidationErrorCode.REQUIRED_PROPERTY_MISSING);
                if (genericIndex >= 0) {
                    errors.splice(genericIndex, 1);
                }
                errors.push(this.errorReporter.createError(
                    this.joinPath(path, 'range.start'),
                    ValidationErrorCode.INVALID_RANGE,
                    location.range.start,
                    {
                        expected: 'position object with line number'
                    }
                ));
            } else {
                this.addPositionSpecificValidation(location.range.start, this.joinPath(path, 'range.start'), errors, warnings);
            }

            if (location.range.end) {
                this.addPositionSpecificValidation(location.range.end, this.joinPath(path, 'range.end'), errors, warnings);
            }
        }
    }

    /**
     * Adds position-specific validation for better error messages
     */
    private addPositionSpecificValidation(
        position: any,
        path: string,
        errors: ValidationError[],
        _warnings: ValidationWarning[]
    ): void {
        if (typeof position.line !== 'number' || position.line < 1) {
            // Replace generic error with specific position error
            const minValueIndex = errors.findIndex(e => e.path === this.joinPath(path, 'line') && e.code === ValidationErrorCode.MIN_VALUE_VIOLATION);
            if (minValueIndex >= 0) {
                errors.splice(minValueIndex, 1);
            }
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'line'),
                ValidationErrorCode.INVALID_POSITION,
                position.line,
                {
                    expected: 'positive integer (1-based line number)'
                }
            ));
        }

        if (position.column !== undefined && (typeof position.column !== 'number' || position.column < 1)) {
            // Replace generic error with specific position error
            const minValueIndex = errors.findIndex(e => e.path === this.joinPath(path, 'column') && e.code === ValidationErrorCode.MIN_VALUE_VIOLATION);
            if (minValueIndex >= 0) {
                errors.splice(minValueIndex, 1);
            }
            errors.push(this.errorReporter.createError(
                this.joinPath(path, 'column'),
                ValidationErrorCode.INVALID_POSITION,
                position.column,
                {
                    expected: 'positive integer (1-based column number) or undefined'
                }
            ));
        }
    }

    /**
     * Updates validation options
     */
    setOptions(options: ValidationOptions): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Gets the current schema
     */
    getSchema(): JSONSchema {
        return this.schema;
    }

    /**
     * Sorts schemas by likelihood of matching the input value
     */
    private sortSchemasByLikelihood(schemas: JSONSchema[], value: any): JSONSchema[] {
        return schemas.sort((a, b) => {
            const scoreA = this.getSchemaLikelihoodScore(a, value);
            const scoreB = this.getSchemaLikelihoodScore(b, value);
            return scoreB - scoreA; // Higher score first
        });
    }

    /**
     * Calculates a likelihood score for how well a schema might match a value
     */
    private getSchemaLikelihoodScore(schema: JSONSchema, value: any): number {
        let score = 0;

        // Type matching
        if (schema.type) {
            if (this.validateType(value, schema.type)) {
                score += 10;
            } else {
                return 0; // If type doesn't match, this schema is unlikely
            }
        }

        // Object structure matching
        if (schema.type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (schema.required) {
                const requiredProps = schema.required;
                const valueProps = Object.keys(value);
                const matchingRequired = requiredProps.filter(prop => valueProps.includes(prop));

                // Strong bonus for matching all required properties
                if (matchingRequired.length === requiredProps.length) {
                    score += 50;
                } else {
                    score += matchingRequired.length * 5;
                    // Heavy penalty for missing required properties
                    score -= (requiredProps.length - matchingRequired.length) * 20;
                }
            }

            if (schema.properties) {
                const schemaProps = Object.keys(schema.properties);
                const valueProps = Object.keys(value);
                const matchingProps = schemaProps.filter(prop => valueProps.includes(prop));
                score += matchingProps.length * 2;

                // Bonus for having properties that match the schema structure
                const propertyMatchRatio = matchingProps.length / Math.max(valueProps.length, 1);
                score += propertyMatchRatio * 10;
            }

            // Special handling for diagnostic-like objects
            if (value.message && value.location && schema.required?.includes('message') && schema.required?.includes('location')) {
                score += 30; // Strong bonus for diagnostic structure
            }

            // Penalty for diagnostic result structure when we have diagnostic fields
            if (schema.required?.includes('diagnostics') && (value.message || value.location)) {
                score -= 25; // This looks more like a single diagnostic
            }
        }

        // Array matching
        if (schema.type === 'array' && Array.isArray(value)) {
            score += 15;
            if (value.length > 0 && schema.items) {
                // Check if first item matches the schema
                const firstItemScore = this.getSchemaLikelihoodScore(schema.items, value[0]);
                score += firstItemScore * 0.3;
            }
        }

        return Math.max(0, score);
    }

    /**
     * Calculates how well a schema matches based on validation errors
     */
    private calculateSchemaMatchScore(value: any, schema: JSONSchema, errors: ValidationError[]): number {
        let score = 100; // Start with perfect score

        // Penalty for each error
        score -= errors.length * 5;

        // Heavy penalty for type mismatches (these are fundamental)
        const typeMismatchErrors = errors.filter(e => e.code === ValidationErrorCode.TYPE_MISMATCH);
        score -= typeMismatchErrors.length * 50;

        // Heavy penalty for missing required properties that suggest wrong schema
        const missingPropErrors = errors.filter(e => e.code === ValidationErrorCode.REQUIRED_PROPERTY_MISSING);
        score -= missingPropErrors.length * 30;

        // Less penalty for validation errors within the correct structure
        const structuralErrors = errors.filter(e =>
            e.code === ValidationErrorCode.MIN_LENGTH_VIOLATION ||
            e.code === ValidationErrorCode.MAX_LENGTH_VIOLATION ||
            e.code === ValidationErrorCode.PATTERN_MISMATCH ||
            e.code === ValidationErrorCode.EMPTY_STRING ||
            e.code === ValidationErrorCode.MIN_VALUE_VIOLATION ||
            e.code === ValidationErrorCode.MAX_VALUE_VIOLATION ||
            e.code === ValidationErrorCode.ENUM_VALIDATION_FAILED ||
            e.code === ValidationErrorCode.INVALID_POSITION ||
            e.code === ValidationErrorCode.INVALID_RANGE ||
            e.code === ValidationErrorCode.INVALID_LOCATION ||
            e.code === ValidationErrorCode.INVALID_SEVERITY
        );
        score += structuralErrors.length * 2; // Reduce penalty for these

        // Bonus for schemas that match the input structure better
        if (schema.type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (schema.required?.includes('message') && value.message) {
                score += 10;
            }
            if (schema.required?.includes('location') && value.location) {
                score += 10;
            }
            if (schema.required?.includes('diagnostics') && !value.diagnostics) {
                score -= 20; // This is probably not a diagnostic result
            }
        }

        return Math.max(0, score);
    }
}

// Export convenience functions
export function validate(data: any, options?: ValidationOptions): ValidationResult {
    const validator = new Validator(options);
    return validator.validate(data);
}

export function validateField(path: string, value: any, schema: JSONSchema, options?: ValidationOptions): ValidationResult {
    const validator = new Validator(options);
    return validator.validateField(path, value, schema);
}