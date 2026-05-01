"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, ChevronRight, FileText, Loader2, Receipt, ShieldCheck } from "lucide-react";

function KioskContent() {
  const { ticketId } = useParams();
  const searchParams = useSearchParams();
  
  const [ticketData, setTicketData] = useState<any>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  
  const [formData, setFormData] = useState({
     rfc: "",
     legalName: "",
     taxRegime: "601",
     zipCode: "",
     cfdiUse: "G03"
  });
  
  const [isStamping, setIsStamping] = useState(false);
  const [stampResult, setStampResult] = useState<any>(null);
  const [errorMenu, setErrorMenu] = useState<string | null>(null);

  useEffect(() => {
     // Fetch dynamic numbers from URL (OmniChat auto-sync)
     const amtParam = searchParams.get('total');
     const conceptParam = searchParams.get('concept');
     const companyParam = searchParams.get('company');

     // Fallbacks just in case the link didn't bring params
     const finalTotal = amtParam ? parseFloat(amtParam) : 4800.00;
     const finalConcept = conceptParam ? decodeURIComponent(conceptParam) : "Artículos Generales (Venta de Mostrador)";
     const finalName = companyParam || "Grupo Hurtado";

     // Fetch mock data for MVP
     setTimeout(() => {
       setTicketData({
         id: ticketId,
         date: new Date().toISOString(),
         total: finalTotal,
         status: "DRAFT", // DRAFT = Ticket no timbrado, TIMBRADA = Ya se usó
         items: [{ description: finalConcept, quantity: 1, total: finalTotal }],
         tenant: { name: finalName }
       });
       setLoadingTicket(false);
     }, 1000);
  }, [ticketId, searchParams]);

  const handleStamp = () => {
    if (!formData.rfc || !formData.legalName || !formData.zipCode) {
       setErrorMenu("Por favor llena los campos obligatorios: RFC, Razón Social y Código Postal.");
       return;
    }
    setErrorMenu(null);
    setIsStamping(true);

    // Mock API Call to backend
    setTimeout(() => {
       setStampResult({
          uuid: "A1B2C3D4-E5F6-7A8B-9C0D-1E2F3A4B5C6D",
          pdfUrl: `https://facturapro.radiotecpro.com/shared/FAC-${ticketId}.pdf`,
          xmlUrl: `https://facturapro.radiotecpro.com/shared/FAC-${ticketId}.xml`
       });
       setIsStamping(false);
    }, 2500);
  };

  if (loadingTicket) {
     return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
           <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 animate-pulse border border-slate-200">
              <Receipt className="w-8 h-8 text-indigo-500 animate-bounce" />
           </div>
           <h2 className="text-slate-500 font-bold tracking-widest uppercase text-sm">Buscando Ticket...</h2>
        </div>
     );
  }

  if (ticketData?.status !== "DRAFT" && !stampResult) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Ticket Invalido</h2>
              <p className="text-slate-500 text-sm mb-6">Este ticket de compra ya ha sido facturado o no existe en nuestras bases de datos.</p>
           </div>
        </div>
     );
  }

  if (stampResult) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-100">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-8 border-t-emerald-500">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">¡Factura Generada!</h2>
              <p className="text-slate-500 text-sm font-medium mb-8">El comprobante fiscal CFDI 4.0 ha sido validado ante el SAT exitosamente.</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 mb-8 shadow-sm">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Folio Fiscal (UUID)</p>
                 <p className="text-xs font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">{stampResult.uuid}</p>
              </div>

              <div className="space-y-3">
                 <a href="#" className="w-full bg-slate-800 hover:bg-black text-white font-bold py-3.5 rounded-xl border border-transparent flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5">
                    <FileText className="w-5 h-5" /> Descargar PDF
                 </a>
                 <a href="#" className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl border border-slate-200 flex items-center justify-center gap-2 shadow-sm transition-all">
                    <FileText className="w-5 h-5 opacity-60" /> Descargar XML
                 </a>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6">
      
      <div className="w-full max-w-md text-center mb-8">
         <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 mb-6">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-800 tracking-tight">{ticketData.tenant.name}</span>
         </div>
         <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal de Autofacturación</h1>
         <p className="text-slate-500 mt-2 font-medium text-sm">Completa tus datos fiscales para emitir el CFDI.</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8 transform transition-all">
         
         <div className="bg-indigo-600 p-6 flex items-center justify-between text-white border-b-4 border-indigo-700">
            <div>
               <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Total del Ticket</p>
               <h2 className="text-4xl font-black">${ticketData.total.toLocaleString('es-MX', {minimumFractionDigits: 2})} <span className="text-base font-bold text-indigo-300">MXN</span></h2>
            </div>
            <Receipt className="w-12 h-12 opacity-30 right-4 absolute" />
         </div>

         <div className="p-6">
            <div className="mb-6 pb-6 border-b border-slate-100 space-y-3">
               {ticketData.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-medium">
                     <span className="text-slate-600 pr-4">{item.quantity}x {item.description}</span>
                     <span className="text-slate-900 font-bold flex-shrink-0">${item.total.toLocaleString()}</span>
                  </div>
               ))}
               <div className="text-xs text-slate-400 font-medium">
                  Ref: Ticket #{ticketData.id.slice(0, 8)} • Fecha: {new Date(ticketData.date).toLocaleDateString()}
               </div>
            </div>

            {errorMenu && (
               <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold p-4 rounded-xl mb-6">
                  {errorMenu}
               </div>
            )}

            <div className="space-y-5">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">RFC Receptor *</label>
                 <input 
                   type="text" 
                   maxLength={13}
                   className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 font-mono text-base outline-none transition-colors uppercase tracking-wider text-slate-900 font-bold" 
                   placeholder="XAXX010101000"
                   value={formData.rfc}
                   onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
                 />
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Razón Social * (Sin S.A de C.V)</label>
                 <input 
                   type="text" 
                   placeholder="JUAN PEREZ LOPEZ"
                   className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 text-sm font-bold text-slate-900 outline-none transition-colors uppercase" 
                   value={formData.legalName}
                   onChange={e => setFormData({...formData, legalName: e.target.value.toUpperCase()})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">C.P. Fiscal *</label>
                    <input 
                      type="text" 
                      maxLength={5}
                      placeholder="00000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 font-mono text-center text-slate-900 font-bold outline-none transition-colors" 
                      value={formData.zipCode}
                      onChange={e => setFormData({...formData, zipCode: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Uso CFDI</label>
                    <select 
                       className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 text-sm font-bold text-slate-700 outline-none transition-colors appearance-none"
                       value={formData.cfdiUse}
                       onChange={e => setFormData({...formData, cfdiUse: e.target.value})}
                    >
                       <option value="G03">G03 - Gastos en General</option>
                       <option value="G01">G01 - Adquisición de mercancías</option>
                       <option value="S01">S01 - Sin efectos fiscales</option>
                       <option value="P01">P01 - Por definir</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Régimen Fiscal (4.0)</label>
                 <select 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 text-sm font-bold text-slate-700 outline-none transition-colors appearance-none"
                    value={formData.taxRegime}
                    onChange={e => setFormData({...formData, taxRegime: e.target.value})}
                 >
                    <option value="601">601 - General de Ley Personas Morales</option>
                    <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados</option>
                    <option value="606">606 - Arrendamiento</option>
                    <option value="612">612 - Personas Físicas con Actividades</option>
                    <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                    <option value="616">616 - Sin obligaciones fiscales</option>
                 </select>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 pb-2">
               <button 
                  onClick={handleStamp}
                  disabled={isStamping}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait disabled:translate-y-0"
               >
                  {isStamping ? (
                     <span className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" /> Procesando ante el SAT...
                     </span>
                  ) : (
                     <span className="flex items-center gap-2">
                        Timbrar Factura Ahora <ChevronRight className="w-5 h-5" />
                     </span>
                  )}
               </button>
               <p className="text-center text-[10px] text-slate-400 font-medium tracking-wide mt-4 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Portal Seguro Criptográfico
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function KioskSelfServicePage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
       </div>
    }>
      <KioskContent />
    </Suspense>
  );
}
