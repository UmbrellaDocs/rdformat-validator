#!/usr/bin/env node

/**
 * Script to fix ES module imports by adding .js extensions
 * Required because TypeScript doesn't add extensions when compiling to ES modules
 */

const fs = require('fs');
const path = require('path');

function fixImportsInDir(dirPath) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      fixImportsInDir(fullPath);
    } else if (item.isFile() && item.name.endsWith('.js')) {
      fixImportsInFile(fullPath);
    }
  }
}

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Fix relative imports to add .js extension
  let fixedContent = content
    // Handle import statements
    .replace(/import\s+.*?\s+from\s+['"](\.\/.+?)['"];/g, (match, importPath) => {
      if (importPath.endsWith('.js')) return match;
      // Check if it's a directory import that should point to index.js
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return match.replace(importPath, importPath + '/index.js');
      }
      return match.replace(importPath, importPath + '.js');
    })
    // Handle import { } from statements (with line breaks)
    .replace(/import\s*\{[^}]*\}\s*from\s*['"](\.\/.+?)['"];/gs, (match, importPath) => {
      if (importPath.endsWith('.js')) return match;
      // Check if it's a directory import that should point to index.js
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return match.replace(importPath, importPath + '/index.js');
      }
      return match.replace(importPath, importPath + '.js');
    })
    // Handle relative imports that start with ../ (parent directory)
    .replace(/import\s+.*?\s+from\s+['"](\.\.\/.+?)['"];/g, (match, importPath) => {
      if (importPath.endsWith('.js')) return match;
      // Check if it's a directory import that should point to index.js
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return match.replace(importPath, importPath + '/index.js');
      }
      return match.replace(importPath, importPath + '.js');
    })
    // Handle dynamic imports
    .replace(/import\(['"](\.\/.+?)['"]\)/g, (match, importPath) => {
      if (importPath.endsWith('.js')) return match;
      // Check if it's a directory import that should point to index.js
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return match.replace(importPath, importPath + '/index.js');
      }
      return match.replace(importPath, importPath + '.js');
    })
    // Handle export * from statements
    .replace(/export \* from ['"](\.\/.+?)['"];/g, (match, importPath) => {
      if (importPath.endsWith('.js')) return match;
      // Check if it's a directory import that should point to index.js
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return match.replace(importPath, importPath + '/index.js');
      }
      return match.replace(importPath, importPath + '.js');
    });

  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

const esmDir = path.join(__dirname, '../dist/esm');
if (fs.existsSync(esmDir)) {
  fixImportsInDir(esmDir);
  console.log('ES module import paths fixed successfully');
} else {
  console.error('ESM dist directory not found');
  process.exit(1);
}
