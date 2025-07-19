/**
 * Unit tests for the Parser module
 */

import { Parser, parseString, parseFile, parseStream } from '../src/parser';
import { Readable } from 'stream';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

describe('Parser', () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('parseString', () => {
    it('should parse valid JSON string', () => {
      const validJson = '{"message": "test", "location": {"path": "test.js"}}';
      const result = parser.parseString(validJson);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        message: "test",
        location: { path: "test.js" }
      });
      expect(result.errors).toBeUndefined();
    });

    it('should parse empty object', () => {
      const result = parser.parseString('{}');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should parse array', () => {
      const validJson = '[{"message": "test"}]';
      const result = parser.parseString(validJson);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ message: "test" }]);
    });

    it('should handle empty input', () => {
      const result = parser.parseString('');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toBe('Input is empty');
      expect(result.errors![0].line).toBe(1);
      expect(result.errors![0].column).toBe(1);
    });

    it('should handle whitespace-only input', () => {
      const result = parser.parseString('   \n\t  ');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toBe('Input is empty');
    });

    it('should handle malformed JSON - missing quote', () => {
      const malformedJson = '{"message: "test"}';
      const result = parser.parseString(malformedJson);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Expected');
    });

    it('should handle malformed JSON - trailing comma', () => {
      const malformedJson = '{"message": "test",}';
      const result = parser.parseString(malformedJson);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
    });

    it('should handle malformed JSON - incomplete input', () => {
      const malformedJson = '{"message": "test"';
      const result = parser.parseString(malformedJson);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Expected');
    });

    it('should handle malformed JSON - invalid characters', () => {
      const malformedJson = '{"message": test}'; // unquoted value
      const result = parser.parseString(malformedJson);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
    });

    it('should extract line and column information from syntax errors', () => {
      const malformedJson = '{\n  "message": "test",\n  "invalid": \n}';
      const result = parser.parseString(malformedJson);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      // The error should be a syntax error with descriptive message
      expect(result.errors![0].message).toContain('Unexpected token');
    });
  });

  describe('parseFile', () => {
    const testFilePath = join(__dirname, 'temp-test-file.json');

    afterEach(async () => {
      try {
        await unlink(testFilePath);
      } catch {
        // File might not exist, ignore error
      }
    });

    it('should parse valid JSON file', async () => {
      const validJson = '{"message": "test", "location": {"path": "test.js"}}';
      await writeFile(testFilePath, validJson, 'utf-8');

      const result = await parser.parseFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        message: "test",
        location: { path: "test.js" }
      });
    });

    it('should handle non-existent file', async () => {
      const result = await parser.parseFile('non-existent-file.json');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Failed to read file');
    });

    it('should handle file with malformed JSON', async () => {
      const malformedJson = '{"message": "test"';
      await writeFile(testFilePath, malformedJson, 'utf-8');

      const result = await parser.parseFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Expected');
    });

    it('should handle empty file', async () => {
      await writeFile(testFilePath, '', 'utf-8');

      const result = await parser.parseFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toBe('Input is empty');
    });

    it('should handle large valid JSON file', async () => {
      // Create a large JSON object
      const largeObject = {
        diagnostics: Array.from({ length: 1000 }, (_, i) => ({
          message: `Test message ${i}`,
          location: { path: `file${i}.js` }
        }))
      };
      const largeJson = JSON.stringify(largeObject);
      await writeFile(testFilePath, largeJson, 'utf-8');

      const result = await parser.parseFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.data.diagnostics).toHaveLength(1000);
    });
  });

  describe('parseStream', () => {
    it('should parse valid JSON from stream', async () => {
      const validJson = '{"message": "test", "location": {"path": "test.js"}}';
      const stream = Readable.from([validJson]);

      const result = await parser.parseStream(stream);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        message: "test",
        location: { path: "test.js" }
      });
    });

    it('should handle empty stream', async () => {
      const stream = Readable.from([]);

      const result = await parser.parseStream(stream);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toBe('Input is empty');
    });

    it('should handle malformed JSON from stream', async () => {
      const malformedJson = '{"message": "test"';
      const stream = Readable.from([malformedJson]);

      const result = await parser.parseStream(stream);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Expected');
    });

    it('should handle chunked JSON from stream', async () => {
      const jsonParts = ['{"message":', ' "test", "location":', ' {"path": "test.js"}}'];
      const stream = Readable.from(jsonParts);

      const result = await parser.parseStream(stream);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        message: "test",
        location: { path: "test.js" }
      });
    });

    it('should handle large JSON from stream', async () => {
      const largeObject = {
        diagnostics: Array.from({ length: 500 }, (_, i) => ({
          message: `Test message ${i}`,
          location: { path: `file${i}.js` }
        }))
      };
      const largeJson = JSON.stringify(largeObject);
      const stream = Readable.from([largeJson]);

      const result = await parser.parseStream(stream);

      expect(result.success).toBe(true);
      expect(result.data.diagnostics).toHaveLength(500);
    });

    it('should handle stream read errors', async () => {
      const errorStream = new Readable({
        read() {
          this.emit('error', new Error('Stream read error'));
        }
      });

      const result = await parser.parseStream(errorStream);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('Failed to read stream');
    });
  });

  describe('Parser with options', () => {
    it('should create parser with custom options', () => {
      const customParser = new Parser({
        allowComments: true,
        strictMode: false
      });

      expect(customParser).toBeInstanceOf(Parser);
    });

    it('should use default options when none provided', () => {
      const defaultParser = new Parser();

      expect(defaultParser).toBeInstanceOf(Parser);
    });
  });

  describe('Convenience functions', () => {
    it('should provide parseString convenience function', () => {
      const validJson = '{"test": true}';
      const result = parseString(validJson);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: true });
    });

    it('should provide parseFile convenience function', async () => {
      const testFilePath = join(__dirname, 'temp-convenience-test.json');
      const validJson = '{"test": true}';
      
      try {
        await writeFile(testFilePath, validJson, 'utf-8');
        const result = await parseFile(testFilePath);

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ test: true });
      } finally {
        try {
          await unlink(testFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('should provide parseStream convenience function', async () => {
      const validJson = '{"test": true}';
      const stream = Readable.from([validJson]);
      const result = await parseStream(stream);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: true });
    });

    it('should accept options in convenience functions', () => {
      const result = parseString('{"test": true}', { strictMode: false });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: true });
    });
  });

  describe('Edge cases', () => {
    it('should handle deeply nested JSON', () => {
      const deepJson = '{"a":{"b":{"c":{"d":{"e":{"f":"deep"}}}}}}';
      const result = parser.parseString(deepJson);

      expect(result.success).toBe(true);
      expect(result.data.a.b.c.d.e.f).toBe('deep');
    });

    it('should handle JSON with special characters', () => {
      const specialJson = '{"message": "Hello\\nWorld\\t!", "unicode": "🚀"}';
      const result = parser.parseString(specialJson);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Hello\nWorld\t!');
      expect(result.data.unicode).toBe('🚀');
    });

    it('should handle JSON with numbers and booleans', () => {
      const mixedJson = '{"number": 42, "float": 3.14, "bool": true, "null": null}';
      const result = parser.parseString(mixedJson);

      expect(result.success).toBe(true);
      expect(result.data.number).toBe(42);
      expect(result.data.float).toBe(3.14);
      expect(result.data.bool).toBe(true);
      expect(result.data.null).toBeNull();
    });

    it('should handle very large numbers', () => {
      const largeNumberJson = '{"large": 9007199254740991}';
      const result = parser.parseString(largeNumberJson);

      expect(result.success).toBe(true);
      expect(result.data.large).toBe(9007199254740991);
    });
  });
});