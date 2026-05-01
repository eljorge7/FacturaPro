import React from 'react';
import { X, FileCode2, Download } from 'lucide-react';

interface DocumentViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: any; // The expense object directly
}

export default function DocumentViewerDialog({ isOpen, onClose, documentData }: DocumentViewerDialogProps) {
  if (!isOpen || !documentData) return null;

  const hasXml = !!documentData.xmlContent;

  const downloadXml = () => {
    if (!hasXml) return;
    const blob = new Blob([documentData.xmlContent], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factura_${documentData.satUuid || documentData.id}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Bóveda Documental</h2>
              <p className="text-xs text-slate-500">{documentData.satUuid ? `UUID: ${documentData.satUuid}` : 'Nota Interna (Sin Fiscalizar)'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Concepto</span>
              <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{documentData.description}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Fecha de Cargo</span>
              <span className="font-bold text-slate-800">{new Date(documentData.date).toLocaleDateString()}</span>
            </div>
            <div className="py-2 border-y border-slate-100">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500 font-medium">Subtotal Estimado</span>
                 <span className="font-bold text-slate-700">${(documentData.total - documentData.taxTotal).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm mt-1">
                 <span className="text-slate-500 font-medium">IVA Trasladado</span>
                 <span className="font-bold text-slate-700">${documentData.taxTotal.toFixed(2)}</span>
               </div>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-800 font-black">Total Facturado</span>
              <span className="font-black text-indigo-700">${documentData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {hasXml ? (
            <button 
              onClick={downloadXml}
              className="w-full px-5 py-3 font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Descargar XML Original
            </button>
          ) : (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
              <p className="text-sm font-bold text-orange-800">No hay XML adjunto</p>
              <p className="text-xs text-orange-600 mt-1">Este gasto fue capturado manualmente y no posee representación fiscal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
