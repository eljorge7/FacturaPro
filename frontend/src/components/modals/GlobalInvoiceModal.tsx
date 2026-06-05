import React, { useState, useEffect } from 'react';
import { FileText, X, Loader2, Calendar, Globe, AlertTriangle } from 'lucide-react';

export default function GlobalInvoiceModal({ isOpen, onClose, onGenerate }: any) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const [dateRange, setDateRange] = useState('today'); // today, week, month, custom
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [globalPeriod, setGlobalPeriod] = useState('01'); // 01 Diario
  const [globalMonths, setGlobalMonths] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [globalYear, setGlobalYear] = useState(new Date().getFullYear().toString());

  const [previewData, setPreviewData] = useState<{totalTickets: number, totalAmount: number} | null>(null);

  useEffect(() => {
    if (isOpen) {
       handleDateRangeChange('today');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && startDate && endDate) {
       fetchPreview();
    }
  }, [startDate, endDate, isOpen]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
      const res = await fetch(`${baseUrl}/invoices/pending-global?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      } else {
        setPreviewData({ totalTickets: 0, totalAmount: 0 });
      }
    } catch (e) {
      console.error(e);
      setPreviewData({ totalTickets: 0, totalAmount: 0 });
    }
    setLoadingPreview(false);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();
    
    if (range === 'today') {
       setStartDate(today.toISOString().split('T')[0]);
       setEndDate(today.toISOString().split('T')[0]);
       setGlobalPeriod('01'); // Diario
    } else if (range === 'week') {
       const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
       const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
       setStartDate(firstDay.toISOString().split('T')[0]);
       setEndDate(lastDay.toISOString().split('T')[0]);
       setGlobalPeriod('02'); // Semanal
    } else if (range === 'month') {
       const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
       const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
       setStartDate(firstDay.toISOString().split('T')[0]);
       setEndDate(lastDay.toISOString().split('T')[0]);
       setGlobalPeriod('04'); // Mensual
    }
    
    setGlobalMonths((new Date(startDate).getMonth() + 1).toString().padStart(2, '0'));
    setGlobalYear(new Date(startDate).getFullYear().toString());
  };

  const handleSubmit = async () => {
    if (!previewData || previewData.totalTickets === 0) {
      alert("No hay tickets pendientes en este rango.");
      return;
    }
    
    if (!confirm(`¿Estás seguro de agrupar y timbrar ${previewData.totalTickets} tickets por un total de $${previewData.totalAmount.toLocaleString()}? Esto consumirá 1 timbre.`)) {
      return;
    }

    setLoadingSubmit(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
      
      const res = await fetch(`${baseUrl}/invoices/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
           startDate,
           endDate,
           globalPeriod,
           globalMonths,
           globalYear
        })
      });

      if (res.ok) {
        alert("¡Factura Global generada y timbrada con éxito!");
        onGenerate();
        onClose();
      } else {
        const err = await res.json();
        alert(`Error al generar factura global: ${err.message || 'Error desconocido'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error de conexión.");
    }
    setLoadingSubmit(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
               <Globe className="h-6 w-6 text-white" />
             </div>
             <div>
               <h2 className="font-bold text-lg leading-tight">Factura Global (CFDI 4.0)</h2>
               <p className="text-blue-100 text-xs">Cumplimiento SAT para Público en General</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
           <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
              <AlertTriangle className="w-5 h-5 shrink-0 text-blue-500" />
              <p>El SAT requiere que las ventas de mostrador no facturadas se agrupen en un CFDI Global. Selecciona el rango de fechas para agrupar tus tickets "Borrador".</p>
           </div>

           <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Rango de Tickets a Agrupar</label>
              <div className="grid grid-cols-4 gap-2">
                 <button onClick={() => handleDateRangeChange('today')} className={`py-2 text-sm font-medium rounded-lg border transition-colors ${dateRange === 'today' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Hoy</button>
                 <button onClick={() => handleDateRangeChange('week')} className={`py-2 text-sm font-medium rounded-lg border transition-colors ${dateRange === 'week' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Semana</button>
                 <button onClick={() => handleDateRangeChange('month')} className={`py-2 text-sm font-medium rounded-lg border transition-colors ${dateRange === 'month' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Mes</button>
                 <button onClick={() => handleDateRangeChange('custom')} className={`py-2 text-sm font-medium rounded-lg border transition-colors ${dateRange === 'custom' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Manual</button>
              </div>
           </div>

           {dateRange === 'custom' && (
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Desde</label>
                   <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Hasta</label>
                   <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
               <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Periodicidad SAT</label>
                   <select value={globalPeriod} onChange={e => setGlobalPeriod(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="01">01 - Diario</option>
                      <option value="02">02 - Semanal</option>
                      <option value="03">03 - Quincenal</option>
                      <option value="04">04 - Mensual</option>
                      <option value="05">05 - Bimestral</option>
                   </select>
               </div>
               <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mes a Reportar</label>
                   <select value={globalMonths} onChange={e => setGlobalMonths(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="01">01 - Enero</option>
                      <option value="02">02 - Febrero</option>
                      <option value="03">03 - Marzo</option>
                      <option value="04">04 - Abril</option>
                      <option value="05">05 - Mayo</option>
                      <option value="06">06 - Junio</option>
                      <option value="07">07 - Julio</option>
                      <option value="08">08 - Agosto</option>
                      <option value="09">09 - Septiembre</option>
                      <option value="10">10 - Octubre</option>
                      <option value="11">11 - Noviembre</option>
                      <option value="12">12 - Diciembre</option>
                   </select>
               </div>
           </div>

           {/* Preview Panel */}
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center relative overflow-hidden">
               {loadingPreview ? (
                 <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-sm font-medium">Buscando tickets no facturados...</span>
                 </div>
               ) : previewData ? (
                 <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total a Consolidar</p>
                    <div className="flex items-center justify-center gap-4">
                       <div className="text-left">
                          <span className="block text-3xl font-black text-slate-800">{previewData.totalTickets}</span>
                          <span className="text-sm text-slate-500 font-medium">Tickets de mostrador</span>
                       </div>
                       <div className="w-px h-12 bg-slate-200"></div>
                       <div className="text-left">
                          <span className="block text-3xl font-black text-[#10b981]">${previewData.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          <span className="text-sm text-slate-500 font-medium">MXN Subtotal + IVA</span>
                       </div>
                    </div>
                 </>
               ) : (
                 <div className="py-6 text-slate-400 text-sm font-medium">Selecciona una fecha válida</div>
               )}
           </div>

        </div>

        <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-sm text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
          <button 
             onClick={handleSubmit} 
             disabled={loadingSubmit || !previewData || previewData.totalTickets === 0} 
             className="px-6 py-2.5 font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
          >
            {loadingSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Timbrar CFDI Global
          </button>
        </div>

      </div>
    </div>
  );
}
