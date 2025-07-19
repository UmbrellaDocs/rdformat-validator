/**
 * RDFormat Validator - Main entry point
 * Validator for Reviewdog Diagnostic Format
 */

// Export all types and interfaces
export * from './types/rdformat';
export * from './types/validation';
export * from './types/schema';

// Export parser module
export * from './parser';

// Export validator module
export * from './validator';

// Export fixer module
export * from './fixer';

// Main validator class (placeholder for now)
export class RDFormatValidator {
  constructor(options?: any) {
    // Implementation will be added in later tasks
  }
}

// Utility functions (placeholders for now)
export function validate(input: string | object, options?: any): Promise<any> {
  // Implementation will be added in later tasks
  throw new Error('Not implemented yet');
}

export function validateAndFix(input: string | object, options?: any): Promise<any> {
  // Implementation will be added in later tasks
  throw new Error('Not implemented yet');
}