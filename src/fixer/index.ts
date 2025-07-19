/**
 * Fixer module for automatically correcting common RDFormat validation errors
 */

import {
    ValidationError,
    ValidationResult,
    FixerOptions,
    FixResult,
    AppliedFix
} from '../types/validation';
import { ValidationErrorCode } from '../validator/index';

/**
 * Fixer class that can automatically correct common validation errors
 */
export class Fixer {
    private options: FixerOptions;

    constructor(options: FixerOptions = {}) {
        this.options = {
            strictMode: false,
            fixLevel: 'basic',
            ...options
        };
    }

    /**
     * Attempts to fix validation errors in the provided data
     */
    fix(data: any, validationResult: ValidationResult): FixResult {
        const appliedFixes: AppliedFix[] = [];
        const remainingErrors: ValidationError[] = [];
        const fixedData = this.deepClone(data);

        // Process each validation error and attempt to fix it
        for (const error of validationResult.errors) {
            const fixResult = this.applyFix(fixedData, error);

            if (fixResult) {
                appliedFixes.push(fixResult);
            } else {
                remainingErrors.push(error);
            }
        }

        return {
            fixed: appliedFixes.length > 0,
            data: fixedData,
            appliedFixes,
            remainingErrors
        };
    }

    /**
     * Checks if a specific validation error can be automatically fixed
     */
    canFix(error: ValidationError): boolean {
        switch (error.code) {
            // Type coercion fixes
            case ValidationErrorCode.TYPE_MISMATCH:
                return this.canFixTypeMismatch(error);

            // Missing field fixes
            case ValidationErrorCode.REQUIRED_PROPERTY_MISSING:
                return this.canFixMissingProperty(error);

            // String fixes
            case ValidationErrorCode.EMPTY_STRING:
                return this.options.fixLevel === 'aggressive';

            // Number fixes
            case ValidationErrorCode.MIN_VALUE_VIOLATION:
            case ValidationErrorCode.MAX_VALUE_VIOLATION:
                return this.options.fixLevel === 'aggressive';

            // RDFormat specific fixes
            case ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE:
            case ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION:
                return true;

            case ValidationErrorCode.INVALID_SEVERITY:
                return true;

            case ValidationErrorCode.INVALID_POSITION:
                return this.options.fixLevel === 'aggressive';

            default:
                return false;
        }
    }

    /**
     * Applies a fix for a specific validation error
     */
    applyFix(data: any, error: ValidationError): AppliedFix | null {
        if (!this.canFix(error)) {
            return null;
        }

        const pathParts = this.parsePath(error.path);
        const before = this.getValueAtPath(data, pathParts);

        let fixed = false;
        let after: any;

        switch (error.code) {
            case ValidationErrorCode.TYPE_MISMATCH:
                after = this.fixTypeMismatch(data, pathParts, error);
                fixed = after !== undefined;
                break;

            case ValidationErrorCode.REQUIRED_PROPERTY_MISSING:
            case ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE:
            case ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION:
                after = this.fixMissingProperty(data, pathParts, error);
                fixed = after !== undefined;
                break;

            case ValidationErrorCode.EMPTY_STRING:
                after = this.fixEmptyString(data, pathParts, error);
                fixed = after !== undefined;
                break;

            case ValidationErrorCode.MIN_VALUE_VIOLATION:
            case ValidationErrorCode.MAX_VALUE_VIOLATION:
                after = this.fixNumberViolation(data, pathParts, error);
                fixed = after !== undefined;
                break;

            case ValidationErrorCode.INVALID_SEVERITY:
                after = this.fixInvalidSeverity(data, pathParts, error);
                fixed = after !== undefined;
                break;

            case ValidationErrorCode.INVALID_POSITION:
                after = this.fixInvalidPosition(data, pathParts, error);
                fixed = after !== undefined;
                break;

            default:
                return null;
        }

        if (fixed) {
            return {
                path: error.path,
                message: this.getFixMessage(error.code, before, after),
                before,
                after
            };
        }

        return null;
    }

    /**
     * Fixes type mismatches through coercion
     */
    private fixTypeMismatch(data: any, pathParts: string[], error: ValidationError): any {
        const currentValue = this.getValueAtPath(data, pathParts);
        const expectedType = this.extractExpectedType(error.expected || '');

        let fixedValue: any;

        switch (expectedType) {
            case 'string':
                if (typeof currentValue === 'number' || typeof currentValue === 'boolean') {
                    fixedValue = String(currentValue);
                } else if (currentValue === null || currentValue === undefined) {
                    fixedValue = '';
                }
                break;

            case 'number':
                if (typeof currentValue === 'string' && !isNaN(Number(currentValue))) {
                    fixedValue = Number(currentValue);
                } else if (typeof currentValue === 'boolean') {
                    fixedValue = currentValue ? 1 : 0;
                }
                break;

            case 'boolean':
                if (typeof currentValue === 'string') {
                    fixedValue = currentValue.toLowerCase() === 'true';
                } else if (typeof currentValue === 'number') {
                    fixedValue = currentValue !== 0;
                }
                break;

            case 'array':
                if (!Array.isArray(currentValue) && currentValue !== null && currentValue !== undefined) {
                    fixedValue = [currentValue];
                }
                break;

            case 'object':
                if (typeof currentValue !== 'object' || Array.isArray(currentValue)) {
                    fixedValue = {};
                }
                break;
        }

        if (fixedValue !== undefined) {
            this.setValueAtPath(data, pathParts, fixedValue);
            return fixedValue;
        }

        return undefined;
    }

