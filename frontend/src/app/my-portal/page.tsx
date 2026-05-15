"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Calendar, FileText, Download, Briefcase, Plus, Clock, CheckCircle2, XCircle, ChevronRight, Plane, Stethoscope, HeartPulse, User } from "lucide-react";
import toast from "react-hot-toast";

export default function MyPortalPage() {
  const { tenantId, token, user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/employees/me/portal`, {
        headers: { 
          'x-tenant-id': tenantId || "",
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("No tienes un perfil de empleado asignado.");
      
      const result = await res.json();
      setData(result);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && token) {
      fetchData();
    }
  }, [tenantId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return toast.error("Selecciona las fechas");
    if (new Date(startDate) > new Date(endDate)) return toast.error("La fecha de inicio debe ser antes del fin");

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/employees/me/portal/time-off`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId || "",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, startDate, endDate, reason })
      });
      
      if (!res.ok) throw new Error("Error al enviar la solicitud");
      
      toast.success("Solicitud enviada a Recursos Humanos");
      setIsModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      fetchData(); // Refresh data
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!data) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Perfil no encontrado. Contacta a RRHH.</div>;

  const { employee, timeOffRequests, payslips, documents } = data;

  const getTypeIcon = (t: string) => {
      switch(t) {
          case 'VACATION': return <Plane className="w-5 h-5 text-sky-500" />;
          case 'SICK_LEAVE': return <Stethoscope className="w-5 h-5 text-rose-500" />;
          default: return <HeartPulse className="w-5 h-5 text-indigo-500" />;
      }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'APPROVED': return <span className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3"/> Aprobado</span>;
          case 'REJECTED': return <span className="flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-full"><XCircle className="w-3 h-3"/> Rechazado</span>;
          default: return <span className="flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full"><Clock className="w-3 h-3"/> En Revisión</span>;
      }
  }

  const getTypeLabel = (t: string) => {
      const labels: any = {
          'VACATION': 'Vacaciones',
          'SICK_LEAVE': 'Enfermedad',
          'BEREAVEMENT': 'Fallecimiento',
          'MATERNITY_PATERNITY': 'Maternidad/Paternidad',
          'SPECIAL': 'Permiso Especial'
      };
      return labels[t] || t;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
          
        {/* ENCABEZADO Y RESUMEN */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <Briefcase className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/30 shadow-lg">
                    {employee.avatarUrl ? (
                        <img src={employee.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-10 h-10 text-white" />
                    )}
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-black mb-1">¡Hola, {employee.firstName}!</h1>
                    <p className="text-indigo-200 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                        {employee.jobTitle || 'Miembro del Equipo'}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                        <span className="bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md border border-white/10">ID: {employee.employeeNumber || 'N/A'}</span>
                        <span className="bg-white/10 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md border border-white/10 flex items-center gap-1"><Calendar className="w-4 h-4"/> 12 Días de Vacaciones</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* COLUMNA IZQUIERDA: PERMISOS Y VACACIONES */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-6 h-6 text-indigo-500"/> Mis Permisos</h2>
                        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Solicitar
                        </button>
                    </div>

                    {timeOffRequests?.length > 0 ? (
                        <div className="space-y-4">
                            {timeOffRequests.map((req: any) => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                            {getTypeIcon(req.type)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{getTypeLabel(req.type)}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {new Date(req.startDate).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})} 
                                                {' '}al{' '}
                                                {new Date(req.endDate).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        {getStatusBadge(req.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <Plane className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-600">Sin historial de permisos</p>
                            <p className="text-xs text-slate-400 mt-1">Aquí aparecerán tus vacaciones y solicitudes.</p>
                        </div>
                    )}
                </div>

                {/* RECIBOS DE NÓMINA */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6"><FileText className="w-6 h-6 text-emerald-500"/> Mis Recibos de Nómina</h2>
                    
                    {payslips?.length > 0 ? (
                        <div className="space-y-3">
                            {payslips.map((ps: any) => (
                                <div key={ps.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 text-sm">{ps.payrollRun?.name || 'Nómina'}</span>
                                        <span className="text-xs text-slate-500">{new Date(ps.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-emerald-600">${ps.netPay?.toFixed(2)}</span>
                                        <button className="text-slate-400 group-hover:text-emerald-600 transition-colors bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm font-medium text-slate-500">No hay recibos de nómina disponibles.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMNA DERECHA: DOCUMENTOS Y UTILIDADES */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-amber-500"/> Mi Expediente</h2>
                    {documents?.length > 0 ? (
                        <div className="space-y-3">
                            {documents.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-amber-200 transition-colors cursor-pointer group">
                                    <span className="text-sm font-bold text-slate-700 truncate mr-2">{doc.name}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 text-center italic py-4">No hay documentos en tu expediente.</p>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* MODAL NUEVA SOLICITUD */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in-95 duration-200">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Plane className="w-5 h-5 text-indigo-500"/> Nueva Solicitud</h2>
                      <button onClick={()=>setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5"/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Permiso</label>
                          <select value={type} onChange={e=>setType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 font-medium">
                              <option value="VACATION">🏖️ Vacaciones</option>
                              <option value="SICK_LEAVE">🤒 Enfermedad / Incapacidad</option>
                              <option value="MATERNITY_PATERNITY">👶 Maternidad / Paternidad</option>
                              <option value="BEREAVEMENT">🕊️ Fallecimiento</option>
                              <option value="SPECIAL">⭐ Permiso Especial</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Día de Inicio</label>
                              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Día Final</label>
                              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Motivo / Notas Adicionales</label>
                          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} placeholder="Describe brevemente el motivo..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"></textarea>
                      </div>
                      <div className="pt-2">
                          <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex justify-center items-center gap-2">
                              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar a Recursos Humanos"}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
