"use client";

import { useEffect, useState } from "react";
import { Plane, CalendarDays, FileText, User, CreditCard, Clock, CheckCircle, XCircle, ShieldCheck, HeartPulse, LogOut, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function MyPortalPage() {
  const router = useRouter();
  const { tenantId: activeTenantId, token, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'payslips' | 'timeoff'>('profile');
  
  const [employee, setEmployee] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Time off form
  const [type, setType] = useState("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPortalData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      const res = await fetch(`${baseUrl}/employees/me/portal`, {
        headers: { "x-tenant-id": activeTenantId, "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("No pudimos cargar tu portal");
      const data = await res.json();
      setEmployee(data.employee);
      setPayslips(data.payslips || []);
      setDocuments(data.documents || []);

      // Fetch time off
      const timeOffRes = await fetch(`${baseUrl}/time-off/my-requests?employeeId=${data.employee.id}`, {
        headers: { "x-tenant-id": activeTenantId, "Authorization": `Bearer ${token}` }
      });
      if (timeOffRes.ok) {
          setTimeOffRequests(await timeOffRes.json());
      }
    } catch (e: any) {
      toast.error(e.message || "Error al cargar el portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTenantId && token) fetchPortalData();
  }, [activeTenantId, token]);

  const submitTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return toast.error("Selecciona las fechas");
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/time-off`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-tenant-id": activeTenantId, 
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
            employeeId: employee.id,
            type, startDate, endDate, reason
        })
      });
      if (!res.ok) throw new Error("No se pudo enviar la solicitud");
      
      toast.success("Solicitud enviada correctamente a Recursos Humanos");
      setStartDate(""); setEndDate(""); setReason("");
      fetchPortalData(); // Refresh history
      
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeStr = (t: string) => {
    switch (t) {
        case 'VACATION': return "Vacaciones";
        case 'SICK_LEAVE': return "Incapacidad (IMSS)";
        case 'BEREAVEMENT': return "Por Fallecimiento";
        case 'MATERNITY_PATERNITY': return "Maternidad/Paternidad";
        case 'UNPAID_LEAVE': return "Sin Goce de Sueldo";
        case 'SPECIAL': return "Especial";
        default: return "Permiso";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Aprobada</span>;
    if (status === 'REJECTED') return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><XCircle className="w-3 h-3 mr-1" /> Rechazada</span>;
    return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><Clock className="w-3 h-3 mr-1" /> En Revisión</span>;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-500 animate-pulse">Cargando tu portal...</div>;
  if (!employee) return <div className="flex items-center justify-center min-h-screen text-slate-500">No tienes un perfil de empleado asignado. Contacta a RRHH.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
       <div className="bg-slate-900 text-white pt-12 pb-24 px-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20 translate-x-1/3 -translate-y-1/3"></div>
           <div className="max-w-5xl mx-auto flex items-center justify-between relative z-10">
               <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                       {employee.avatarUrl ? (
                           <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${employee.avatarUrl}`} className="w-full h-full object-cover" />
                       ) : <User className="w-8 h-8 text-slate-400" />}
                   </div>
                   <div>
                       <h1 className="text-3xl font-extrabold tracking-tight">¡Hola, {employee.firstName}!</h1>
                       <p className="text-slate-400 text-lg">{employee.jobTitle || 'Miembro del Equipo'}</p>
                   </div>
               </div>
               
               <button onClick={() => { logout(); router.push('/login'); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                   <LogOut className="w-4 h-4" /> Cerrar Sesión
               </button>
           </div>
       </div>

       <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
           {/* Navigation Tabs */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col sm:flex-row gap-2 mb-8">
               <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                   <User className="w-4 h-4" /> Mi Expediente
               </button>
               <button onClick={() => setActiveTab('timeoff')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'timeoff' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                   <Plane className="w-4 h-4" /> Permisos y Vacaciones
               </button>
               <button onClick={() => setActiveTab('payslips')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'payslips' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                   <CreditCard className="w-4 h-4" /> Recibos de Nómina
               </button>
           </div>

           {/* Tab Contents */}
           <div className="animate-in fade-in duration-300">
               {activeTab === 'profile' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                           <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-rose-500" /> Información Médica y Tallas</h2>
                           <div className="space-y-4">
                               <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Contacto de Emergencia</p><p className="font-medium text-slate-800">{employee.emergencyContact || 'No registrado'}</p></div>
                               <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Tipo de Sangre</p><p className="font-medium text-slate-800">{employee.bloodType || 'No registrado'}</p></div>
                               <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                                   <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Camisa</p><p className="font-bold text-slate-800">{employee.shirtSize || '-'}</p></div>
                                   <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Pantalón</p><p className="font-bold text-slate-800">{employee.pantsSize || '-'}</p></div>
                                   <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Calzado</p><p className="font-bold text-slate-800">{employee.shoeSize || '-'}</p></div>
                               </div>
                           </div>
                       </div>
                       <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                           <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Mis Documentos</h2>
                           {documents.length === 0 ? (
                               <p className="text-slate-500 text-sm">No tienes documentos en tu expediente.</p>
                           ) : (
                               <div className="space-y-3">
                                   {documents.map(doc => (
                                       <a key={doc.id} href={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${doc.fileUrl}`} target="_blank" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100">
                                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-500 shadow-sm shrink-0"><FileText className="w-5 h-5" /></div>
                                           <div className="flex-1 min-w-0">
                                               <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                                               <p className="text-xs text-slate-500">Documento de RRHH</p>
                                           </div>
                                       </a>
                                   ))}
                               </div>
                           )}
                       </div>
                   </div>
               )}

               {activeTab === 'timeoff' && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                       <div className="lg:col-span-1 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-fit">
                           <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Plane className="w-5 h-5 text-indigo-500" /> Solicitar Permiso</h2>
                           <form onSubmit={submitTimeOff} className="space-y-5">
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Permiso</label>
                                   <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50">
                                       <option value="VACATION">Vacaciones</option>
                                       <option value="SICK_LEAVE">Incapacidad (IMSS)</option>
                                       <option value="BEREAVEMENT">Por Fallecimiento</option>
                                       <option value="MATERNITY_PATERNITY">Maternidad/Paternidad</option>
                                       <option value="SPECIAL">Permiso Especial</option>
                                       <option value="UNPAID_LEAVE">Sin Goce de Sueldo</option>
                                   </select>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Desde</label>
                                       <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hasta</label>
                                       <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo o Notas (Opcional)</label>
                                   <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej. Viaje familiar, Cita médica..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 h-24 resize-none"></textarea>
                               </div>
                               <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                                   {isSubmitting ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar Solicitud a RRHH</>}
                               </button>
                           </form>
                       </div>
                       
                       <div className="lg:col-span-2 space-y-4">
                           <h2 className="text-lg font-bold text-slate-800 mb-2">Historial de Solicitudes</h2>
                           {timeOffRequests.length === 0 ? (
                               <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-200 text-center">
                                   <Plane className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                   <p className="text-slate-500">Aún no has solicitado vacaciones ni permisos.</p>
                               </div>
                           ) : (
                               timeOffRequests.map(req => (
                                   <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                                       <div className="flex items-start gap-4">
                                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-500' : req.status === 'REJECTED' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                               <CalendarDays className="w-6 h-6" />
                                           </div>
                                           <div>
                                               <h3 className="font-bold text-slate-800">{getTypeStr(req.type)}</h3>
                                               <p className="text-sm text-slate-500">{new Date(req.startDate).toLocaleDateString()} al {new Date(req.endDate).toLocaleDateString()}</p>
                                               {req.adminNotes && (
                                                   <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                       <span className="font-bold">Nota de RRHH:</span> {req.adminNotes}
                                                   </p>
                                               )}
                                           </div>
                                       </div>
                                       <div>
                                           {getStatusBadge(req.status)}
                                       </div>
                                   </div>
                               ))
                           )}
                       </div>
                   </div>
               )}

               {activeTab === 'payslips' && (
                   <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                       <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500" /> Mis Recibos de Nómina</h2>
                       {payslips.length === 0 ? (
                           <div className="text-center py-12">
                               <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                               <p className="text-slate-500">No hay recibos de nómina disponibles todavía.</p>
                           </div>
                       ) : (
                           <div className="overflow-x-auto">
                               <table className="w-full text-left text-sm whitespace-nowrap">
                                   <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                                       <tr>
                                           <th className="p-4 rounded-tl-xl">Periodo de Pago</th>
                                           <th className="p-4">Salario Base</th>
                                           <th className="p-4">Total Pagado</th>
                                           <th className="p-4 text-right rounded-tr-xl">Estado</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {payslips.map(ps => (
                                           <tr key={ps.id} className="hover:bg-slate-50 transition-colors">
                                               <td className="p-4 font-bold text-slate-800">
                                                   {new Date(ps.payrollRun.periodStart).toLocaleDateString()} - {new Date(ps.payrollRun.periodEnd).toLocaleDateString()}
                                               </td>
                                               <td className="p-4 text-slate-600">${ps.baseSalary.toLocaleString()}</td>
                                               <td className="p-4 font-black text-emerald-600">${ps.netPay.toLocaleString()}</td>
                                               <td className="p-4 text-right">
                                                   <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Pagado</span>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       )}
                   </div>
               )}
           </div>
       </div>
    </div>
  );
}
