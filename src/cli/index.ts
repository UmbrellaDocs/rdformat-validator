/**
 * CLI Module for RDFormat Validator
 * Provides command-line interface functionality for validating RDFormat data
 */

import { Command } from 'commander';
import { RDFormatValidator } from '../index';
import { RDFormatValidatorOptions } from '../types/validation';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

/**
 * Utility function to colorize text for terminal output
 */
function colorize(text: string, color: keyof typeof colors): string {
  // Only colorize if stdout is a TTY (terminal)
  if (process.stdout.isTTY) {
    return `${colors[color]}${text}${colors.reset}`;
  }
  return text;
}

/**
 * CLI options interface extending the base validator options
 */
export interface CLIOptions extends RDFormatValidatorOptions {
  /** Enable automatic fixing of common issues */
  fix?: boolean;
  /** Output file path (default: stdout) */
  output?: string;
  /** Enable verbose output */
  verbose?: boolean;
  /** Enable silent mode (suppress non-error output) */
  silent?: boolean;
  /** Output format: 'json' or 'text' */
  format?: 'json' | 'text';
  /** Input files to validate */
  files?: string[];
}

/**
 * CLI result interface for structured output
 */
export interface CLIResult {
  /** Overall success status */
  success: boolean;
  /** Number of files processed */
  filesProcessed: number;
  /** Number of valid files */
  validFiles: number;
  /** Number of invalid files */
  invalidFiles: number;
  /** Total number of errors across all files */
  totalErrors: number;
  /** Total number of warnings across all files */
  totalWarnings: number;
  /** Total number of fixes applied */
  totalFixes: number;
  /** Detailed results per file */
  fileResults: Array<{
    file: string;
    valid: boolean;
    errors: number;
    warnings: number;
    fixes: number;
    errorDetails?: Array<{
      path: string;
      message: string;
      code: string;
    }>;
    warningDetails?: Array<{
      path: string;
      message: string;
      code: string;
    }>;
    fixDetails?: Array<{
      path: string;
      message: string;
    }>;
  }>;
}

/**
 * Main CLI class that handles command-line operations
 */
export class CLI {
  private program: Command;
  private validator: RDFormatValidator;

  constructor() {
    this.program = new Command();
    this.validator = new RDFormatValidator();
    this.setupCommands();
  }

