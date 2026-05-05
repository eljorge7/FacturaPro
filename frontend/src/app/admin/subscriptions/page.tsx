"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Search, Activity, ShieldAlert, ArrowRight, Loader2, DollarSign } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminSubscriptions() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    if (!token) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/tenants/upgrade-requests`, {
        cache: 'no-store',
        headers: { 
           'Authorization': `Bearer ${token}`,
           'Pragma': 'no-cache',
           'Cache-Control': 'no-cache'
        }
      });
      const data = await res.json();
      setRequests(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    if (!window.confirm('¿Confirmas que has recibido el pago y deseas liberar el módulo?')) return;
    
    setApproving(id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/tenants/upgrade-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al aprobar');
      
      alert('Suscripción liberada. Se ha enviado el WA de confirmación.');
      fetchRequests(); // Recargar lista
    } catch (e) {
      console.error(e);
      alert('Hubo un problema al aprobar. Revisa logs.');
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <ShieldAlert className="w-8 h-8 text-indigo-600" />
             Auditoría de Suscripciones
          </h1>
          <p className="text-slate-500 mt-1">Valida las transferencias y libera los candados de las agencias.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Agencia</th>
                <th className="px-6 py-4">Referencia WA</th>
                <th className="px-6 py-4">Plan Solicitado</th>
                <th className="px-6 py-4">Monto A Pagar</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                 <tr><td colSpan={6} className="text-center py-10 text-slate-400">No hay nuevas solicitudes</td></tr>
              ) : (
                 requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                         <p className="font-bold text-slate-800">{r.tenant?.name || 'Desconocida'}</p>
                         <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()} a las {new Date(r.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-5">
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-sm font-medium text-slate-700 font-mono">
                            {r.reference}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className="font-black text-indigo-600">{r.tier}</span> {r.isAnnual && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold ml-1">ANUAL</span>}
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-1 text-slate-700 font-bold">
                           <DollarSign className="w-4 h-4 text-slate-400" />
                           {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                         {r.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                               <Activity className="w-3.5 h-3.5" /> Pendiente Pago
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                               <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-right">
                         {r.status === 'PENDING' && (
                            <button 
                               onClick={() => handleApprove(r.id)} 
                               disabled={approving === r.id}
                               className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                            >
                               {approving === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Liberar'}
                            </button>
                         )}
                         {r.status === 'APPROVED' && (
                            <span className="text-slate-400 text-sm font-medium">Completado</span>
                         )}
                      </td>
                    </tr>
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
