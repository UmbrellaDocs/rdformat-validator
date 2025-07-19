/**
 * JSON Schema definition for RDFormat validation
 */
export interface RDFormatSchema {
    type: 'object';
    required?: string[];
    properties: {
        [key: string]: {
            type: string;
            required?: string[];
            properties?: any;
            items?: any;
            enum?: string[];
        };
    };
}
export declare const rdformatSchema: RDFormatSchema;
//# sourceMappingURL=schema.d.ts.map