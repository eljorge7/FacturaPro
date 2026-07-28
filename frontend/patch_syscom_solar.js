const fs = require('fs');

const file = 'c:\\\\Users\\\\jorge\\\\Documents\\\\Antigravity\\\\FacturaPro\\\\frontend\\\\src\\\\app\\\\quotes\\\\new\\\\page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. States
content = content.replace(
  "  const [isSolarModalOpen, setIsSolarModalOpen] = useState(false);",
  "  const [isSolarModalOpen, setIsSolarModalOpen] = useState(false);\n  const [syscomSelectMode, setSyscomSelectMode] = useState<'PANEL' | 'INVERSOR' | null>(null);\n  const [selectedPanel, setSelectedPanel] = useState<any>(null);\n  const [selectedInverter, setSelectedInverter] = useState<any>(null);"
);

content = content.replace(
  "costoKwp: 18000,",
  "costoKwp: 18000,\n      costoInstalacion: 15000,"
);

// 2. Syscom UI in Calculator
const syscomUI = `<div className="col-span-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 block mb-2">Panel Solar (Búsqueda en Syscom)</label>
                        {selectedPanel ? (
                           <div className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-slate-200">
                              <div className="flex items-center gap-3">
                                 {selectedPanel.imageUrl ? <img src={selectedPanel.imageUrl} className="w-10 h-10 object-contain rounded" /> : <div className="w-10 h-10 bg-slate-100 rounded"></div>}
                                 <div>
                                    <p className="text-xs font-bold text-blue-600 line-clamp-1">{selectedPanel.model}</p>
                                    <p className="text-[10px] text-slate-500 line-clamp-1">{selectedPanel.title}</p>
                                    <p className="text-xs font-bold text-emerald-600">$\\{selectedPanel.finalPrice?.toLocaleString('en-US', {minimumFractionDigits:2}) || 0} MXN</p>
                                 </div>
                              </div>
                              <button onClick={() => { setSyscomSelectMode('PANEL'); setIsSyscomModalOpen(true); }} className="text-xs text-purple-600 hover:underline px-2">Cambiar</button>
                           </div>
                        ) : (
                           <button onClick={() => { setSyscomSelectMode('PANEL'); setIsSyscomModalOpen(true); }} className="w-full flex items-center justify-center gap-2 bg-white border border-purple-200 hover:border-purple-500 text-purple-600 text-sm py-2 rounded transition-colors shadow-sm font-bold">
                              <Globe className="w-4 h-4" /> Buscar Panel en Syscom
                           </button>
                        )}
                     </div>

                     <div className="col-span-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 block mb-2">Inversor Central (Búsqueda en Syscom)</label>
                        {selectedInverter ? (
                           <div className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-slate-200">
                              <div className="flex items-center gap-3">
                                 {selectedInverter.imageUrl ? <img src={selectedInverter.imageUrl} className="w-10 h-10 object-contain rounded" /> : <div className="w-10 h-10 bg-slate-100 rounded"></div>}
                                 <div>
                                    <p className="text-xs font-bold text-blue-600 line-clamp-1">{selectedInverter.model}</p>
                                    <p className="text-[10px] text-slate-500 line-clamp-1">{selectedInverter.title}</p>
                                    <p className="text-xs font-bold text-emerald-600">$\\{selectedInverter.finalPrice?.toLocaleString('en-US', {minimumFractionDigits:2}) || 0} MXN</p>
                                 </div>
                              </div>
                              <button onClick={() => { setSyscomSelectMode('INVERSOR'); setIsSyscomModalOpen(true); }} className="text-xs text-purple-600 hover:underline px-2">Cambiar</button>
                           </div>
                        ) : (
                           <button onClick={() => { setSyscomSelectMode('INVERSOR'); setIsSyscomModalOpen(true); }} className="w-full flex items-center justify-center gap-2 bg-white border border-purple-200 hover:border-purple-500 text-purple-600 text-sm py-2 rounded transition-colors shadow-sm font-bold">
                              <Globe className="w-4 h-4" /> Buscar Inversor en Syscom
                           </button>
                        )}
                     </div>

                     <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500">Mano de Obra y Extras ($ Llave en Mano)</label>
                        <input type="number" value={solarForm.costoInstalacion} onChange={e=>setSolarForm({...solarForm, costoInstalacion: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1 bg-green-50 focus:bg-white" />
                     </div>`;

content = content.replace(
  /<div className="col-span-2">\s*<label className="text-xs font-bold text-slate-500">Modelo del Panel<\/label>\s*<input type="text".*?\/>\s*<\/div>\s*<div className="col-span-2">\s*<label className="text-xs font-bold text-slate-500">Modelo Inversor de Red<\/label>\s*<input type="text".*?\/>\s*<\/div>/g,
  syscomUI
);

