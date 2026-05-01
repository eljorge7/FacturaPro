'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Building2, User, Play, CheckCircle, Search, AlertTriangle, ArrowRight, Save, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function StockTakesPage() {
    const { token, tenantId: activeTenantId, user } = useAuth();
    const [audits, setAudits] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isCreating, setIsCreating] = useState(false);
    const [newWarehouseId, setNewWarehouseId] = useState('');
    const [newAuditorId, setNewAuditorId] = useState('');

    // Execution / Review State
    const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
    const [auditItems, setAuditItems] = useState<{itemId: string, countedQty: number, product: any}[]>([]);

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
            const [stRes, wRes, uRes] = await Promise.all([
                fetch(`${baseUrl}/stock-takes`, { headers }),
                fetch(`${baseUrl}/warehouses`, { headers }),
                fetch(`${baseUrl}/users`, { headers })
            ]);
            
            if (stRes.ok) setAudits(await stRes.json());
            if (wRes.ok) setWarehouses(await wRes.json());
            if (uRes.ok) setUsers(await uRes.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreateAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/stock-takes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ warehouseId: newWarehouseId, auditorId: newAuditorId || user?.id, productIds: [] })
        });

        if (res.ok) {
            setIsCreating(false);
            setNewWarehouseId('');
            setNewAuditorId('');
            loadData();
        } else {
            const error = await res.json();
            alert(error.message);
        }
    };

    const openAuditExecution = async (id: string) => {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/stock-takes/${id}`, {
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setSelectedAudit(data);
            setAuditItems(data.items.map((i: any) => ({
                itemId: i.id,
                countedQty: i.countedQty !== null ? i.countedQty : '',
                product: i.product
            })));
        }
    };

    const handleCountChange = (itemId: string, val: string) => {
        const num = parseFloat(val);
        setAuditItems(prev => prev.map(i => i.itemId === itemId ? { ...i, countedQty: isNaN(num) ? '' as any : num } : i));
    };

    const submitCount = async () => {
        if (!confirm('¿Seguro que deseas enviar el conteo? Ya no podrás modificarlo después.')) return;
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        
        const counts = auditItems.filter((i: any) => i.countedQty !== '').map(i => ({ itemId: i.itemId, countedQty: Number(i.countedQty) }));
        
        const res = await fetch(`${baseUrl}/stock-takes/${selectedAudit.id}/submit`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ counts })
        });

        if (res.ok) {
            setSelectedAudit(null);
            loadData();
        }
    };

    const applyAdjustments = async () => {
        if (!confirm('¿Seguro que deseas APLICAR las desviaciones al inventario? Las diferencias generarán Mermas y Entradas automáticas.')) return;
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/stock-takes/${selectedAudit.id}/apply`, {
            method: 'PATCH',
            headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setSelectedAudit(null);
            loadData();
        }
    };

    const canReview = user?.role === 'OWNER' || user?.role === 'MANAGER';
    const isAssignedAuditor = selectedAudit && selectedAudit.auditorId === user?.id;

    if (loading) return <div className="p-10 text-center font-bold text-slate-500">Cargando Misiones de Auditoría...</div>;

    if (selectedAudit) {
        // EXECUTION OR REVIEW VIEW
        const isReviewing = selectedAudit.status === 'REVIEW' && canReview;
        const isCounting = selectedAudit.status === 'IN_PROGRESS' && (isAssignedAuditor || canReview);

        return (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <button onClick={() => setSelectedAudit(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors">
                    <ArrowRight className="w-5 h-5 rotate-180" /> Volver a misiones
                </button>
                
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <ClipboardList className="w-8 h-8 text-indigo-600"/>
                                Misión: {selectedAudit.id.substring(0, 8)}
                            </h2>
                            <div className="flex gap-4 mt-3 text-sm font-medium text-slate-500">
                                <span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {selectedAudit.warehouse?.name}</span>
                                <span className="flex items-center gap-1"><User className="w-4 h-4"/> Auditor: {selectedAudit.auditor?.name || 'Cualquiera'}</span>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border font-bold text-sm ${selectedAudit.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' : selectedAudit.status === 'REVIEW' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {selectedAudit.status === 'IN_PROGRESS' ? 'EN PROCESO (CONTEO PIE DE ANDÉN)' : selectedAudit.status === 'REVIEW' ? 'REVISIÓN DE DESVIACIONES' : 'MISIÓN COMPLETADA'}
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                        {selectedAudit.items.map((item: any, index: number) => {
                            const dynInput = auditItems.find(i => i.itemId === item.id);
                            const discrepancy = isReviewing || selectedAudit.status === 'COMPLETED' ? item.countedQty - item.expectedQty : 0;
                            return (
                                <div key={item.id} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-700">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.product.name}</h4>
                                            <p className="text-xs text-slate-500 border border-slate-200 rounded px-1.5 py-0.5 inline-block mt-1 font-mono uppercase bg-white">
                                                {item.product.sku || 'SIN SKU'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        { (isReviewing || selectedAudit.status === 'COMPLETED') && (
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-slate-400 mb-1">Teórico SAP/ERP</p>
                                                <p className="font-bold text-slate-600 bg-slate-200 px-3 py-1 rounded-lg">{item.expectedQty} {item.product.satUnitCode}</p>
                                            </div>
                                        )}

                                        <div className="text-center">
                                            <p className="text-xs font-bold text-slate-400 mb-1">Conteo Físico Real</p>
                                            {isCounting ? (
                                                <input 
                                                    type="number" 
                                                    placeholder="0"
                                                    value={dynInput?.countedQty ?? ''}
                                                    onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                    className="w-24 text-center border-2 border-indigo-200 focus:border-indigo-600 rounded-lg py-1.5 font-black text-indigo-800 outline-none text-lg transition-colors"
                                                />
                                            ) : (
                                                <p className="font-black text-slate-800 bg-slate-100 px-4 py-1.5 rounded-lg text-lg border border-slate-200">{item.countedQty ?? 'N/A'}</p>
                                            )}
                                        </div>

                                        { (isReviewing || selectedAudit.status === 'COMPLETED') && (
                                            <div className="text-center w-24">
                                                <p className="text-xs font-bold text-slate-400 mb-1">Desviación</p>
                                                <p className={`font-black text-lg ${discrepancy === 0 ? 'text-emerald-500' : discrepancy < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                                    {discrepancy > 0 ? '+' : ''}{discrepancy}
                                                </p>
                                                {discrepancy < 0 && <span className="text-[10px] uppercase font-bold text-red-600 block">Sobrante a Merma</span>}
                                                {discrepancy > 0 && <span className="text-[10px] uppercase font-bold text-blue-600 block">Ingreso Fantasma</span>}
                                                {discrepancy === 0 && <span className="text-[10px] uppercase font-bold text-emerald-600 block">Exacto</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-8 border-t border-slate-100 mt-6 flex justify-end">
                        {isCounting && (
                            <button onClick={submitCount} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3">
                                <Save className="w-6 h-6"/> ENVIAR CONTEO A REVISIÓN
                            </button>
                        )}
                        {isReviewing && (
                            <button onClick={applyAdjustments} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6"/> AUTORIZAR Y APLICAR CUADRATURA
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <ClipboardList className="w-10 h-10 text-indigo-600" />
                        Misiones de Conteo Cíclico
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2">
                        Auditorías de inventario ciegas. Descubre robos o errores de logística.
                    </p>
                </div>
                {canReview && (
                    <button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
                        <Plus className="w-5 h-5"/> Crear Nueva Auditoría
                    </button>
                )}
            </div>

            {/* Modal de Creación */}
            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setIsCreating(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                            X
                        </button>
                        <h3 className="text-2xl font-black text-slate-800 mb-6">Nueva Misión</h3>
                        <form onSubmit={handleCreateAudit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Sucursal / Bodega a Auditar <span className="text-red-500">*</span></label>
                                <select required value={newWarehouseId} onChange={(e) => setNewWarehouseId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Seleccione una bodega</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Auditor Asignado (Opcional)</label>
                                <select value={newAuditorId} onChange={(e) => setNewAuditorId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Cualquier Cajero/Staff</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                                <LayoutGrid className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <p className="text-indigo-800 text-sm font-medium">Esta misión auditará todos los productos marcados para control de inventario en esa bodega.</p>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 transition-all">
                                Lanzar Misión
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {audits.map(audit => (
                    <div key={audit.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-2 ${audit.status === 'IN_PROGRESS' ? 'bg-amber-400' : audit.status === 'REVIEW' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${audit.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : audit.status === 'REVIEW' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {audit.status === 'IN_PROGRESS' ? 'En Progreso' : audit.status === 'REVIEW' ? 'Revisión Pendiente' : 'Completado'}
                                </span>
                                <h3 className="font-bold text-slate-800 mt-3 text-lg font-mono">ID: {audit.id.substring(0, 8)}</h3>
                            </div>
                            {audit.status === 'IN_PROGRESS' && (
                                <div className="w-10 h-10 rounded-full bg-amber-50 animate-pulse flex items-center justify-center text-amber-500">
                                    <Play className="w-5 h-5" />
                                </div>
                            )}
                            {audit.status === 'REVIEW' && (
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            )}
                            {audit.status === 'COMPLETED' && (
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-6">
                            <p className="text-slate-600 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400"/> {audit.warehouse?.name}</p>
                            <p className="text-slate-600 text-sm flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> {audit.auditor?.name || 'Cualquiera'}</p>
                            <p className="text-slate-600 text-sm flex items-center gap-2"><Search className="w-4 h-4 text-slate-400"/> {audit._count?.items} Artículos a contar</p>
                        </div>

                        <button onClick={() => openAuditExecution(audit.id)} className={`w-full py-3 rounded-xl font-bold flex justify-center py-2 transition-all group-hover:-translate-y-0.5 ${audit.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : audit.status === 'REVIEW' ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {audit.status === 'IN_PROGRESS' ? 'Retomar Conteo' : audit.status === 'REVIEW' ? 'Evaluar Desviaciones' : 'Ver Resultados'}
                        </button>
                    </div>
                ))}
            </div>
            {audits.length === 0 && !loading && (
                <div className="text-center p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-500">No hay misiones de conteo activas</h3>
                    <p className="text-slate-400 mt-2">Crea una nueva auditoría para someter a tu plantilla a una verificación de stock a ciegas.</p>
                </div>
            )}
        </div>
    );
}
