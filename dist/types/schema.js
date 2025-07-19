"use strict";
/**
 * JSON Schema definition for RDFormat validation
 * Based on the official Reviewdog Diagnostic Format protobuf definition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.severityEnum = exports.diagnosticSchema = exports.relatedLocationSchema = exports.suggestionSchema = exports.codeSchema = exports.sourceSchema = exports.locationSchema = exports.rangeSchema = exports.positionSchema = exports.rdformatSchema = void 0;
exports.getSchema = getSchema;
exports.isValidSchema = isValidSchema;
// Position schema - represents a position in a file
const positionSchema = {
    type: 'object',
    title: 'Position',
    description: 'A position in a file',
    required: ['line'],
    properties: {
        line: {
            type: 'number',
            description: 'Line number (1-based)',
            minimum: 1
        },
        column: {
            type: 'number',
            description: 'Column number (1-based)',
            minimum: 1
        }
    },
    additionalProperties: false
};
exports.positionSchema = positionSchema;
// Range schema - represents a range in a file
const rangeSchema = {
    type: 'object',
    title: 'Range',
    description: 'A range in a file',
    required: ['start'],
    properties: {
        start: positionSchema,
        end: positionSchema
    },
    additionalProperties: false
};
exports.rangeSchema = rangeSchema;
// Location schema - represents a location in a file
const locationSchema = {
    type: 'object',
    title: 'Location',
    description: 'A location in a file',
    required: ['path'],
    properties: {
        path: {
            type: 'string',
            description: 'File path',
            minLength: 1
        },
        range: rangeSchema
    },
    additionalProperties: false
};
exports.locationSchema = locationSchema;
// Source schema - represents the source of a diagnostic
const sourceSchema = {
    type: 'object',
    title: 'Source',
    description: 'Source information for a diagnostic',
    required: ['name'],
    properties: {
        name: {
            type: 'string',
            description: 'Name of the diagnostic source',
            minLength: 1
        },
        url: {
            type: 'string',
            description: 'URL for more information about the source',
            pattern: '^https?://.+'
        }
    },
    additionalProperties: false
};
exports.sourceSchema = sourceSchema;
// Code schema - represents a diagnostic code
const codeSchema = {
    type: 'object',
    title: 'Code',
    description: 'Code information for a diagnostic',
    properties: {
        value: {
            type: 'string',
            description: 'The diagnostic code value',
            minLength: 1
        },
        url: {
            type: 'string',
            description: 'URL for more information about the code',
            pattern: '^https?://.+'
        }
    },
    additionalProperties: false
};
exports.codeSchema = codeSchema;
// Suggestion schema - represents a suggested fix
const suggestionSchema = {
    type: 'object',
    title: 'Suggestion',
    description: 'A suggested fix for a diagnostic',
    required: ['text', 'range'],
    properties: {
        range: rangeSchema,
        text: {
            type: 'string',
            description: 'The suggested replacement text'
        }
    },
    additionalProperties: false
};
exports.suggestionSchema = suggestionSchema;
// Related location schema - represents a related location
const relatedLocationSchema = {
    type: 'object',
    title: 'RelatedLocation',
    description: 'A location related to a diagnostic',
    required: ['location'],
    properties: {
        message: {
            type: 'string',
            description: 'Message describing the relationship'
        },
        location: locationSchema
    },
    additionalProperties: false
};
exports.relatedLocationSchema = relatedLocationSchema;
// Severity enum values
const severityEnum = ['UNKNOWN_SEVERITY', 'ERROR', 'WARNING', 'INFO'];
exports.severityEnum = severityEnum;
// Diagnostic schema - represents a single diagnostic
const diagnosticSchema = {
    type: 'object',
    title: 'Diagnostic',
    description: 'A single diagnostic message',
    required: ['message', 'location'],
    properties: {
        message: {
            type: 'string',
            description: 'The diagnostic message',
            minLength: 1
        },
        location: locationSchema,
        severity: {
            type: 'string',
            description: 'Severity level of the diagnostic',
            enum: severityEnum
        },
        source: sourceSchema,
        code: codeSchema,
        suggestions: {
            type: 'array',
            description: 'Suggested fixes for the diagnostic',
            items: suggestionSchema
        },
        original_output: {
            type: 'string',
            description: 'Original output from the diagnostic tool'
        },
        related_locations: {
            type: 'array',
            description: 'Locations related to this diagnostic',
            items: relatedLocationSchema
        }
    },
    additionalProperties: false
};
exports.diagnosticSchema = diagnosticSchema;
// Main RDFormat schema - supports multiple formats
exports.rdformatSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://github.com/reviewdog/reviewdog/blob/master/proto/rdf/reviewdog.proto',
    title: 'Reviewdog Diagnostic Format',
    description: 'JSON schema for Reviewdog Diagnostic Format (RDFormat)',
    oneOf: [
        // Single diagnostic format (for JSONL lines)
        diagnosticSchema,
        // Array of diagnostics format (for JSON arrays)
        {
            type: 'array',
            title: 'DiagnosticArray',
            description: 'An array of diagnostic messages',
            items: diagnosticSchema
        },
        // Diagnostic result format (for structured JSON)
        {
            type: 'object',
            title: 'DiagnosticResult',
            description: 'A collection of diagnostics with optional metadata',
            required: ['diagnostics'],
            properties: {
                diagnostics: {
                    type: 'array',
                    description: 'Array of diagnostic messages',
                    items: diagnosticSchema
                },
                source: sourceSchema,
                severity: {
                    type: 'string',
                    description: 'Default severity level for diagnostics',
                    enum: severityEnum
                }
            },
            additionalProperties: false
        }
    ]
};
/**
 * Utility function to get a specific schema by name
 * @param schemaName - Name of the schema to retrieve
 * @returns The requested schema or undefined if not found
 * @example
 * ```typescript
 * const diagnosticSchema = getSchema('diagnostic');
 * const positionSchema = getSchema('position');
 * ```
 */
function getSchema(schemaName) {
    const schemas = {
        position: positionSchema,
        range: rangeSchema,
        location: locationSchema,
        source: sourceSchema,
        code: codeSchema,
        suggestion: suggestionSchema,
        relatedLocation: relatedLocationSchema,
        diagnostic: diagnosticSchema,
        rdformat: exports.rdformatSchema
    };
    return schemas[schemaName];
}
/**
 * Type guard to validate if an object is a valid JSON Schema
 * @param schema - Object to validate
 * @returns True if the object is a valid JSON Schema structure
 * @example
 * ```typescript
 * if (isValidSchema(someObject)) {
 *   // someObject is now typed as JSONSchema
 *   console.log(someObject.type);
 * }
 * ```
 */
function isValidSchema(schema) {
    return typeof schema === 'object' &&
        schema !== null &&
        (typeof schema.type === 'string' ||
            schema.oneOf ||
            schema.anyOf ||
            schema.allOf);
}
//# sourceMappingURL=schema.js.map