/**
 * TypeScript interfaces for Reviewdog Diagnostic Format (RDFormat)
 * Based on the official protobuf definition
 */
export declare enum Severity {
    UNKNOWN_SEVERITY = "UNKNOWN_SEVERITY",
    ERROR = "ERROR",
    WARNING = "WARNING",
    INFO = "INFO"
}
export interface Position {
    line: number;
    column?: number;
}
export interface Range {
    start: Position;
    end?: Position;
}
export interface Location {
    path: string;
    range?: Range;
}
export interface RelatedLocation {
    message?: string;
    location: Location;
}
export interface Suggestion {
    range: Range;
    text: string;
}
export interface Source {
    name: string;
    url?: string;
}
export interface Code {
    value: string;
    url?: string;
}
export interface Diagnostic {
    message: string;
    location: Location;
    severity?: Severity;
    source?: Source;
    code?: Code;
    suggestions?: Suggestion[];
    original_output?: string;
    related_locations?: RelatedLocation[];
}
export interface DiagnosticResult {
    diagnostics: Diagnostic[];
    source?: Source;
    severity?: Severity;
}
//# sourceMappingURL=rdformat.d.ts.map