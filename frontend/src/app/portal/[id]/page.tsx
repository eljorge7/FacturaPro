"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Download, CheckCircle, Clock, CreditCard, ChevronRight, XCircle } from "lucide-react";

export default function PortalPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     if (!id) return;
     const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
     
     fetch(`${baseUrl}/portal/invoices/${id}`)
        .then(async (res) => {
            if (!res.ok) throw new Error("Documento no encontrado o expirado.");
            return res.json();
        })
        .then(data => {
            setInvoice(data);
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setLoading(false);
        });
  }, [id]);

  if (loading) {
     return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
           <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="text-slate-500 font-medium animate-pulse">Tratando de cargar el documento mágico...</p>
        </div>
     );
  }

  if (error || !invoice) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-slate-100">
               <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
               <h1 className="text-xl font-bold text-slate-800 mb-2">Enlace Inválido</h1>
               <p className="text-sm text-slate-500">Este Magic Link no es válido, expiró o no tienes permiso para visualizarlo. Contacta a tu emisor.</p>
           </div>
        </div>
      );
  }

  const { taxProfile, customer } = invoice;
  const brandColor = taxProfile?.brandColor || "#10b981";
  const brandFont = taxProfile?.brandFont === "Courier" ? "Courier, monospace" : (taxProfile?.brandFont === "Times-Roman" ? "Times New Roman, serif" : "system-ui, sans-serif");
  
  const paymentTotal = invoice.payments?.reduce((acc: any, curr: any) => acc + curr.amount, 0) || 0;
  const isPaid = (invoice.total - paymentTotal) <= 0.01;
  const balance = invoice.total - paymentTotal;

  const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-4 sm:px-6" style={{fontFamily: brandFont}}>
        
        {/* Encabezado Visual */}
        <div className="w-full max-w-3xl mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
               {taxProfile?.logoUrl ? (
                   <img src={`${baseUrl}${taxProfile.logoUrl}`} alt="Logo" className="max-w-[120px] max-h-[60px] object-contain" />
               ) : (
                   <div className="text-2xl font-black tracking-tight" style={{color: brandColor}}>{taxProfile?.legalName || 'EMPRESA'}</div>
               )}
            </div>
            <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portal Comercial Privado</span>
            </div>
        </div>

        {/* Tarjeta Principal del Documento */}
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header de la Tarjeta */}
            <div className="p-8 text-white relative overflow-hidden" style={{backgroundColor: brandColor}}>
                {/* Overlay abstracto sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                   <div>
                       <h1 className="text-3xl font-black mb-1 opacity-90 drop-shadow-md tracking-tight">FACTURA CFDI</h1>
                       <p className="text-white/80 font-medium text-lg">Folio: {invoice.invoiceNumber}</p>
                       <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold text-white uppercase tracking-wider shadow-inner">
                           {invoice.status === 'CANCELADA' ? (
                               <><XCircle className="w-4 h-4"/> CANCELADA</>
                           ) : isPaid ? (
                               <><CheckCircle className="w-4 h-4"/> PAGADA TOTAL</>
                           ) : (
                               <><Clock className="w-4 h-4"/> SALDO PENDIENTE</>
                           )}
                       </div>
                   </div>
                   <div className="text-left sm:text-right bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
                       <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-1">Total a Pagar</p>
                       <p className="text-4xl font-black drop-shadow-lg">${invoice.total.toLocaleString('es-MX', {minimumFractionDigits:2})}</p>
                       <p className="text-white/70 font-semibold">{invoice.currency}</p>
                   </div>
                </div>
            </div>

            {/* Cuerpo de la Tarjeta */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-700">
                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Emitido Por</h3>
                   <p className="font-bold text-slate-800 text-lg leading-tight">{taxProfile?.legalName}</p>
                   <p className="text-sm mt-1">RFC: {taxProfile?.rfc}</p>
                   <p className="text-sm mt-1">Fecha Emisión: {new Date(invoice.createdAt).toLocaleDateString('es-MX', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                </div>
                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Preparado Para</h3>
                   <p className="font-bold text-slate-800 text-lg leading-tight">{customer?.legalName}</p>
                   <p className="text-sm mt-1">RFC: {customer?.rfc}</p>
                   <p className="text-sm mt-1">CP: {customer?.zipCode}</p>
                </div>
            </div>

            {/* Resumen de Partidas Breve */}
            <div className="bg-slate-50 px-8 py-6 border-y border-slate-100">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Resumen de Conceptos</h3>
               <div className="space-y-3">
                   {invoice.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                         <div className="flex gap-3 items-center">
                            <span className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">{item.quantity}</span>
                            <span className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-xs">{item.description}</span>
                         </div>
                         <span className="font-bold text-slate-800">${item.total.toLocaleString('es-MX', {minimumFractionDigits:2})}</span>
                      </div>
                   ))}
               </div>
            </div>

            {/* Botonera de Acción */}
            <div className="p-8 flex flex-col sm:flex-row gap-4 bg-white items-center justify-between">
                <div className="flex gap-4 w-full sm:w-auto">
                    <button 
                       onClick={() => window.open(`${baseUrl}/portal/invoices/${id}/pdf`, '_blank')}
                       className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm border border-slate-200 transition-colors"
                    >
                       <FileText className="w-5 h-5"/> Descargar PDF
                    </button>
                    {invoice.xmlContent && (
                       <button 
                          onClick={() => window.open(`${baseUrl}/portal/invoices/${id}/xml`, '_blank')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm border border-slate-200 transition-colors"
                       >
                          <Download className="w-5 h-5"/> Bajar XML
                       </button>
                    )}
                </div>

                {!isPaid && invoice.status !== 'CANCELADA' && (
                    <button 
                       className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-lg"
                       style={{backgroundColor: brandColor}}
                       onClick={() => alert('La integración con Stripe/MercadoPago estará lista en la siguiente fase. Por ahora, realiza transferencia directa.')}
                    >
                       <CreditCard className="w-5 h-5"/> Pagar en Línea
                    </button>
                )}
            </div>
        </div>

        {/* Footer Seguro */}
        <div className="mt-8 text-center flex flex-col items-center justify-center">
           <p className="text-xs font-medium text-slate-400 mb-2">Documento Seguro encriptado mediante 256-bit AES.</p>
           <a href="https://radiotecpro.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 justify-center opacity-60 hover:opacity-100 transition-opacity bg-slate-200/50 hover:bg-slate-200 px-3 py-1.5 rounded-full">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Powered by</span>
               <div className="flex items-center gap-1 text-slate-800 font-black tracking-tighter text-sm">
                   <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white p-0.5 rounded shadow-sm">
                       <FileText className="w-3 h-3" />
                   </div>
                   FacturaPro by radiotecpro.com
               </div>
           </a>
        </div>
    </div>
  );
}
