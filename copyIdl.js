// copyIdl.js
const fs = require('fs');
const idl = require('./target/idl/channels.json');

fs.writeFileSync('./app/src/idl.json', JSON.stringify(idl));