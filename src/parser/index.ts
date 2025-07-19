/**
 * Parser module for RDFormat Validator
 * Handles parsing JSON input from various sources
 */

import { readFile } from 'fs/promises';
import { Readable } from 'stream';
import { ParserOptions, ParserResult, ParseError } from '../types/validation';

export class Parser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      allowComments: false,
      strictMode: true,
      ...options
    };
  }

  /**
   * Parse JSON from a string input
   */
  parseString(input: string): ParserResult {
    try {
      // Handle empty input
      if (!input || input.trim().length === 0) {
        return {
          data: null,
          success: false,
          errors: [{
            message: 'Input is empty',
            line: 1,
            column: 1
          }]
        };
      }

      // Parse the JSON
      const data = JSON.parse(input);
      
      return {
        data,
        success: true
      };
    } catch (error) {
      return this.handleParseError(error, input);
    }
  }

  /**
   * Parse JSON from a file
   */
  async parseFile(filePath: string): Promise<ParserResult> {
    try {
      // Read the file
      const content = await readFile(filePath, 'utf-8');
      
      // Parse the content using parseString
      return this.parseString(content);
    } catch (error: any) {
      // Handle file system errors
      return {
        data: null,
        success: false,
        errors: [{
          message: `Failed to read file: ${error?.message || 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Parse JSON from a readable stream
   */
  async parseStream(stream: Readable): Promise<ParserResult> {
    try {
      const chunks: Buffer[] = [];
      
      // Collect all chunks from the stream
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      
      // Convert to string
      const content = Buffer.concat(chunks).toString('utf-8');
      
      // Parse the content using parseString
      return this.parseString(content);
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          success: false,
          errors: [{
            message: `Failed to read stream: ${error.message}`
          }]
        };
      }
      
      return {
        data: null,
        success: false,
        errors: [{
          message: 'Unknown error occurred while reading stream'
        }]
      };
    }
  }

  /**
   * Handle JSON parsing errors and extract useful information
   */
  private handleParseError(error: unknown, input: string): ParserResult {
    const parseError: ParseError = {
      message: 'Invalid JSON format'
    };

    if (error instanceof SyntaxError) {
      // Use the original error message as it's already descriptive
      parseError.message = error.message;
      
      // Try to extract line and column information from the error message
      const positionMatch = error.message.match(/at position (\d+)/);
      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        const lineInfo = this.getLineAndColumn(input, position);
        parseError.line = lineInfo.line;
        parseError.column = lineInfo.column;
      } else {
        // Try alternative patterns for line/column extraction
        const lineColMatch = error.message.match(/\(line (\d+) column (\d+)\)/);
        if (lineColMatch) {
          parseError.line = parseInt(lineColMatch[1], 10);
          parseError.column = parseInt(lineColMatch[2], 10);
        }
      }
    } else if (error instanceof Error) {
      parseError.message = error.message;
    } else {
      parseError.message = 'Unknown parsing error occurred';
    }

    return {
      data: null,
      success: false,
      errors: [parseError]
    };
  }

  /**
   * Convert character position to line and column numbers
   */
  private getLineAndColumn(input: string, position: number): { line: number; column: number } {
    const lines = input.substring(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }
}

// Export a default parser instance for convenience
export const defaultParser = new Parser();

// Export convenience functions
export function parseString(input: string, options?: ParserOptions): ParserResult {
  const parser = new Parser(options);
  return parser.parseString(input);
}

export async function parseFile(filePath: string, options?: ParserOptions): Promise<ParserResult> {
  const parser = new Parser(options);
  return parser.parseFile(filePath);
}

export async function parseStream(stream: Readable, options?: ParserOptions): Promise<ParserResult> {
  const parser = new Parser(options);
  return parser.parseStream(stream);
}