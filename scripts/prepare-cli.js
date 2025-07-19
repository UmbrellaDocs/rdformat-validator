#!/usr/bin/env node

/**
 * Script to prepare the CLI executable after TypeScript compilation
 * This ensures the CLI has proper shebang and executable permissions
 */

const fs = require('fs');
const path = require('path');

const cliDistPath = path.join(__dirname, '../dist/cli/index.js');
const binPath = path.join(__dirname, '../bin/rdformat-validator.js');

// Ensure bin directory exists
const binDir = path.dirname(binPath);
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// Read the compiled CLI file
if (!fs.existsSync(cliDistPath)) {
  console.error('Error: CLI dist file not found. Make sure to build CommonJS first.');
  process.exit(1);
}

const cliContent = fs.readFileSync(cliDistPath, 'utf8');

// Fix import paths for when the CLI is in the bin directory
let fixedContent = cliContent.replace(
  /require\("\.\.\/index"\)/g,
  'require("../dist/index")'
);

// Add main() call at the end to actually execute the CLI
fixedContent += `

// Execute CLI when run directly
if (require.main === module) {
    main().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
`;

// Add shebang and create executable
const executableContent = `#!/usr/bin/env node
${fixedContent}`;

// Write to bin directory
fs.writeFileSync(binPath, executableContent);

// Make executable (on Unix systems)
if (process.platform !== 'win32') {
  fs.chmodSync(binPath, '755');
}

console.log('CLI executable prepared successfully');
