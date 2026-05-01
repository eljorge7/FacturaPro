"use client";

import { useState, useEffect } from "react";
import { DollarSign, Building2, TrendingUp, AlertCircle, RefreshCw, Container, Plus } from "lucide-react";
import { ExpensesAPI } from "../../lib/ExpensesAPI";
import { useAuth } from "@/components/AuthProvider";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";

interface Expense {
  id: string;
  amount: number;
  total: number;
  date: string;
  category: string;
  satUuid: string | null;
}

interface Supplier {
  id: string;
  legalName: string;
  rfc: string | null;
  taxRegime: string | null;
  category: string;
  email: string | null;
  phone: string | null;
  expenses?: Expense[];
}

export default function SuppliersPage() {
  const { tenantId: activeTenantId } = useAuth();
  const tenantId = activeTenantId || 'demo-tenant';
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ legalName: '', rfc: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await ExpensesAPI.getSuppliers(tenantId);
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3005/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(newSupplier)
      });
      if (!res.ok) throw new Error('Error al crear proveedor');
      setShowAddModal(false);
      setNewSupplier({ legalName: '', rfc: '', email: '', phone: '' });
      fetchData();
    } catch (err) {
      alert('Hubo un error al agregar el proveedor.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recharts Data Prep
  const chartData = suppliers
    .filter(s => (s.expenses || []).length > 0)
    .map(s => {
      // In ExpensesAPI, the expense object uses "total" instead of "amount" for the full cost
      const expensesArray = s.expenses || [];
      const totalAmount = expensesArray.reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0);
      const nameFallback = s.legalName || 'Proveedor Desconocido';
      return {
        name: nameFallback.substring(0, 15) + (nameFallback.length > 15 ? '...' : ''),
        value: totalAmount,
      };
    })
    .sort((a,b) => b.value - a.value);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b', '#06b6d4'];
  const totalSpent = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (loading) {
     return <div className="p-10 text-center text-indigo-500 animate-pulse font-bold">Cargando Proveedores...</div>;
  }

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Container className="h-8 w-8 text-indigo-600" />
             Directorio de Proveedores
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Análisis de egresos distribuidos e inteligencia financiera de tus proveedores.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="bg-white border text-sm font-bold border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <RefreshCw className="h-4 w-4" /> Recargar
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 border border-transparent text-sm font-bold text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfica de Distribución */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Distribución de Gastos
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Sumatoria global por emisor (RFC)</p>
          </div>
          <div className="p-6 relative flex-1 flex flex-col justify-center">
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
               <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total</span>
               <span className="text-2xl font-black text-slate-900">${totalSpent.toLocaleString()}</span>
             </div>
             {chartData.length > 0 ? (
               <div className="h-[280px]">
                 <ResponsiveContainer width="100%" minHeight={280}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={105}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value ? `$${Number(value).toLocaleString()}` : "$0", "Gasto"]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
             ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
                  <PieChart className="opacity-10 w-20 h-20" />
                  <p className="font-medium mt-4">Sin datos financieros para graficar</p>
                </div>
             )}
          </div>
        </div>

        {/* Tabla Robusta de Resumen */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Building2 className="h-5 w-5 text-emerald-500" />
               Analítica de Entidades (Proveedores)
             </h2>
             <p className="text-xs text-slate-500 mt-1 font-medium">Monitoreo automático de los RFC que te han emitido facturas de gasto.</p>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-white border-b border-slate-100 text-slate-400 font-bold uppercase text-xs tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Empresa / RFC</th>
                   <th className="px-6 py-4 text-center">Facturas (CFDIs)</th>
                   <th className="px-6 py-4 text-right">Inversión Bruta</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-slate-500">
                        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="font-medium">No cuentas con historial de proveedores.</p>
                        <p className="text-xs mt-1">Sube tus tickets al Buzón de Gastos para detectar a tus proveedores automáticamente.</p>
                      </td>
                    </tr>
                 ) : (
                    suppliers.map((supplier) => {
                      const expenses = supplier.expenses || [];
                      const totalCosto = expenses.reduce((acc, current) => acc + (current.total || current.amount || 0), 0);
                      const qty = expenses.length;
                      return (
                        <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-base">{supplier.legalName || 'Proveedor Desconocido'}</div>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                 {supplier.rfc || 'SIN RFC'}
                               </div>
                               {supplier.email && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{supplier.email}</div>}
                               {supplier.phone && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{supplier.phone}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={qty > 0 ? "bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-xl text-xs inline-block" : "bg-slate-50 text-slate-500 font-bold px-3 py-1 rounded-xl text-xs inline-block"}>
                               {qty} Gasto{qty !== 1 && 's'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                               ${totalCosto.toLocaleString()}
                             </div>
                          </td>
                        </tr>
                      );
                    })
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Registrar Aliado / Proveedor</h2>
            </div>
            <form onSubmit={handleAddSupplier}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Razón Social / Nombre Comercial <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required 
                    value={newSupplier.legalName} 
                    onChange={e => setNewSupplier({...newSupplier, legalName: e.target.value})} 
                    className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Ej. SYSCOM, Enlaces SC"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">RFC <span className="text-slate-400 font-normal">(Opcional)</span></label>
                  <input 
                    type="text" 
                    value={newSupplier.rfc} 
                    onChange={e => setNewSupplier({...newSupplier, rfc: e.target.value.toUpperCase()})} 
                    className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                    placeholder="ABC123456T1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Teléfono</label>
                    <input 
                      type="text" 
                      value={newSupplier.phone} 
                      onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="10 dígitos"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Correo</label>
                    <input 
                      type="email" 
                      value={newSupplier.email} 
                      onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} 
                      className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="ventas@..."
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting || !newSupplier.legalName} className="px-5 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center">
                  {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
