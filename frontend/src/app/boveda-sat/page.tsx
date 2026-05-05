"use client";

import { useState, useEffect } from "react";
import { 
    Landmark, 
    RefreshCcw, 
    Download, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    Plus, 
    Calendar,
    ChevronDown
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function BovedaSatPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<"issued" | "received">("received");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/boveda-sat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleRequestDownload = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const res = await fetch(`${getBaseUrl()}/boveda-sat/request`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ start: startDate, end: endDate, type })
          });
          const data = await res.json();
          if (res.ok) {
              alert(`Solicitud Aceptada por el SAT (ID: ${data.idSolicitud})`);
              setShowModal(false);
              fetchRequests();
          } else {
              alert(data.message || "Fallo la solicitud.");
          }
      } catch (e) {
          alert("Error de comunicación.");
      }
      setIsSubmitting(false);
  };

  const handleVerify = async (idSolicitud: string) => {
      try {
          const res = await fetch(`${getBaseUrl()}/boveda-sat/verify/${idSolicitud}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              await fetchRequests();
              alert("Verificación ejecutada.");
          }
      } catch (e) {
          alert("Fallo la verificación.");
      }
  };

  const handleProcessPackages = async (idSolicitud: string, packagesStr: string) => {
      const packageIds = packagesStr.split(',');
      if (packageIds.length === 0 || !packageIds[0]) return alert("No hay paquetes disponibles.");

      try {
          // Procesamos solo el primero por simplificar, o iteramos.
          for (let p of packageIds) {
              const res = await fetch(`${getBaseUrl()}/boveda-sat/download/${p}`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (res.ok) {
                  alert(`Paquete ${p} extraído. Invoices: ${data.processStats?.invoicesCreated}, Gastos (DRAFT): ${data.processStats?.expensesCreated}, Ignorados: ${data.processStats?.duplicatesIgnored}`);
              } else {
                  alert(`Error en paquete ${p}: ` + data.message);
              }
          }
          fetchRequests(); // Actualizar estado a Success
      } catch (e) {
          console.error(e);
          alert("Fallo procesando el paquete.");
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Landmark className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bóveda Efisco (SAT)</h1>
            <p className="text-sm text-slate-500 font-medium">Descarga masiva de XMLs directo de los servidores de Hacienda</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Solicitud
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                     <th className="px-6 py-4">ID Solicitud</th>
                     <th className="px-6 py-4">Tipo</th>
                     <th className="px-6 py-4">Período</th>
                     <th className="px-6 py-4">Fecha Petición</th>
                     <th className="px-6 py-4">Estatus SAT</th>
                     <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     <tr><td colSpan={6} className="text-center py-10 text-slate-400">Cargando Bóveda...</td></tr>
                  ) : requests.length === 0 ? (
                     <tr><td colSpan={6} className="text-center py-10 text-slate-400">No hay descargas masivas solicitadas aún.</td></tr>
                  ) : requests.map(req => (
                     <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{req.idSolicitud}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${req.requestType === 'received' ? 'bg-amber-100/50 text-amber-700 border border-amber-200' : 'bg-emerald-100/50 text-emerald-700 border border-emerald-200'}`}>
                              {req.requestType === 'received' ? 'Egresos' : 'Ingresos'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium text-xs">
                           {req.periodStart.split('T')[0]} <span className="text-slate-400 mx-1">→</span> {req.periodEnd.split('T')[0]}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                           {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                           {req.status === 'ACCEPTED' || req.status === 'PENDING' ? (
                              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-max border border-indigo-100">
                                 <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                                 <span className="text-xs font-semibold uppercase">En Proceso</span>
                              </div>
                           ) : req.status === 'SUCCESS' ? (
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-max border border-emerald-100">
                                 <CheckCircle className="w-3.5 h-3.5" />
                                 <span className="text-xs font-semibold uppercase">Importado</span>
                              </div>
                           ) : (
                              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2 py-1 rounded-md w-max border border-rose-100">
                                 <AlertCircle className="w-3.5 h-3.5" />
                                 <span className="text-xs font-semibold uppercase">Rechazado/Error</span>
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {req.status !== 'SUCCESS' && (
                              <button 
                                onClick={() => req.packageIds ? handleProcessPackages(req.idSolicitud, req.packageIds) : handleVerify(req.idSolicitud)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                   req.packageIds 
                                     ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-sm" 
                                     : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {req.packageIds ? (
                                   <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Bajar Egresos DRAFT</span>
                                ) : (
                                   <span className="flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5" /> Verificar Estado</span>
                                )}
                              </button>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal Nueva Solicitud */}
      {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                 <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                    <div className="bg-indigo-100 p-2 rounded-lg"><Calendar className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                       <h2 className="text-lg font-bold text-slate-800">Nueva Petición SAT</h2>
                       <p className="text-xs text-slate-500">Recuperación de hasta 200k XMLs</p>
                    </div>
                 </div>
                 
                 <form onSubmit={handleRequestDownload} className="p-6 space-y-5 flex flex-col">
                    <div>
                       <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Tipo de Archivos</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setType('received')} className={`p-3 border rounded-xl text-sm font-semibold transition-all ${type === 'received' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Egresos (Gastos)</button>
                          <button type="button" onClick={() => setType('issued')} className={`p-3 border rounded-xl text-sm font-semibold transition-all ${type === 'issued' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Ingresos (Mis Facturas)</button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Fecha Inicio</label>
                          <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                       </div>
                       <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Fecha Fin</label>
                          <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                       </div>
                    </div>

                    <div className="flex gap-3 pt-2 mt-4">
                       <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">Cancelar</button>
                       <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 text-sm shadow-md">
                          {isSubmitting ? "Autenticando FIEL..." : "Enviar Petición"}
                       </button>
                    </div>
                 </form>
             </div>
          </div>
      )}

    </div>
  );
}
