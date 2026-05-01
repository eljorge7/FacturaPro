const fs = require('fs');
const content = fs.readFileSync('c:/Users/jorge/Documents/Antigravity/FacturaPro/backend/node_modules/@prisma/client/runtime/client.d.ts', 'utf8');
const startIndex = content.indexOf('export declare type PrismaClientOptions');
const endIndex = content.indexOf(';', startIndex);
console.log(content.substring(startIndex, endIndex + 100));
