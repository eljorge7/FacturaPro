"use client";

import { useEffect, useState } from "react";
import { Search, FileText, Download, XCircle, Loader2, Plus, Mail, Share2, Printer, MoreHorizontal, ChevronDown, CheckCircle2, ArrowLeft, FileEdit, MessageCircle, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState("EstÃ¡ndar - Estilo europeo");

  useEffect(() => {
     if (selectedInvoice && selectedInvoice.taxProfile?.pdfTemplate) {
        setCurrentTemplate(selectedInvoice.taxProfile.pdfTemplate);
     }
  }, [selectedInvoice]);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentDate: new Date().toISOString().split('T')[0], paymentMethod: "03", reference: "", notes: "" });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Cancellation Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({ motive: "02", substitutionUuid: "" });
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchInvoices = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/invoices`);
      const data = await res.json();
      setInvoices(data);
      
      const targetId = searchParams.get('targetId');
      if (targetId && data.length > 0) {
         const target = data.find((inv: any) => inv.id === targetId);
         if (target) setSelectedInvoice(target);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchInvoices();
  }, []);

  if (!mounted) return null;

  const filteredInvoices = invoices.filter(inv => 
     inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (inv.customer?.legalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     (inv.satUuid || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvoices = invoices.filter(inv => inv.status !== 'CANCELADA');
  const totals = {
     pendientes: pendingInvoices.reduce((acc, curr) => {
        const paid = curr.payments?.reduce((pAcc: number, p: any) => pAcc + p.amount, 0) || 0;
        return acc + Math.max(0, curr.total - paid);
     }, 0),
     vencidosHoy: 0,
     proximos30Dias: 0,
     vencidos: 0,
     pagados: invoices.reduce((acc, curr) => acc + (curr.payments?.reduce((pAcc: number, p: any) => pAcc + p.amount, 0) || 0), 0)
  };

  const getBalanceDue = (invoice: any) => {
      const paid = invoice.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
      return Math.max(0, invoice.total - paid);
  };

  const handleRegisterPayment = async () => {
      if(!selectedInvoice) return;
      setIsSubmittingPayment(true);
      try {
          const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
          const res = await fetch(`${baseUrl}/invoices/${selectedInvoice.id}/payments`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                amount: parseFloat(paymentForm.amount),
                paymentDate: paymentForm.paymentDate,
                paymentMethod: paymentForm.paymentMethod,
                reference: paymentForm.reference,
                notes: paymentForm.notes
             })
          });
          if (res.ok) {
              fetchInvoices();
              setIsPaymentModalOpen(false);
              setPaymentForm({ amount: "", paymentDate: new Date().toISOString().split('T')[0], paymentMethod: "03", reference: "", notes: "" });
              
              // Local update for immediate UI reflection
              const d = await res.json();
              setSelectedInvoice({...selectedInvoice, payments: [...(selectedInvoice.payments || []), d], status: (getBalanceDue(selectedInvoice) - parseFloat(paymentForm.amount)) <= 0.01 ? 'PAID' : selectedInvoice.status});
          } else {
             alert('Error al registrar pago');
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmittingPayment(false);
      }
  };


  const handleCancelClick = () => {
     if (!selectedInvoice || selectedInvoice.status === 'CANCELADA') return;
     setIsCancelModalOpen(true);
  };

  const submitCancel = async () => {
    if (cancelForm.motive === '01' && !cancelForm.substitutionUuid.trim()) {
       alert("El Motivo 01 requiere obligatoriamente el Folio Fiscal (UUID) que sustituye a esta factura.");
       return;
    }
    setIsCanceling(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/invoices/${selectedInvoice.id}/cancel`, { 
         method: "POST",
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
             motive: cancelForm.motive,
             substitutionUuid: cancelForm.substitutionUuid
         })
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => null);
         throw new Error(errorData?.message || "Error al cancelar ante el SAT.");
      }

      fetchInvoices();
      setSelectedInvoice({...selectedInvoice, status: 'CANCELADA'});
      setIsCancelModalOpen(false);
      alert("La factura ha sido cancelada exitosamente ante el SAT.");
    } catch (e: any) {
      console.error('Error canceling invoice', e);
      alert(e.message || "OcurriÃ³ un error cancelando el CFDI.");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleStamp = async (id: string) => {
    if (!confirm('Â¿Deseas mandar a timbrar este comprobante? Esto consumirÃ¡ 1 saldo de tus Timbres Disponibles.')) return;
    try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/invoices/${id}/stamp`, { method: "PATCH" });
       if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || "Error al timbrar el comprobante");
       }
       const updated = await res.json();
       fetchInvoices();
       if(selectedInvoice && selectedInvoice.id === id) setSelectedInvoice(updated);
       alert("Â¡Factura Timbrada Ã‰xitosamente!");
    } catch (e: any) {
       console.error(e);
       alert(e.message || "Error al timbrar.");
    }
  };

  const handleSendWhatsapp = async (id: string, defaultPhone?: string) => {
     const phone = window.prompt('Ingresa el nÃºmero de WhatsApp (10 dÃ­gitos) para enviar esta factura al cliente:', defaultPhone || '');
     if (!phone) return;
     
     try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/invoices/${id}/send-whatsapp`, { 
           method: "POST",
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ phone })
       });
       if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || "Error al enviar WhatsApp");
       }
       alert("ðŸš€ Â¡Comprobante enviado por WhatsApp a la cola de salida con Ã©xito!");
     } catch (e: any) {
       console.error(e);
       alert(e.message || "Error al enviar WhatsApp.");
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
     if(selectedIds.length === filteredInvoices.length) {
        setSelectedIds([]);
     } else {
        setSelectedIds(filteredInvoices.map(inv => inv.id));
     }
  };

  const handleBulkAction = async (action: string) => {
     if (action === 'Eliminar') {
        if (!confirm(`Â¿EstÃ¡s seguro de que quieres eliminar ${selectedIds.length} elemento(s)?`)) return;
        try {
           const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
           await Promise.all(selectedIds.map(id => 
              fetch(`${baseUrl}/invoices/${id}`, { method: 'DELETE' })
           ));
           setInvoices(invoices.filter(i => !selectedIds.includes(i.id)));
           setSelectedIds([]);
        } catch (e) {
           console.error("Error al eliminar", e);
           alert("Hubo un problema al eliminar. Es posible que el servidor no tenga esta ruta habilitada aÃºn, pero se simulÃ³ en frontend.");
           setInvoices(invoices.filter(i => !selectedIds.includes(i.id))); // Fallback simulation
           setSelectedIds([]);
        }
        return;
     }
     
     alert(`Ejecutando acciÃ³n masiva: ${action} sobre ${selectedIds.length} facturas.`);
     setSelectedIds([]);
  };

  const handleDownload = async (id: string, invoiceNum: string) => {
     try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/invoices/${id}/pdf`, { method: 'GET' });
       if (!res.ok) throw new Error("Error al consultar el documento fiscal.");
       
       const blob = await res.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `${invoiceNum}.pdf`;
       document.body.appendChild(a);
       a.click();
       window.URL.revokeObjectURL(url);
     } catch (e) {
       console.error("Error al descargar:", e);
       alert("OcurriÃ³ un error al intentar generar la RepresentaciÃ³n Impresa (PDF).");
     }
  };

  const getStatusColor = (status: string) => {
     if(status === 'PAID') return 'text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded';
     if(status === 'TIMBRADA' || status === 'VIGENTE') return 'text-[#10b981]';
     if(status === 'CANCELADA') return 'text-red-500 bg-red-50 px-2 py-0.5 rounded';
     return 'text-[#f59e0b]';
  };

  // Full Table View Mode
  if (!selectedInvoice) {
    return (
      <div className="font-sans min-h-screen bg-[#f9fafb] relative">
        {/* Resumen Banner Zoho Style */}
        <div className="bg-white border-b border-slate-200">
           <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resumen del Pago</span>
           </div>
           
           <div className="grid grid-cols-5 px-6 py-4 items-center">
              <div className="border-r border-slate-100 pr-4">
                 <div className="flex gap-2 items-center">
                    <div className="bg-[#fcd34d] p-2 rounded-full"><ArrowLeft className="w-4 h-4 text-white transform rotate-45" /></div>
                    <div>
                       <p className="text-xs text-slate-500">Total de cuentas pendientes de cobro</p>
                       <p className="text-xl font-bold">MXN{totals.pendientes.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>
              </div>
              <div className="border-r border-slate-100 px-4">
                 <p className="text-xs text-slate-500">Vencidos hoy</p>
                 <p className="text-xl font-bold text-[#f59e0b]">MXN{totals.vencidosHoy.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="border-r border-slate-100 px-4">
                 <p className="text-xs text-slate-500">Vence en los prÃ³ximos 30 dÃ­as</p>
                 <p className="text-xl font-bold text-slate-400">MXN{totals.proximos30Dias.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="border-r border-slate-100 px-4">
                 <p className="text-xs text-slate-500">Factura vencida</p>
                 <p className="text-xl font-bold text-slate-700">MXN{totals.vencidos.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="pl-4">
                 <p className="text-xs text-slate-500">Total Validado</p>
                 <p className="text-xl font-bold text-slate-800">MXN{totals.pagados.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
           </div>

           <div className="bg-[#f8fafc] px-6 py-2 border-t border-slate-100 flex items-center text-xs text-slate-600">
              <span className="font-bold text-[#2563eb] mr-2 flex items-center gap-1"><ArrowLeft className="w-3 h-3 transform rotate-45"/> Resumen de facturas electrÃ³nicas:</span>
              <span className="mx-2"><span className="text-[#10b981] font-bold">{invoices.filter(i=>i.status === 'PAID').length}</span> Han sido pagadas</span> |
              <span className="mx-2"><span className="text-[#f59e0b] font-bold">{invoices.filter(i=>i.status !== 'PAID' && i.status !== 'CANCELADA').length}</span> Tienen saldo pendiente</span> |
              <span className="mx-2"><span className="text-red-500 font-bold">{invoices.filter(i=>i.status==='CANCELADA').length}</span> Se han cancelado</span>
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-lg font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors">
                 Todas las factur... <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <Link href="/invoices/new" className="bg-[#10b981] hover:bg-[#059669] text-white p-1.5 rounded transition-colors shadow-sm ml-2">
                 <Plus className="w-5 h-5" />
              </Link>
           </div>
           
           <div className="flex border border-slate-200 rounded text-slate-400 bg-white items-center px-2 py-0.5 max-w-xs w-full focus-within:border-slate-400 focus-within:text-slate-600 transition-colors">
              <Search className="w-4 h-4 mr-2 ml-1" />
              <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Folio, Nombre..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-1 text-slate-800" 
              />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="hover:text-slate-600"><XCircle className="w-4 h-4 ml-1" /></button>}
           </div>
        </div>

        {/* Bulk Action Toolbar Overlay */}
        {selectedIds.length > 0 && (
           <div className="absolute top-[175px] left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-20 px-6 py-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => handleBulkAction('ActualizaciÃ³n masiva')} className="text-sm font-medium border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-3 py-1.5 rounded transition-colors text-slate-700">ActualizaciÃ³n masiva</button>
              <button onClick={() => handleBulkAction('Imprimir')} className="border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-2 py-1.5 rounded transition-colors text-slate-600"><Printer className="w-4 h-4" /></button>
              <button onClick={() => handleBulkAction('Descargar')} className="border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-2 py-1.5 rounded transition-colors text-slate-600"><Download className="w-4 h-4" /></button>
              <button onClick={() => handleBulkAction('Email')} className="border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-2 py-1.5 rounded transition-colors text-slate-600"><Mail className="w-4 h-4" /></button>
              
              <div className="h-6 w-px bg-slate-200 mx-1"></div>
              
              <button onClick={() => handleBulkAction('Disociar')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-slate-700 font-medium">Disociar Ã³rdenes de venta</button>
              <button onClick={() => handleBulkAction('MarcarEnviado')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-slate-700 font-medium">Marcar como enviado</button>
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
                    <th className="py-3 px-6"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0} className="rounded border-slate-300" /></th>
                    <th className="py-3 px-2 whitespace-nowrap">Fecha</th>
                    <th className="py-3 px-2">N.Âº de factura</th>
                    <th className="py-3 px-2">Nombre del cliente</th>
                    <th className="py-3 px-2">Estado CFDI</th>
                    <th className="py-3 px-2">Estado Pago</th>
                    <th className="py-3 px-2 text-right">Cantidad</th>
                    <th className="py-3 px-6 text-right">Saldo Adeudado</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {filteredInvoices.map(inv => (
                    <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className={`border-b border-slate-100 cursor-pointer transition-colors group ${selectedIds.includes(inv.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                       <td className="py-3 px-6" onClick={(e) => toggleSelect(e, inv.id)}>
                          <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => {}} className="rounded border-slate-300" />
                       </td>
                       <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{new Date(inv.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric'})}</td>
                       <td className="py-3 px-2">
                          <span className="text-[#2563eb] hover:underline font-medium flex items-center gap-1">
                             {inv.invoiceNumber} <FileText className="w-3 h-3 text-[#10b981]" />
                          </span>
                       </td>
                       <td className="py-3 px-2 text-slate-700 font-medium">{inv.customer?.legalName.substring(0, 25)}{inv.customer?.legalName.length > 25 ? '...' : ''}</td>
                       <td className="py-3 px-2 text-slate-600">{inv.satUuid ? 'Timbrado' : 'Pendiente'}</td>
                       <td className="py-3 px-2"><span className={`text-[11px] font-bold uppercase tracking-wider ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                       <td className="py-3 px-2 text-right font-medium">MXN{inv.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                       <td className="py-3 px-6 text-right text-[#10b981] font-bold">MXN{getBalanceDue(inv).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                 ))}
                 {invoices.length === 0 && !isLoading && (
                    <tr><td colSpan={8} className="py-10 text-center text-slate-400">No hay facturas aÃºn. Haz clic en el botÃ³n '+' para crear una nueva.</td></tr>
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
                onClick={() => setSelectedInvoice(null)} 
                className="flex items-center gap-1 text-[15px] font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors"
              >
                 Todas las factur... <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <Link href="/invoices/new" className="bg-[#10b981] hover:bg-[#059669] text-white p-1 rounded transition-colors flex items-center justify-center">
                 <Plus className="w-4 h-4" />
              </Link>
           </div>
           
           <div className="flex-1 flex justify-between items-center px-4">
              <h2 className="text-xl font-bold text-slate-800">{selectedInvoice.invoiceNumber}</h2>
              <div className="flex gap-2">
                 <button onClick={() => setSelectedInvoice(null)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><XCircle className="w-5 h-5"/></button>
              </div>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar List */}
           <div className="w-[320px] overflow-y-auto bg-white border-r border-slate-200 shrink-0">
              {filteredInvoices.map(inv => (
                 <div 
                    key={inv.id} 
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-4 border-b border-slate-100 cursor-pointer flex justify-between group ${selectedInvoice.id === inv.id ? 'bg-[#f8fafc] border-l-4 border-l-[#10b981]' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                 >
                    <div className="space-y-1 overflow-hidden pr-2">
                       <p className="text-sm font-medium text-slate-800 truncate">{inv.customer?.legalName}</p>
                       <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className={selectedInvoice.id === inv.id ? 'text-[#2563eb]' : ''}>{inv.invoiceNumber}</span>
                          <FileText className="w-3 h-3 text-[#10b981] opacity-0 group-hover:opacity-100" /> â€¢ {new Date(inv.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric'})}
                       </p>
                       <p className={`text-[10px] font-bold uppercase tracking-wider ${getStatusColor(inv.status)}`}>{inv.status}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-sm font-medium text-slate-800">MXN{inv.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
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
                       <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap" title="Enviar WhatsApp AutomÃ¡tico" onClick={() => handleSendWhatsapp(selectedInvoice.id, selectedInvoice.customer?.phone)}><MessageCircle className="w-4 h-4 text-emerald-500 font-bold"/> Enviar WhatsApp</button>
                       <button onClick={() => { const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000'; const portalLink = `${baseUrl}/portal/${selectedInvoice.id}`; navigator.clipboard.writeText(portalLink); alert('¡Liga Mágica copiada al portapapeles! Envíala a tu cliente.'); }} className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded transition-colors whitespace-nowrap border border-indigo-200 shadow-sm font-bold"><Globe className="w-4 h-4 text-indigo-500 font-bold" /> Liga Mágica</button><button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><Mail className="w-4 h-4 text-slate-500"/> Correos <ChevronDown className="w-3 h-3"/></button>
                       <button className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><FileEdit className="w-4 h-4 text-slate-500"/> Editar</button>
                       <button onClick={() => handleDownload(selectedInvoice.id, selectedInvoice.invoiceNumber)} className="flex items-center gap-1.5 hover:bg-slate-100 px-3 py-1.5 rounded transition-colors whitespace-nowrap"><Printer className="w-4 h-4 text-slate-500"/> PDF/Imprimir <ChevronDown className="w-3 h-3"/></button>
                    </div>

                    <div className="flex gap-2 items-center">
                       {selectedInvoice.status !== 'CANCELADA' && (
                          <button onClick={handleCancelClick} className="bg-white border border-slate-300 hover:bg-red-50 text-red-600 px-3 py-1.5 rounded transition-colors font-medium">Cancelar CFDI</button>
                       )}
                       {getBalanceDue(selectedInvoice) > 0 && selectedInvoice.status !== 'CANCELADA' && (
                          <button onClick={() => { setPaymentForm({...paymentForm, amount: getBalanceDue(selectedInvoice).toString()}); setIsPaymentModalOpen(true); }} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-1.5 rounded transition-colors font-medium flex items-center gap-2">Registrar Pago <Plus className="w-4 h-4"/></button>
                       )}
                       <button className="p-1 hover:bg-slate-100 border border-transparent rounded"><MoreHorizontal className="w-5 h-5 text-slate-400"/></button>
                    </div>
                 </div>

                 {/* Banners */}
                 {selectedInvoice.status === 'CANCELADA' ? (
                    <div className="bg-red-50 text-red-800 rounded-md border border-red-200 p-4 shadow-sm flex flex-col gap-2">
                       <p className="text-sm font-bold flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Esta factura ha sido cancelada ante el SAT.
                       </p>
                    </div>
                 ) : selectedInvoice.status !== 'TIMBRADA' && selectedInvoice.status !== 'VIGENTE' ? (
                    <div className="bg-blue-50 text-blue-800 rounded-md border border-blue-200 p-4 shadow-sm flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                          <p className="text-sm font-bold flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4 text-blue-500" />
                             Â¡Timbre pendiente! Factura guardada, lista para ser certificada ante el PAC.
                          </p>
                          <div className="flex gap-2">
                             <button onClick={() => handleStamp(selectedInvoice.id)} className="bg-[#2563eb] text-white hover:bg-blue-700 font-bold px-3 py-1 text-xs rounded shadow-sm">Timbrar CFDI 4.0</button>
                          </div>
                       </div>
                    </div>
                 ) : selectedInvoice.status === 'PAID' ? (
                    <div className="bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 p-4 shadow-sm flex items-center justify-between">
                       <p className="text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Â¡Factura Pagada en su totalidad!
                       </p>
                       <div className="flex gap-2 items-center">
                           <span className="text-slate-500 text-xs font-bold mr-2 border-r border-emerald-200 pr-2">Saldo Adeudado: $0.00</span>
                           <span className="bg-[#10b981] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center">Pagado</span>
                       </div>
                    </div>
                 ) : (
                    <div className="bg-blue-50 text-blue-800 rounded-md border border-blue-200 p-4 shadow-sm flex items-center justify-between">
                       <p className="text-sm font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          CFDI Emitido y Vigente. Saldo Pendiente: MXN{getBalanceDue(selectedInvoice).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </p>
                       <span className="bg-[#2563eb] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center">Pendiente de Pago <ChevronDown className="w-3 h-3 ml-1" /></span>
                    </div>
                 )}

                 {/* TABS */}
                 <div className="flex gap-6 border-b border-slate-200 pt-2 px-2">
                    <button className="border-b-2 border-[#2563eb] text-[#2563eb] pb-2 text-sm font-bold">Detalles de Factura</button>
                    <button className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 pb-2 text-sm font-medium">Registros de actividad</button>
                 </div>

                 {/* Document Preview Imitation */}
                 <div className="bg-white mx-auto shadow-sm border border-slate-200 p-12 relative min-h-[600px] mt-4 mb-12">
                    
                    {/* Ribbon */}
                    <div className="absolute top-0 left-0 overflow-hidden w-28 h-28">
                       {selectedInvoice.status === 'PAID' ? (
                          <div className="absolute top-6 -left-8 w-40 text-center bg-[#10b981] text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Pagada</div>
                       ) : selectedInvoice.status === 'TIMBRADA' || selectedInvoice.status === 'VIGENTE' ? (
                          <div className="absolute top-6 -left-8 w-40 text-center bg-[#2563eb] text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Vigente</div>
                       ) : selectedInvoice.status === 'CANCELADA' ? (
                          <div className="absolute top-6 -left-8 w-40 text-center bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Cancelada</div>
                       ) : (
                          <div className="absolute top-6 -left-8 w-40 text-center bg-slate-500 text-white font-bold text-[10px] uppercase tracking-widest py-1.5 transform -rotate-45 shadow-sm">Borrador</div>
                       )}
                    </div>

                    {selectedInvoice.taxProfile?.pdfTemplate === 'Elegante - Dark Header' ? (
                       <div className="bg-slate-900 text-white p-8 flex justify-between items-center mb-12 -mx-10 -mt-2">
                          <div className="flex items-center gap-6">
                             {selectedInvoice.taxProfile?.logoUrl ? (
                                <div className="bg-white p-2 rounded-md"><img src={`http://localhost:3005${selectedInvoice.taxProfile.logoUrl}`} style={{ width: `${selectedInvoice.taxProfile.logoWidth || 120}px` }} className="object-contain" alt="Logo Previa" /></div>
                             ) : (
                                <div className="font-black text-2xl tracking-tighter text-white" style={{ width: `${selectedInvoice.taxProfile?.logoWidth || 120}px` }}>{selectedInvoice.taxProfile?.legalName || 'SIN NOMBRE'}</div>
                             )}
                          </div>
                          <div className="text-right">
                             <h1 className="text-2xl font-black tracking-widest text-emerald-400">{selectedInvoice.status === 'DRAFT' ? 'COTIZACIÃ“N' : 'FACTURA COMERCIAL'}</h1>
                             <p className="text-base font-bold text-indigo-200 mt-1">N.Âº {selectedInvoice.invoiceNumber}</p>
                          </div>
                       </div>
                    ) : selectedInvoice.taxProfile?.pdfTemplate === 'Hoja de CÃ¡lculo Fiscal' ? (
                       <div className="p-8 border-b-2 border-green-600 mb-8 bg-[#f1f5f9] -mx-10 -mt-2">
                          <div className="flex justify-between items-end pb-4 border-b border-slate-300">
                             {selectedInvoice.taxProfile?.logoUrl ? (
                                <img src={`http://localhost:3005${selectedInvoice.taxProfile.logoUrl}`} style={{ width: `${selectedInvoice.taxProfile.logoWidth || 120}px` }} className="object-contain grayscale" alt="Logo Previa" />
                             ) : (
                                <div className="font-mono text-xl font-bold text-slate-800" style={{ width: `${selectedInvoice.taxProfile?.logoWidth || 120}px` }}>{selectedInvoice.taxProfile?.legalName || 'SIN NOMBRE'}</div>
                             )}
                             <h1 className="font-mono text-xl font-bold text-slate-800">{selectedInvoice.status === 'DRAFT' ? 'EstimaciÃ³n' : 'CFDI v4.0 (Ingreso)'}</h1>
                          </div>
                       </div>
                    ) : (
                       <div className="flex justify-between items-start mb-12">
                          <div>
                             <h1 className="text-4xl font-light text-slate-800 mb-2">Factura Fiscal</h1>
                             <p className="text-slate-500 font-bold text-sm"># {selectedInvoice.invoiceNumber}</p>
                             <p className="text-[10px] text-slate-400 font-mono font-bold mt-1 tracking-wider uppercase">UUID: {selectedInvoice.satUuid || 'SIN TIMBRAR'}</p>
                          </div>
                          <div className="text-right">
                             {selectedInvoice.taxProfile?.logoUrl ? (
                                <img src={`http://localhost:3005${selectedInvoice.taxProfile.logoUrl}`} alt="Logo" style={{ width: `${selectedInvoice.taxProfile.logoWidth || 120}px` }} className="ml-auto mb-4 object-contain" />
                             ) : (
                                <h2 className="text-4xl font-black text-[#10b981] tracking-tighter mb-4 flex items-center justify-end gap-2">
                                   <div className="grid grid-cols-3 gap-1 w-8 h-8 opacity-80">
                                      <div className="bg-[#2563eb] rounded-sm"></div><div className="bg-[#10b981] rounded-sm"></div><div className="bg-[#2563eb] rounded-sm"></div>
                                      <div className="bg-slate-300 rounded-sm"></div><div className="bg-[#2563eb] rounded-sm"></div><div className="bg-[#10b981] rounded-sm"></div>
                                      <div className="bg-[#10b981] rounded-sm"></div><div className="bg-slate-300 rounded-sm"></div><div className="bg-[#2563eb] rounded-sm"></div>
                                   </div>
                                   {selectedInvoice.taxProfile?.legalName?.split(' ')[0] || 'Empresa'}
                                </h2>
                             )}
                             <div className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                                {selectedInvoice.taxProfile?.legalName || 'Jorge Hurtado Cota'}{"\n"}
                                {selectedInvoice.taxProfile?.zipCode ? `C.P. ${selectedInvoice.taxProfile.zipCode}` : 'Avenida Sinaloa, Navojoa Sonora'}{"\n"}
                                Mexico{"\n"}
                                RFC: {selectedInvoice.taxProfile?.rfc || 'XAXX010101000'}{"\n"}
                                RÃ©gimen fiscal: {selectedInvoice.taxProfile?.taxRegime || '601 - General de Ley Personas Morales'}{"\n"}
                                jorge.hurtadoc@live.com.mx
                             </div>
                          </div>
                       </div>
                    )}
                    
                    <div className="flex justify-between items-end mt-8 border-b border-slate-800 pb-8 mb-8">
                       <div className="space-y-1 text-xs">
                          <p><span className="text-slate-500 inline-block w-32 font-bold">Fecha de emisiÃ³n :</span> {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                          <p><span className="text-slate-500 inline-block w-32 font-bold">Uso CFDI :</span> {selectedInvoice.cfdiUse || 'G03 - Gastos en general'}</p>
                          <p><span className="text-slate-500 inline-block w-32 font-bold">Forma de Pago :</span> {selectedInvoice.paymentForm || '03 - Transferencia electrÃ³nica de fondos'}</p>
                          <p><span className="text-slate-500 inline-block w-32 font-bold">MÃ©todo :</span> {selectedInvoice.paymentMethod || 'PUE - Pago en una sola exhibiciÃ³n'}</p>
                       </div>
                       <div className="text-right space-y-1 text-xs">
                          <p className="text-slate-500 font-bold mb-2">Facturar a</p>
                          <p className="text-[#2563eb] font-bold text-sm">{selectedInvoice.customer?.legalName}</p>
                          <p>{selectedInvoice.customer?.zipCode || 'Sin C.P.'}</p>
                          <p>MÃ©xico</p>
                          <p>RFC del receptor {selectedInvoice.customer?.rfc}</p>
                          <p>RÃ©gimen fiscal: {selectedInvoice.customer?.taxRegime}</p>
                       </div>
                    </div>

                    {/* Tabla de Articulos Estilo Zoho */}
                    <table className="w-full text-left text-xs mb-8">
                       <thead className="bg-[#334155] text-white">
                          <tr>
                             <th className="py-2.5 px-3 font-bold">Clave SAT</th>
                             <th className="py-2.5 px-3 font-bold">ArtÃ­culo & DescripciÃ³n</th>
                             <th className="py-2.5 px-3 font-bold text-right w-16">Cant.</th>
                             <th className="py-2.5 px-3 font-bold text-right w-24">Tarifa</th>
                             <th className="py-2.5 px-3 font-bold text-center w-20">Impuesto</th>
                             <th className="py-2.5 px-3 font-bold text-right w-28">Importe</th>
                          </tr>
                       </thead>
                       <tbody>
                          {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                             selectedInvoice.items.map((item: any, i: number) => (
                                <tr key={i} className="border-b border-slate-200 text-slate-700">
                                   <td className="py-3 px-3 font-mono">{item.productId || '81112101'}</td>
                                   <td className="py-3 px-3 font-bold break-all max-w-[200px]">{item.description}</td>
                                   <td className="py-3 px-3 text-right">{item.quantity}</td>
                                   <td className="py-3 px-3 text-right">{item.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                   <td className="py-3 px-3 text-center">{(item.taxRate * 100)}%</td>
                                   <td className="py-3 px-3 text-right font-bold">{(item.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                             ))
                          ) : (
                             // Fallback visual
                             <tr className="border-b border-slate-200 text-slate-700">
                                <td className="py-3 px-3 font-mono">81112101</td>
                                <td className="py-3 px-3 font-bold">Servicios Comerciales</td>
                                <td className="py-3 px-3 text-right">1.00</td>
                                <td className="py-3 px-3 text-right">{selectedInvoice.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="py-3 px-3 text-center">16.0%</td>
                                <td className="py-3 px-3 text-right font-bold">{(selectedInvoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                             </tr>
                          )}
                       </tbody>
                    </table>

                    <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-8 mb-8">
                       <div className="w-1/2 rounded p-3 bg-slate-50 border border-slate-100 flex items-center justify-center pt-8">
                          {/* Sello Digital Mockhouse */}
                          <div className="text-[6px] text-slate-500 break-all leading-tight font-mono w-full px-2 text-justify">
                             ||1.1|{selectedInvoice.satUuid || '00000000-0000-0000-0000-000000000000'}|{new Date(selectedInvoice.date).toISOString()}|SAT970701NN3|rA/9A+bO22nZqQc6Y/Z1X/z2D+3KxG...yH+G|00001000000504465028||
                          </div>
                       </div>
                       <div className="w-64 space-y-2">
                          <div className="flex justify-between text-slate-600">
                             <span>Sub Total</span>
                             <span>{selectedInvoice.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          {selectedInvoice.items?.some((i:any)=>i.taxRate === 0.16) || !selectedInvoice.items && selectedInvoice.taxTotal > 0 ? (
                             <div className="flex justify-between text-slate-600">
                                <span>IVA (16%)</span>
                                <span>{selectedInvoice.taxTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                          ) : null}
                          {selectedInvoice.items?.some((i:any)=>i.taxRate === 0.08) ? (
                             <div className="flex justify-between text-slate-600">
                                <span>IVA (8%)</span>
                                <span>{selectedInvoice.taxTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             </div>
                          ) : null}
                           <div className="flex justify-between font-bold text-sm bg-slate-100 p-2 rounded mt-2 text-slate-800">
                              <span>Importe Total</span>
                              <span>MXN{selectedInvoice.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                           </div>
                           <div className="flex justify-between text-xs text-[#10b981] p-2">
                              <span>Pagado</span>
                              <span>(-) MXN{(selectedInvoice.total - getBalanceDue(selectedInvoice)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                           </div>
                           <div className="flex justify-between font-bold text-sm bg-blue-50/50 border border-blue-100 p-2 rounded mt-2 text-[#2563eb]">
                              <span>Saldo Adeudado</span>
                              <span>MXN{getBalanceDue(selectedInvoice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                           </div>
                        </div>
                    </div>

                    <div className="text-slate-500 text-[10px] leading-relaxed grid grid-cols-2 gap-4">
                       <div>
                          <p><strong>RÃ©gimen Fiscal (Emisor):</strong> {selectedInvoice.taxProfile?.taxRegime || '601 - General de Ley Personas Morales'}</p>
                          <p><strong>Lugar de ExpediciÃ³n:</strong> {selectedInvoice.taxProfile?.zipCode || '85000'}</p>
                          <p className="mt-4 font-bold text-slate-400">Este documento es una representaciÃ³n impresa de un CFDI.</p>
                       </div>
                       <div className="text-right">
                          <p><strong>Certificado SAT:</strong> 00001000000504465028</p>
                          <p><strong>Fecha CertificaciÃ³n:</strong> {new Date(selectedInvoice.date).toLocaleString('es-ES')}</p>
                       </div>
                    </div>
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

         {/* Template Change Modal */}
         {isTemplateModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
               <div className="bg-[#f8fafc] rounded-lg shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 bg-white shadow-sm z-10">
                     <h3 className="text-xl font-bold text-slate-800">GalerÃ­a de Plantillas</h3>
                     <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5"/></button>
                  </div>
                  <div className="p-8 flex-1 overflow-y-auto">
                     <p className="text-slate-600 mb-6 font-medium">Selecciona una plantilla predefinida y modifÃ­cala a tu gusto para aplicar a tus facturas futuras.</p>
                     
                     <div className="grid grid-cols-3 gap-8">
                        {/* Option 1 */}
                        <div 
                           onClick={() => {setCurrentTemplate('EstÃ¡ndar - Estilo europeo'); setIsTemplateModalOpen(false);}}
                           className={`group bg-white border-2 rounded-lg cursor-pointer transition-all overflow-hidden p-2
                              ${currentTemplate === 'EstÃ¡ndar - Estilo europeo' ? 'border-[#10b981] shadow-md ring-4 ring-emerald-50' : 'border-slate-200 hover:border-[#2563eb] hover:shadow-lg'}`}
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
                           <p className="text-center font-bold mt-4 mb-2 text-slate-700">EstÃ¡ndar - Estilo europeo</p>
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
                           onClick={() => {setCurrentTemplate('Hoja de CÃ¡lculo Fiscal'); setIsTemplateModalOpen(false);}}
                           className={`group bg-white border-2 rounded-lg cursor-pointer transition-all overflow-hidden p-2
                              ${currentTemplate === 'Hoja de CÃ¡lculo Fiscal' ? 'border-[#10b981] shadow-md ring-4 ring-emerald-50' : 'border-slate-200 hover:border-[#2563eb] hover:shadow-lg'}`}
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
                           <p className="text-center font-bold mt-4 mb-2 text-slate-700">Hoja de CÃ¡lculo Fiscal</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
         {/* Payment Modal */}
         {isPaymentModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
               <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 bg-slate-50 shadow-sm z-10">
                     <h3 className="text-lg font-bold text-slate-800">Registrar Pago Recibido</h3>
                     <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6">
                     <p className="text-sm text-slate-600 mb-4">Registra un pago parcial o total para la factura <span className="font-bold">{selectedInvoice?.invoiceNumber}</span>. El saldo adeudado actual es de <span className="font-bold text-[#f59e0b]">MXN{getBalanceDue(selectedInvoice).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>.</p>
                     
                     <div className="space-y-4 text-sm mt-4">
                        <div>
                           <label className="block text-slate-700 font-bold mb-1">Monto del Pago (MXN) *</label>
                           <input type="number" step="0.01" max={getBalanceDue(selectedInvoice)} value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" placeholder="Ej. 1500.00" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-slate-700 font-bold mb-1">Fecha de pago *</label>
                              <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" />
                           </div>
                           <div>
                              <label className="block text-slate-700 font-bold mb-1">Modo de pago *</label>
                              <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] bg-white">
                                 <option value="01">01 - Efectivo</option>
                                 <option value="02">02 - Cheque nominativo</option>
                                 <option value="03">03 - Transferencia electrÃ³nica</option>
                                 <option value="04">04 - Tarjeta de crÃ©dito</option>
                                 <option value="28">28 - Tarjeta de dÃ©bito</option>
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="block text-slate-700 font-medium mb-1">Referencia # <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                           <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" placeholder="Ej. TR-009121" />
                        </div>
                        <div>
                           <label className="block text-slate-700 font-medium mb-1">Notas internas <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                           <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" placeholder="Anotaciones sobre este pago..." rows={2}></textarea>
                        </div>
                     </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                     <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors" disabled={isSubmittingPayment}>Cancelar</button>
                     <button onClick={handleRegisterPayment} disabled={isSubmittingPayment || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || parseFloat(paymentForm.amount) > getBalanceDue(selectedInvoice)} className="px-4 py-2 text-sm font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                        {isSubmittingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Registrar Pago
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Cancel Modal */}
         {isCancelModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
               <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-red-200 bg-red-50 shadow-sm z-10">
                     <h3 className="text-lg font-bold text-red-800">Cancelar CFDI ante el SAT</h3>
                     <button onClick={() => setIsCancelModalOpen(false)} className="text-slate-400 hover:text-red-600"><XCircle className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6">
                     <p className="text-sm text-slate-600 mb-4">Vas a solicitar la cancelaciÃ³n del UUID <span className="font-mono text-xs">{selectedInvoice?.satUuid}</span> al SAT. Por favor indica el motivo oficial tributario:</p>
                     
                     <div className="space-y-4 text-sm mt-4">
                        <div>
                           <label className="block text-slate-700 font-bold mb-1">Motivo de CancelaciÃ³n *</label>
                           <select value={cancelForm.motive} onChange={(e) => setCancelForm({...cancelForm, motive: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-red-500 bg-white">
                              <option value="01">01 - Comprobante emitido con errores con relaciÃ³n</option>
                              <option value="02">02 - Comprobante emitido con errores sin relaciÃ³n</option>
                              <option value="03">03 - No se llevÃ³ a cabo la operaciÃ³n</option>
                              <option value="04">04 - OperaciÃ³n nominativa relacionada en la factura global</option>
                           </select>
                        </div>
                        
                        {cancelForm.motive === '01' && (
                           <div>
                              <label className="block text-slate-700 font-bold mb-1">Folio Fiscal Sustituto (UUID) *</label>
                              <input type="text" value={cancelForm.substitutionUuid} onChange={(e) => setCancelForm({...cancelForm, substitutionUuid: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-red-500 font-mono text-xs uppercase" placeholder="Ej. 1A2B3C4D-5E6F-..." />
                              <p className="text-xs text-slate-400 mt-1">Obligatorio para motivo 01. Indica el UUID de la factura que reemplaza a la actual.</p>
                           </div>
                        )}
                        
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs border border-yellow-200 mt-4">
                           <strong>AtenciÃ³n:</strong> Esta acciÃ³n requiere que tus archivos CSD y contraseÃ±a estÃ©n guardados en tu perfil fiscal. Firmaremos criptogrÃ¡ficamente tu solicitud de cancelaciÃ³n.
                        </div>
                     </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                     <button onClick={() => setIsCancelModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors" disabled={isCanceling}>Cerrar</button>
                     <button onClick={submitCancel} disabled={isCanceling} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                        {isCanceling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />} Enviar al SAT
                     </button>
                  </div>
               </div>
            </div>
         )}
    </div>
  );
}