    /**
     * Fixes missing required properties by adding default values
     */
    private fixMissingProperty(data: any, pathParts: string[], error: ValidationError): any {
        const propertyName = pathParts[pathParts.length - 1];
        let defaultValue: any;

        // Determine default value based on property name and context
        switch (propertyName) {
            case 'message':
                defaultValue = 'No message provided';
                break;

            case 'location':
                defaultValue = { path: 'unknown' };
                break;

            case 'path':
                defaultValue = 'unknown';
                break;

            case 'line':
                defaultValue = 1;
                break;

            case 'column':
                defaultValue = 1;
                break;

            case 'severity':
                defaultValue = 'UNKNOWN_SEVERITY';
                break;

            case 'diagnostics':
                defaultValue = [];
                break;

            case 'name':
                // For source.name
                defaultValue = 'unknown';
                break;

            default:
                // Generic defaults based on expected type
                if (error.expected?.includes('string')) {
                    defaultValue = '';
                } else if (error.expected?.includes('number')) {
                    defaultValue = 0;
                } else if (error.expected?.includes('array')) {
                    defaultValue = [];
                } else if (error.expected?.includes('object')) {
                    defaultValue = {};
                } else {
                    return undefined;
                }
        }

        this.setValueAtPath(data, pathParts, defaultValue);
        return defaultValue;
    }

    /**
     * Fixes empty strings with meaningful defaults
     */
    private fixEmptyString(data: any, pathParts: string[], _error: ValidationError): any {
        if (this.options.fixLevel !== 'aggressive') {
            return undefined;
        }

        const propertyName = pathParts[pathParts.length - 1];
        let defaultValue: string;

        switch (propertyName) {
            case 'message':
                defaultValue = 'No message provided';
                break;
            case 'path':
                defaultValue = 'unknown';
                break;
            case 'name':
                defaultValue = 'unknown';
                break;
            default:
                defaultValue = 'unknown';
        }

        this.setValueAtPath(data, pathParts, defaultValue);
        return defaultValue;
    }

    /**
     * Fixes number constraint violations
     */
    private fixNumberViolation(data: any, pathParts: string[], error: ValidationError): any {
        if (this.options.fixLevel !== 'aggressive') {
            return undefined;
        }

        const currentValue = this.getValueAtPath(data, pathParts);
        let fixedValue: number;

        if (error.code === ValidationErrorCode.MIN_VALUE_VIOLATION) {
            // Extract minimum value from error message or use 1 as default
            const minMatch = error.message.match(/at least (\d+)/);
            const minValue = minMatch ? parseInt(minMatch[1]) : 1;
            fixedValue = Math.max(currentValue, minValue);
        } else if (error.code === ValidationErrorCode.MAX_VALUE_VIOLATION) {
            // Extract maximum value from error message or use reasonable default
            const maxMatch = error.message.match(/at most (\d+)/);
            const maxValue = maxMatch ? parseInt(maxMatch[1]) : 1000;
            fixedValue = Math.min(currentValue, maxValue);
        } else {
            return undefined;
        }

        this.setValueAtPath(data, pathParts, fixedValue);
        return fixedValue;
    }

    /**
     * Fixes invalid severity values
     */
    private fixInvalidSeverity(data: any, pathParts: string[], _error: ValidationError): any {
        const currentValue = this.getValueAtPath(data, pathParts);
        let fixedValue: string;

        // Try to map common severity values to valid ones
        if (typeof currentValue === 'string') {
            const normalized = currentValue.toLowerCase();
            switch (normalized) {
                case 'error':
                case 'err':
                case 'fatal':
                    fixedValue = 'ERROR';
                    break;
                case 'warning':
                case 'warn':
                case 'caution':
                    fixedValue = 'WARNING';
                    break;
                case 'info':
                case 'information':
                case 'note':
                    fixedValue = 'INFO';
                    break;
                default:
                    fixedValue = 'UNKNOWN_SEVERITY';
            }
        } else {
            fixedValue = 'UNKNOWN_SEVERITY';
        }

        this.setValueAtPath(data, pathParts, fixedValue);
        return fixedValue;
    }

