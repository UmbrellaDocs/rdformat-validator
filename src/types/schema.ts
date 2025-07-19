/**
 * JSON Schema definition for RDFormat validation
 * Based on the official Reviewdog Diagnostic Format protobuf definition
 */

/**
 * JSON Schema interface supporting Draft 7 specification
 * Used for validating RDFormat data structures
 */
export interface JSONSchema {
  /** JSON Schema version identifier */
  $schema?: string;
  /** Unique identifier for this schema */
  $id?: string;
  /** The type of the value (string, number, object, array, boolean, null) */
  type?: string;
  /** Human-readable title for the schema */
  title?: string;
  /** Description of what this schema validates */
  description?: string;
  /** Array of required property names for objects */
  required?: string[];
  /** Schema definitions for object properties */
  properties?: { [key: string]: JSONSchema };
  /** Schema for array items */
  items?: JSONSchema;
  /** Enumeration of allowed values */
  enum?: string[];
  /** Whether additional properties are allowed in objects */
  additionalProperties?: boolean | JSONSchema;
  /** Minimum value for numbers */
  minimum?: number;
  /** Maximum value for numbers */
  maximum?: number;
  /** Minimum length for strings */
  minLength?: number;
  /** Maximum length for strings */
  maxLength?: number;
  /** Regular expression pattern for string validation */
  pattern?: string;
  /** Value must match any of these schemas */
  anyOf?: JSONSchema[];
  /** Value must match exactly one of these schemas */
  oneOf?: JSONSchema[];
  /** Value must match all of these schemas */
  allOf?: JSONSchema[];
  /** Value must not match this schema */
  not?: JSONSchema;
}

// Position schema - represents a position in a file
const positionSchema: JSONSchema = {
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

// Range schema - represents a range in a file
const rangeSchema: JSONSchema = {
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

// Location schema - represents a location in a file
const locationSchema: JSONSchema = {
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

// Source schema - represents the source of a diagnostic
const sourceSchema: JSONSchema = {
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

// Code schema - represents a diagnostic code
const codeSchema: JSONSchema = {
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

// Suggestion schema - represents a suggested fix
const suggestionSchema: JSONSchema = {
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

// Related location schema - represents a related location
const relatedLocationSchema: JSONSchema = {
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

// Severity enum values
const severityEnum = ['UNKNOWN_SEVERITY', 'ERROR', 'WARNING', 'INFO'];

// Diagnostic schema - represents a single diagnostic
const diagnosticSchema: JSONSchema = {
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

// Main RDFormat schema - supports multiple formats
export const rdformatSchema: JSONSchema = {
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

// Export individual schemas for testing and validation
export {
  positionSchema,
  rangeSchema,
  locationSchema,
  sourceSchema,
  codeSchema,
  suggestionSchema,
  relatedLocationSchema,
  diagnosticSchema,
  severityEnum
};

/**
 * Legacy interface for backward compatibility
 * @deprecated Use JSONSchema directly instead
 */
export interface RDFormatSchema extends JSONSchema {}

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
export function getSchema(schemaName: string): JSONSchema | undefined {
  const schemas: { [key: string]: JSONSchema } = {
    position: positionSchema,
    range: rangeSchema,
    location: locationSchema,
    source: sourceSchema,
    code: codeSchema,
    suggestion: suggestionSchema,
    relatedLocation: relatedLocationSchema,
    diagnostic: diagnosticSchema,
    rdformat: rdformatSchema
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
export function isValidSchema(schema: any): schema is JSONSchema {
  return typeof schema === 'object' && 
         schema !== null && 
         (typeof schema.type === 'string' || 
          schema.oneOf || 
          schema.anyOf || 
          schema.allOf);
}