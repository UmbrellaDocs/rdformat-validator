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

// Schema based on the official protobuf definition
export const rdformatSchema: RDFormatSchema = {
  type: 'object',
  properties: {
    diagnostics: {
      type: 'array',
      items: {
        type: 'object',
        required: ['message', 'location'],
        properties: {
          message: { type: 'string' },
          location: {
            type: 'object',
            required: ['path'],
            properties: {
              path: { type: 'string' },
              range: {
                type: 'object',
                properties: {
                  start: {
                    type: 'object',
                    required: ['line'],
                    properties: {
                      line: { type: 'number' },
                      column: { type: 'number' }
                    }
                  },
                  end: {
                    type: 'object',
                    properties: {
                      line: { type: 'number' },
                      column: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          severity: { 
            type: 'string', 
            enum: ['UNKNOWN_SEVERITY', 'ERROR', 'WARNING', 'INFO'] 
          },
          source: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              url: { type: 'string' }
            }
          },
          code: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              url: { type: 'string' }
            }
          },
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['text', 'range'],
              properties: {
                range: { 
                  type: 'object',
                  properties: {
                    start: {
                      type: 'object',
                      properties: {
                        line: { type: 'number' },
                        column: { type: 'number' }
                      }
                    },
                    end: {
                      type: 'object',
                      properties: {
                        line: { type: 'number' },
                        column: { type: 'number' }
                      }
                    }
                  }
                },
                text: { type: 'string' }
              }
            }
          },
          original_output: { type: 'string' },
          related_locations: {
            type: 'array',
            items: {
              type: 'object',
              required: ['location'],
              properties: {
                message: { type: 'string' },
                location: {
                  type: 'object',
                  required: ['path'],
                  properties: {
                    path: { type: 'string' },
                    range: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    source: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        url: { type: 'string' }
      }
    },
    severity: { 
      type: 'string', 
      enum: ['UNKNOWN_SEVERITY', 'ERROR', 'WARNING', 'INFO'] 
    }
  }
};