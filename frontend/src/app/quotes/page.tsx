"use client";

import { useEffect, useState } from "react";
import { Search, FileText, Download, XCircle, Loader2, Plus, Mail, Share2, Printer, MoreHorizontal, ChevronDown, FileEdit, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState("Estándar - Estilo europeo");

  useEffect(() => {
     if (selectedQuote && selectedQuote.taxProfile?.pdfTemplate) {
        setCurrentTemplate(selectedQuote.taxProfile.pdfTemplate);
     }
  }, [selectedQuote]);

  const fetchQuotes = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/quotes`);
      const data = await res.json();
      setQuotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchQuotes();
  }, []);

  if (!mounted) return null;

  const filteredQuotes = quotes.filter(quote => 
     quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (quote.customer?.legalName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingQuotes = quotes.filter(quote => quote.status === 'SENT' || quote.status === 'DRAFT');
  const totals = {
     pendientes: pendingQuotes.reduce((acc, curr) => acc + curr.total, 0),
     aceptados: quotes.filter(q => q.status === 'ACCEPTED' || q.status === 'INVOICED').reduce((acc, curr) => acc + curr.total, 0),
     rechazados: quotes.filter(q => q.status === 'DECLINED').reduce((acc, curr) => acc + curr.total, 0),
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      await fetch(`${baseUrl}/quotes/${id}/status`, {
         method: "PATCH",
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus })
      });
      fetchQuotes();
      if(selectedQuote && selectedQuote.id === id) setSelectedQuote({...selectedQuote, status: newStatus});
    } catch (e) {
      console.error('Error updating status', e);
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
     e.stopPropagation();
     if(selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
     } else {
        setSelectedIds([...selectedIds, id]);
     }
  };

  const toggleSelectAll = () => {
     if(selectedIds.length === filteredQuotes.length) {
        setSelectedIds([]);
     } else {
        setSelectedIds(filteredQuotes.map(q => q.id));
     }
  };

  const handleBulkAction = async (action: string) => {
     if (action === 'Eliminar') {
        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} elemento(s)?`)) return;
        try {
           const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
           await Promise.all(selectedIds.map(id => 
              fetch(`${baseUrl}/quotes/${id}`, { method: 'DELETE' })
           ));
           setQuotes(quotes.filter(q => !selectedIds.includes(q.id)));
           setSelectedIds([]);
        } catch (e) {
           console.error("Error al eliminar", e);
           alert("Hubo un problema al eliminar. Se simuló en local.");
           setQuotes(quotes.filter(q => !selectedIds.includes(q.id)));
           setSelectedIds([]);
        }
        return;
     }

     alert(`Ejecutando acción masiva: ${action} sobre ${selectedIds.length} cotizaciones.`);
     setSelectedIds([]);
  };

  const handleDownload = async (id: string, quoteNum: string) => {
     try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/quotes/${id}/pdf`, { method: 'GET' });
       if (!res.ok) throw new Error("Error al consultar el documento fiscal.");
       
       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `Cotizacion_${quoteNum}.pdf`;
       document.body.appendChild(a);
       a.click();
       window.URL.revokeObjectURL(url);
     } catch (e) {
       console.error("Error al descargar:", e);
       alert("Ocurrió un error al generar pdf.");
     }
  };

  const getStatusColor = (status: string) => {
     if(status === 'ACCEPTED') return 'text-[#10b981]';
     if(status === 'INVOICED') return 'text-purple-600 bg-purple-50 px-2 py-0.5 rounded';
     if(status === 'DECLINED') return 'text-red-500 bg-red-50 px-2 py-0.5 rounded';
     if(status === 'SENT') return 'text-[#2563eb]';
     return 'text-slate-500';
  };

  const getStatusDisplay = (status: string) => {
     const val = {
        'DRAFT': 'Borrador',
        'SENT': 'Enviado',
        'ACCEPTED': 'Aceptado',
        'DECLINED': 'Rechazado',
        'INVOICED': 'Facturado'
     }[status];
     return val || status;
  }

  // Full Table View Mode
  if (!selectedQuote) {
    return (
      <div className="font-sans min-h-screen bg-[#f9fafb] relative">
        {/* Resumen Banner Zoho Style */}
        <div className="bg-white border-b border-slate-200">
           <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumen de Estimaciones</span>
           </div>
           
           <div className="grid grid-cols-4 px-6 py-4 items-center">
              <div className="border-r border-slate-100 pr-4">
                 <div className="flex gap-2 items-center">
                    <div className="bg-blue-400 p-2 rounded-full"><FileEdit className="w-4 h-4 text-white" /></div>
                    <div>
                       <p className="text-xs text-slate-500">Estimaciones Pendientes</p>
                       <p className="text-xl font-bold text-blue-600">MXN{totals.pendientes.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>
              </div>
              <div className="border-r border-slate-100 px-4">
                 <p className="text-xs text-slate-500">Estimaciones Aceptadas</p>
                 <p className="text-xl font-bold text-[#10b981]">MXN{totals.aceptados.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="border-r border-slate-100 px-4">
                 <p className="text-xs text-slate-500">Estimaciones Rechazadas</p>
                 <p className="text-xl font-bold text-red-500">MXN{totals.rechazados.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="pl-4">
                 <p className="text-xs text-slate-500">Cotizaciones Creadas</p>
                 <p className="text-xl font-bold text-slate-800">{quotes.length}</p>
              </div>
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-lg font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors">
                 Todas las estimac... <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <Link href="/quotes/new" className="bg-[#10b981] hover:bg-[#059669] text-white p-1.5 rounded transition-colors shadow-sm ml-2">
                 <Plus className="w-5 h-5" />
              </Link>
           </div>
           
           <div className="flex border border-slate-200 rounded text-slate-400 bg-white items-center px-2 py-0.5 max-w-xs w-full focus-within:border-slate-400 focus-within:text-slate-600 transition-colors">
              <Search className="w-4 h-4 mr-2 ml-1" />
              <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Número de estimación, Nombre..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-1 text-slate-800" 
              />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="hover:text-slate-600"><XCircle className="w-4 h-4 ml-1" /></button>}
           </div>
        </div>

        {/* Bulk Action Toolbar Overlay */}
        {selectedIds.length > 0 && (
           <div className="absolute top-[138px] left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-20 px-6 py-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => handleBulkAction('Actualización masiva')} className="text-sm font-medium border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-3 py-1.5 rounded transition-colors text-slate-700">Actualización masiva</button>
              <button onClick={() => handleBulkAction('Imprimir')} className="border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-2 py-1.5 rounded transition-colors text-slate-600"><Printer className="w-4 h-4" /></button>
              <button onClick={() => handleBulkAction('Descargar')} className="border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-2 py-1.5 rounded transition-colors text-slate-600"><Download className="w-4 h-4" /></button>
              <button onClick={() => handleBulkAction('Email')} className="border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-2 py-1.5 rounded transition-colors text-slate-600"><Mail className="w-4 h-4" /></button>
              
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
              
              <button onClick={() => handleBulkAction('MarcarEnviado')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-slate-700 font-medium">Marcar como enviado</button>
              <button onClick={() => handleBulkAction('Facturar')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-[#10b981] font-medium">Facturar Selección</button>
              <button onClick={() => handleBulkAction('Eliminar')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-red-600 font-medium">Eliminar</button>

              <div className="h-6 w-px bg-slate-200 mx-1"></div>

              <div className="flex items-center gap-2">
                 <span className="bg-blue-100 text-[#2563eb] text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                 <span className="text-sm text-slate-600 font-medium">Seleccionado{selectedIds.length > 1 ? 's' : ''}</span>
              </div>

              <button onClick={() => setSelectedIds([])} className="ml-auto flex items-center text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">
                 Esc <XCircle className="w-4 h-4 ml-1" />
              </button>
           </div>
        )}

        {/* Table View */}
        <div className="bg-white overflow-x-auto min-h-[500px]">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-slate-200 text-[#64748b] text-[11px] font-bold uppercase tracking-wider bg-[#f8fafc]">
                    <th className="py-3 px-6"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredQuotes.length && filteredQuotes.length > 0} className="rounded border-slate-300" /></th>
                    <th className="py-3 px-2 whitespace-nowrap">Fecha</th>
                    <th className="py-3 px-2">N.º de estimación</th>
                    <th className="py-3 px-2">Nombre del cliente</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-6 text-right">Cantidad</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {filteredQuotes.map(quote => (
                    <tr key={quote.id} onClick={() => setSelectedQuote(quote)} className={`border-b border-slate-100 cursor-pointer transition-colors group ${selectedIds.includes(quote.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                       <td className="py-3 px-6" onClick={(e) => toggleSelect(e, quote.id)}>
                          <input type="checkbox" checked={selectedIds.includes(quote.id)} onChange={() => {}} className="rounded border-slate-300" />
                       </td>
                       <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{new Date(quote.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric'})}</td>
                       <td className="py-3 px-2">
                          <span className="text-[#2563eb] hover:underline font-medium flex items-center gap-1">
                             {quote.quoteNumber} <FileText className="w-3 h-3 text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                       </td>
                       <td className="py-3 px-2 text-slate-700 font-medium">{quote.customer?.legalName.substring(0, 45)}{quote.customer?.legalName.length > 45 ? '...' : ''}</td>
                       <td className="py-3 px-2"><span className={`text-[11px] font-bold uppercase tracking-wider ${getStatusColor(quote.status)}`}>{getStatusDisplay(quote.status)}</span></td>
                       <td className="py-3 px-6 text-right text-slate-800 font-bold">MXN{quote.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                 ))}
                 {quotes.length === 0 && !isLoading && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400">No hay estimaciones aún. Haz clic en el botón '+' para crear una nueva.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    );
  }

  // Master-Detail View Mode
  return (
    <div className="font-sans h-screen flex flex-col bg-[#f9fafb] overflow-hidden">
       {/* Toolbar */}
       <div className="flex items-center px-4 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm z-20">
           <div className="w-[320px] flex items-center gap-2 border-r border-slate-200">
              <button 
                onClick={() => setSelectedQuote(null)} 
                className="flex items-center gap-1 text-[15px] font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors"
              >
                 Todas las estimac... <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <Link href="/quotes/new" className="bg-[#10b981] hover:bg-[#059669] text-white p-1 rounded transition-colors flex items-center justify-center">
                 <Plus className="w-4 h-4" />
              </Link>
           </div>
           
           <div className="flex-1 flex justify-between items-center px-4">
              <h2 className="text-xl font-bold text-slate-800">{selectedQuote.quoteNumber}</h2>
              <div className="flex gap-2">
                 <button onClick={() => setSelectedQuote(null)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><XCircle className="w-5 h-5"/></button>
              </div>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar List */}
           <div className="w-[320px] overflow-y-auto bg-white border-r border-slate-200 shrink-0">
              {filteredQuotes.map(quote => (
                 <div 
                    key={quote.id} 
                    onClick={() => setSelectedQuote(quote)}
                    className={`p-4 border-b border-slate-100 cursor-pointer flex justify-between group ${selectedQuote.id === quote.id ? 'bg-[#f8fafc] border-l-4 border-l-[#10b981]' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                 >
                    <div className="space-y-1 overflow-hidden pr-2">
                       <p className="text-sm font-medium text-slate-800 truncate">{quote.customer?.legalName}</p>
                       <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className={selectedQuote.id === quote.id ? 'text-[#2563eb]' : ''}>{quote.quoteNumber}</span>
                          <FileText className="w-3 h-3 text-[#10b981] opacity-0 group-hover:opacity-100" /> • {new Date(quote.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric'})}
                       </p>
                       <p className={`text-[10px] font-bold uppercase tracking-wider ${getStatusColor(quote.status)}`}>{getStatusDisplay(quote.status)}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-sm font-medium text-slate-800">MXN{quote.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>
              ))}
           </div>

           {/* Detail View */}
           <div className="flex-1 overflow-y-auto bg-[#f4f5f7] p-6 relative">
              <div className="max-w-4xl mx-auto space-y-4">
                 
                 {/* Action Bar */}
                 <div className="bg-white rounded-md shadow-sm border border-slate-200 px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-600 overflow-x-auto gap-2">
                    <div className="flex items-center gap-1">
                       <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><FileEdit className="w-4 h-4 text-slate-500"/> Editar</button>
                       <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><Mail className="w-4 h-4 text-slate-500"/> Correos <ChevronDown className="w-3 h-3"/></button>
                       <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><Share2 className="w-4 h-4 text-slate-500"/> Compartir</button>
                       <button onClick={() => handleDownload(selectedQuote.id, selectedQuote.quoteNumber)} className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><Printer className="w-4 h-4 text-slate-500"/> PDF/Imprimir <ChevronDown className="w-3 h-3"/></button>
                       <span className="w-px h-5 bg-slate-200 mx-2"></span>
                       
                       <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 uppercase tracking-widest">Estado:</span>
                          <select 
                               value={selectedQuote.status} 
                               onChange={(e) => handleUpdateStatus(selectedQuote.id, e.target.value)}
                               className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded py-1 px-2 focus:outline-none cursor-pointer"
                          >
                               <option value="DRAFT">Borrador</option>
                               <option value="SENT">Enviada</option>
                               <option value="ACCEPTED">Aceptada</option>
                               <option value="DECLINED">Rechazada</option>
                               <option value="INVOICED">Facturada</option>
                          </select>
                       </div>
                    </div>

                    <div className="flex gap-2 items-center">
                       <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded transition-colors font-medium">Crear proyecto</button>
                       <button onClick={() => router.push('/invoices/new?quoteId=' + selectedQuote.id)} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-1.5 rounded transition-colors font-medium flex items-center gap-2">Convertir en factura <ChevronDown className="w-3 h-3"/></button>
                       <button className="p-1 hover:bg-slate-100 border border-transparent rounded"><MoreHorizontal className="w-5 h-5 text-slate-400"/></button>
                    </div>
                 </div>

                 {/* Banner Billed */}
                 {selectedQuote.status !== 'INVOICED' && (
                    <div className="bg-blue-50 text-blue-800 rounded-md border border-blue-200 p-4 shadow-sm flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                          <p className="text-sm font-bold flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4 text-blue-500" />
                             ¿CÓMO CONTINUAR? Cree una factura para esta estimación para confirmar la venta y facturar a su cliente.
                          </p>
                          <div className="flex gap-2">
                             <button onClick={() => router.push('/invoices/new?quoteId=' + selectedQuote.id)} className="bg-[#10b981] text-white hover:bg-[#059669] font-bold px-3 py-1 text-xs rounded shadow-sm">Convertir en factura</button>
                             <button className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-bold px-3 py-1 text-xs rounded shadow-sm">Crear proyecto</button>
                          </div>
                       </div>
                       <hr className="border-blue-200 my-1"/>
                       <div className="flex justify-between items-center text-xs">
                          <p className="text-blue-700">💡 <strong>Facturar sobre la marcha con la facturación progresiva</strong> Puede facturar a los clientes por etapas a partir de un único presupuesto, lo que permite mejorar el flujo de caja y reducir los riesgos de pago. <a href="#" className="underline text-[#2563eb]">Configurar ahora &gt;</a></p>
                          <button className="text-blue-400 hover:text-blue-600"><XCircle className="w-4 h-4"/></button>
                       </div>
                    </div>
                 )}

                 {/* TABS */}
                 <div className="flex gap-6 border-b border-slate-200 pt-2 px-2">
                    <button className="border-b-2 border-[#2563eb] text-[#2563eb] pb-2 text-sm font-bold">Detalles de Estimación</button>
                    <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 pb-2 text-sm font-medium">Registros de actividad</button>
                 </div>

                 {/* Document Preview Imitation */}
                 <div className="bg-white mx-auto shadow-sm border border-slate-200 p-12 relative min-h-[600px] mt-4 mb-12">
                    
                    {/* Ribbon */}
                    <div className="absolute top-0 left-0 overflow-hidden w-28 h-28">
                       {selectedQuote.status === 'ACCEPTED' && <div className="absolute top-6 -left-8 w-40 text-center bg-[#10b981] text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Aceptado</div>}
                       {selectedQuote.status === 'DECLINED' && <div className="absolute top-6 -left-8 w-40 text-center bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Rechazado</div>}
                       {selectedQuote.status === 'SENT' && <div className="absolute top-6 -left-8 w-40 text-center bg-[#2563eb] text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Enviado</div>}
                       {selectedQuote.status === 'INVOICED' && <div className="absolute top-6 -left-8 w-40 text-center bg-purple-600 text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Facturado</div>}
                    </div>

                    <div className="flex justify-between items-start mb-12">
                       <div>
                          <h1 className="text-4xl font-light text-slate-800 mb-2">Cotización</h1>
                          <p className="text-slate-500 font-bold text-sm"># {selectedQuote.quoteNumber}</p>
                       </div>
                       <div className="text-right">
                          {selectedQuote.taxProfile?.logoUrl ? (
                             <img src={`http://localhost:3005${selectedQuote.taxProfile.logoUrl}`} alt="Logo" style={{ width: `${selectedQuote.taxProfile.logoWidth || 120}px` }} className="ml-auto mb-4 object-contain" />
                          ) : (
                             <h2 className="text-4xl font-black text-[#10b981] tracking-tighter mb-4 flex items-center justify-end gap-2">
                                <div className="grid grid-cols-3 gap-1 w-8 h-8 opacity-80">
                                   <div className="bg-[#2563eb] rounded-sm"></div><div className="bg-[#10b981] rounded-sm"></div><div className="bg-[#2563eb] rounded-sm"></div>
                                   <div className="bg-slate-300 rounded-sm"></div><div className="bg-[#2563eb] rounded-sm"></div><div className="bg-[#10b981] rounded-sm"></div>
                                   <div className="bg-[#10b981] rounded-sm"></div><div className="bg-slate-300 rounded-sm"></div><div className="bg-[#2563eb] rounded-sm"></div>
                                </div>
                                {selectedQuote.taxProfile?.legalName?.split(' ')[0] || 'Empresa'}
                             </h2>
                          )}
                          <div className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                             {selectedQuote.taxProfile?.legalName || 'Jorge Hurtado Cota'}{"\n"}
                             {selectedQuote.taxProfile?.zipCode ? `C.P. ${selectedQuote.taxProfile.zipCode}` : 'Avenida Sinaloa, Navojoa Sonora'}{"\n"}
                             Mexico{"\n"}
                             RFC: {selectedQuote.taxProfile?.rfc || 'XAXX010101000'}{"\n"}
                             Régimen fiscal: {selectedQuote.taxProfile?.taxRegime || '601 - General de Ley Personas Morales'}{"\n"}
                             jorge.hurtadoc@live.com.mx
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-8 border-b border-slate-800 pb-8 mb-8">
                       <div className="space-y-1 text-xs">
                          <p><span className="text-slate-500 inline-block w-32 font-bold">Fecha de la Cotización :</span> {new Date(selectedQuote.createdAt).toLocaleDateString()}</p>
                          <p><span className="text-slate-500 inline-block w-32 font-bold">Asunto :</span> Enviamos cotización de servicios comerciales.</p>
                       </div>
                       <div className="text-right space-y-1 text-xs">
                          <p className="text-slate-500 font-bold mb-2">Facturar a</p>
                          <p className="text-[#2563eb] font-bold text-sm">{selectedQuote.customer?.legalName}</p>
                          <p>{selectedQuote.customer?.zipCode || 'Sin C.P.'}</p>
                          <p>México</p>
                          <p>RFC del receptor {selectedQuote.customer?.rfc}</p>
                          <p>Régimen fiscal: {selectedQuote.customer?.taxRegime}</p>
                       </div>
                    </div>

                    {/* Tabla de Articulos Estilo Zoho */}
                    <table className="w-full text-left text-xs mb-8">
                       <thead className="bg-[#334155] text-white">
                          <tr>
                             <th className="py-2.5 px-3 font-bold">Artículo & Descripción</th>
                             <th className="py-2.5 px-3 font-bold text-right w-20">Cant.</th>
                             <th className="py-2.5 px-3 font-bold text-right w-24">Tarifa</th>
                             <th className="py-2.5 px-3 font-bold text-center w-20">Impuesto</th>
                             <th className="py-2.5 px-3 font-bold text-right w-28">Importe</th>
                          </tr>
                       </thead>
                       <tbody>
                          {selectedQuote.items && selectedQuote.items.length > 0 ? (
                             selectedQuote.items.map((item: any, i: number) => (
                                <tr key={i} className="border-b border-slate-200 text-slate-700">
                                   <td className="py-3 px-3 font-bold">{item.description}</td>
                                   <td className="py-3 px-3 text-right">{item.quantity}</td>
                                   <td className="py-3 px-3 text-right">{item.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   <td className="py-3 px-3 text-center">{(item.taxRate * 100)}%</td>
                                   <td className="py-3 px-3 text-right font-bold">{(item.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                             ))
                          ) : (
                             // Simulación visual en caso de que aún haya cotizaciones sin items guardadas
                             <tr className="border-b border-slate-200 text-slate-700">
                                <td className="py-3 px-3 font-bold">Servicios Profesionales de Facturación</td>
                                <td className="py-3 px-3 text-right">1.00</td>
                                <td className="py-3 px-3 text-right">{selectedQuote.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="py-3 px-3 text-center">16.0%</td>
                                <td className="py-3 px-3 text-right font-bold">{selectedQuote.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                             </tr>
                          )}
                       </tbody>
                    </table>

                    <div className="flex justify-end text-xs">
                       <div className="w-64 space-y-2">
                          <div className="flex justify-between text-slate-600">
                             <span>Sub Total</span>
                             <span>{selectedQuote.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          {selectedQuote.items?.some((i:any)=>i.taxRate === 0.16) || !selectedQuote.items && selectedQuote.taxTotal > 0 ? (
                             <div className="flex justify-between text-slate-600">
                                <span>IVA (16%)</span>
                                <span>{selectedQuote.taxTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                          ) : null}
                          {selectedQuote.items?.some((i:any)=>i.taxRate === 0.08) ? (
                             <div className="flex justify-between text-slate-600">
                                <span>IVA (8%)</span>
                                <span>{selectedQuote.taxTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                          ) : null}
                          <div className="flex justify-between font-bold text-sm bg-slate-100 p-2 rounded mt-2">
                             <span>Total</span>
                             <span>MXN{selectedQuote.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                       </div>
                    </div>

                    <div className="mt-20 pt-8 border-t border-slate-200 text-slate-500 text-[10px] leading-relaxed">
                       <p><strong>Notas:</strong> {selectedQuote.notes || "Gracias por su preferencia."}</p>
                       <p className="mt-4">Sistema impulsado y autorizado por <strong>FacturaPro</strong>.</p>
                    </div>

                 </div>
                 
                 {/* Plantilla Selector Banner (Estilo Zoho) */}
                 <div className="max-w-4xl mx-auto bg-white shadow-sm border border-slate-200 p-4 mt-6 flex justify-between items-center rounded text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                       <span className="font-bold">Plantilla de PDF:</span>
                       <span>'{currentTemplate}'</span>
                    </div>
                    <button onClick={() => setIsTemplateModalOpen(true)} className="text-[#2563eb] hover:underline font-bold">Cambiar</button>
                 </div>

              </div>
           </div>
        </div>

        {/* Template Change Modal */}
        {isTemplateModalOpen && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
              <div className="bg-[#f8fafc] rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                 <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 bg-white shadow-sm z-10">
                    <h3 className="text-xl font-bold text-slate-800">Galería de Plantillas (Cotizaciones)</h3>
                    <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5"/></button>
                 </div>
                 <div className="p-8 flex-1 overflow-y-auto">
                    <p className="text-slate-600 mb-6 font-medium">Selecciona una plantilla predefinida y modifícala a tu gusto para aplicar a tus estimaciones futuras.</p>
                    
                    <div className="grid grid-cols-3 gap-8">
                       {/* Option 1 */}
                       <div 
                          onClick={() => {setCurrentTemplate('Estándar - Estilo europeo'); setIsTemplateModalOpen(false);}}
                          className={`group bg-white border-2 rounded-lg cursor-pointer transition-all overflow-hidden p-2
                             ${currentTemplate === 'Estándar - Estilo europeo' ? 'border-[#10b981] shadow-md ring-4 ring-emerald-50' : 'border-slate-200 hover:border-[#2563eb] hover:shadow-lg'}`}
                       >
                          <div className="h-64 bg-slate-100 border border-slate-200 flex flex-col p-4 opacity-80 group-hover:opacity-100 transition-opacity">
                              <div className="h-4 w-1/3 bg-slate-300 rounded mb-2"></div>
                              <div className="h-2 w-1/4 bg-slate-200 rounded mb-6"></div>
                              <div className="flex justify-between mb-4">
                                 <div className="w-1/4 space-y-1"><div className="h-1 bg-slate-400"></div><div className="h-1 bg-slate-300"></div></div>
                                 <div className="w-1/4 space-y-1"><div className="h-1 bg-slate-400"></div><div className="h-1 bg-slate-300"></div></div>
                              </div>
                              <div className="flex-1 bg-white border border-slate-200">
                                 <div className="bg-slate-700 h-3"></div>
                                 <div className="border-b border-slate-100 h-4"></div>
                                 <div className="border-b border-slate-100 h-4"></div>
                              </div>
                          </div>
                          <p className="text-center font-bold mt-4 mb-2 text-slate-700">Estándar - Estilo europeo</p>
                       </div>

                       {/* Option 2 */}
                       <div 
                          onClick={() => {setCurrentTemplate('Elegante - Dark Header'); setIsTemplateModalOpen(false);}}
                          className={`group bg-white border-2 rounded-lg cursor-pointer transition-all overflow-hidden p-2
                             ${currentTemplate === 'Elegante - Dark Header' ? 'border-[#10b981] shadow-md ring-4 ring-emerald-50' : 'border-slate-200 hover:border-[#2563eb] hover:shadow-lg'}`}
                       >
                          <div className="h-64 bg-slate-100 border border-slate-200 flex flex-col opacity-80 group-hover:opacity-100 transition-opacity">
                              <div className="h-12 bg-slate-800 w-full mb-4"></div>
                              <div className="px-4 flex justify-between mb-4">
                                 <div className="w-1/3 space-y-2"><div className="h-2 bg-slate-300"></div><div className="h-2 bg-slate-200"></div></div>
                                 <div className="w-1/3 space-y-2"><div className="h-2 bg-slate-300"></div><div className="h-2 bg-slate-200"></div></div>
                              </div>
                              <div className="px-4 flex-1">
                                 <div className="bg-white h-24 border border-slate-200 shadow-sm flex flex-col">
                                    <div className="border-b border-slate-200 h-4 bg-slate-50"></div>
                                 </div>
                              </div>
                          </div>
                          <p className="text-center font-bold mt-4 mb-2 text-slate-700">Elegante - Dark Header</p>
                       </div>

                       {/* Option 3 */}
                       <div 
                          onClick={() => {setCurrentTemplate('Hoja de Cálculo Financiera'); setIsTemplateModalOpen(false);}}
                          className={`group bg-white border-2 rounded-lg cursor-pointer transition-all overflow-hidden p-2
                             ${currentTemplate === 'Hoja de Cálculo Financiera' ? 'border-[#10b981] shadow-md ring-4 ring-emerald-50' : 'border-slate-200 hover:border-[#2563eb] hover:shadow-lg'}`}
                       >
                          <div className="h-64 bg-white border border-slate-200 flex flex-col p-4 opacity-80 group-hover:opacity-100 transition-opacity">
                              <div className="flex justify-between items-center border-b-2 border-green-600 pb-2 mb-4">
                                 <div className="h-4 w-12 bg-green-200"></div>
                                 <div className="h-4 w-1/3 bg-slate-800"></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-4">
                                 <div className="border border-slate-200 h-8"></div>
                                 <div className="border border-slate-200 h-8"></div>
                              </div>
                              <div className="border border-slate-300 flex-1 flex flex-col">
                                 <div className="bg-slate-100 h-4 border-b border-slate-300"></div>
                                 <div className="h-4 border-b border-slate-200"></div>
                                 <div className="h-4 border-b border-slate-200"></div>
                              </div>
                          </div>
                          <p className="text-center font-bold mt-4 mb-2 text-slate-700">Hoja de Cálculo Financiera</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
    </div>
  );
}
