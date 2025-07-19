const obj = { location: { path: 'src/test.js' } };
const isPartial = typeof obj === 'object' && 
                  obj !== null && 
                  !Array.isArray(obj) &&
                  (obj.hasOwnProperty('message') || 
                   obj.hasOwnProperty('location') || 
                   obj.hasOwnProperty('severity') ||
                   obj.hasOwnProperty('source'));
console.log('Is partial diagnostic:', isPartial);
console.log('Has location:', obj.hasOwnProperty('location'));