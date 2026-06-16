import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle } from 'lucide-react';
import { ExpensesAPI } from '../lib/ExpensesAPI';

interface ExpenseDialogProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function ExpenseDialog({ tenantId, isOpen, onClose, onSuccess, initialData }: ExpenseDialogProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isDeductible, setIsDeductible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      ExpensesAPI.getCategories(tenantId).then(setCategories).catch(console.error);
      if (initialData) {
        setAmount(initialData.isDeductible ? (initialData.total - initialData.taxTotal).toString() : initialData.total.toString());
        setDescription(initialData.description || '');
        setCategoryId(initialData.categoryId || '');
        setIsDeductible(initialData.isDeductible || false);
        setDate(new Date(initialData.date).toISOString().split('T')[0]);
      } else {
        setAmount('');
        setDescription('');
        setCategoryId('');
        setIsDeductible(false);
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, tenantId, initialData]);

  if (!isOpen) return null;

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NEW_CATEGORY') {
      const name = prompt('Nombre de la nueva categoría:');
      if (name) {
        try {
          const newCat = await ExpensesAPI.createCategory(tenantId, name);
          setCategories([...categories, newCat]);
          setCategoryId(newCat.id);
        } catch (err) {
          console.error(err);
          alert('Error creando categoría');
        }
      }
    } else {
      setCategoryId(val);
    }
  };

  const handleSave = async () => {
    if (!amount || !description) return alert('Campos obligatorios');
    setSaving(true);
    try {
      const parsedAmount = parseFloat(amount);
      const taxTotal = isDeductible ? parsedAmount * 0.16 : 0;
      const total = parsedAmount + taxTotal;

      const payload = {
        amount: parsedAmount,
        total,
        taxTotal,
        description,
        categoryId: categoryId || null,
        isDeductible,
        date: new Date(date).toISOString()
      };

      if (initialData?.id) {
        await ExpensesAPI.updateManual(initialData.id, tenantId, payload);
      } else {
        await ExpensesAPI.createManual(tenantId, payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{initialData ? 'Editar Gasto' : 'Nuevo Gasto Manual'}</h2>
              <p className="text-xs text-slate-500">Caja chica o notas sin factura</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm font-medium text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5">Descripción</label>
              <input 
                type="text" 
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ej. Papelería"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1.5">Fecha</label>
              <input 
                type="date" 
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5">Monto (Subtotal)</label>
              <input 
                type="number" 
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1.5">Categoría</label>
              <select 
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                value={categoryId}
                onChange={handleCategoryChange}
              >
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="NEW_CATEGORY" className="font-bold text-indigo-600 bg-indigo-50">+ Crear Nueva Categoría</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={isDeductible}
              onChange={(e) => setIsDeductible(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
            />
            <div>
              <p className="font-bold text-slate-800">¿Es deducible de impuestos?</p>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Si se marca, calculará IVA sobre el subtotal para la DIOT.</p>
            </div>
          </label>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2">
            {saving ? 'Guardando...' : <><CheckCircle className="w-5 h-5" /> Guardar Gasto</>}
          </button>
        </div>
      </div>
    </div>
  );
}
