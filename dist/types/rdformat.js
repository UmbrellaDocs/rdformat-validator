"use strict";
/**
 * TypeScript interfaces for Reviewdog Diagnostic Format (RDFormat)
 * Based on the official protobuf definition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Severity = void 0;
/**
 * Severity levels for diagnostics as defined in the RDFormat specification
 */
var Severity;
(function (Severity) {
    /** Unknown or unspecified severity level */
    Severity["UNKNOWN_SEVERITY"] = "UNKNOWN_SEVERITY";
    /** Error level - indicates a problem that must be fixed */
    Severity["ERROR"] = "ERROR";
    /** Warning level - indicates a potential issue */
    Severity["WARNING"] = "WARNING";
    /** Info level - provides informational feedback */
    Severity["INFO"] = "INFO";
})(Severity || (exports.Severity = Severity = {}));
//# sourceMappingURL=rdformat.js.map