"use client";

import { useEffect, useState, use } from "react";
import { User, Phone, Mail, Building2, Briefcase, MapPin, ArrowLeft, Upload, FileText, Calendar, DollarSign, Download, CheckCircle, ShieldAlert, HeartPulse, HardHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { tenantId: activeTenantId, token } = useAuth();
  
  const unwrappedParams = use(params);
  const employeeId = unwrappedParams.id;

  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("expediente");
  
  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [token, activeTenantId, employeeId]);

  const fetchEmployee = async () => {
    if (!token || !activeTenantId) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/employees/${employeeId}`, {
         headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
         setEmployee(await res.json());
      } else {
         router.push('/employees');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('file', file);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/employees/${employeeId}/avatar`, {
         method: 'POST',
         headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
         body: fd
      });

      if (res.ok) fetchEmployee();
      else alert('Error subiendo foto.');
  };

  const handleDocumentUpload = async () => {
      if (!docFile || !docName) return alert("Selecciona un archivo y ponle un nombre.");
      setIsUploadingDoc(true);

      try {
         const fd = new FormData();
         fd.append('file', docFile);
         fd.append('name', docName);

         const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
         const res = await fetch(`${baseUrl}/employees/${employeeId}/documents`, {
            method: 'POST',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: fd
         });

         if (res.ok) {
            setDocFile(null);
            setDocName("");
            fetchEmployee();
         } else {
            const err = await res.text();
            alert(`Error subiendo documento: ${err}`);
         }
      } catch (e) {
         console.error(e);
      } finally {
         setIsUploadingDoc(false);
      }
  };

  if (isLoading) return <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">Cargando expediente...</div>;
  if (!employee) return null;

  return (
    <div className="font-sans min-h-screen bg-[#f9fafb] flex flex-col">
       {/* Topbar */}
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <Link href="/employees" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
             <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
             <h1 className="text-xl font-bold text-slate-800">{employee.firstName} {employee.lastName}</h1>
             <p className="text-sm text-slate-500 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                {employee.isActive ? 'Empleado Activo' : 'Baja'} • {employee.jobTitle}
             </p>
          </div>
       </div>

       <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar: Profile Identity */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                {/* Background Banner */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                <div className="relative pt-8 flex flex-col items-center">
                   <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-100 shadow-md relative group overflow-hidden mb-4">
                      {employee.avatarUrl ? (
                         <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${employee.avatarUrl}`} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <User className="w-12 h-12" />
                         </div>
                      )}
                      
                      <label className="absolute inset-x-0 bottom-0 bg-black/60 py-2 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                         <span className="text-white text-[10px] font-bold tracking-wider">CAMBIAR</span>
                         <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                   </div>
                   
                   <h2 className="text-xl font-bold text-slate-800 text-center leading-tight">{employee.firstName} <br/>{employee.lastName}</h2>
                   <p className="text-blue-600 font-bold text-sm mt-1">{employee.jobTitle}</p>
                </div>

                <div className="mt-8 space-y-4">
                   <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500"><Phone className="w-4 h-4" /></div>
                      <span className="font-medium">{employee.phone || 'No registrado'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="bg-white p-2 rounded-lg shadow-sm text-emerald-500"><Mail className="w-4 h-4" /></div>
                      <span className="font-medium truncate">{employee.email || 'No registrado'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-500"><Building2 className="w-4 h-4" /></div>
                      <span className="font-medium">{employee.departmentRef?.name || 'Depto. General'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="bg-white p-2 rounded-lg shadow-sm text-amber-500"><DollarSign className="w-4 h-4" /></div>
                      <div className="flex flex-col">
                         <span className="text-xs text-slate-400">Salario Base</span>
                         <span className="font-bold text-slate-800">${employee.baseSalary?.toLocaleString() || '0.00'}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <HeartPulse className="w-5 h-5 text-rose-500" /> Datos Médicos / Equipo
                </h3>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-500">Tipo de Sangre</span>
                      <span className="font-bold text-slate-700">{employee.bloodType || '-'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-500">NSS (Seguro)</span>
                      <span className="font-bold text-slate-700">{employee.nss || '-'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-500 flex items-center gap-1"><HardHat className="w-4 h-4 text-amber-500"/> Talla Playera</span>
                      <span className="font-bold text-slate-700">{employee.shirtSize || '-'}</span>
                   </div>
                   <div className="pt-2">
                      <span className="block text-slate-500 mb-1">Contacto de Emergencia</span>
                      <p className="font-medium text-slate-800 bg-rose-50 p-2 rounded-lg border border-rose-100">
                         {employee.emergencyContact || 'No registrado'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
             
             {/* Tabs Header */}
             <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button 
                   onClick={() => setActiveTab('expediente')}
                   className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'expediente' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                   <FileText className="w-4 h-4" /> Expediente Digital y Contratos
                </button>
                <button 
                   onClick={() => setActiveTab('nominas')}
                   className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'nominas' ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                   <DollarSign className="w-4 h-4" /> Recibos de Nómina
                </button>
             </div>

             {/* Tab Content */}
             <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
                {activeTab === 'expediente' && (
                   <div className="animate-in fade-in space-y-8">
                      {/* Document Upload Widget */}
                      <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                         <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-500" />
                            Agregar Documento al Expediente
                         </h3>
                         <p className="text-sm text-slate-500 mb-6">Sube el INE, Contrato Firmado, Comprobante de Domicilio o cualquier acta administrativa en formato PDF o Imagen.</p>
                         
                         <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full space-y-2">
                               <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nombre del Documento</label>
                               <input 
                                  type="text" 
                                  value={docName} 
                                  onChange={e=>setDocName(e.target.value)} 
                                  placeholder="Ej. Contrato Indefinido 2024" 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" 
                               />
                            </div>
                            <div className="flex-1 w-full space-y-2">
                               <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Archivo PDF / Imagen</label>
                               <input 
                                  type="file" 
                                  onChange={e=>setDocFile(e.target.files?.[0] || null)} 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                               />
                            </div>
                            <button 
                               onClick={handleDocumentUpload}
                               disabled={isUploadingDoc || !docFile || !docName}
                               className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                            >
                               {isUploadingDoc ? 'Subiendo...' : 'Subir'}
                            </button>
                         </div>
                      </div>

                      {/* Documents List */}
                      <div>
                         <h3 className="font-bold text-slate-800 mb-4 text-lg">Documentos Guardados ({employee.documents?.length || 0})</h3>
                         
                         {employee.documents?.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                               <FileText className="w-12 h-12 text-slate-300 mb-3" />
                               <p className="font-bold text-slate-600">No hay documentos en el expediente</p>
                               <p className="text-sm text-slate-400">Sube el primer documento utilizando el formulario de arriba.</p>
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {employee.documents?.map((doc: any) => (
                                  <a key={doc.id} href={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="group flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all">
                                     <div className="bg-blue-50 p-3 rounded-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                           <Calendar className="w-3 h-3" />
                                           Subido el {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </p>
                                     </div>
                                     <div className="text-slate-400 group-hover:text-blue-600 p-2">
                                        <Download className="w-5 h-5" />
                                     </div>
                                  </a>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                )}

                {activeTab === 'nominas' && (
                   <div className="animate-in fade-in space-y-6">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
                         <ShieldAlert className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                         <div>
                            <h3 className="font-bold text-emerald-800">Historial Financiero Inalterable</h3>
                            <p className="text-sm text-emerald-700 mt-1">Los recibos mostrados aquí forman parte de una corrida de nómina sellada y pagada. Constituyen el respaldo oficial de las dispersiones hechas a este empleado.</p>
                         </div>
                      </div>

                      {employee.payslips?.filter((p: any) => p.status === 'PAID').length === 0 ? (
                         <div className="text-center py-16">
                            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-600">Aún no se ha pagado ninguna nómina</p>
                            <p className="text-sm text-slate-500 mt-2">Ve a la sección general de Nóminas para procesar el primer pago de la semana.</p>
                            <Link href="/payroll" className="inline-block mt-4 text-blue-600 font-bold hover:underline">Ir a Nóminas &rarr;</Link>
                         </div>
                      ) : (
                         <div className="space-y-4">
                            {employee.payslips?.filter((p: any) => p.status === 'PAID').map((slip: any) => (
                               <div key={slip.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                                  <div className="flex items-center gap-4">
                                     <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                                        <CheckCircle className="w-6 h-6" />
                                     </div>
                                     <div>
                                        <h4 className="font-bold text-slate-800">Nómina del {new Date(slip.payrollRun?.periodStart).toLocaleDateString()} al {new Date(slip.payrollRun?.periodEnd).toLocaleDateString()}</h4>
                                        <div className="flex gap-4 mt-1 text-xs">
                                           <span className="text-slate-500">Salario Base: <span className="font-bold">${slip.baseSalary.toLocaleString()}</span></span>
                                           <span className="text-emerald-600 font-medium">Bonos: +${slip.bonuses.toLocaleString()}</span>
                                           <span className="text-rose-500 font-medium">Deduc: -${slip.deductions.toLocaleString()}</span>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Pago Neto</p>
                                     <p className="text-xl font-black text-slate-800">${slip.netPay.toLocaleString()}</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}
