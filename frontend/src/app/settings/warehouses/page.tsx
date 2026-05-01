'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, CheckCircle, ShieldAlert, Users, Search, Trash2, FileEdit, X, Save } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function WarehousesSettings() {
    const { token, tenantId: activeTenantId } = useAuth();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newWarehouse, setNewWarehouse] = useState({ name: '', address: '' });
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');

    useEffect(() => {
        if (token && activeTenantId) {
            loadData();
        }
    }, [token, activeTenantId]);

    const loadData = async () => {
        setLoading(true);
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const headers = { 
            'x-tenant-id': activeTenantId || 'demo-tenant',
            'Authorization': `Bearer ${token}` 
        };
        
        try {
            const [wRes, uRes] = await Promise.all([
                fetch(`${baseUrl}/warehouses`, { headers }),
                fetch(`${baseUrl}/users`, { headers })
            ]);
            
            if (wRes.ok) setWarehouses(await wRes.json());
            if (uRes.ok) setUsers(await uRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWarehouse = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newWarehouse.name) return;

        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/warehouses`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-tenant-id': activeTenantId || 'demo-tenant',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newWarehouse)
        });

        if (res.ok) {
            setNewWarehouse({ name: '', address: '' });
            loadData();
        }
    };

    const handleDeleteWarehouse = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar la sucursal ${name}? Esta acción no se puede deshacer.`)) return;
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        try {
            const res = await fetch(`${baseUrl}/warehouses/${id}`, {
                method: 'DELETE',
                headers: { 
                    'x-tenant-id': activeTenantId || 'demo-tenant',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                loadData();
            } else {
                alert('No se puede eliminar la sucursal (quizás sea la predeterminada o tenga inventario asignado).');
            }
        } catch (e) { console.error(e); }
    };

    const startEditing = (w: any) => {
        setEditingId(w.id);
        setEditName(w.name);
        setEditAddress(w.address || '');
    };

    const handleUpdateWarehouse = async () => {
        if (!editName) return;
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        await fetch(`${baseUrl}/warehouses/${editingId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-tenant-id': activeTenantId || 'demo-tenant',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: editName, address: editAddress })
        });
        setEditingId(null);
        loadData();
    };

    const handleUserWarehouseChange = async (userId: string, warehouseId: string) => {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        await fetch(`${baseUrl}/users/${userId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-tenant-id': activeTenantId || 'demo-tenant',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ warehouseId })
        });
        loadData();
    };

    const handleSetDefault = async (id: string) => {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        await fetch(`${baseUrl}/warehouses/${id}/default`, {
            method: 'PATCH',
            headers: { 
                'x-tenant-id': activeTenantId || 'demo-tenant',
                'Authorization': `Bearer ${token}`
            }
        });
        loadData();
    }

    if (loading) return <div className="p-10 font-bold text-center text-slate-500">Cargando Módulo Multi-Bodega...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                     <Building2 className="w-8 h-8 text-indigo-600" />
                     Estructura Multi-Sucursal (Bodegas)
                </h1>
                <p className="text-slate-500 font-medium text-lg mt-1">
                    Crea múltiples almacenes y asigna a tus empleados su burbuja de acceso para despachar y consultar.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* WH FORM */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-1 border-t-4 border-t-indigo-500">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Nueva Sucursal / Bodega</h3>
                    <form onSubmit={handleCreateWarehouse} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Identificador</label>
                            <input 
                                type="text"
                                required
                                value={newWarehouse.name}
                                onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                                placeholder="Ej. Bodega Norte"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Dirección (Opcional)</label>
                            <input 
                                type="text"
                                value={newWarehouse.address}
                                onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})}
                                placeholder="Ej. Av. Siempre Viva 123"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2">
                            <Plus className="w-5 h-5" /> Registrar Sucursal
                        </button>
                    </form>
                </div>

                {/* WH LIST */}
                <div className="col-span-1 lg:col-span-2 space-y-4">
                    {warehouses.length === 0 ? (
                        <div className="bg-slate-50 rounded-3xl p-10 text-center border border-dashed border-slate-300">
                            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">No tienes múltiples bodegas detectadas aún.</p>
                            <p className="text-sm text-slate-400">El sistema opera en modo de almacén unificado actualmente.</p>
                        </div>
                    ) : (
                        warehouses.map(w => (
                            <div key={w.id} className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between ${w.isDefault ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200'}`}>
                                {editingId === w.id ? (
                                    <div className="flex-1 mr-4 space-y-3">
                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-indigo-500" placeholder="Nombre" autoFocus />
                                        <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-sm" placeholder="Dirección" />
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdateWarehouse} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1"><Save className="w-4 h-4"/> Guardar</button>
                                            <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1"><X className="w-4 h-4"/> Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${w.isDefault ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                <Building2 className={`w-6 h-6 ${w.isDefault ? 'text-emerald-600' : 'text-slate-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                                    {w.name} 
                                                    {w.isDefault && <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Matriz</span>}
                                                </h4>
                                                <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {w.address || 'Sin dirección'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => startEditing(w)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"><FileEdit className="w-5 h-5"/></button>
                                            {!w.isDefault && (
                                                <>
                                                <button onClick={() => handleDeleteWarehouse(w.id, w.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                                                <button onClick={() => handleSetDefault(w.id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-sm transition-colors ml-2">
                                                    Predeterminar
                                                </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* USERS - WAREHOUSE MAPPING */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8 border-t-4 border-t-blue-500">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> Enrolamiento Multi-Sucursal</h3>
                        <p className="text-slate-500 text-sm mt-1">Configura a qué bodega física pertenece cada empleado. El Gerente (Omnipotente) no necesita bodega.</p>
                    </div>
                </div>
                <div className="px-6 py-2">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="py-4 font-bold">Empleado</th>
                                <th className="py-4 font-bold">Cargo / Rol</th>
                                <th className="py-4 font-bold">Sucursal Asignada (Burbuja)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="py-4">
                                        <div className="font-bold text-slate-800">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'OWNER' ? 'bg-indigo-100 text-indigo-700' : u.role === 'CASHIER' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        {u.role === 'OWNER' ? (
                                            <div className="text-slate-400 text-sm italic flex items-center gap-1">
                                                <ShieldAlert className="w-4 h-4"/> Omnipotente (Acceso Total)
                                            </div>
                                        ) : (
                                            <select 
                                                value={u.warehouseId || ''}
                                                onChange={e => handleUserWarehouseChange(u.id, e.target.value)}
                                                className="bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">-- Sin Burbuja (Acceso a Todo) --</option>
                                                {warehouses.map(w => (
                                                    <option key={w.id} value={w.id}>📍 {w.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