  /**
   * Set up the command-line interface structure and options
   */
  private setupCommands(): void {
    this.program
      .name('rdformat-validator')
      .description('Validate JSON data against the Reviewdog Diagnostic Format specification')
      .version('1.0.0')
      .argument('[files...]', 'JSON files to validate (reads from stdin if no files specified)')
      .option('-f, --fix', 'attempt to automatically fix common issues', false)
      .option('-o, --output <file>', 'output file (default: stdout)')
      .option('-v, --verbose', 'enable verbose output', false)
      .option('-s, --silent', 'suppress non-error output', false)
      .option('--format <format>', 'output format: json or text', 'text')
      .option('--strict', 'enable strict validation mode', false)
      .option('--no-extra-fields', 'disallow extra fields not in specification', false)
      .option('--fix-level <level>', 'fix level: basic or aggressive', 'basic')
      .action(async (files: string[], options: any) => {
        try {
          const cliOptions = this.parseOptions(files, options);
          const exitCode = await this.run(cliOptions);
          process.exit(exitCode);
        } catch (error) {
          console.error('Fatal error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Add help examples
    this.program.addHelpText('after', `
Examples:
  $ rdformat-validator file.json                    # Validate a single file
  $ rdformat-validator file1.json file2.json       # Validate multiple files
  $ cat file.json | rdformat-validator             # Validate from stdin
  $ rdformat-validator --fix file.json             # Validate and fix issues
  $ rdformat-validator --format json file.json     # Output in JSON format
  $ rdformat-validator --output result.json file.json  # Save output to file
  $ rdformat-validator --strict --no-extra-fields file.json  # Strict validation
`);
  }

  /**
   * Parse command-line arguments and convert to CLIOptions
   */
  private parseOptions(files: string[], options: any): CLIOptions {
    return {
      files: files.length > 0 ? files : undefined,
      fix: options.fix || false,
      output: options.output,
      verbose: options.verbose || false,
      silent: options.silent || false,
      format: options.format === 'json' ? 'json' : 'text',
      strictMode: options.strict || false,
      allowExtraFields: options.extraFields !== false, // Default true unless --no-extra-fields
      fixLevel: options.fixLevel === 'aggressive' ? 'aggressive' : 'basic'
    };
  }

  /**
   * Main CLI execution method
   * @param options - Parsed CLI options
   * @returns Exit code (0 for success, non-zero for failure)
   */
  async run(options: CLIOptions): Promise<number> {
    try {
      // Update validator options
      this.validator.setOptions({
        strictMode: options.strictMode,
        allowExtraFields: options.allowExtraFields,
        fixLevel: options.fixLevel
      });

      let result: CLIResult;

      if (options.files && options.files.length > 0) {
        // Process files
        result = await this.processFiles(options.files, options);
      } else {
        // Process stdin
        result = await this.processStdin(options);
      }

      // Output results
      await this.outputResult(result, options);

      // Return appropriate exit code
      return result.success ? 0 : 1;
    } catch (error) {
      if (!options.silent) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      }
      return 1;
    }
  }

  /**
   * Process multiple files
   */
  private async processFiles(files: string[], options: CLIOptions): Promise<CLIResult> {
    const result: CLIResult = {
      success: true,
      filesProcessed: 0,
      validFiles: 0,
      invalidFiles: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalFixes: 0,
      fileResults: []
    };

    for (const file of files) {
      try {
        if (!options.silent && options.verbose) {
          console.log(`Processing: ${file}`);
        }

        const fileResult = await this.processFile(file, options);
        result.fileResults.push(fileResult);
        result.filesProcessed++;

        if (fileResult.valid) {
          result.validFiles++;
        } else {
          result.invalidFiles++;
          result.success = false;
        }

        result.totalErrors += fileResult.errors;
        result.totalWarnings += fileResult.warnings;
        result.totalFixes += fileResult.fixes;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.fileResults.push({
          file,
          valid: false,
          errors: 1,
          warnings: 0,
          fixes: 0
        });
        result.filesProcessed++;
        result.invalidFiles++;
        result.totalErrors++;
        result.success = false;

        if (!options.silent) {
          console.error(`Error processing ${file}: ${errorMessage}`);
        }
      }
    }

    return result;
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string, options: CLIOptions): Promise<{
    file: string;
    valid: boolean;
    errors: number;
    warnings: number;
    fixes: number;
    errorDetails?: Array<{
      path: string;
      message: string;
      code: string;
    }>;
    warningDetails?: Array<{
      path: string;
      message: string;
      code: string;
    }>;
    fixDetails?: Array<{
      path: string;
      message: string;
    }>;
  }> {
    // Check if file exists and is readable
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }
      
      // Check if file is readable
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          throw new Error(`File not found: ${filePath}`);
        } else if (nodeError.code === 'EACCES') {
          throw new Error(`Permission denied: ${filePath}`);
        }
      }
      throw new Error(`Cannot access file: ${filePath} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate the file
    const validationResult = await this.validator.validateFile(filePath, options.fix || false);

    // If fixing was requested and fixes were applied, optionally write back to file
    if (options.fix && validationResult.fixedData && validationResult.appliedFixes && validationResult.appliedFixes.length > 0) {
      if (!options.silent && options.verbose) {
        console.log(`Applied ${validationResult.appliedFixes.length} fixes to ${filePath}`);
      }
      
      // Note: We don't automatically overwrite the original file for safety
      // Users can use --output to specify where to save fixed data
    }

    const result: {
      file: string;
      valid: boolean;
      errors: number;
      warnings: number;
      fixes: number;
      errorDetails?: Array<{
        path: string;
        message: string;
        code: string;
      }>;
      warningDetails?: Array<{
        path: string;
        message: string;
        code: string;
      }>;
      fixDetails?: Array<{
        path: string;
        message: string;
      }>;
    } = {
      file: filePath,
      valid: validationResult.valid,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      fixes: validationResult.appliedFixes?.length || 0
    };

    // Add detailed error information if verbose or JSON format
    if (options.verbose || options.format === 'json') {
      if (validationResult.errors.length > 0) {
        result.errorDetails = validationResult.errors.map(error => ({
          path: error.path,
          message: error.message,
          code: error.code
        }));
      }

      if (validationResult.warnings.length > 0) {
        result.warningDetails = validationResult.warnings.map(warning => ({
          path: warning.path,
          message: warning.message,
          code: warning.code
        }));
      }

      if (validationResult.appliedFixes && validationResult.appliedFixes.length > 0) {
        result.fixDetails = validationResult.appliedFixes.map(fix => ({
          path: fix.path,
          message: fix.message
        }));
      }
    }

    return result;
  }

  /**
   * Process input from stdin
   */
  private async processStdin(options: CLIOptions): Promise<CLIResult> {
    return new Promise((resolve, reject) => {
      let input = '';
      let hasData = false;

      // Set up stdin reading with timeout for empty input
      process.stdin.setEncoding('utf8');
      
      // Set a timeout to detect if no input is provided
      const timeout = setTimeout(() => {
        if (!hasData) {
          reject(new Error('No input provided via stdin. Use --help for usage information.'));
        }
      }, 100); // 100ms timeout for detecting empty stdin

      process.stdin.on('data', (chunk) => {
        hasData = true;
        clearTimeout(timeout);
        input += chunk;
      });

      process.stdin.on('end', async () => {
        clearTimeout(timeout);
        
        try {
          // Check for empty input
          if (!input.trim()) {
            reject(new Error('Empty input provided via stdin'));
            return;
          }

          if (!options.silent && options.verbose) {
            console.log('Processing stdin...');
          }

          const validationResult = await this.validator.validateString(input, options.fix || false);

          // If fixing was requested and fixes were applied, log the information
          if (options.fix && validationResult.fixedData && validationResult.appliedFixes && validationResult.appliedFixes.length > 0) {
            if (!options.silent && options.verbose) {
              console.log(`Applied ${validationResult.appliedFixes.length} fixes to stdin input`);
            }
          }

          const fileResult: {
            file: string;
            valid: boolean;
            errors: number;
            warnings: number;
            fixes: number;
            errorDetails?: Array<{
              path: string;
              message: string;
              code: string;
            }>;
            warningDetails?: Array<{
              path: string;
              message: string;
              code: string;
            }>;
            fixDetails?: Array<{
              path: string;
              message: string;
            }>;
          } = {
            file: '<stdin>',
            valid: validationResult.valid,
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length,
            fixes: validationResult.appliedFixes?.length || 0
          };

          // Add detailed error information if verbose or JSON format
          if (options.verbose || options.format === 'json') {
            if (validationResult.errors.length > 0) {
              fileResult.errorDetails = validationResult.errors.map(error => ({
                path: error.path,
                message: error.message,
                code: error.code
              }));
            }

            if (validationResult.warnings.length > 0) {
              fileResult.warningDetails = validationResult.warnings.map(warning => ({
                path: warning.path,
                message: warning.message,
                code: warning.code
              }));
            }

            if (validationResult.appliedFixes && validationResult.appliedFixes.length > 0) {
              fileResult.fixDetails = validationResult.appliedFixes.map(fix => ({
                path: fix.path,
                message: fix.message
              }));
            }
          }

          const result: CLIResult = {
            success: validationResult.valid,
            filesProcessed: 1,
            validFiles: validationResult.valid ? 1 : 0,
            invalidFiles: validationResult.valid ? 0 : 1,
            totalErrors: validationResult.errors.length,
            totalWarnings: validationResult.warnings.length,
            totalFixes: validationResult.appliedFixes?.length || 0,
            fileResults: [fileResult]
          };

          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      process.stdin.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Error reading from stdin: ${error.message}`));
      });

      // Check if stdin is a TTY (interactive terminal)
      if (process.stdin.isTTY) {
        clearTimeout(timeout);
        reject(new Error('No input provided. Please provide input via stdin or specify files to validate.'));
        return;
      }

      // Start reading
      process.stdin.resume();
    });
  }

  /**
   * Output the validation results
   */
  private async outputResult(result: CLIResult, options: CLIOptions): Promise<void> {
    let output: string;

    if (options.format === 'json') {
      output = JSON.stringify(result, null, 2);
    } else {
      output = this.formatTextOutput(result, options);
    }

    if (options.output) {
      // Write to file
      try {
        const outputDir = path.dirname(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(options.output, output, 'utf8');
        
        if (!options.silent) {
          console.log(`Results written to: ${options.output}`);
        }
      } catch (error) {
        throw new Error(`Failed to write output file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Write to stdout
      console.log(output);
    }
  }

  /**
   * Write fixed data to output file when fixing is enabled
   */
  private async writeFixedData(fixedData: any, outputPath: string, options: CLIOptions): Promise<void> {
    try {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const fixedJson = JSON.stringify(fixedData, null, 2);
      fs.writeFileSync(outputPath, fixedJson, 'utf8');
      
      if (!options.silent) {
        console.log(`Fixed data written to: ${outputPath}`);
      }
    } catch (error) {
      throw new Error(`Failed to write fixed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format results as human-readable text
   */
  private formatTextOutput(result: CLIResult, options: CLIOptions): string {
    const lines: string[] = [];

    if (!options.silent) {
      // Summary
      lines.push(colorize('RDFormat Validation Results', 'bold'));
      lines.push(colorize('==========================', 'bold'));
      lines.push('');
      lines.push(`Files processed: ${colorize(result.filesProcessed.toString(), 'cyan')}`);
      lines.push(`Valid files: ${colorize(result.validFiles.toString(), 'green')}`);
      lines.push(`Invalid files: ${colorize(result.invalidFiles.toString(), result.invalidFiles > 0 ? 'red' : 'green')}`);
      lines.push(`Total errors: ${colorize(result.totalErrors.toString(), result.totalErrors > 0 ? 'red' : 'green')}`);
      lines.push(`Total warnings: ${colorize(result.totalWarnings.toString(), result.totalWarnings > 0 ? 'yellow' : 'green')}`);
      
      if (result.totalFixes > 0) {
        lines.push(`Total fixes applied: ${colorize(result.totalFixes.toString(), 'blue')}`);
      }
      
      lines.push('');

      // Per-file results
      if (result.fileResults.length > 1 || options.verbose) {
        lines.push(colorize('File Results:', 'bold'));
        lines.push(colorize('-------------', 'bold'));
        
        for (const fileResult of result.fileResults) {
          const status = fileResult.valid ? colorize('✓', 'green') : colorize('✗', 'red');
          let line = `${status} ${fileResult.file}`;
          
          if (!fileResult.valid || options.verbose) {
            const details: string[] = [];
            if (fileResult.errors > 0) details.push(colorize(`${fileResult.errors} errors`, 'red'));
            if (fileResult.warnings > 0) details.push(colorize(`${fileResult.warnings} warnings`, 'yellow'));
            if (fileResult.fixes > 0) details.push(colorize(`${fileResult.fixes} fixes`, 'blue'));
            
            if (details.length > 0) {
              line += ` (${details.join(', ')})`;
            }
          }
          
          lines.push(line);

          // Add detailed error, warning, and fix information in verbose mode
          if (options.verbose) {
            // Show errors
            if (fileResult.errorDetails && fileResult.errorDetails.length > 0) {
              lines.push(colorize('  Errors:', 'red'));
              for (const error of fileResult.errorDetails) {
                const pathStr = error.path ? `${colorize(error.path, 'gray')}: ` : '';
                lines.push(`    ${colorize('✗', 'red')} ${pathStr}${error.message} ${colorize(`(${error.code})`, 'gray')}`);
              }
            }

            // Show warnings
            if (fileResult.warningDetails && fileResult.warningDetails.length > 0) {
              lines.push(colorize('  Warnings:', 'yellow'));
              for (const warning of fileResult.warningDetails) {
                const pathStr = warning.path ? `${colorize(warning.path, 'gray')}: ` : '';
                lines.push(`    ${colorize('⚠', 'yellow')} ${pathStr}${warning.message} ${colorize(`(${warning.code})`, 'gray')}`);
              }
            }

            // Show fixes
            if (fileResult.fixDetails && fileResult.fixDetails.length > 0) {
              lines.push(colorize('  Fixes Applied:', 'blue'));
              for (const fix of fileResult.fixDetails) {
                const pathStr = fix.path ? `${colorize(fix.path, 'gray')}: ` : '';
                lines.push(`    ${colorize('✓', 'blue')} ${pathStr}${fix.message}`);
              }
            }

            // Add spacing between files if there are multiple
            if (result.fileResults.length > 1) {
              lines.push('');
            }
          }
        }
        
        if (!options.verbose) {
          lines.push('');
        }
      }

      // Overall result
      if (result.success) {
        lines.push(colorize('✓ All files are valid RDFormat', 'green'));
      } else {
        lines.push(colorize('✗ Some files have validation errors', 'red'));
      }
    }

    return lines.join('\n');
  }

  /**
   * Parse command-line arguments and execute
   */
  async parseAndExecute(args: string[]): Promise<number> {
    try {
      await this.program.parseAsync(args);
      return 0; // If we get here, the action handler should have called process.exit
    } catch (error) {
      console.error('Error parsing arguments:', error instanceof Error ? error.message : 'Unknown error');
      return 1;
    }
  }
}

/**
 * Create and return a new CLI instance
 */
export function createCLI(): CLI {
  return new CLI();
}

/**
 * Main entry point for CLI execution
 * @param args - Command-line arguments (defaults to process.argv)
 */
export async function main(args: string[] = process.argv): Promise<number> {
  const cli = createCLI();
  return cli.parseAndExecute(args);
}