#!/usr/bin/env node

/**
 * CLI entry point for RDFormat Validator
 * Executable script that loads and runs the CLI module
 */

// Import the compiled CLI module
const { main } = require('../dist/cli/index.js');

// Execute the CLI with command-line arguments
main(process.argv)
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error.message || error);
    process.exit(1);
  });