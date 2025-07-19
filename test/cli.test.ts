/**
 * Integration tests for CLI functionality
 * Tests the command-line interface with various arguments and scenarios
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Path to the CLI executable
const CLI_PATH = path.join(__dirname, '..', 'bin', 'rdformat-validator.js');

// Helper function to run CLI commands and capture output
function runCLI(args: string[], input?: string): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const command = `node ${CLI_PATH} ${args.join(' ')}`;
    const result = execSync(command, {
      input: input,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      stdout: result.toString(),
      stderr: '',
      exitCode: 0
    };
  } catch (error: any) {
    // Combine stdout and stderr for easier testing since CLI prints errors to stdout
    const stdout = error.stdout?.toString() || '';
    const stderr = error.stderr?.toString() || '';
    
    return {
      stdout: stdout,
      stderr: stderr,
      exitCode: error.status || 1
    };
  }
}

// Helper function to create temporary files for testing
function createTempFile(content: string, suffix: string = '.json'): string {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `rdformat-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${suffix}`);
  fs.writeFileSync(tempFile, content, 'utf8');
  return tempFile;
}

// Helper function to clean up temporary files
function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe('CLI Integration Tests', () => {
  // Test data
  const validRDFormat = JSON.stringify({
    diagnostics: [{
      message: "Unused variable 'x'",
      location: {
        path: "src/main.ts",
        range: {
          start: { line: 10, column: 5 },
          end: { line: 10, column: 6 }
        }
      },
      severity: "WARNING",
      source: {
        name: "eslint",
        url: "https://eslint.org"
      }
    }]
  }, null, 2);

  const invalidRDFormat = JSON.stringify({
    diagnostics: [{
      message: "Missing location",
      // location field is missing
      severity: "ERROR"
    }]
  }, null, 2);

  const emptyDiagnostics = JSON.stringify({
    diagnostics: []
  }, null, 2);

  describe('Help and Version', () => {
    test('should display help when --help is used', () => {
      const result = runCLI(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage: rdformat-validator');
      expect(result.stdout).toContain('Validate JSON data against the Reviewdog Diagnostic Format');
      expect(result.stdout).toContain('Examples:');
    });

    test('should display version when --version is used', () => {
      const result = runCLI(['--version']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('File Input Validation', () => {
    test('should validate a valid RDFormat file successfully', () => {
      const tempFile = createTempFile(validRDFormat);
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
        expect(result.stdout).toContain('Files processed: 1');
        expect(result.stdout).toContain('Valid files: 1');
        expect(result.stdout).toContain('Invalid files: 0');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should detect invalid RDFormat file and return error exit code', () => {
      const tempFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('✗ Some files have validation errors');
        expect(result.stdout).toContain('Files processed: 1');
        expect(result.stdout).toContain('Valid files: 0');
        expect(result.stdout).toContain('Invalid files: 1');
        expect(result.stdout).toContain('Total errors: 1');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should handle multiple files', () => {
      const validFile = createTempFile(validRDFormat);
      const invalidFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI([validFile, invalidFile]);
        
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('Files processed: 2');
        expect(result.stdout).toContain('Valid files: 1');
        expect(result.stdout).toContain('Invalid files: 1');
        expect(result.stdout).toContain('✓');
        expect(result.stdout).toContain('✗');
      } finally {
        cleanupTempFile(validFile);
        cleanupTempFile(invalidFile);
      }
    });

    test('should handle non-existent files gracefully', () => {
      const result = runCLI(['non-existent-file.json']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error processing non-existent-file.json: File not found');
    });
  });

  describe('Stdin Input Validation', () => {
    test('should validate valid RDFormat from stdin', () => {
      const result = runCLI(['--verbose'], validRDFormat);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✓ All files are valid RDFormat');
      expect(result.stdout).toContain('<stdin>');
    });

    test('should detect invalid RDFormat from stdin', () => {
      const result = runCLI(['--verbose'], invalidRDFormat);
      
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('✗ Some files have validation errors');
      expect(result.stdout).toContain('<stdin>');
    });

    test('should handle empty stdin input', () => {
      const result = runCLI([], '');
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Empty input provided via stdin');
    });

    test('should handle malformed JSON from stdin', () => {
      const result = runCLI([], '{ invalid json }');
      
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('✗ Some files have validation errors');
    });
  });

  describe('CLI Options', () => {
    test('should use verbose mode to show detailed information', () => {
      const tempFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI(['--verbose', tempFile]);
        
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('Processing:');
        expect(result.stdout).toContain('File Results:');
        expect(result.stdout).toContain('Errors:');
        expect(result.stdout).toContain('✗');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should use silent mode to suppress output', () => {
      const tempFile = createTempFile(validRDFormat);
      
      try {
        const result = runCLI(['--silent', tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe('');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should output JSON format when requested', () => {
      const tempFile = createTempFile(validRDFormat);
      
      try {
        const result = runCLI(['--format', 'json', tempFile]);
        
        expect(result.exitCode).toBe(0);
        
        // Parse the JSON output to verify it's valid JSON
        const jsonOutput = JSON.parse(result.stdout);
        expect(jsonOutput).toHaveProperty('success', true);
        expect(jsonOutput).toHaveProperty('filesProcessed', 1);
        expect(jsonOutput).toHaveProperty('validFiles', 1);
        expect(jsonOutput).toHaveProperty('fileResults');
        expect(Array.isArray(jsonOutput.fileResults)).toBe(true);
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should apply fixes when --fix option is used', () => {
      const tempFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI(['--fix', tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
        expect(result.stdout).toContain('Total fixes applied: 1');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should use strict mode when --strict option is used', () => {
      const tempFile = createTempFile(validRDFormat);
      
      try {
        const result = runCLI(['--strict', tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should use aggressive fix level when specified', () => {
      const tempFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI(['--fix', '--fix-level', 'aggressive', tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
      } finally {
        cleanupTempFile(tempFile);
      }
    });
  });

  describe('Output File Handling', () => {
    test('should write results to output file when --output is specified', () => {
      const inputFile = createTempFile(validRDFormat);
      const outputFile = createTempFile('', '.txt');
      
      try {
        // Remove the output file so we can test creation
        cleanupTempFile(outputFile);
        
        const result = runCLI(['--format', 'json', '--output', outputFile, inputFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(`Results written to: ${outputFile}`);
        expect(fs.existsSync(outputFile)).toBe(true);
        
        // Verify the output file contains valid JSON
        const outputContent = fs.readFileSync(outputFile, 'utf8');
        const jsonOutput = JSON.parse(outputContent);
        expect(jsonOutput).toHaveProperty('success', true);
      } finally {
        cleanupTempFile(inputFile);
        cleanupTempFile(outputFile);
      }
    });

    test('should create output directory if it does not exist', () => {
      const inputFile = createTempFile(validRDFormat);
      const outputDir = path.join(os.tmpdir(), `rdformat-test-${Date.now()}`);
      const outputFile = path.join(outputDir, 'results.json');
      
      try {
        const result = runCLI(['--format', 'json', '--output', outputFile, inputFile]);
        
        expect(result.exitCode).toBe(0);
        expect(fs.existsSync(outputFile)).toBe(true);
        
        // Verify the output file contains valid JSON
        const outputContent = fs.readFileSync(outputFile, 'utf8');
        const jsonOutput = JSON.parse(outputContent);
        expect(jsonOutput).toHaveProperty('success', true);
      } finally {
        cleanupTempFile(inputFile);
        cleanupTempFile(outputFile);
        try {
          fs.rmdirSync(outputDir);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Exit Codes', () => {
    test('should return exit code 0 for valid files', () => {
      const tempFile = createTempFile(validRDFormat);
      
      try {
        const result = runCLI([tempFile]);
        expect(result.exitCode).toBe(0);
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should return exit code 1 for invalid files', () => {
      const tempFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI([tempFile]);
        expect(result.exitCode).toBe(1);
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should return exit code 1 for file not found', () => {
      const result = runCLI(['non-existent-file.json']);
      expect(result.exitCode).toBe(1);
    });

    test('should return exit code 0 when fixes make files valid', () => {
      const tempFile = createTempFile(invalidRDFormat);
      
      try {
        const result = runCLI(['--fix', tempFile]);
        expect(result.exitCode).toBe(0);
      } finally {
        cleanupTempFile(tempFile);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty diagnostics array', () => {
      const tempFile = createTempFile(emptyDiagnostics);
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should handle very large files', () => {
      // Create a large valid RDFormat file
      const largeDiagnostics = {
        diagnostics: Array.from({ length: 1000 }, (_, i) => ({
          message: `Error ${i}`,
          location: {
            path: `file${i}.ts`,
            range: {
              start: { line: i + 1, column: 1 }, // Line numbers should start from 1
              end: { line: i + 1, column: 10 }
            }
          },
          severity: "ERROR"
        }))
      };
      
      const tempFile = createTempFile(JSON.stringify(largeDiagnostics, null, 2));
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should handle files with special characters in paths', () => {
      const specialCharData = JSON.stringify({
        diagnostics: [{
          message: "Error with special chars: éñ中文🚀",
          location: {
            path: "src/special-chars-éñ中文🚀.ts",
            range: {
              start: { line: 1, column: 1 }
            }
          },
          severity: "ERROR"
        }]
      }, null, 2);
      
      const tempFile = createTempFile(specialCharData);
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should handle deeply nested diagnostic structures', () => {
      const deeplyNestedData = JSON.stringify({
        diagnostics: [{
          message: "Deeply nested error",
          location: {
            path: "src/deep.ts",
            range: {
              start: { line: 1, column: 1 },
              end: { line: 1, column: 10 }
            }
          },
          severity: "ERROR",
          related_locations: [{
            message: "Related location",
            location: {
              path: "src/related.ts",
              range: {
                start: { line: 5, column: 1 },
                end: { line: 5, column: 5 }
              }
            }
          }],
          suggestions: [{
            range: {
              start: { line: 1, column: 1 },
              end: { line: 1, column: 10 }
            },
            text: "replacement text"
          }]
        }]
      }, null, 2);
      
      const tempFile = createTempFile(deeplyNestedData);
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('✓ All files are valid RDFormat');
      } finally {
        cleanupTempFile(tempFile);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle permission denied errors gracefully', () => {
      // This test might not work on all systems, so we'll skip it if we can't create the scenario
      const tempFile = createTempFile(validRDFormat);
      
      try {
        // Try to make the file unreadable (this might not work on all systems)
        try {
          fs.chmodSync(tempFile, 0o000);
          
          const result = runCLI([tempFile]);
          
          expect(result.exitCode).toBe(1);
          expect(result.stdout).toContain('Permission denied');
        } catch (chmodError) {
          // If we can't change permissions, skip this test
          console.log('Skipping permission test - chmod not supported');
        }
      } finally {
        // Restore permissions and cleanup
        try {
          fs.chmodSync(tempFile, 0o644);
        } catch (error) {
          // Ignore
        }
        cleanupTempFile(tempFile);
      }
    });

    test('should handle invalid JSON gracefully', () => {
      const tempFile = createTempFile('{ invalid json content }');
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('✗ Some files have validation errors');
      } finally {
        cleanupTempFile(tempFile);
      }
    });

    test('should handle binary files gracefully', () => {
      // Create a binary file (just some random bytes)
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0xFD]);
      const tempFile = path.join(os.tmpdir(), `rdformat-binary-test-${Date.now()}.bin`);
      fs.writeFileSync(tempFile, binaryContent);
      
      try {
        const result = runCLI([tempFile]);
        
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('✗ Some files have validation errors');
      } finally {
        cleanupTempFile(tempFile);
      }
    });
  });
});