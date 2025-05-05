require('dotenv').config();
const fs = require('fs');
const path = require('path');

function getDatabase() {
  return 'postgresql';
}

const databaseType = getDatabase();

if (!databaseType || !['mysql', 'postgresql'].includes(databaseType)) {
  throw new Error('Missing or invalid database');
}

console.log(`Database type detected: ${databaseType}`);

const src = path.resolve(__dirname, `../prisma/schema.${databaseType}.prisma`);
const dest = path.resolve(__dirname, '../prisma/schema.prisma');

fs.copyFileSync(src, dest);

console.log(`Copied ${src} to ${dest}`);
