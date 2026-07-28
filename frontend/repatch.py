import re

with open('c:\\\\Users\\\\jorge\\\\Documents\\\\Antigravity\\\\FacturaPro\\\\frontend\\\\src\\\\app\\\\quotes\\\\new\\\\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
state_old = "  const [isSolarModalOpen, setIsSolarModalOpen] = useState(false);"
state_new = """  const [isSolarModalOpen, setIsSolarModalOpen] = useState(false);
  const [syscomSelectMode, setSyscomSelectMode] = useState<'PANEL' | 'INVERSOR' | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [selectedInverter, setSelectedInverter] = useState<any>(null);"""
content = content.replace(state_old, state_new)

# 2. Form state
form_old = """      costoKwp: 18000,
      tarifaCfe: 2.20"""
form_new = """      costoKwp: 18000,
      costoInstalacion: 15000,
      tarifaCfe: 2.20"""
content = content.replace(form_old, form_new)

# 3. Equipamiento UI
ui_old = """<div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500">Modelo del Panel</label>
                        <input type="text" value={solarForm.panelModelo} onChange={e=>setSolarForm({...solarForm, panelModelo: e.target.value})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500">Modelo Inversor de Red</label>
                        <input type="text" value={solarForm.inversorModelo} onChange={e=>setSolarForm({...solarForm, inversorModelo: e.target.value})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>"""
ui_new = """<div className="col-span-2 p-3 bg-slate-100 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 block mb-2">Panel Solar (Búsqueda en Syscom)</label>
                        {selectedPanel ? (
                           <div className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-slate-200">
                              <div className="flex items-center gap-3">
                                 {selectedPanel.imageUrl ? <img src={selectedPanel.imageUrl} className="w-10 h-10 object-contain rounded" /> : <div className="w-10 h-10 bg-slate-100 rounded"></div>}
                                 <div>
                                    <p className="text-xs font-bold text-blue-600 line-clamp-1">{selectedPanel.model}</p>
                                    <p className="text-[10px] text-slate-500 line-clamp-1">{selectedPanel.title}</p>
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
                     </div>"""
content = content.replace(ui_old, ui_new)

# 4. Save logic in Solar modal
# Need to specifically replace the onClick of "Guardar Resultados en Cotización"
save_btn_old = """                             onClick={() => {
                                const newItems = [...items];
                                // Si solo hay un item vacio, lo quitamos
                                if (newItems.length === 1 && newItems[0].description === "" && newItems[0].unitPrice === 0) {
                                   newItems.pop();
                                }
                                newItems.push({
                                   productId: "",
                                   description: `[Panel Solar] ${solarForm.panelModelo}`,
                                   imageUrl: "",
                                   quantity: numPaneles,
                                   unitPrice: 0,
                                   taxRate: 0.16,
                                   discount: 0,
                                   type: "ITEM"
                                });
                                newItems.push({
                                   productId: "",
                                   description: `[Inversor] ${solarForm.inversorModelo}`,
                                   imageUrl: "",
                                   quantity: 1,
                                   unitPrice: 0,
                                   taxRate: 0.16,
                                   discount: 0,
                                   type: "ITEM"
                                });
                                setItems(newItems);
                                setIsSolarModalOpen(false);
                             }}"""
save_btn_new = """                             onClick={() => {
                                const newItems = [...items];
                                if (newItems.length === 1 && newItems[0].description === "" && newItems[0].unitPrice === 0) {
                                   newItems.pop();
                                }
                                
                                if (selectedPanel) {
                                   newItems.push({
                                      productId: "",
                                      description: `[${selectedPanel.model}] ${selectedPanel.title}`,
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
                                      description: `[${selectedInverter.model}] ${selectedInverter.title}`,
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
                                   description: `Mano de Obra, Estructura y Material Eléctrico (Instalación Sistema Fotovoltaico)`,
                                   imageUrl: "",
                                   quantity: 1,
                                   unitPrice: solarForm.costoInstalacion || 0,
                                   taxRate: 0.16,
                                   discount: 0,
                                   type: "ITEM"
                                });

                                setItems(newItems);
                                setIsSolarModalOpen(false);
                             }}"""
content = content.replace(save_btn_old, save_btn_new)


# 5. ROI Logic
roi_old = "const inversionTotal = potenciaInstalada * solarForm.costoKwp;"
roi_new = """const costoPaneles = (selectedPanel?.finalPrice || 0) * numPaneles;
                  const costoInversor = selectedInverter?.finalPrice || 0;
                  const costoExtra = solarForm.costoInstalacion || 0;
                  const inversionTotal = costoPaneles + costoInversor + costoExtra;"""
content = content.replace(roi_old, roi_new)


# 6. Syscom close button
close_old = """<button onClick={() => setIsSyscomModalOpen(false)} className="p-2 hover:bg-purple-100 rounded-full text-slate-500">"""
close_new = """<button onClick={() => { setIsSyscomModalOpen(false); setSyscomSelectMode(null); }} className="p-2 hover:bg-purple-100 rounded-full text-slate-500">"""
content = content.replace(close_old, close_new)


# 7. Syscom Select Logic
syscom_select_old = """                      let finalPrice = prod.price;
                      if (currency === 'MXN') {
                         finalPrice = prod.price * exchangeRate;
                      }
                      newItems[targetIdx] = {
                         productId: "",
                         description: `[${prod.model}] ${prod.title}`,
                         imageUrl: prod.imageUrl || "",
                         quantity: 1,
                         unitPrice: finalPrice,
                         taxRate: 0.16,
                         discount: 0,
                         type: "ITEM"
                      };
                      setItems(newItems);
                      setIsSyscomModalOpen(false);"""

syscom_select_new = """                      let finalPrice = prod.price;
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
                         description: `[${prod.model}] ${prod.title}`,
                         imageUrl: prod.imageUrl || "",
                         quantity: 1,
                         unitPrice: finalPrice,
                         taxRate: 0.16,
                         discount: 0,
                         type: "ITEM"
                      };
                      setItems(newItems);
                      setIsSyscomModalOpen(false);"""
content = content.replace(syscom_select_old, syscom_select_new)

with open('c:\\\\Users\\\\jorge\\\\Documents\\\\Antigravity\\\\FacturaPro\\\\frontend\\\\src\\\\app\\\\quotes\\\\new\\\\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