    /**
     * Fixes invalid position values
     */
    private fixInvalidPosition(data: any, pathParts: string[], _error: ValidationError): any {
        if (this.options.fixLevel !== 'aggressive') {
            return undefined;
        }

        const currentValue = this.getValueAtPath(data, pathParts);
        const propertyName = pathParts[pathParts.length - 1];
        let fixedValue: number;

        if (propertyName === 'line' || propertyName === 'column') {
            if (typeof currentValue === 'number' && currentValue < 1) {
                fixedValue = 1;
            } else if (typeof currentValue !== 'number') {
                fixedValue = 1;
            } else {
                return undefined;
            }

            this.setValueAtPath(data, pathParts, fixedValue);
            return fixedValue;
        }

        return undefined;
    }

    /**
     * Helper methods for path manipulation and value access
     */
    private parsePath(path: string): string[] {
        if (!path) return [];

        return path.split(/[.[\]]/).filter(part => part !== '');
    }

    private getValueAtPath(obj: any, pathParts: string[]): any {
        let current = obj;

        for (const part of pathParts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }

        return current;
    }

    private setValueAtPath(obj: any, pathParts: string[], value: any): void {
        if (pathParts.length === 0) return;

        let current = obj;

        // Navigate to the parent of the target property
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];

            if (current[part] === undefined || current[part] === null) {
                // Create intermediate objects/arrays as needed
                const nextPart = pathParts[i + 1];
                current[part] = /^\d+$/.test(nextPart) ? [] : {};
            }

            current = current[part];
        }

        // Set the final value
        const finalPart = pathParts[pathParts.length - 1];
        current[finalPart] = value;
    }

    private deepClone(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }

        return cloned;
    }

    private extractExpectedType(expected: string): string {
        if (expected.includes('string')) return 'string';
        if (expected.includes('number')) return 'number';
        if (expected.includes('boolean')) return 'boolean';
        if (expected.includes('array')) return 'array';
        if (expected.includes('object')) return 'object';
        return 'unknown';
    }

    private canFixTypeMismatch(error: ValidationError): boolean {
        const expectedType = this.extractExpectedType(error.expected || '');
        const currentValue = error.value;

        switch (expectedType) {
            case 'string':
                return typeof currentValue === 'number' ||
                       typeof currentValue === 'boolean' ||
                       currentValue === null ||
                       currentValue === undefined;

            case 'number':
                return (typeof currentValue === 'string' && !isNaN(Number(currentValue))) ||
                       typeof currentValue === 'boolean';

            case 'boolean':
                return typeof currentValue === 'string' ||
                       typeof currentValue === 'number';

            case 'array':
                return !Array.isArray(currentValue) &&
                       currentValue !== null &&
                       currentValue !== undefined;

            case 'object':
                return typeof currentValue !== 'object' ||
                       Array.isArray(currentValue);

            default:
                return false;
        }
    }

    private canFixMissingProperty(error: ValidationError): boolean {
        const pathParts = this.parsePath(error.path);
        const propertyName = pathParts[pathParts.length - 1];

        // We can fix most missing properties with reasonable defaults
        const fixableProperties = [
            'message', 'location', 'path', 'line', 'column',
            'severity', 'diagnostics', 'name'
        ];

        return fixableProperties.includes(propertyName) ||
               (error.expected?.includes('string') ?? false) ||
               (error.expected?.includes('number') ?? false) ||
               (error.expected?.includes('array') ?? false) ||
               (error.expected?.includes('object') ?? false);
    }

    private getFixMessage(code: ValidationErrorCode, before: any, after: any): string {
        switch (code) {
            case ValidationErrorCode.TYPE_MISMATCH:
                return `Converted ${typeof before} value '${before}' to ${typeof after} '${after}'`;

            case ValidationErrorCode.REQUIRED_PROPERTY_MISSING:
            case ValidationErrorCode.MISSING_DIAGNOSTIC_MESSAGE:
            case ValidationErrorCode.MISSING_DIAGNOSTIC_LOCATION:
                return `Added missing property with default value '${after}'`;

            case ValidationErrorCode.EMPTY_STRING:
                return `Replaced empty string with default value '${after}'`;

            case ValidationErrorCode.MIN_VALUE_VIOLATION:
                return `Adjusted value from ${before} to minimum allowed value ${after}`;

            case ValidationErrorCode.MAX_VALUE_VIOLATION:
                return `Adjusted value from ${before} to maximum allowed value ${after}`;

            case ValidationErrorCode.INVALID_SEVERITY:
                return `Normalized severity from '${before}' to '${after}'`;

            case ValidationErrorCode.INVALID_POSITION:
                return `Fixed invalid position value from ${before} to ${after}`;

            default:
                return `Fixed value from '${before}' to '${after}'`;
        }
    }
}

// Export convenience functions
export function createFixer(options?: FixerOptions): Fixer {
    return new Fixer(options);
}

export function fixData(data: any, validationResult: ValidationResult, options?: FixerOptions): FixResult {
    const fixer = new Fixer(options);
    return fixer.fix(data, validationResult);
}