// 3. Syscom Modal additions
content = content.replace(
  /<button onClick=\{\(\) => setIsSyscomModalOpen\(false\)\} className="p-2 hover:bg-purple-100 rounded-full text-slate-500">/,
  `<button onClick={() => { setIsSyscomModalOpen(false); setSyscomSelectMode(null); }} className="p-2 hover:bg-purple-100 rounded-full text-slate-500">`
);

const syscomAddOld = `                      let finalPrice = prod.price;
                      if (currency === 'MXN') {
                         finalPrice = prod.price * exchangeRate;
                      }
                      newItems[targetIdx] = {
                         productId: "",
                         description: \\\`[\\$\\{prod.model\\}] \\$\\{prod.title\\}\\\`,
                         imageUrl: prod.imageUrl || "",
                         quantity: 1,
                         unitPrice: finalPrice,
                         taxRate: 0.16,
                         discount: 0,
                         type: "ITEM"
                      };
                      setItems(newItems);
                      setIsSyscomModalOpen(false);`;

const syscomAddNew = `                      let finalPrice = prod.price;
                      if (currency === 'MXN') {
                         finalPrice = prod.price * exchangeRate;
                      }

                      if (syscomSelectMode === 'PANEL') {
                         setSelectedPanel({...prod, finalPrice});
                         setSolarForm({...solarForm, panelModelo: prod.model});
                         setIsSyscomModalOpen(false);
                         setSyscomSelectMode(null);
                         return;
                      }
                      if (syscomSelectMode === 'INVERSOR') {
                         setSelectedInverter({...prod, finalPrice});
                         setSolarForm({...solarForm, inversorModelo: prod.model});
                         setIsSyscomModalOpen(false);
                         setSyscomSelectMode(null);
                         return;
                      }

                      newItems[targetIdx] = {
                         productId: "",
                         description: \\\`[\\$\\{prod.model\\}] \\$\\{prod.title\\}\\\`,
                         imageUrl: prod.imageUrl || "",
                         quantity: 1,
                         unitPrice: finalPrice,
                         taxRate: 0.16,
                         discount: 0,
                         type: "ITEM"
                      };
                      setItems(newItems);
                      setIsSyscomModalOpen(false);`;

content = content.replace(/let finalPrice = prod\.price;[\s\S]*?setIsSyscomModalOpen\(false\);/, syscomAddNew);

// 4. Save logic
const saveLogicNew = `const newItems = [...items];
                                if (newItems.length === 1 && newItems[0].description === "" && newItems[0].unitPrice === 0) {
                                   newItems.pop();
                                }
                                
                                if (selectedPanel) {
                                   newItems.push({
                                      productId: "",
                                      description: \\\`[\\$\\{selectedPanel.model\\}] \\$\\{selectedPanel.title\\}\\\`,
                                      imageUrl: selectedPanel.imageUrl || "",
                                      quantity: numPaneles,
                                      unitPrice: selectedPanel.finalPrice,
                                      taxRate: 0.16,
                                      discount: 0,
                                      type: "ITEM"
                                   });
                                }
                                if (selectedInverter) {
                                   newItems.push({
                                      productId: "",
                                      description: \\\`[\\$\\{selectedInverter.model\\}] \\$\\{selectedInverter.title\\}\\\`,
                                      imageUrl: selectedInverter.imageUrl || "",
                                      quantity: 1,
                                      unitPrice: selectedInverter.finalPrice,
                                      taxRate: 0.16,
                                      discount: 0,
                                      type: "ITEM"
                                   });
                                }
                                
                                newItems.push({
                                   productId: "",
                                   description: \\\`Mano de Obra, Estructura y Material Eléctrico (Instalación Sistema Fotovoltaico)\\\`,
                                   imageUrl: "",
                                   quantity: 1,
                                   unitPrice: solarForm.costoInstalacion || 0,
                                   taxRate: 0.16,
                                   discount: 0,
                                   type: "ITEM"
                                });

                                setItems(newItems);
                                setIsSolarModalOpen(false);`;

content = content.replace(/const newItems = \[\.\.\.items\];[\s\S]*?setIsSolarModalOpen\(false\);/, saveLogicNew);

const roiCalcNew = `const costoPaneles = (selectedPanel?.finalPrice || 0) * numPaneles;
                  const costoInversor = selectedInverter?.finalPrice || 0;
                  const costoExtra = solarForm.costoInstalacion || 0;
                  const inversionTotal = costoPaneles + costoInversor + costoExtra;`;
content = content.replace(/const inversionTotal = potenciaInstalada \* solarForm\.costoKwp;/, roiCalcNew);

fs.writeFileSync(file, content, 'utf-8');
console.log('Successfully patched page.tsx');
