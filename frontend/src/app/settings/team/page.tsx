'use client';

import { useState, useRef, useEffect } from 'react';
import { Users, UserPlus, Building2, ShieldCheck, Briefcase, Calculator, Key, Search, Trash2, X, Save, HeartPulse, Shirt, Camera, Printer, Edit2, TrendingUp } from 'lucide-react';
import QRCode from 'react-qr-code';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/components/AuthProvider';

export default function TeamSettings() {
    const { token, tenantId: activeTenantId, user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [payrollStats, setPayrollStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingDept, setIsCreatingDept] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [isEditingId, setIsEditingId] = useState<string | null>(null);
    const [giveAccess, setGiveAccess] = useState(false);
    
    const initialEmpState = {
        firstName: '', lastName: '', jobTitle: '', departmentId: '', department: '', baseSalary: '', employeeType: 'DIRECT',
        phone: '', rfc: '', curp: '', nss: '', employeeNumber: '', hireDate: '',
        shirtSize: '', pantsSize: '', shoeSize: '', bloodType: '', emergencyContact: '',
        email: '', password: '', role: 'CASHIER', customRoleId: '', warehouseId: '',
        documents: []
    };
    
    const [newEmp, setNewEmp] = useState(initialEmpState);

    const [printingEmp, setPrintingEmp] = useState<any>(null);

    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    useEffect(() => {
        if (token && activeTenantId) {
            loadData();
        }
    }, [token, activeTenantId]);

    const loadData = async () => {
        setLoading(true);
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const headers = { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` };
        try {
            const [eRes, wRes, rRes, dRes, pRes] = await Promise.all([
                fetch(`${baseUrl}/employees`, { headers }),
                fetch(`${baseUrl}/warehouses`, { headers }),
                fetch(`${baseUrl}/roles`, { headers }),
                fetch(`${baseUrl}/departments`, { headers }),
                fetch(`${baseUrl}/departments/payroll-stats`, { headers })
            ]);
            if (eRes.ok) setEmployees(await eRes.json());
            if (wRes.ok) setWarehouses(await wRes.json());
            if (rRes.ok) setRoles(await rRes.json());
            if (dRes.ok) setDepartments(await dRes.json());
            if (pRes.ok) setPayrollStats(await pRes.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const payload = { ...newEmp, createSystemAccess: isEditingId ? undefined : giveAccess };
        
        if (payload.role && payload.role.startsWith('CUSTOM_')) {
            payload.customRoleId = payload.role.replace('CUSTOM_', '');
            payload.role = 'CUSTOM';
        }

        const method = isEditingId ? 'PATCH' : 'POST';
        const url = isEditingId ? `${baseUrl}/employees/${isEditingId}` : `${baseUrl}/employees`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsCreating(false);
            setIsEditingId(null);
            setGiveAccess(false);
            setNewEmp(initialEmpState);
            loadData();
        } else {
            const err = await res.json();
            alert(err.message || 'Error al guardar empleado');
        }
    };

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newDeptName.toUpperCase() })
        });
        if (res.ok) {
            setNewDeptName('');
            loadData();
        } else {
            alert('Error al crear departamento');
        }
    };

    const handleUpdateDepartment = async (id: string, name: string) => {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/departments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: name.toUpperCase() })
        });
        if (res.ok) loadData();
        else alert('Error al actualizar departamento');
    };

    const handleDeleteDepartment = async (id: string) => {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/departments/${id}`, {
            method: 'DELETE',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) loadData();
        else alert('Error al eliminar departamento (asegurate que no tenga empleados asignados)');
    };

    const startEdit = (emp: any) => {
        setNewEmp({
            ...initialEmpState,
            firstName: emp.firstName,
            lastName: emp.lastName,
            jobTitle: emp.jobTitle || '',
            departmentId: emp.departmentRef?.id || '',
            department: emp.department || '', // Mantenemos legacy text temporalmente
            baseSalary: emp.baseSalary || '',
            employeeType: emp.employeeType || 'DIRECT',
            employeeNumber: emp.employeeNumber || '',
            rfc: emp.rfc || '',
            nss: emp.nss || '',
            curp: emp.curp || '',
            shirtSize: emp.shirtSize || '',
            pantsSize: emp.pantsSize || '',
            shoeSize: emp.shoeSize || '',
            bloodType: emp.bloodType || '',
            emergencyContact: emp.emergencyContact || '',
            phone: emp.phone || '',
            email: emp.email || '',
            documents: emp.documents || []
        });
        setIsEditingId(emp.id);
        setIsCreating(true);
        setGiveAccess(false); // Can't edit credentials through this form yet
    };

    const uploadPhoto = async (empId: string, file: File) => {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${baseUrl}/employees/${empId}/avatar`, {
            method: 'POST',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            loadData();
        } else {
            alert('Error al subir la imagen');
        }
    };

    const uploadDocument = async (e: any) => {
        if (!e.target.files || !e.target.files[0] || !isEditingId) return;
        const file = e.target.files[0];
        
        const docName = prompt("Nombre del documento (Ej. Contrato, INE)", file.name);
        if (!docName) return;

        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', docName);

        const res = await fetch(`${baseUrl}/employees/${isEditingId}/documents`, {
            method: 'POST',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert('Documento subido con éxito');
            loadData();
            // Need to append it to newEmp.documents immediately to be visible
            const reFetched = await fetch(`${baseUrl}/employees/${isEditingId}`, { headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` } });
            if (reFetched.ok) {
                const refreshedEmp = await reFetched.json();
                setNewEmp(prev => ({...prev, documents: refreshedEmp.documents}));
            }
        } else {
            alert('Error al subir documento');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Dar de baja a ${name}? Con esto dejará de acceder al sistema inmediatamente.`)) return;
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        await fetch(`${baseUrl}/employees/${id}`, {
            method: 'DELETE',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        loadData();
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

    const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';

    // ==========================================
    // ISOLATED PRINT VIEW ENGINE (DUAL SIDED)
    // ==========================================
    if (printingEmp) {
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
    // ==========================================

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <Users className="w-10 h-10 text-indigo-600" />
                        Directorio de Personal
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2">
                        Gestión de empleados, control de gafetes e impresiones de acceso.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsCreatingDept(true)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
                        ⚙️ Departamentos
                    </button>
                    <button onClick={() => { setNewEmp(initialEmpState); setIsEditingId(null); setIsCreating(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
                        <UserPlus className="w-5 h-5"/> Contratar / Alta Nuevo
                    </button>
                </div>
            </div>

            {/* ====== DASHBOARD NÓMINA POR DEPARTAMENTO ====== */}
            <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <TrendingUp className="w-6 h-6"/>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Distribución de Costos de Nómina</h3>
                        <p className="text-slate-500 text-sm font-medium">Gasto histórico (desembolsado) vs Proyección Actual (sueldos base)</p>
                    </div>
                </div>
                
                <div className="w-full h-[300px]">
                    {payrollStats && payrollStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={payrollStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={35}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} tickFormatter={(v) => `$${v}`} />
                                <RechartsTooltip 
                                    cursor={{ fill: '#f8fafc' }} 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                                    formatter={(value: any) => [`$${Number(value).toLocaleString('en-US', {minimumFractionDigits: 2})}`, 'Monto']} 
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#475569' }} />
                                <Bar dataKey="Historico" name="Gasto Histórico" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Proyectado" name="Quincena Base" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl gap-2">
                             <Calculator className="w-8 h-8 opacity-50" />
                             <span className="font-medium text-sm">Aún no hay sueldos configurados o nóminas pagadas.</span>
                        </div>
                    )}
                </div>
            </div>

            {isCreatingDept && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative flex flex-col max-h-[80vh]">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Building2 className="w-6 h-6 text-indigo-600"/> Catálogo de Departamentos</h3>
                            <button onClick={() => setIsCreatingDept(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-2">
                             {departments.map(d => (
                                 <div key={d.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center font-bold text-xs">{d.name.substring(0,2)}</div>
                                         <span className="font-bold text-sm text-slate-700">{d.name}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <button onClick={() => {
                                             const newName = prompt('Nuevo nombre del departamento:', d.name);
                                             if(newName && newName !== d.name) handleUpdateDepartment(d.id, newName);
                                         }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit2 className="w-4 h-4"/></button>
                                         <button onClick={() => {
                                             if(confirm(`¿Eliminar el departamento ${d.name}?`)) handleDeleteDepartment(d.id);
                                         }} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4"/></button>
                                     </div>
                                 </div>
                             ))}
                             {departments.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No hay departamentos registrados.</p>}
                         </div>

                         <div className="pt-4 border-t border-slate-100 mt-auto">
                            <form onSubmit={handleCreateDepartment} className="flex gap-2">
                                <input required type="text" placeholder="Nuevo Departamento (Ej. VENTAS)" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-4 py-3 uppercase text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-bold text-sm shadow-md transition-colors whitespace-nowrap">Añadir</button>
                            </form>
                         </div>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                                {isEditingId ? <Edit2 className="w-8 h-8 text-indigo-600"/> : <Briefcase className="w-8 h-8 text-indigo-600"/>} 
                                {isEditingId ? 'Editar Perfil y/o Gafete' : 'Alta de Personal Corporativo'}
                            </h3>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-8 h-8"/></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <form id="createEmpForm" onSubmit={handleCreateOrUpdate} className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-8">
                                        {/* Datos Personales */}
                                        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                                                <span>Información Básica</span>
                                                <select value={newEmp.employeeType} onChange={e => setNewEmp({...newEmp, employeeType: e.target.value})} className="text-xs bg-slate-100 px-3 py-1 rounded font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500">
                                                    <option value="DIRECT">🛠️ Empleado Planta (Directo)</option>
                                                    <option value="CONTRACTOR">⚙️ Externo / Contratista</option>
                                                </select>
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre(s) *</label>
                                                    <input required type="text" value={newEmp.firstName} onChange={e => setNewEmp({...newEmp, firstName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Apellidos *</label>
                                                    <input required type="text" value={newEmp.lastName} onChange={e => setNewEmp({...newEmp, lastName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono Personal</label>
                                                    <input type="text" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Correo Recibos / Nómina</label>
                                                    <input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Puesto</label>
                                                    <input type="text" placeholder="Ej. Cajero, Chofer" value={newEmp.jobTitle} onChange={e => setNewEmp({...newEmp, jobTitle: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex justify-between">
                                                        <span>Departamento</span>
                                                    </label>
                                                    <select required value={newEmp.departmentId} onChange={e => setNewEmp({...newEmp, departmentId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50">
                                                        <option value="">Seleccione o cree uno</option>
                                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Número de Empleado (Matrícula Interna)</label>
                                                    <input type="text" placeholder="Ej. EMP-0012" value={newEmp.employeeNumber} onChange={e => setNewEmp({...newEmp, employeeNumber: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50 font-mono tracking-widest text-center" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fundamento de Nómina */}
                                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                                            <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5"/> Datos Fiscales (Timbrado CFDI)</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-emerald-700 mb-1">Salario Diario ($)</label>
                                                    <input type="number" step="0.01" value={newEmp.baseSalary} onChange={e => setNewEmp({...newEmp, baseSalary: e.target.value})} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-emerald-700 mb-1">RFC</label>
                                                    <input type="text" maxLength={13} value={newEmp.rfc} onChange={e => setNewEmp({...newEmp, rfc: e.target.value})} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono uppercase bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-emerald-700 mb-1">NSS (Seguro Social)</label>
                                                    <input type="text" maxLength={11} value={newEmp.nss} onChange={e => setNewEmp({...newEmp, nss: e.target.value})} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono uppercase bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-emerald-700 mb-1">CURP</label>
                                                    <input type="text" maxLength={18} value={newEmp.curp} onChange={e => setNewEmp({...newEmp, curp: e.target.value})} className="w-full border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-600 text-sm font-mono uppercase bg-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Operativo: Uniformes */}
                                        <div className="bg-rose-50 p-6 border border-rose-100 rounded-2xl shadow-sm">
                                            <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><HeartPulse className="w-5 h-5"/> Archivo Médico & Vestuario Corporativo <Shirt className="w-4 h-4 ml-1 text-slate-500" /></h4>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-rose-700 mb-1">Talla Camisa</label>
                                                    <select value={newEmp.shirtSize} onChange={e => setNewEmp({...newEmp, shirtSize: e.target.value})} className="w-full border border-rose-200 rounded-lg px-3 py-2 outline-none bg-white">
                                                        <option value="">N/A</option>
                                                        <option value="S">S - Chica</option>
                                                        <option value="M">M - Mediana</option>
                                                        <option value="L">L - Grande</option>
                                                        <option value="XL">XL - Extra Gde</option>
                                                        <option value="XXL">XXL</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-rose-700 mb-1">Talla Pantalón</label>
                                                    <input type="text" placeholder="Ej. 32" value={newEmp.pantsSize} onChange={e => setNewEmp({...newEmp, pantsSize: e.target.value})} className="w-full border border-rose-200 rounded-lg px-3 py-2 outline-none bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-rose-700 mb-1">Núm Calzado</label>
                                                    <input type="text" placeholder="Ej. 27.5" value={newEmp.shoeSize} onChange={e => setNewEmp({...newEmp, shoeSize: e.target.value})} className="w-full border border-rose-200 rounded-lg px-3 py-2 outline-none bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-rose-700 mb-1">Tipo Sangre</label>
                                                    <select value={newEmp.bloodType} onChange={e => setNewEmp({...newEmp, bloodType: e.target.value})} className="w-full border border-rose-200 rounded-lg px-3 py-2 outline-none bg-white">
                                                        <option value="">N/A</option><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-rose-700 mb-1">Contacto de Emergencia</label>
                                                    <input type="text" placeholder="Nombre y celular" value={newEmp.emergencyContact} onChange={e => setNewEmp({...newEmp, emergencyContact: e.target.value})} className="w-full border border-rose-200 rounded-lg px-3 py-2 outline-none bg-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acceso a Plataforma */}
                                        {!isEditingId && (
                                            <div className="border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-indigo-900 flex items-center gap-2"><Key className="w-5 h-5"/> Asignar Credenciales ERP</h4>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                      <input type="checkbox" checked={giveAccess} onChange={() => setGiveAccess(!giveAccess)} className="sr-only peer" />
                                                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>

                                                {giveAccess && (
                                                    <div className="p-6 grid grid-cols-1 gap-4 bg-white">
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-1">Correo (Usuario de Ingreso) *</label>
                                                            <input required type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Inicial *</label>
                                                            <input required type="text" value={newEmp.password} onChange={e => setNewEmp({...newEmp, password: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-600 bg-slate-50" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-bold text-slate-700 mb-1">Matriz de Privilegios *</label>
                                                                <select required value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none ring-2 ring-indigo-500 font-bold text-indigo-700 bg-indigo-50/20">
                                                                    <optgroup label="Roles Fijos Clásicos"><option value="CASHIER">Cajero en Mostrador</option><option value="WAREHOUSE">Almacenista WMS</option><option value="MANAGER">Supervisor de Turno</option><option value="OWNER">Propietario</option></optgroup>
                                                                    {roles.length > 0 && (
                                                                        <optgroup label="🔹 Roles Dinámicos">
                                                                            {roles.map(r => (<option key={r.id} value={`CUSTOM_${r.id}`}>{r.name}</option>))}
                                                                        </optgroup>
                                                                    )}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-bold text-slate-700 mb-1">Sucursal</label>
                                                                <select required value={newEmp.warehouseId} onChange={e => setNewEmp({...newEmp, warehouseId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none bg-slate-50">
                                                                    <option value="">TODAS (Global)</option>
                                                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {isEditingId && (
                                            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-2xl flex items-start gap-3">
                                                <ShieldCheck className="w-6 h-6 text-yellow-600 shrink-0"/>
                                                <p className="text-sm text-yellow-800 font-medium">Las credenciales de acceso (Usuario y Contraseña) deben editarse directamente en el Portal de Usuarios para proteger la sesión activa.</p>
                                            </div>
                                        )}

                                        {/* Expediente Digital */}
                                        {isEditingId && (
                                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                                    <h4 className="font-bold text-slate-800">Expediente Digital (Documentos)</h4>
                                                    <label className="bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-50 transition-colors">
                                                        + Subir Documento
                                                        <input type="file" className="hidden" onChange={uploadDocument} />
                                                    </label>
                                                </div>
                                                <div className="bg-white p-4">
                                                    {newEmp.documents && newEmp.documents.length > 0 ? (
                                                        <ul className="space-y-2">
                                                            {newEmp.documents.map((doc: any) => (
                                                                <li key={doc.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                                                    <span className="text-sm font-medium text-slate-700">📄 {doc.name}</span>
                                                                    <a href={`${baseUrl}${doc.fileUrl}`} target="_blank" className="text-xs text-indigo-600 font-bold hover:underline">Ver / Descargar</a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-slate-400 text-center italic py-4">No hay documentos anexados (Contrato, INE, etc.)</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button form="createEmpForm" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                                <Save className="w-6 h-6 inline-block mr-2"/> {isEditingId ? 'GUARDAR CAMBIOS' : 'REGISTRAR Y CONSTRUIR GAFETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => (
                    <div key={emp.id} className={`bg-white rounded-3xl p-6 border shadow-sm transition-all relative ${emp.isActive ? 'border-slate-200' : 'border-red-200 bg-red-50/30'}`}>
                        {/* Botonería Flotante */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <button onClick={() => startEdit(emp)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar Perfil">
                                <Edit2 className="w-4 h-4"/>
                            </button>
                            {emp.isActive && (
                                <button onClick={() => handleDelete(emp.id, emp.firstName)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Dar de Baja">
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            )}
                        </div>

                        {/* Credencial Fotográfica */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRefs.current[emp.id]?.click()}>
                                    {emp.avatarUrl ? (
                                        <img src={`${baseUrl}${emp.avatarUrl}?t=${Date.now()}`} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-slate-100" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-slate-200 rounded-2xl flex items-center justify-center font-black text-indigo-700 text-2xl shadow-inner border-2 border-slate-100">
                                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        ref={el => fileInputRefs.current[emp.id] = el}
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) uploadPhoto(emp.id, e.target.files[0]);
                                        }}
                                    />
                                </div>
                                <div className="pr-12">
                                    <h3 className="font-black text-lg text-slate-800 leading-tight">{emp.firstName} {emp.lastName}</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-0.5">{emp.jobTitle || 'Empleado Corporativo'}</p>
                                    {emp.employeeType === 'CONTRACTOR' && (
                                        <span className="inline-block mt-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-orange-200">Externo / Proveedor</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            {emp.bloodType && <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase px-2 py-1 rounded-md flex items-center gap-1"><HeartPulse className="w-3 h-3"/> {emp.bloodType}</span>}
                            {emp.shirtSize && <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-black px-2 py-1 flex items-center gap-1 rounded-md"><Shirt className="w-3 h-3"/> {emp.shirtSize}</span>}
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-600">{emp.departmentRef?.name || emp.department || 'Sin Departamento'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Key className="w-4 h-4 text-indigo-400" />
                                {emp.user ? (
                                    <span className="font-bold text-indigo-600">{emp.user.role === 'CUSTOM' ? `Rol Personalizado` : emp.user.role}</span>
                                ) : (
                                    <span className="font-medium text-slate-400 italic line-through">Sin Acceso ERP</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button onClick={() => printBadge(emp)} className="w-full flex items-center justify-center gap-2 text-indigo-700 font-bold text-sm bg-indigo-50 py-3 rounded-xl transition-all hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:shadow-lg shadow-indigo-500/30">
                                <Printer className="w-5 h-5" /> EXPEDIR GAFETE OFICIAL
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
