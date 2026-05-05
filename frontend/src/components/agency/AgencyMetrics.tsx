import { useState, useEffect } from "react";
import { Activity, BarChart3, Clock, AlertTriangle, Users, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

export default function AgencyMetrics({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api");
      try {
        const res = await fetch(`${baseUrl}/auth/agency/metrics`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          setMetrics(await res.json());
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchMetrics();
  }, [token]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Cargando inteligencia de operaciones...</div>;
  if (!metrics) return null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
       
       {/* High Level KPI Cards */}
       <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
             <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-1 shadow-sm">Facturación Proyectada</p>
             <h3 className="text-3xl font-black mb-2 tracking-tighter">MXN${(metrics.planAcumulado || 0).toLocaleString()}</h3>
             <p className="text-[10px] text-indigo-200">Basado en planes ({metrics.totalClientes} Clientes Vivos)</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Timbres Consumidos</p>
                <div className="p-1.5 bg-emerald-100 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
             </div>
             <h3 className="text-3xl font-black text-slate-800 mb-1">{metrics.timbres.mensual} <span className="text-sm font-medium text-slate-400">/ mes</span></h3>
             <p className="text-xs text-slate-400 font-medium">Histórico global: {metrics.timbres.historico} CFDIs</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Alerta Suscripciones</p>
                <div className="p-1.5 bg-rose-100 rounded-lg"><AlertTriangle className="w-4 h-4 text-rose-600" /></div>
             </div>
             <h3 className="text-3xl font-black text-slate-800 mb-1">{metrics.subscriptions.expired.length} <span className="text-sm font-medium text-slate-400">vencidas</span></h3>
             <p className="text-xs text-slate-400 font-medium">{metrics.subscriptions.expiringSoon.length} próximas a vencer.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Salud Operativa</p>
                <div className="p-1.5 bg-sky-100 rounded-lg"><Activity className="w-4 h-4 text-sky-600" /></div>
             </div>
             <h3 className="text-3xl font-black text-slate-800 mb-1">
               {metrics.tasks.total > 0 ? Math.round((metrics.tasks.done / metrics.tasks.total) * 100) : 100}%
             </h3>
             <p className="text-xs text-slate-400 font-medium">{metrics.tasks.pending} tareas rezagadas (TODO)</p>
          </div>
       </div>

       {/* Detailed Charts Row */}
       <div className="grid grid-cols-2 gap-6">
          
          {/* Staff Performance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <h4 className="flex items-center gap-2 text-slate-800 font-bold mb-6">
                <Users className="w-5 h-5 text-indigo-600" />
                Rendimiento de Auxiliares (Kanban)
             </h4>
             <div className="space-y-4">
                {metrics.staffChart.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-6 border-2 border-dashed border-slate-100 rounded-xl">No hay tareas asignadas aún.</div>
                ) : metrics.staffChart.map((staff: any, idx: number) => {
                   const total = staff.done + staff.pending;
                   const pct = total === 0 ? 0 : Math.round((staff.done / total) * 100);
                   return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                            <span>{staff.name}</span>
                            <span className={pct === 100 ? 'text-emerald-500' : 'text-slate-500'}>{staff.done}/{total} completadas</span>
                         </div>
                         <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                         </div>
                      </div>
                   )
                })}
             </div>
          </div>

          {/* Accounts & Suscriptions Warning */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <h4 className="flex items-center gap-2 text-slate-800 font-bold mb-6">
                <Clock className="w-5 h-5 text-rose-500" />
                Radar de Suscripciones (Cuentas por Cobrar)
             </h4>
             <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {metrics.subscriptions.expired.length === 0 && metrics.subscriptions.expiringSoon.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-8 text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                      <p className="font-bold text-sm">Todos los clientes están al corriente.</p>
                   </div>
                ) : (
                   <>
                     {metrics.subscriptions.expired.map((name: string, i: number) => (
                        <div key={`exp-${i}`} className="flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-xl">
                           <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                              <span className="text-sm font-bold text-rose-800">{name}</span>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-2 py-0.5 rounded">Vencido</span>
                        </div>
                     ))}
                     {metrics.subscriptions.expiringSoon.map((name: string, i: number) => (
                        <div key={`soon-${i}`} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                           <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-bold text-amber-800">{name}</span>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Próximo a Vencer</span>
                        </div>
                     ))}
                   </>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}
