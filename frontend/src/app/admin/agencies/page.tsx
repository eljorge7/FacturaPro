"use client";

import { useEffect, useState } from "react";
import { Building, ShieldAlert, Activity, Users, Crown, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminAgencies() {
  const { token } = useAuth();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencies();
  }, [token]);

  const fetchAgencies = async () => {
    if (!token) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/tenants`, {
        cache: 'no-store',
        headers: { 
           'Authorization': `Bearer ${token}`,
           'Pragma': 'no-cache',
           'Cache-Control': 'no-cache'
        }
      });
      const data = await res.json();
      setAgencies(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
             <Building className="w-8 h-8 text-indigo-600" />
             Directorio de Agencias
          </h1>
          <p className="text-slate-500 mt-1">Monitorea todos los clientes que utilizan la infraestructura de FacturaPro.</p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-x divide-slate-100">
           <div className="px-6 py-3 text-center">
              <div className="text-2xl font-black text-indigo-600">{agencies.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Activas</div>
           </div>
           <div className="px-6 py-3 text-center">
              <div className="text-2xl font-black text-emerald-500">{agencies.filter(a => a.subscriptionTier !== 'TRIAL').length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Pagando</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Agencia Comercial</th>
                <th className="px-6 py-4">Razón Social Legal (SAT)</th>
                <th className="px-6 py-4 text-center">Nivel de Suscripción</th>
                <th className="px-6 py-4 text-center">Timbres Restantes</th>
                <th className="px-6 py-4 text-right">Fecha de Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agencies.length === 0 ? (
                 <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-bold">No hay clientes aún</td></tr>
              ) : (
                 agencies.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black">
                              {t.tradeName ? t.tradeName.substring(0,2).toUpperCase() : t.name.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-bold text-slate-800">{t.tradeName || t.name}</p>
                             <p className="text-xs font-mono text-slate-400 mt-0.5">{t.phone || 'Sin Celular'}</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <p className="font-bold text-slate-500 text-sm">{t.name}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                         {t.subscriptionTier === 'TRIAL' ? (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700 w-32">
                               Trial (Prueba)
                            </span>
                         ) : (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 w-32 shadow-sm border border-indigo-200">
                               <Crown className="w-3.5 h-3.5" /> {t.subscriptionTier}
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-center">
                         <div className="font-black text-slate-700 tabular-nums">
                            {t.availableStamps} <span className="text-xs text-slate-400 font-bold">XML</span>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <span className="text-slate-500 text-sm font-medium">
                           {new Date(t.createdAt).toLocaleDateString()}
                         </span>
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
