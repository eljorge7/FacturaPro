"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Save, Loader2, X, FileEdit, Trash2, ChevronDown, User, UserPlus, Phone, Mail, MapPin, Building2, Briefcase, FileText, Printer, ShieldCheck, Key, HeartPulse, Shirt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import QRCode from 'react-qr-code';

export default function EmployeesPage() {
  const router = useRouter();
  const { tenantId: activeTenantId, token } = useAuth();
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
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
  
  // Advanced Fields
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [rfc, setRfc] = useState("");
  const [nss, setNss] = useState("");
  const [curp, setCurp] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [pantsSize, setPantsSize] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // ERP Access Fields
  const [giveAccess, setGiveAccess] = useState(false);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CASHIER");
  const [warehouseId, setWarehouseId] = useState("");

  const [printingEmp, setPrintingEmp] = useState<any>(null);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setJobTitle("");
    setDepartmentId(""); setBaseSalary(""); setEmployeeType("DIRECT"); setIsActive(true);
    setEmployeeNumber(""); setRfc(""); setNss(""); setCurp("");
    setShirtSize(""); setPantsSize(""); setShoeSize(""); setBloodType(""); setEmergencyContact("");
    setGiveAccess(false); setPassword(""); setRole("CASHIER"); setWarehouseId("");
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [token, activeTenantId]);

  const fetchData = async () => {
    if (!token || !activeTenantId) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const headers = { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` };
      
      const [empRes, depRes, wRes, rRes] = await Promise.all([
         fetch(`${baseUrl}/employees`, { headers }),
         fetch(`${baseUrl}/departments`, { headers }),
         fetch(`${baseUrl}/warehouses`, { headers }),
         fetch(`${baseUrl}/roles`, { headers })
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (depRes.ok) setDepartments(await depRes.json());
      if (wRes.ok) setWarehouses(await wRes.json());
      if (rRes.ok) setRoles(await rRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName) return alert('El nombre y apellido son obligatorios');
    if (giveAccess && (!email || !password)) return alert('Para dar acceso al sistema, el correo y contraseña son obligatorios.');
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      let finalRole = role;
      let finalCustomRoleId = undefined;
      if (role && role.startsWith('CUSTOM_')) {
          finalCustomRoleId = role.replace('CUSTOM_', '');
          finalRole = 'CUSTOM';
      }

      const payload = {
        firstName, lastName, email, phone, jobTitle, 
        departmentId: departmentId || undefined,
        baseSalary: baseSalary ? parseFloat(baseSalary) : 0,
        employeeType, isActive,
        employeeNumber, rfc, nss, curp, shirtSize, pantsSize, shoeSize, bloodType, emergencyContact,
        createSystemAccess: giveAccess, password, role: finalRole, customRoleId: finalCustomRoleId, warehouseId: warehouseId || undefined
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

  const printBadge = (emp: any) => {
      setPrintingEmp(emp);
      setTimeout(() => {
          window.print();
          setTimeout(() => {
              setPrintingEmp(null);
          }, 300);
      }, 300);
  };

  if (!mounted) return null;

  const filteredEmployees = employees.filter(e => 
     `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (e.jobTitle && e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (e.employeeNumber && e.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ==========================================
  // IMPRESIÓN GAFETE (DUAL SIDED)
  // ==========================================
  if (printingEmp) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const qrPayload = JSON.stringify({ uid: printingEmp.id, type: 'ACCESS' });
      return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white', display: 'flex', gap: '20px', padding: '20px' }}>
              {/* LADO FRONTAL */}
              <div style={{ width: '5.4cm', height: '8.6cm', background: 'white' }}>
                  <div style={{ width: '100%', height: '100%', border: printingEmp.employeeType === 'CONTRACTOR' ? '4px solid #f97316' : '4px solid #4f46e5', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', padding: '10px', boxSizing: 'border-box' }}>
                      <div style={{ height: '50px', background: printingEmp.employeeType === 'CONTRACTOR' ? '#f97316' : '#4f46e5', margin: '-10px -10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <h2 style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>🏢 REFS. HURTADO</h2>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                          {printingEmp.avatarUrl ? (
                              <img src={`${baseUrl}${printingEmp.avatarUrl}?t=${Date.now()}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '3px solid #f1f5f9' }} />
                          ) : (
                              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold', color: '#94a3b8' }}>
                                  {printingEmp.firstName.charAt(0)}{printingEmp.lastName.charAt(0)}
                              </div>
                          )}
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                          <h1 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 5px 0', color: '#1e293b', lineHeight: '1.1' }}>{printingEmp.firstName.toUpperCase()}</h1>
                          <h2 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 10px 0', color: '#475569' }}>{printingEmp.lastName.toUpperCase()}</h2>
                          <p style={{ fontSize: '11px', margin: 0, color: '#64748b', fontWeight: 'bold' }}>{printingEmp.jobTitle || 'STAFF CORPORATIVO'}</p>
                          <p style={{ fontSize: '10px', margin: '5px 0 0 0', color: '#94a3b8' }}>{printingEmp.departmentRef?.name || printingEmp.department}</p>
                          <p style={{ fontSize: '10px', margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>ID: {printingEmp.employeeNumber || printingEmp.id.split('-')[0].toUpperCase()}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' }}>
                          <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.4' }}>
                              <strong style={{ color: '#ef4444' }}>RH:</strong> {printingEmp.bloodType || 'N/D'} <br/>
                              <strong>NSS:</strong> {printingEmp.nss || 'N/D'}
                          </div>
                          {printingEmp.employeeType === 'CONTRACTOR' ? (
                              <div style={{ padding: '4px 8px', background: '#ffedd5', color: '#c2410c', fontSize: '9px', fontWeight: 900, borderRadius: '4px' }}>CONTRATISTA</div>
                          ) : (
                              <div style={{ padding: '4px 8px', background: '#e0e7ff', color: '#4338ca', fontSize: '9px', fontWeight: 900, borderRadius: '4px' }}>PLANTA BASE</div>
                          )}
                      </div>
                  </div>
              </div>

              {/* LADO TRASERO (Reverso) */}
              <div style={{ width: '5.4cm', height: '8.6cm', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <div style={{ width: '100%', height: '100%', border: printingEmp.employeeType === 'CONTRACTOR' ? '4px solid #f97316' : '4px solid #4f46e5', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', padding: '10px', boxSizing: 'border-box', background: 'white' }}>
                      <div style={{ textAlign: 'center', marginBottom: '10px', marginTop: '5px' }}>
                          <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', margin: 0 }}>ID CREDENCIAL</p>
                          <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0', fontFamily: 'monospace' }}>{printingEmp.id.split('-')[0].toUpperCase()}</p>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ padding: '10px', border: '2px solid #f1f5f9', borderRadius: '10px', background: 'white' }}>
                              <QRCode value={qrPayload} size={110} level="H" />
                          </div>
                      </div>

                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                          <h4 style={{ fontSize: '10px', fontWeight: 'bold', color: '#ef4444', margin: '0 0 2px 0' }}>EN CASO DE ACCIDENTE:</h4>
                          <p style={{ fontSize: '9px', color: '#334155', margin: 0, fontWeight: 'bold' }}>{printingEmp.emergencyContact || 'LLAMAR A GERENCIA'}</p>
                      </div>

                      <div style={{ borderTop: '2px solid #f1f5f9', marginTop: '15px', paddingTop: '8px', textAlign: 'center' }}>
                          <p style={{ fontSize: '7px', color: '#94a3b8', margin: 0, lineHeight: '1.2' }}>ESTE GAFETE ES INTRANSFERIBLE Y ES PROPIEDAD DE LA EMPRESA. EL PORTADOR DEBE MOSTRARLO AL PERSONAL DE SEGURIDAD. EN CASO DE EXTRAVÍO, REPORTAR A RR.HH.</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="font-sans min-h-screen bg-[#f9fafb]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Briefcase className="w-5 h-5 text-blue-600" />
               Directorio Corporativo
            </h1>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
               <UserPlus className="w-4 h-4" /> Alta de Personal
            </button>
         </div>
         
         <div className="flex border border-slate-200 rounded text-slate-400 bg-slate-50 items-center px-2 py-1.5 max-w-sm w-full focus-within:border-slate-400 focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 mr-2 ml-1" />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre, Puesto o Matrícula..." 
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
                  <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 relative flex flex-col">
                     {/* Status Indicator */}
                     <div className={`absolute top-0 right-0 w-2 h-full ${emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'} rounded-r-2xl`}></div>
                     
                     <div className="flex items-start gap-4 mb-4">
                        <Link href={`/employees/${emp.id}`} className="shrink-0 cursor-pointer">
                            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 ring-blue-500 transition-all">
                            {emp.avatarUrl ? (
                                <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${emp.avatarUrl}`} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-slate-400" />
                            )}
                            </div>
                        </Link>
                        <div className="flex-1 min-w-0 pt-1">
                           <Link href={`/employees/${emp.id}`} className="hover:text-blue-600 transition-colors">
                               <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                                  {emp.firstName} {emp.lastName}
                               </h3>
                           </Link>
                           <p className="text-sm font-medium text-slate-500 truncate mb-1">{emp.jobTitle || 'Sin Puesto'}</p>
                           {emp.employeeNumber && (
                               <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{emp.employeeNumber}</span>
                           )}
                           {emp.employeeType === 'CONTRACTOR' && (
                               <span className="inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-1">Externo</span>
                           )}
                        </div>
                     </div>
                     
                     <div className="space-y-2 mb-6 flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           <Building2 className="w-4 h-4 text-indigo-400" />
                           <span className="truncate font-medium">{emp.departmentRef?.name || 'Depto. General'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           <Phone className="w-4 h-4 text-emerald-500" />
                           <span className="font-medium">{emp.phone || 'Sin Teléfono'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           <Key className="w-4 h-4 text-amber-500" />
                           {emp.user ? (
                               <span className="font-bold text-amber-600 text-[11px] uppercase">{emp.user.role === 'CUSTOM' ? 'Rol Especial' : emp.user.role}</span>
                           ) : (
                               <span className="italic">Sin Acceso al Sistema</span>
                           )}
                        </div>
                     </div>

                     <div className="flex gap-2 pt-4 border-t border-slate-100 mt-auto">
                        <Link href={`/employees/${emp.id}`} className="flex-1 text-center text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 py-2.5 rounded-xl border border-slate-200 transition-colors">
                            Ver Expediente
                        </Link>
                        <button onClick={() => printBadge(emp)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white py-2.5 rounded-xl border border-blue-200 transition-colors">
                            <Printer className="w-4 h-4" /> Gafete QR
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* MODAL NUEVO EMPLEADO COMPLETÍSIMO */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl border border-slate-200 overflow-hidden scale-in-95 duration-200 flex flex-col max-h-[95vh]">
               <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <UserPlus className="w-6 h-6 text-blue-600" />
                     Alta de Personal Corporativo
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-100 p-2 rounded-lg">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               
               <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     
                     {/* COLUMNA IZQUIERDA: BASES Y NÓMINA */}
                     <div className="space-y-6">
                         
                         {/* Info Básica */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                             <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                                 Información Básica
                                 <select value={employeeType} onChange={e=>setEmployeeType(e.target.value)} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold border-none outline-none focus:ring-2 ring-blue-500">
                                     <option value="DIRECT">🛠️ Planta Base</option>
                                     <option value="CONTRACTOR">⚙️ Contratista</option>
                                 </select>
                             </h3>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase">Nombre(s) *</label>
                                    <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase">Apellidos *</label>
                                    <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                 </div>
                                 <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Matrícula (ID Empleado)</label>
                                    <input type="text" placeholder="Ej. EMP-0012" value={employeeNumber} onChange={e=>setEmployeeNumber(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase">Teléfono Móvil</label>
                                    <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-slate-600 uppercase">Departamento</label>
                                    <select value={departmentId} onChange={e=>setDepartmentId(e.target.value)} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                       <option value="">(Sin asignar)</option>
                                       {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                 </div>
                                 <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Puesto Corporativo</label>
                                    <input type="text" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Ej. Técnico Instalador" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                 </div>
                             </div>
                         </div>

                         {/* Datos Médicos y Tallas */}
                         <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm">
                             <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><HeartPulse className="w-5 h-5"/> Archivo Médico & Vestuario <Shirt className="w-4 h-4 ml-1 text-slate-500" /></h3>
                             <div className="grid grid-cols-3 gap-4">
                                 <div>
                                     <label className="block text-xs font-bold text-rose-700 mb-1">Talla Camisa</label>
                                     <select value={shirtSize} onChange={e=>setShirtSize(e.target.value)} className="w-full border border-rose-200 rounded-lg px-2 py-2 outline-none bg-white text-sm">
                                         <option value="">N/A</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-rose-700 mb-1">Talla Pantalón</label>
                                     <input type="text" placeholder="Ej. 32" value={pantsSize} onChange={e=>setPantsSize(e.target.value)} className="w-full border border-rose-200 rounded-lg px-2 py-2 outline-none bg-white text-sm" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-rose-700 mb-1">Núm Calzado</label>
                                     <input type="text" placeholder="Ej. 27.5" value={shoeSize} onChange={e=>setShoeSize(e.target.value)} className="w-full border border-rose-200 rounded-lg px-2 py-2 outline-none bg-white text-sm" />
                                 </div>
                                 <div className="col-span-1">
                                     <label className="block text-xs font-bold text-rose-700 mb-1">Tipo Sangre</label>
                                     <select value={bloodType} onChange={e=>setBloodType(e.target.value)} className="w-full border border-rose-200 rounded-lg px-2 py-2 outline-none bg-white text-sm">
                                         <option value="">N/A</option><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                                     </select>
                                 </div>
                                 <div className="col-span-2">
                                     <label className="block text-xs font-bold text-rose-700 mb-1">Contacto de Emergencia</label>
                                     <input type="text" placeholder="Nombre y celular" value={emergencyContact} onChange={e=>setEmergencyContact(e.target.value)} className="w-full border border-rose-200 rounded-lg px-3 py-2 outline-none bg-white text-sm" />
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* COLUMNA DERECHA: FISCAL Y ACCESOS */}
                     <div className="space-y-6">
                         
                         {/* Fiscal / Nómina */}
                         <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                             <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> Fiscal / Nómina</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="col-span-2">
                                    <label className="text-xs font-bold text-emerald-700 uppercase">Salario Base (MXN) *</label>
                                    <div className="relative mt-1">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
                                       <input type="number" value={baseSalary} onChange={e=>setBaseSalary(e.target.value)} placeholder="0.00" className="w-full bg-white border border-emerald-200 rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500" />
                                    </div>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-emerald-700 mb-1">RFC</label>
                                     <input type="text" maxLength={13} value={rfc} onChange={e=>setRfc(e.target.value)} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono uppercase bg-white" />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-emerald-700 mb-1">NSS</label>
                                     <input type="text" maxLength={11} value={nss} onChange={e=>setNss(e.target.value)} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono uppercase bg-white" />
                                 </div>
                                 <div className="col-span-2">
                                     <label className="block text-xs font-bold text-emerald-700 mb-1">CURP</label>
                                     <input type="text" maxLength={18} value={curp} onChange={e=>setCurp(e.target.value)} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono uppercase bg-white" />
                                 </div>
                             </div>
                         </div>

                         {/* ERP Access */}
                         <div className="border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                             <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                                 <div>
                                     <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Key className="w-5 h-5"/> Asignar Credenciales ERP</h3>
                                     <p className="text-xs text-indigo-700 mt-1">Dale usuario y contraseña para que pueda usar FacturaPro.</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                   <input type="checkbox" checked={giveAccess} onChange={() => setGiveAccess(!giveAccess)} className="sr-only peer" />
                                   <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                 </label>
                             </div>

                             {giveAccess && (
                                 <div className="p-6 grid grid-cols-1 gap-4 bg-white">
                                     <div>
                                         <label className="block text-sm font-bold text-slate-700 mb-1">Correo de Ingreso *</label>
                                         <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-600 bg-slate-50" />
                                     </div>
                                     <div>
                                         <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Inicial *</label>
                                         <input type="text" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-600 bg-slate-50" />
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                             <label className="block text-xs font-bold text-slate-700 mb-1">Matriz de Privilegios *</label>
                                             <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none bg-indigo-50/50 font-bold text-indigo-700">
                                                 <optgroup label="Roles Fijos Clásicos"><option value="CASHIER">Cajero (Ventas)</option><option value="WAREHOUSE">Almacenista WMS</option><option value="MANAGER">Supervisor / Gerente</option><option value="OWNER">Dueño (Admin)</option></optgroup>
                                                 {roles.length > 0 && (
                                                     <optgroup label="🔹 Roles Personalizados">
                                                         {roles.map(r => (<option key={r.id} value={`CUSTOM_${r.id}`}>{r.name}</option>))}
                                                     </optgroup>
                                                 )}
                                             </select>
                                         </div>
                                         <div>
                                             <label className="block text-xs font-bold text-slate-700 mb-1">Sucursal Limitada</label>
                                             <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none bg-slate-50">
                                                 <option value="">TODAS (Global)</option>
                                                 {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                             </select>
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                  </div>
               </div>
               
               <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                  <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-0.5 flex items-center gap-2">
                     {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                     REGISTRAR Y ABRIR EXPEDIENTE DIGITAL
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
