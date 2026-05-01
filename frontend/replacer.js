const fs = require('fs');
const file = 'c:/Users/jorge/Documents/Antigravity/FacturaPro/frontend/src/app/invoices/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '<button className="bg-[#2563eb] text-white hover:bg-blue-700 font-bold px-3 py-1 text-xs rounded shadow-sm">Timbrar CFDI 4.0</button>',
  '<button onClick={() => handleStamp(selectedInvoice.id)} className="bg-[#2563eb] text-white hover:bg-blue-700 font-bold px-3 py-1 text-xs rounded shadow-sm">Timbrar CFDI 4.0</button>'
);
fs.writeFileSync(file, content);
console.log('Button replaced successfully');
