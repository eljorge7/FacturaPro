const fs = require('fs');
const file = 'c:\\\\Users\\\\jorge\\\\Documents\\\\Antigravity\\\\FacturaPro\\\\frontend\\\\src\\\\app\\\\quotes\\\\new\\\\page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Fix template literal escapes
content = content.replace(/description: \\`\\[\\$\\{selectedPanel.model\\}\\] \\$\\{selectedPanel.title\\}\\`,/g, "description: `[${selectedPanel.model}] ${selectedPanel.title}`,");
content = content.replace(/description: \\`\\[\\$\\{selectedInverter.model\\}\\] \\$\\{selectedInverter.title\\}\\`,/g, "description: `[${selectedInverter.model}] ${selectedInverter.title}`,");

content = content.replace(/description: \\`\\[\\$\\{prod.model\\}\\] \\$\\{prod.title\\}\\`,/g, "description: `[${prod.model}] ${prod.title}`,");

// 2. Fix the corrupted characters
content = content.replace(/Mano de Obra, Estructura y Material El[é]ctrico \(Instalaci[ó]n Sistema Fotovoltaico\)/g, "Mano de Obra, Estructura y Material Eléctrico (Instalación Sistema Fotovoltaico)");
content = content.replace(/M[ó]dulo 620W/g, "Módulo 620W");
content = content.replace(/Guardar Resultados en Cotizaci[ó]n/g, "Guardar Resultados en Cotización");

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed syntax and encoding!');
