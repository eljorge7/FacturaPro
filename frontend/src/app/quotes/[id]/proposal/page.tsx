"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, MapPin, Users, Package, FileText, CheckCircle2, ChevronRight, Sun, Zap, Battery, TrendingUp, LineChart, Leaf } from "lucide-react";
import Image from "next/image";

export default function ProposalViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/quotes/${id}`);
        if (!res.ok) throw new Error("No encontrado");
        setQuote(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchQuote();
  }, [id]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!quote) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-bold">Propuesta no encontrada</div>;

  const solar = quote?.solarData ? (typeof quote.solarData === 'string' ? JSON.parse(quote.solarData) : quote.solarData) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      
      {/* Navbar de la Empresa */}
      <div className="absolute top-0 left-0 w-full z-50 px-6 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 bg-slate-900/40 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
           {quote.taxProfile?.logoUrl ? (
             <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api'}${quote.taxProfile.logoUrl}`} alt="Logo Empresa" className="h-10 w-auto object-contain drop-shadow-md" />
           ) : (
             <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-inner">
                <span className="text-white font-black text-xl">{quote.taxProfile?.legalName?.charAt(0) || 'F'}</span>
             </div>
           )}
           <div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-widest leading-none mb-1">Presentado por</p>
              <h2 className="text-white font-black text-lg leading-none drop-shadow-sm">{quote.taxProfile?.legalName || 'Nuestra Empresa'}</h2>
           </div>
        </div>
      </div>

      {/* Portada del Proyecto */}
      <div className={`relative h-[60vh] w-full flex items-center justify-center overflow-hidden ${solar ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-slate-900'}`}>
        {quote.coverImageUrl && !solar && (
          <img src={quote.coverImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" alt="Project Cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center max-w-4xl px-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-sm tracking-widest uppercase mb-6 backdrop-blur-sm border border-indigo-500/30">
            {solar ? 'Propuesta Comercial Fotovoltaica' : 'Propuesta Comercial'}
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-xl leading-tight">
            {solar ? `Sistema de Energía Solar ${solar.potenciaInstalada || 0} kWp` : (quote.projectName || `Cotización ${quote.quoteNumber}`)}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light drop-shadow-md">
            Preparado exclusivamente para: <strong className="text-white font-bold">{quote.customer?.legalName}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 -mt-16 relative z-20 space-y-10">
        
        {/* Ficha Resumen */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 flex flex-col md:flex-row gap-8 justify-between items-center">
           <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
              <p className="text-lg font-bold text-slate-800">{new Date(quote.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
           </div>
           {quote.expirationDate && (
             <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Válido hasta</p>
                <p className="text-lg font-bold text-slate-800">{new Date(quote.expirationDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
             </div>
           )}
           <div className="text-center md:text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                 {solar ? 'Inversión Total (SIN IVA)' : 'Inversión Total'}
              </p>
              <p className="text-4xl font-black text-indigo-600">
                 ${solar ? (solar.inversionTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : quote.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} {quote.currency}
              </p>
           </div>
        </div>

        {/* Alcance y Descripción */}
        {(quote.projectScope || quote.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="md:col-span-2 space-y-6">
                {quote.projectScope && (
                   <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
                     <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                        <FileText className="w-7 h-7 text-indigo-500" /> Alcance del Proyecto
                     </h3>
                     <div className="prose prose-slate prose-indigo max-w-none">
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{quote.projectScope}</p>
                     </div>
                   </div>
                )}
                
                {quote.personnel && (
                   <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
                     <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                        <Users className="w-7 h-7 text-emerald-500" /> Personal y Ejecución
                     </h3>
                     <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{quote.personnel}</p>
                   </div>
                )}
             </div>

             <div className="space-y-6">
                {quote.coordinates && (
                   <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
                     <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-rose-500" /> Ubicación
                     </h3>
                     <p className="text-slate-600 bg-rose-50 p-3 rounded-xl font-mono text-sm border border-rose-100">{quote.coordinates}</p>
                   </div>
                )}

                {quote.materials && (
                   <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
                     <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-500" /> Materiales Destacados
                     </h3>
                     <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{quote.materials}</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Propuesta Solar (si existe) */}
        {solar && (
          <div className="space-y-8 mt-12">
            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
               <Sun className="w-8 h-8 text-amber-500" /> Propuesta Técnica Fotovoltaica
            </h3>

            {/* 1. Análisis de Consumo */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
               <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <LineChart className="w-6 h-6 text-indigo-500" /> 1. Análisis de Consumo Energético
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                     <p className="text-sm font-bold text-slate-400 uppercase mb-2">Consumo Actual Base</p>
                     <p className="text-2xl font-black text-slate-800">{(solar.consumoAnual || 0).toLocaleString()} <span className="text-lg text-slate-500 font-medium">kWh</span></p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                     <p className="text-sm font-bold text-indigo-400 uppercase mb-2">Crecimiento (+{solar.colchon || 0}%)</p>
                     <p className="text-2xl font-black text-indigo-700">{((solar.consumoAnual || 0) * (solar.colchon || 0) / 100).toLocaleString()} <span className="text-lg text-indigo-500 font-medium">kWh</span></p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                     <p className="text-sm font-bold text-emerald-500 uppercase mb-2">Consumo Total Estimado</p>
                     <p className="text-2xl font-black text-emerald-700">{(solar.consumoProyectado || 0).toLocaleString()} <span className="text-lg text-emerald-600 font-medium">kWh / Año</span></p>
                  </div>
               </div>
            </div>

            {/* 2. Dimensionamiento del Sistema */}
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
               <h4 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" /> 2. Dimensionamiento del Sistema
               </h4>
               <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-8">
                  <p className="text-amber-800 font-medium">Recomendación Principal: Sistema de <strong className="font-black">{solar.potenciaInstalada || 0} kWp</strong> para asegurar cobertura total del consumo actual más el colchón del {solar.colchon || 0}%, manteniendo el recibo en el cargo mínimo durante todo el año.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                        <Sun className="w-8 h-8 text-amber-500" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Módulos Solares</p>
                        <p className="font-bold text-slate-800">{solar.numPaneles || 0} x {solar.panelModelo || 'Tier 1'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                        <Battery className="w-8 h-8 text-indigo-500" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Inversor de Red</p>
                        <p className="font-bold text-slate-800">1 x {solar.inversorModelo || 'Inversor Central'}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. ROI */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-indigo-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                  <TrendingUp className="w-64 h-64 text-white" />
               </div>
               <div className="relative z-10">
                  <h4 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                     <TrendingUp className="w-8 h-8 text-emerald-400" /> Análisis Financiero y ROI
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <p className="text-sm font-bold text-indigo-200 uppercase mb-2">Inversión Total (SIN IVA)</p>
                        <p className="text-3xl font-black text-white">${(solar.inversionTotal || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} MXN</p>
                     </div>
                     <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-6 border border-emerald-400/30">
                        <p className="text-sm font-bold text-emerald-300 uppercase mb-2">Ahorro Anual</p>
                        <p className="text-3xl font-black text-emerald-400">${(solar.ahorroAnual || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} MXN</p>
                     </div>
                     <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col justify-center">
                        <p className="text-sm font-bold text-indigo-200 uppercase mb-1">Retorno de Inversión</p>
                        <div className="flex items-end gap-2">
                           <span className="text-5xl font-black text-white">{solar.roiAnios || 0}</span>
                           <span className="text-xl text-indigo-200 font-bold mb-1">Años</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* 4. Impacto Ambiental */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-xl p-8 md:p-12 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Leaf className="w-48 h-48 text-white" />
               </div>
               <div className="relative z-10">
                  <h4 className="text-2xl font-black mb-8 flex items-center gap-3">
                     <Leaf className="w-8 h-8 text-emerald-200" /> Impacto Ambiental Estimado
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                        <p className="text-emerald-100 font-bold uppercase text-sm mb-1">Árboles Equivalentes</p>
                        <p className="text-4xl font-black">{Math.round((solar.consumoProyectado || 0) * 0.05).toLocaleString()} <span className="text-lg font-medium text-emerald-200">árboles / año</span></p>
                     </div>
                     <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                        <p className="text-emerald-100 font-bold uppercase text-sm mb-1">Reducción de CO2</p>
                        <p className="text-4xl font-black">{Math.round((solar.consumoProyectado || 0) * 0.4).toLocaleString()} <span className="text-lg font-medium text-emerald-200">kg / año</span></p>
                     </div>
                  </div>
               </div>
            </div>

            {/* 5. Ubicación del Proyecto (Movido al final) */}
            {solar.address && (
               <div className="bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-800 text-white mt-8">
                 <h4 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-rose-500" /> Ubicación del Proyecto
                 </h4>
                 <p className="text-slate-300 font-medium mb-4">{solar.address}</p>
                 <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 relative">
                    {solar.locationImageBase64 ? (
                        <img src={solar.locationImageBase64} alt="Ubicación" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full pointer-events-none">
                            <iframe 
                               width="100%" 
                               height="100%" 
                               src={`https://maps.google.com/maps?q=${encodeURIComponent(solar.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} 
                               frameBorder="0" 
                               scrolling="no" 
                               marginHeight={0} 
                               marginWidth={0}
                            ></iframe>
                        </div>
                    )}
                 </div>
               </div>
            )}
          </div>
        )}

        {/* Desglose Financiero */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-200 mt-12 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
           <h3 className="text-3xl font-black text-slate-800 mb-8">Desglose de Inversión</h3>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                      <th className="py-4 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider">Concepto</th>
                      <th className="py-4 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider text-center">Cant.</th>
                      <th className="py-4 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Precio U.</th>
                      <th className="py-4 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {quote.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                               {item.imageUrl && (
                                  <div className="w-12 h-12 bg-white border border-slate-200 rounded shrink-0 p-1 flex items-center justify-center overflow-hidden">
                                     <img src={item.imageUrl} className="w-full h-full object-contain" />
                                  </div>
                               )}
                               <div>
                                  <p className="font-bold text-slate-800">{item.description}</p>
                                  {item.product?.sku && <p className="text-xs text-slate-400 mt-1">SKU: {item.product.sku}</p>}
                               </div>
                            </div>
                         </td>
                         <td className="py-4 px-4 text-center font-medium text-slate-600">{item.quantity}</td>
                         <td className="py-4 px-4 text-right font-medium text-slate-600">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                         <td className="py-4 px-4 text-right font-bold text-slate-800">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>

           <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-12">
              <div className="space-y-3 w-full md:w-64">
                 <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>${quote.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-slate-500">
                    <span>Impuestos</span>
                    <span>${quote.taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-xl font-black text-slate-800 pt-4 border-t border-slate-100">
                    <span>Total ({quote.currency})</span>
                    <span>${quote.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Notas Comerciales Finales */}
        {quote.projectNotes && (
          <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 mt-8">
             <h4 className="text-indigo-800 font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5"/> Condiciones y Notas Comerciales
             </h4>
             <p className="text-indigo-900/80 leading-relaxed whitespace-pre-wrap text-sm">{quote.projectNotes}</p>
          </div>
        )}

        {/* Anexos y Documentos */}
        {quote.attachments && quote.attachments.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200 mt-8">
             <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-500" /> Documentos Adjuntos
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {quote.attachments.map((file: any) => {
                   const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:3005';
                   return (
                     <a key={file.id} href={`${baseUrl}${file.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group bg-slate-50">
                        <div className="bg-red-100 p-3 rounded-lg mr-4 group-hover:bg-red-500 transition-colors">
                           <FileText className="w-6 h-6 text-red-500 group-hover:text-white transition-colors" />
                        </div>
                        <div className="overflow-hidden">
                           <p className="font-semibold text-slate-700 truncate">{file.fileName}</p>
                           <p className="text-xs text-slate-400 mt-0.5">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                     </a>
                   );
                })}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
