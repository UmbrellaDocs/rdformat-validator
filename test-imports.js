// Test CommonJS import
const validator = require('./dist/index.js');
console.log('CommonJS import successful:', typeof validator.RDFormatValidator);

// Test ES module import (using dynamic import for testing)
import('./dist/esm/index.js').then(esm => {
  console.log('ES module import successful:', typeof esm.RDFormatValidator);
}).catch(err => {
  console.error('ES module import failed:', err.message);
});
