"use client";

import { useEffect, useState } from "react";
import { DollarSign, Search, Plus, Calendar, CheckCircle, ChevronRight, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PayrollDashboard() {
  const router = useRouter();
  const { tenantId: activeTenantId, token } = useAuth();
  
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayrollRuns();
  }, [token, activeTenantId]);

  const fetchPayrollRuns = async () => {
    if (!token || !activeTenantId) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/payroll`, {
         headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRuns(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPaid = runs.filter(r => r.status === 'PAID').reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="font-sans min-h-screen bg-[#f9fafb]">
       {/* Toolbar */}
       <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <DollarSign className="w-5 h-5 text-emerald-600" />
               Nóminas
            </h1>
         </div>
         
         <div className="flex gap-3">
            <Link href="/payroll/new" className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
               <Plus className="w-4 h-4" /> Nueva Corrida de Nómina
            </Link>
         </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
         {/* KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Dispersado (Histórico)</p>
               <h2 className="text-3xl font-black text-slate-800">${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Corridas Generadas</p>
               <h2 className="text-3xl font-black text-slate-800">{runs.length}</h2>
            </div>
         </div>

         {/* Runs History */}
         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
               <h3 className="font-bold text-slate-800 text-lg">Historial de Pagos</h3>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                     <tr>
                        <th className="py-4 px-6">Periodo</th>
                        <th className="py-4 px-6">Estado</th>
                        <th className="py-4 px-6">Empleados Pagados</th>
                        <th className="py-4 px-6 text-right">Monto Total</th>
                        <th className="py-4 px-6"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                     {isLoading ? (
                        <tr><td colSpan={5} className="py-12 text-center text-slate-400">Cargando nóminas...</td></tr>
                     ) : runs.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="py-16 text-center">
                              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <h4 className="font-bold text-slate-700 text-lg">Aún no hay nóminas generadas</h4>
                              <p className="text-slate-500 mb-4 max-w-md mx-auto">Comienza tu primera corrida para calcular los sueldos y dispersar los pagos a tu equipo.</p>
                              <Link href="/payroll/new" className="inline-flex bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors">
                                 Crear Primera Nómina
                              </Link>
                           </td>
                        </tr>
                     ) : (
                        runs.map((run: any) => (
                           <tr key={run.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="py-4 px-6">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                       <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="font-bold text-slate-800">
                                          {new Date(run.periodStart).toLocaleDateString()} al {new Date(run.periodEnd).toLocaleDateString()}
                                       </p>
                                       {run.paymentDate && <p className="text-xs text-slate-500">Pagada el {new Date(run.paymentDate).toLocaleDateString()}</p>}
                                    </div>
                                 </div>
                              </td>
                              <td className="py-4 px-6">
                                 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${run.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {run.status === 'PAID' ? <CheckCircle className="w-3.5 h-3.5"/> : <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>}
                                    {run.status === 'PAID' ? 'CERRADA' : 'BORRADOR'}
                                 </span>
                              </td>
                              <td className="py-4 px-6 text-slate-600 font-medium">
                                 <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                       <div className="w-6 h-6 rounded-full bg-slate-200 border border-white"></div>
                                       <div className="w-6 h-6 rounded-full bg-slate-300 border border-white"></div>
                                    </div>
                                    {run._count?.payslips || 0} Empleados
                                 </div>
                              </td>
                              <td className="py-4 px-6 text-right font-black text-slate-800 text-lg">
                                 ${run.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </td>
                              <td className="py-4 px-6 text-right">
                                 <button className="text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg p-2 opacity-0 group-hover:opacity-100">
                                    <ArrowUpRight className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
