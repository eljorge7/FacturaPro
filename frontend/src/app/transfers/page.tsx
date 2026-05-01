'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, CheckSquare, Search, AlertTriangle, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function TransfersPage() {
    const { token, tenantId: activeTenantId } = useAuth();
    const [transfers, setTransfers] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNew, setShowNew] = useState(false);
    const [newOrigin, setNewOrigin] = useState('');
    const [newDest, setNewDest] = useState('');
    const [newItems, setNewItems] = useState<any[]>([]);
    const [searchProd, setSearchProd] = useState('');

    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [receiveForm, setReceiveForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (token && activeTenantId) {
            loadData();
        }
    }, [token, activeTenantId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
            const headers = { 
                'x-tenant-id': activeTenantId || 'demo-tenant',
                'Authorization': `Bearer ${token}` 
            };
            const [tRes, wRes, pRes] = await Promise.all([
                fetch(`${baseUrl}/transfers`, { headers }),
                fetch(`${baseUrl}/warehouses`, { headers }),
                fetch(`${baseUrl}/products`, { headers })
            ]);
            
            if (tRes.ok) setTransfers(await tRes.json());
            if (wRes.ok) setWarehouses(await wRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransfer = async () => {
        if (!newOrigin || !newDest || newOrigin === newDest || newItems.length === 0) return alert('Formulario inválido. Selecciona bodegas distintas y al menos 1 producto.');
        
        setIsSaving(true);
        try {
            const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
            const res = await fetch(`${baseUrl}/transfers`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-tenant-id': activeTenantId || 'demo-tenant',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    fromWarehouseId: newOrigin,
                    toWarehouseId: newDest,
                    reference: 'Traspaso Interno',
                    items: newItems.map(i => ({ productId: i.id, quantity: Number(i.qty) }))
                })
            });
            
            if (res.ok) {
                setShowNew(false);
                setNewItems([]);
                loadData();
            } else {
                const err = await res.json();
                alert(err.message || 'Error de Stock en Origen');
            }
        } catch(e) { console.error(e); } finally { setIsSaving(false); }
    };

    const addItemToTransfer = (prod: any) => {
        if (newItems.find(i => i.id === prod.id)) return;
        setNewItems([...newItems, { ...prod, qty: 1 }]);
        setSearchProd('');
    };

    const openForReceive = (t: any) => {
        setSelectedOrder(t);
        const defaults: any = {};
        t.items.forEach((item: any) => {
            defaults[item.id] = { receivedQty: item.quantity }; // pre-fill 100%
        });
        setReceiveForm(defaults);
    };

    const handleReceiveSubmit = async () => {
        setIsSaving(true);
        const itemsRecv = Object.keys(receiveForm).map(id => ({ itemId: id, receivedQty: Number(receiveForm[id].receivedQty) }));

        try {
            const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
            const res = await fetch(`${baseUrl}/transfers/${selectedOrder.id}/receive`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-tenant-id': activeTenantId || 'demo-tenant',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ itemsRecv })
            });

            if (res.ok) {
                setSelectedOrder(null);
                loadData();
            } else { alert('Error al recibir'); }
        } catch(e) { console.error(e); } finally { setIsSaving(false); }
    };

    const handleResolve = async (action: 'MERMA' | 'RETURN_TO_ORIGIN') => {
        if (!confirm('Esta acción es irrevocable y alterará el stock financiero global de la empresa. ¿Continuar?')) return;
        
        setIsSaving(true);
        try {
            const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
            const res = await fetch(`${baseUrl}/transfers/${selectedOrder.id}/resolve-discrepancy`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-tenant-id': activeTenantId || 'demo-tenant',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                setSelectedOrder(null);
                loadData();
            }
        } catch(e) {} finally { setIsSaving(false); }
    };

    if (loading) return <div className="p-10 font-bold text-center text-slate-500">Sincronizando Estado Carretero...</div>;

    const filteredProds = searchProd.length > 2 ? products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()) || p.sku?.includes(searchProd)) : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50/50">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                         <Truck className="w-8 h-8 text-indigo-600" />
                         Traspasos y Logística Interna
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Mueve inventario entre sucursales y audita mermas de traslado.</p>
                </div>
                <button onClick={() => setShowNew(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-colors">
                    <ArrowRightLeft className="w-5 h-5" /> Enviar Mercancía
                </button>
            </div>

            {showNew && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
                    <div className="bg-indigo-600 p-4 text-white font-black text-lg flex justify-between items-center">
                        <span>Generar Carta Porte (Traspaso)</span>
                        <button onClick={() => setShowNew(false)} className="hover:text-indigo-200">X</button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-slate-500 font-bold text-sm mb-1">Bodega ORIGEN (Sale)</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={newOrigin} onChange={e=>setNewOrigin(e.target.value)}>
                                    <option value="">Selecciona Sucursal...</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>📍 {w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-500 font-bold text-sm mb-1">Bodega DESTINO (Entra)</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" value={newDest} onChange={e=>setNewDest(e.target.value)}>
                                    <option value="">Selecciona Sucursal...</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>📍 {w.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                            <input type="text" placeholder="Buscar refacción para subir al camión..." value={searchProd} onChange={e=>setSearchProd(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2" />
                            {filteredProds.length > 0 && (
                                <div className="mt-2 bg-white border border-slate-200 shadow-lg rounded-lg max-h-40 overflow-y-auto">
                                    {filteredProds.map(p => (
                                        <div key={p.id} onClick={() => addItemToTransfer(p)} className="p-2 border-b hover:bg-slate-50 cursor-pointer font-bold text-sm flex justify-between">
                                            <span>{p.name} <span className="text-slate-400 font-normal">({p.sku})</span></span>
                                            <span className="text-emerald-600 bg-emerald-50 px-2 rounded">Global: {p.stock}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {newItems.length > 0 && (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider text-left">
                                        <th className="p-3">Item</th>
                                        <th className="p-3 w-32">Cantidad a Enviar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newItems.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            <td className="p-3 font-bold text-slate-800">{item.name}</td>
                                            <td className="p-3">
                                                <input type="number" min="1" value={item.qty} onChange={e => setNewItems(newItems.map(i => i.id === item.id ? {...i, qty: e.target.value} : i))} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-center font-bold" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="text-right">
                           <button disabled={isSaving} onClick={handleCreateTransfer} className="bg-slate-800 hover:bg-black text-white px-8 py-3 rounded-xl font-black shadow-lg">Lanzar Camión 🚛</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LISTING */}
            {selectedOrder === null ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transfers.map(t => (
                        <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
                              <div className={`h-full ${t.status === 'IN_TRANSIT' ? 'bg-amber-500 animate-pulse' : t.status === 'RECEIVED' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: '100%'}}></div>
                           </div>
                           <div className="flex justify-between items-center mb-4">
                               <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${t.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-700' : t.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                   {t.status === 'IN_TRANSIT' ? 'En Tránsito' : t.status === 'RECEIVED' ? 'Completado' : 'Discrepancia / Merma'}
                               </span>
                               <span className="text-slate-400 font-mono text-sm">{new Date(t.issueDate).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-3 mb-4 text-slate-700 font-bold">
                               <div className="bg-slate-100 p-2 rounded text-slate-500 text-sm">📍 {t.fromWarehouse.name}</div>
                               <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                               <div className="bg-slate-100 p-2 rounded text-slate-800 text-sm">📍 {t.toWarehouse.name}</div>
                           </div>
                           
                           {(t.status === 'IN_TRANSIT' || t.status === 'DISCREPANCY') && (
                               <button onClick={() => openForReceive(t)} className="w-full mt-2 bg-slate-900 hover:bg-black text-white py-2 rounded-xl font-bold transition-colors">
                                  {t.status === 'IN_TRANSIT' ? 'Recibir Traspaso' : 'Auditar Discrepancia'}
                               </button>
                           )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black">Recepción Lote de {selectedOrder.fromWarehouse.name}</h2>
                            <p className="text-slate-400">Audita palomeando las cantidades físicas recibidas en {selectedOrder.toWarehouse.name}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">Cerrar</button>
                    </div>

                    <div className="p-0">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4 text-center text-indigo-600 bg-indigo-50">Enviado (Teórico)</th>
                                    <th className="p-4 w-48 text-center text-emerald-600 bg-emerald-50">Físico Recibido</th>
                                    {selectedOrder.status === 'DISCREPANCY' && <th className="p-4 text-center">Estatus</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items.map((item: any) => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{item.product.name}</div>
                                            <div className="text-slate-500 text-xs font-mono">{item.product.sku}</div>
                                        </td>
                                        <td className="p-4 text-center font-black text-xl text-indigo-600 bg-indigo-50/30">{item.quantity}</td>
                                        
                                        {selectedOrder.status === 'IN_TRANSIT' ? (
                                            <td className="p-4 bg-emerald-50/40">
                                                <input type="number" min="0" max={item.quantity} value={receiveForm[item.id]?.receivedQty || 0} onChange={e => setReceiveForm({...receiveForm, [item.id]: {receivedQty: e.target.value}})} className="w-full bg-white border-2 border-emerald-200 text-emerald-700 text-center text-xl font-black rounded-xl py-2 outline-none focus:border-emerald-500" />
                                            </td>
                                        ) : (
                                            <td className="p-4 text-center font-black text-xl text-emerald-600 bg-emerald-50/30">{item.receivedQty}</td>
                                        )}

                                        {selectedOrder.status === 'DISCREPANCY' && (
                                            <td className="p-4 text-center">
                                                {item.receivedQty < item.quantity ? (
                                                    <span className="text-red-500 font-bold text-sm bg-red-50 px-2 py-1 rounded">Faltan {item.quantity - item.receivedQty}</span>
                                                ) : <span className="text-emerald-500 font-bold text-sm">OK</span>}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                        {selectedOrder.status === 'IN_TRANSIT' && (
                            <button disabled={isSaving} onClick={handleReceiveSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg">Confirmar Ingreso en {selectedOrder.toWarehouse.name}</button>
                        )}
                        {selectedOrder.status === 'DISCREPANCY' && (
                            <div className="flex gap-4 items-center">
                                <span className="bg-red-100 text-red-800 font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5"/> Zona de Dictamen
                                </span>
                                <button disabled={isSaving} onClick={() => handleResolve('RETURN_TO_ORIGIN')} className="border-2 border-slate-300 text-slate-600 hover:border-slate-800 hover:text-slate-800 font-bold px-4 py-2 rounded-xl">Devolver Balance a Origen</button>
                                <button disabled={isSaving} onClick={() => handleResolve('MERMA')} className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-2 rounded-xl shadow-lg">Asumir como Merma Total</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
