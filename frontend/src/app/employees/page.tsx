"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Save, Loader2, X, FileEdit, Trash2, ChevronDown, User, UserPlus, Phone, Mail, MapPin, Building2, Briefcase, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function EmployeesPage() {
  const router = useRouter();
  const { tenantId: activeTenantId, token } = useAuth();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [employeeType, setEmployeeType] = useState("DIRECT"); // DIRECT, CONTRACTOR
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setDepartmentId("");
    setBaseSalary("");
    setEmployeeType("DIRECT");
    setIsActive(true);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [token, activeTenantId]);

  const fetchData = async () => {
    if (!token || !activeTenantId) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      const [empRes, depRes] = await Promise.all([
         fetch(`${baseUrl}/employees`, { headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` } }),
         fetch(`${baseUrl}/departments`, { headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` } })
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (depRes.ok) setDepartments(await depRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName) return alert('El nombre y apellido son obligatorios');
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        departmentId: departmentId || undefined,
        baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
        employeeType,
        isActive
      };

      const res = await fetch(`${baseUrl}/employees`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-tenant-id": activeTenantId,
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      const newEmp = await res.json();
      setIsModalOpen(false);
      resetForm();
      
      // Navigate straight to their file so he can upload contracts immediately
      router.push(`/employees/${newEmp.id}`);
      
    } catch (e: any) {
      console.error(e);
      alert(`Error al guardar: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  const filteredEmployees = employees.filter(e => 
     `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (e.jobTitle && e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="font-sans min-h-screen bg-[#f9fafb]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Briefcase className="w-5 h-5 text-blue-600" />
               Directorio de Empleados
            </h1>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
               <UserPlus className="w-4 h-4" /> Nuevo Empleado
            </button>
         </div>
         
         <div className="flex border border-slate-200 rounded text-slate-400 bg-slate-50 items-center px-2 py-1.5 max-w-sm w-full focus-within:border-slate-400 focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 mr-2 ml-1" />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre o Puesto..." 
                className="bg-transparent border-none outline-none text-sm w-full py-0.5 text-slate-800" 
            />
            {searchTerm && <button onClick={() => setSearchTerm("")} className="hover:text-slate-600"><X className="w-4 h-4 ml-1" /></button>}
         </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
         {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
         ) : filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
               <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <UserPlus className="w-12 h-12 text-blue-500" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">Aún no hay empleados registrados</h3>
               <p className="text-slate-500 mb-6 max-w-md">Empieza a formar tu equipo agregando a tus técnicos y personal administrativo para gestionar su nómina y expedientes.</p>
               <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
                  Registrar Primer Empleado
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredEmployees.map(emp => (
                  <Link href={`/employees/${emp.id}`} key={emp.id} className="block group">
                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
                        {/* Status Indicator */}
                        <div className={`absolute top-0 right-0 w-2 h-full ${emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        
                        <div className="flex items-start gap-4">
                           <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                              {emp.avatarUrl ? (
                                 <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${emp.avatarUrl}`} className="w-full h-full object-cover" />
                              ) : (
                                 <User className="w-6 h-6 text-slate-400" />
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                                 {emp.firstName} {emp.lastName}
                              </h3>
                              <p className="text-sm font-medium text-slate-500 truncate mb-3">{emp.jobTitle || 'Sin Puesto'}</p>
                              
                              <div className="space-y-1.5">
                                 <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span className="truncate">{emp.departmentRef?.name || 'Depto. General'}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{emp.phone || 'Sin Teléfono'}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="font-medium text-blue-600">Ver Expediente y Contratos &rarr;</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         )}
      </div>

      {/* MODAL NUEVO EMPLEADO */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden scale-in-95 duration-200">
               <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <UserPlus className="w-5 h-5 text-blue-600" />
                     Alta de Nuevo Empleado
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-1 rounded-lg">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nombre (s)</label>
                        <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ej. Juan Carlos" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Apellidos</label>
                        <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Ej. Pérez Silva" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Puesto de Trabajo</label>
                        <input type="text" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Ej. Técnico Instalador" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Departamento</label>
                        <select value={departmentId} onChange={e=>setDepartmentId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none">
                           <option value="">(Sin asignar)</option>
                           {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Teléfono (WhatsApp)</label>
                        <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10 dígitos" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Correo Electrónico (Opcional)</label>
                        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="empleado@ejemplo.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Salario Base (MXN)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                           <input type="number" value={baseSalary} onChange={e=>setBaseSalary(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Tipo de Contratación</label>
                        <div className="flex gap-2">
                           <button onClick={()=>setEmployeeType('DIRECT')} className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-colors ${employeeType==='DIRECT' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Nómina Directa</button>
                           <button onClick={()=>setEmployeeType('CONTRACTOR')} className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-colors ${employeeType==='CONTRACTOR' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Contratista</button>
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm text-blue-800">
                     <FileText className="w-5 h-5 shrink-0 text-blue-500" />
                     <p>Podrás subir la foto del empleado, sus documentos (INE, RFC, Contrato) y su talla de uniforme en la siguiente pantalla (Expediente Digital).</p>
                  </div>
               </div>
               
               <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                  <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2">
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Crear Empleado y Abrir Expediente
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
