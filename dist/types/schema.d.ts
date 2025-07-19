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
    properties?: {
        [key: string]: JSONSchema;
    };
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
declare const positionSchema: JSONSchema;
declare const rangeSchema: JSONSchema;
declare const locationSchema: JSONSchema;
declare const sourceSchema: JSONSchema;
declare const codeSchema: JSONSchema;
declare const suggestionSchema: JSONSchema;
declare const relatedLocationSchema: JSONSchema;
declare const severityEnum: string[];
declare const diagnosticSchema: JSONSchema;
export declare const rdformatSchema: JSONSchema;
export { positionSchema, rangeSchema, locationSchema, sourceSchema, codeSchema, suggestionSchema, relatedLocationSchema, diagnosticSchema, severityEnum };
/**
 * Legacy interface for backward compatibility
 * @deprecated Use JSONSchema directly instead
 */
export interface RDFormatSchema extends JSONSchema {
}
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
export declare function getSchema(schemaName: string): JSONSchema | undefined;
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
export declare function isValidSchema(schema: any): schema is JSONSchema;
//# sourceMappingURL=schema.d.ts.map