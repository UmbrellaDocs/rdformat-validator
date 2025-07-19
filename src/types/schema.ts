/**
 * JSON Schema definition for RDFormat validation
 * Based on the official Reviewdog Diagnostic Format protobuf definition
 */

export interface JSONSchema {
  $schema?: string;
  $id?: string;
  type?: string;
  title?: string;
  description?: string;
  required?: string[];
  properties?: { [key: string]: JSONSchema };
  items?: JSONSchema;
  enum?: string[];
  additionalProperties?: boolean | JSONSchema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
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

// Legacy interface for backward compatibility
export interface RDFormatSchema extends JSONSchema {}

// Utility function to get schema by name
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

// Utility function to validate schema structure
export function isValidSchema(schema: any): schema is JSONSchema {
  return typeof schema === 'object' && 
         schema !== null && 
         (typeof schema.type === 'string' || 
          schema.oneOf || 
          schema.anyOf || 
          schema.allOf);
}