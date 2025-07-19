"use strict";
/**
 * RDFormat Validator - Main entry point
 * Validator for Reviewdog Diagnostic Format
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFormatValidator = void 0;
exports.validate = validate;
exports.validateAndFix = validateAndFix;
// Export all types and interfaces
__exportStar(require("./types/rdformat"), exports);
__exportStar(require("./types/validation"), exports);
__exportStar(require("./types/schema"), exports);
// Main validator class (placeholder for now)
class RDFormatValidator {
    constructor(options) {
        // Implementation will be added in later tasks
    }
}
exports.RDFormatValidator = RDFormatValidator;
// Utility functions (placeholders for now)
function validate(input, options) {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
}
function validateAndFix(input, options) {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
}
//# sourceMappingURL=index.js.map