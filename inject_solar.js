const fs = require('fs');

const file = 'c:\\\\Users\\\\jorge\\\\Documents\\\\Antigravity\\\\FacturaPro\\\\frontend\\\\src\\\\app\\\\quotes\\\\new\\\\page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add States
const state_injection = `  // Solar Calculator States
  const [isSolarModalOpen, setIsSolarModalOpen] = useState(false);
  const [solarData, setSolarData] = useState<any>(null);
  const [solarForm, setSolarForm] = useState({
      consumoAnual: 3439,
      colchon: 25,
      hsp: 5.5,
      eficiencia: 80,
      panelWatts: 620,
      panelModelo: "Módulo 620W",
      inversorModelo: "Inversor 3kW",
      costoKwp: 18000,
      tarifaCfe: 2.20
  });
`;
content = content.replace(/(const \[proposalData, setProposalData\] = useState\(\{[\s\S]*?\}\);)/, '$1\n\n' + state_injection);


// 2. Update load useEffect
const load_injection = `                 if (data.solarData) {
                    try {
                       const parsed = typeof data.solarData === 'string' ? JSON.parse(data.solarData) : data.solarData;
                       setSolarData(parsed);
                       setSolarForm(parsed);
                    } catch(e) {}
                 }`;
content = content.replace(/(if \(data\.isProposal\) \{[\s\S]*?\}\);)/, '$1\n' + load_injection);


// 3. Update handleSave payload
const save_injection = `          templateId: proposalData.templateId || undefined,\n          solarData: solarData ? JSON.stringify(solarData) : undefined,`;
content = content.replace(/templateId: proposalData\.templateId \|\| undefined,/, save_injection);


// 4. Inject Solar Calculator Button
const button_injection = `               <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
                  <div>
                     <h3 className="font-bold text-amber-900 flex items-center gap-2"><PanelRight className="w-5 h-5"/> Dimensionamiento Solar (Calculadora)</h3>
                     <p className="text-sm text-amber-700 mt-1">Calcula y genera una propuesta técnica para paneles solares.</p>
                  </div>
                  <button onClick={() => setIsSolarModalOpen(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm">
                    {solarData ? 'Ver / Editar Cálculo' : 'Abrir Calculadora'}
                  </button>
               </div>`;
content = content.replace(/(<div className="mt-8 border border-amber-200 bg-amber-50 rounded-xl p-5">[\s\S]*?<\/div>\s*<\/label>\s*<\/div>)/, '$1\n' + button_injection);


