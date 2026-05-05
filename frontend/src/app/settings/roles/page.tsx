'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Key, Zap, CheckCircle2, Circle, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const PERMISSION_MATRIX = [
    { id: 'view_sales', label: 'Ver Módulo de Ventas', desc: 'Permite acceder al historial de facturas' },
    { id: 'pos_access', label: 'Acceso a Mostrador (POS)', desc: 'Permite cobrar en caja web' },
    { id: 'view_inventory', label: 'Ver Catálogo y WMS', desc: 'Lectura de existencias y productos' },
    { id: 'manage_transfers', label: 'Crear Traspasos', desc: 'Puede mover stock entre sucursales' },
    { id: 'manage_audits', label: 'Manejar Auditorías', desc: 'Puede lanzar y aplicar discrepancias de stock' },
    { id: 'staff_auditor', label: 'Conteo a Ciegas', desc: 'Puede realizar conteos sin ver teóricos' },
    { id: 'view_hr', label: 'Directorio HR', desc: 'Permite ver la lista de personal' },
    { id: 'manage_hr', label: 'Administrar HR', desc: 'Contratar y despedir, ver salarios' }
];

export default function RolesSettings() {
    const { token, tenantId: activeTenantId, user } = useAuth();
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });

    useEffect(() => {
        if (token && activeTenantId) loadRoles();
    }, [token, activeTenantId]);

    const loadRoles = async () => {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        try {
            const res = await fetch(`${baseUrl}/roles`, { headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` } });
            if (res.ok) setRoles(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const togglePermission = (permId: string) => {
        if (newRole.permissions.includes(permId)) {
            setNewRole(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== permId) }));
        } else {
            setNewRole(prev => ({ ...prev, permissions: [...prev.permissions, permId] }));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newRole)
        });

        if (res.ok) {
            setIsCreating(false);
            setNewRole({ name: '', description: '', permissions: [] });
            loadRoles();
        }
    };

    const handleDelete = async (id: string, name: string, count: number) => {
        if (count > 0) return alert('No puedes eliminar un rol si hay empleados activos usándolo. Quítalo de su gafete primero.');
        if (!confirm(`¿Eliminar matriz de permisos de "${name}"?`)) return;
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        await fetch(`${baseUrl}/roles/${id}`, {
            method: 'DELETE',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        loadRoles();
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <ShieldAlert className="w-10 h-10 text-rose-600" />
                        Ingeniería de Privilegios (RBAC)
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2">
                        Crea perfiles dinámicos encendiendo y apagando interruptores de acceso.
                    </p>
                </div>
                <button onClick={() => setIsCreating(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
                    <Zap className="w-5 h-5"/> Crear Rol Dinámico
                </button>
            </div>

            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Key className="w-6 h-6 text-rose-600"/> Nuevo Perfil de Permisos</h3>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                            <form id="roleForm" onSubmit={handleCreate} className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Perfil *</label>
                                        <input required type="text" placeholder="Ej. Vendedor Jr" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-rose-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Descripción Breve</label>
                                        <input type="text" placeholder="Solo accede a la caja mostrador" value={newRole.description} onChange={e => setNewRole({...newRole, description: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-rose-600" />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Matriz de Acceso Autorizado (Switches)</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {PERMISSION_MATRIX.map(perm => {
                                            const active = newRole.permissions.includes(perm.id);
                                            return (
                                                <div key={perm.id} onClick={() => togglePermission(perm.id)} className={`cursor-pointer border rounded-xl p-4 transition-all flex items-start gap-3 ${active ? 'border-rose-300 bg-rose-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                                    {active ? <CheckCircle2 className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 mt-0.5 shrink-0" />}
                                                    <div>
                                                        <h5 className={`font-bold ${active ? 'text-rose-800' : 'text-slate-700'}`}>{perm.label}</h5>
                                                        <p className="text-xs text-slate-500 mt-1">{perm.desc}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button form="roleForm" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                <Save className="w-5 h-5"/> Compilar Permisos en Matriz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
                        <div className="flex justify-between items-start mb-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800">{role.name}</h3>
                                    <p className="text-sm font-medium text-slate-500">{role.description || 'Sin descripción'}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(role.id, role.name, role._count?.users || 0)} className="text-slate-300 hover:text-red-500 transition-colors p-2" title="Eliminar Rol">
                                <Trash2 className="w-5 h-5"/>
                            </button>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Llaves Autorizadas ({role.permissions.length})</h4>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.map((p: string) => (
                                    <span key={p} className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400"/>
                            <span className="text-sm font-bold text-slate-600">{role._count?.users || 0} Operadores portan este gafete</span>
                        </div>
                    </div>
                ))}

                {roles.length === 0 && !loading && (
                    <div className="col-span-1 lg:col-span-2 text-center p-12 border border-dashed border-slate-200 rounded-3xl">
                        <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-500">Sin Roles Dinámicos</h3>
                        <p className="text-slate-400 mt-1">Dependes enteramente de los Roles Fijos (Cajero, Almacenista, etc).</p>
                    </div>
                )}
            </div>
        </div>
    );
}
