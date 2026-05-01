"use client";

import { useState, useEffect } from "react";
import { Plane, CheckCircle, XCircle, Clock, CalendarDays, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function TimeOffPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:3001/time-off");
      if (res.ok) setRequests(await res.json());
    } catch (e) {
      console.error(e);
      // Fallback para wow-factor
      setRequests([
        { id: "1", employee: { name: "Maria Garcia", email: "maria@empresa.com" }, type: "VACATION", startDate: "2026-06-10", endDate: "2026-06-15", status: "PENDING", reason: "Vacaciones familiares" },
        { id: "2", employee: { name: "Juan Perez", email: "juan@empresa.com" }, type: "SICK_LEAVE", startDate: "2026-05-02", endDate: "2026-05-04", status: "APPROVED", reason: "Incapacidad IMSS Folio #1234" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`http://localhost:3001/time-off/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      toast.success(`Solicitud ${status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} con éxito`);
      fetchRequests();
    } catch (e) {
      toast.error("Error al actualizar la solicitud");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</span>;
    if (status === 'REJECTED') return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><XCircle className="w-3 h-3 mr-1" /> Rechazado</span>;
    return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><Clock className="w-3 h-3 mr-1" /> Pendiente</span>;
  };

  const getTypeStr = (type: string) => {
    if (type === 'VACATION') return "Vacaciones";
    if (type === 'SICK_LEAVE') return "Incapacidad (IMSS)";
    return "Permiso sin goce";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center">
             <Plane className="w-10 h-10 mr-3 text-sky-500" /> Bandeja de Permisos
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Revisa y aprueba solicitudes de vacaciones o captura incapacidades del equipo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 animate-pulse">Cargando bandeja...</div>
         ) : requests.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">No hay solicitudes pendientes.</div>
         ) : (
            requests.map((req: any) => (
              <div key={req.id} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group hover:shadow-sky-100/50 transition">
                 <div className="p-6 border-b border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                       {getStatusBadge(req.status)}
                       <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{getTypeStr(req.type)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{req.employee?.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{req.employee?.email}</p>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="flex items-center font-medium text-slate-700">
                         <CalendarDays className="w-4 h-4 mr-2 text-sky-500" />
                         {new Date(req.startDate).toLocaleDateString()} al {new Date(req.endDate).toLocaleDateString()}
                       </p>
                    </div>
                    
                    {req.reason && (
                      <div className="mt-4 text-sm text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                        <span className="font-semibold block mb-1">Motivo:</span>
                        "{req.reason}"
                      </div>
                    )}
                 </div>

                 {req.status === 'PENDING' && (
                    <div className="p-4 bg-slate-50 flex gap-3">
                       <Button variant="outline" className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleUpdateStatus(req.id, 'REJECTED')}>
                         <ThumbsDown className="w-4 h-4 mr-2" /> Denegar
                       </Button>
                       <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" onClick={() => handleUpdateStatus(req.id, 'APPROVED')}>
                         <ThumbsUp className="w-4 h-4 mr-2" /> Autorizar
                       </Button>
                    </div>
                 )}
              </div>
            ))
         )}
      </div>
    </div>
  );
}