// 5. Inject Solar Modal UI before the last closing div
const modal_ui = `      {/* --- SOLAR CALCULATOR MODAL --- */}
      {isSolarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-amber-50">
              <div className="flex items-center gap-3">
                <PanelRight className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900">Calculadora de Dimensionamiento y ROI</h3>
                  <p className="text-xs text-slate-500">Ajusta los parámetros para generar la propuesta técnica fotovoltaica.</p>
                </div>
              </div>
              <button onClick={() => setIsSolarModalOpen(false)} className="p-2 hover:bg-amber-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
               
               <div className="space-y-4">
                  <h4 className="font-bold text-slate-700 border-b pb-2">1. Datos de Entrada</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500">Consumo Base Anual (kWh)</label>
                        <input type="number" value={solarForm.consumoAnual} onChange={e=>setSolarForm({...solarForm, consumoAnual: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Margen de Crecimiento (%)</label>
                        <input type="number" value={solarForm.colchon} onChange={e=>setSolarForm({...solarForm, colchon: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Horas Sol Pico (HSP)</label>
                        <input type="number" step="0.1" value={solarForm.hsp} onChange={e=>setSolarForm({...solarForm, hsp: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Eficiencia Sistema (%)</label>
                        <input type="number" value={solarForm.eficiencia} onChange={e=>setSolarForm({...solarForm, eficiencia: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                  </div>

                  <h4 className="font-bold text-slate-700 border-b pb-2 mt-6">Equipamiento</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500">Watts del Panel (W)</label>
                        <input type="number" value={solarForm.panelWatts} onChange={e=>setSolarForm({...solarForm, panelWatts: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Costo Estimado kWp ($)</label>
                        <input type="number" value={solarForm.costoKwp} onChange={e=>setSolarForm({...solarForm, costoKwp: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500">Modelo del Panel</label>
                        <input type="text" value={solarForm.panelModelo} onChange={e=>setSolarForm({...solarForm, panelModelo: e.target.value})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500">Modelo Inversor de Red</label>
                        <input type="text" value={solarForm.inversorModelo} onChange={e=>setSolarForm({...solarForm, inversorModelo: e.target.value})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Tarifa Promedio CFE ($/kWh)</label>
                        <input type="number" step="0.01" value={solarForm.tarifaCfe} onChange={e=>setSolarForm({...solarForm, tarifaCfe: Number(e.target.value)})} className="w-full border rounded p-2 text-sm mt-1" />
                     </div>
                  </div>
               </div>

               {(() => {
                  const consumoProyectado = solarForm.consumoAnual * (1 + (solarForm.colchon / 100));
                  const consumoDiario = consumoProyectado / 365;
                  const potenciaReq = consumoDiario / solarForm.hsp / (solarForm.eficiencia / 100);
                  const numPanelesExacto = (potenciaReq * 1000) / solarForm.panelWatts;
                  const numPaneles = Math.ceil(numPanelesExacto);
                  const potenciaInstalada = (numPaneles * solarForm.panelWatts) / 1000;
                  const generacionAnual = potenciaInstalada * solarForm.hsp * 365 * (solarForm.eficiencia / 100);
                  
                  const inversionTotal = potenciaInstalada * solarForm.costoKwp;
                  const ahorroAnual = generacionAnual * solarForm.tarifaCfe;
                  const roiAnios = (inversionTotal / ahorroAnual).toFixed(1);

                  return (
                     <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-700 border-b pb-2">2. Resultados del Dimensionamiento</h4>
                        
                        <div className="space-y-2 text-sm">
                           <div className="flex justify-between"><span className="text-slate-500">Consumo Total Proyectado:</span> <b>{consumoProyectado.toFixed(1)} kWh/Año</b></div>
                           <div className="flex justify-between"><span className="text-slate-500">Potencia Fotovoltaica Requerida:</span> <b>{potenciaReq.toFixed(2)} kWp</b></div>
                           <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded"><span className="font-bold">Número de Paneles:</span> <b className="text-lg">{numPaneles}</b></div>
                           <div className="flex justify-between"><span className="text-slate-500">Potencia Total Instalada:</span> <b>{potenciaInstalada.toFixed(2)} kWp</b></div>
                        </div>

                        <h4 className="font-bold text-slate-700 border-b pb-2 mt-6">3. Análisis Financiero y ROI</h4>
                        <div className="space-y-2 text-sm">
                           <div className="flex justify-between"><span className="text-slate-500">Generación Anual Estimada:</span> <b>{generacionAnual.toFixed(1)} kWh</b></div>
                           <div className="flex justify-between"><span className="text-slate-500">Inversión Total Estimada:</span> <b>\${inversionTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} MXN</b></div>
                           <div className="flex justify-between"><span className="text-slate-500">Ahorro Anual Estimado:</span> <b>\${ahorroAnual.toLocaleString(undefined, {minimumFractionDigits: 2})} MXN</b></div>
                           <div className="flex justify-between text-green-700 bg-green-50 p-2 rounded"><span className="font-bold">Retorno de Inversión:</span> <b className="text-lg">{roiAnios} Años</b></div>
                        </div>

                        <div className="mt-6">
                           <button 
                             onClick={() => {
                                setSolarData({
                                   ...solarForm,
                                   consumoProyectado,
                                   potenciaReq,
                                   numPaneles,
                                   potenciaInstalada,
                                   generacionAnual,
                                   inversionTotal,
                                   ahorroAnual,
                                   roiAnios
                                });
                                setIsSolarModalOpen(false);
                             }}
                             className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors"
                           >
                              Guardar Resultados en Cotización
                           </button>
                        </div>
                     </div>
                  );
               })()}

            </div>
          </div>
        </div>
      )}\n`;

content = content.replace(/(    <\/div>\s*\);\s*}\s*)$/, modal_ui + '$1');

fs.writeFileSync(file, content, 'utf-8');
console.log('Injected successfully!');
