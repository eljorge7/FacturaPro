import React, { useState } from 'react';
import { X, FileText, CheckCircle } from 'lucide-react';
import { ExpensesAPI } from '../lib/ExpensesAPI';

interface ExpensePreviewDialogProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  xmlData: any; // Data from API parse
}

export default function ExpensePreviewDialog({ tenantId, isOpen, onClose, onSuccess, xmlData }: ExpensePreviewDialogProps) {
  const [saving, setSaving] = useState(false);

  if (!isOpen || !xmlData) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await ExpensesAPI.createManual(tenantId, {
        amount: xmlData.subtotal,
        total: xmlData.total,
        taxTotal: xmlData.taxTotal,
        description: `Compra a ${xmlData.providerName}`,
        isDeductible: true,
        satUuid: xmlData.uuid,
        xmlContent: xmlData.xmlContentRaw,
        providerRfc: xmlData.providerRfc,
        providerName: xmlData.providerName
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Error confirmando gasto XML:\n${err.message || 'Error Desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recibir Factura SAT</h2>
              <p className="text-xs text-slate-500">Revisa la información extraída del XML</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!xmlData.isBelongingToTenant && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="text-red-800 font-bold text-sm flex items-center gap-2">
                <X className="w-4 h-4 bg-red-500 text-white rounded-full p-0.5" /> 
                Posible Fraude o RFC Incorrecto
              </h3>
              <p className="text-red-600 text-xs mt-1">Este gasto fue facturado al RFC <b>{xmlData.receiverRfc}</b>, el cual no coincide con ninguno de los perfiles fiscales de tu empresa.</p>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Proveedor</span>
              <span className="font-bold text-slate-800">{xmlData.providerName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">RFC</span>
              <span className="font-bold text-slate-800">{xmlData.providerRfc}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">UUID SAT</span>
              <span className="font-mono text-xs text-slate-600">{xmlData.uuid}</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex justify-between items-center text-sm text-indigo-800">
              <span className="font-medium">Subtotal</span>
              <span>${xmlData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-indigo-800">
              <span className="font-medium">IVA Extraído</span>
              <span>${xmlData.taxTotal.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-indigo-200/60 flex justify-between items-center font-black text-lg text-indigo-900">
              <span>Total</span>
              <span>${xmlData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Descartar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={saving || !xmlData.isBelongingToTenant} 
            className={`px-5 py-2.5 font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2
              ${!xmlData.isBelongingToTenant ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'}
            `}
          >
            {saving ? 'Registrando...' : <><CheckCircle className="w-5 h-5" /> Confirmar Gasto</>}
          </button>
        </div>
      </div>
    </div>
  );
}
