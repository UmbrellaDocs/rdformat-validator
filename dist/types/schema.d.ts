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
    properties?: {
        [key: string]: JSONSchema;
    };
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
export interface RDFormatSchema extends JSONSchema {
}
export declare function getSchema(schemaName: string): JSONSchema | undefined;
export declare function isValidSchema(schema: any): schema is JSONSchema;
//# sourceMappingURL=schema.d.ts.map