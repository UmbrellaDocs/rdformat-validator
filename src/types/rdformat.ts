/**
 * TypeScript interfaces for Reviewdog Diagnostic Format (RDFormat)
 * Based on the official protobuf definition
 */

/**
 * Severity levels for diagnostics as defined in the RDFormat specification
 */
export enum Severity {
  /** Unknown or unspecified severity level */
  UNKNOWN_SEVERITY = 'UNKNOWN_SEVERITY',
  /** Error level - indicates a problem that must be fixed */
  ERROR = 'ERROR',
  /** Warning level - indicates a potential issue */
  WARNING = 'WARNING',
  /** Info level - provides informational feedback */
  INFO = 'INFO'
}

/**
 * Represents a position in a source file
 */
export interface Position {
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based, optional) */
  column?: number;
}

/**
 * Represents a range in a source file from start to end position
 */
export interface Range {
  /** Starting position of the range */
  start: Position;
  /** Ending position of the range (optional, defaults to start position) */
  end?: Position;
}

/**
 * Represents a location in a source file
 */
export interface Location {
  /** File path relative to the project root */
  path: string;
  /** Optional range within the file */
  range?: Range;
}

/**
 * Represents a location related to the main diagnostic
 */
export interface RelatedLocation {
  /** Optional message describing the relationship */
  message?: string;
  /** Location of the related issue */
  location: Location;
}

/**
 * Represents a suggested fix for a diagnostic
 */
export interface Suggestion {
  /** Range where the suggestion should be applied */
  range: Range;
  /** Text to replace the range with */
  text: string;
}

/**
 * Represents the source tool that generated the diagnostic
 */
export interface Source {
  /** Name of the tool or linter */
  name: string;
  /** Optional URL to the tool's homepage or documentation */
  url?: string;
}

/**
 * Represents a diagnostic code or rule identifier
 */
export interface Code {
  /** The code or rule identifier */
  value: string;
  /** Optional URL to documentation about this code */
  url?: string;
}

/**
 * Represents a single diagnostic message
 */
export interface Diagnostic {
  /** The diagnostic message text */
  message: string;
  /** Location where the diagnostic applies */
  location: Location;
  /** Severity level of the diagnostic */
  severity?: Severity;
  /** Source tool that generated this diagnostic */
  source?: Source;
  /** Code or rule that triggered this diagnostic */
  code?: Code;
  /** Suggested fixes for this diagnostic */
  suggestions?: Suggestion[];
  /** Original output from the tool (for debugging) */
  original_output?: string;
  /** Related locations that provide additional context */
  related_locations?: RelatedLocation[];
}

/**
 * Represents the complete diagnostic result format
 * This is the top-level structure for RDFormat data
 */
export interface DiagnosticResult {
  /** Array of diagnostic messages */
  diagnostics: Diagnostic[];
  /** Default source for all diagnostics (can be overridden per diagnostic) */
  source?: Source;
  /** Default severity for all diagnostics (can be overridden per diagnostic) */
  severity?: Severity;
}