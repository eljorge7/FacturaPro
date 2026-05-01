'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, CheckSquare, Search, Box, QrCode } from 'lucide-react';

export default function WarehousePage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [receiveForm, setReceiveForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPendingOrders();
    }, []);

    const loadPendingOrders = async () => {
        setLoading(true);
        try {
            const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
            const res = await fetch(`${baseUrl}/purchases`, {
                headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
            });
            const data = await res.json();
            // Filtrar SOLO facturas pendientes o parciales (Blind WMS: no queremos ver completadas aquí)
            const pending = data.filter((o: any) => o.status === 'PENDING' || o.status === 'PARTIAL');
            setOrders(pending);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openOrder = (order: any) => {
        setSelectedOrder(order);
        const defaults: any = {};
        order.items?.forEach((item: any) => {
            const pendingQty = item.quantity - (item.receivedQuantity || 0);
            if (pendingQty > 0) {
                defaults[item.id] = { receivedNow: pendingQty, check: false };
            }
        });
        setReceiveForm(defaults);
    };

    const handleReceive = async () => {
        const itemsToProcess = [];
        for (const itemId of Object.keys(receiveForm)) {
             if (receiveForm[itemId].check && receiveForm[itemId].receivedNow > 0) {
                 itemsToProcess.push({
                     itemId,
                     receivedNow: Number(receiveForm[itemId].receivedNow)
                 });
             }
        }
        
        if (itemsToProcess.length === 0) {
            return alert('Por favor, selecciona (palomea) al menos un artículo para recibir e ingresa su cantidad.');
        }

        setIsSaving(true);
        try {
            const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
            const res = await fetch(`${baseUrl}/purchases/${selectedOrder.id}/receive`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' 
                },
                body: JSON.stringify({ items: itemsToProcess })
            });
            
            if (res.ok) {
                alert('¡Cantidades registradas en el almacén con éxito!');
                setSelectedOrder(null);
                loadPendingOrders();
            } else {
                alert('Error al recibir. Intenta de nuevo.');
            }
        } catch (e) {
            console.error(e);
            alert('Fallo de conexión.');
        } finally {
            setIsSaving(false);
        }
    };

    const printReceiptLabel = (product: any, qty: number) => {
        // En etapa madura esto generará ZPL o un PDF térmico
        alert(`Imprimiendo ${qty} etiquetas térmicas para [${product.sku || 'N/A'}] - ${product.name}\nDestino: ${product.locationShelf || 'ALMACÉN GENERAL'}`);
    };

    if (loading) return <div className="p-10 font-bold text-center text-slate-500">Sincronizando Bodega Central...</div>;

    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.supplier?.legalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
            {/* WMS Header */}
            <div className="bg-slate-950 border-b border-slate-800 px-8 py-5">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <h1 className="text-3xl font-black text-amber-500 flex items-center gap-3 tracking-wide uppercase">
                         <Box className="w-8 h-8" />
                         Recepción Andén (WMS)
                    </h1>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-500" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar proveedor u orden..." 
                            className="bg-slate-800 border-none outline-none text-slate-200 pl-10 pr-4 py-2.5 rounded-xl font-bold w-64 focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto">
                {selectedOrder === null ? (
                    <>
                        <div className="flex gap-4 items-center mb-6">
                             <Truck className="w-6 h-6 text-slate-400" />
                             <h2 className="text-xl font-bold text-slate-100">Cargamentos Esperados Hoy</h2>
                             <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-full text-sm">{filteredOrders.length}</span>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="bg-slate-800 rounded-3xl p-16 text-center shadow-lg border border-slate-700">
                                <CheckSquare className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-black text-white">Andén Limpio</h3>
                                <p className="text-slate-400 mt-2 text-lg">No hay camiones ni recepciones programadas para hoy.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredOrders.map(order => (
                                    <div 
                                        key={order.id} 
                                        onClick={() => openOrder(order)}
                                        className="bg-slate-800 rounded-2xl p-6 border-l-4 border-l-amber-500 shadow-lg cursor-pointer hover:bg-slate-700 transition-all border border-slate-700 hover:-translate-y-1"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded">
                                                    {order.status === 'PARTIAL' ? 'Parcial' : 'Ruta'}
                                                </span>
                                            </div>
                                            <span className="text-slate-500 font-mono text-sm">#{order.id.split('-')[0]}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{order.supplier?.legalName}</h3>
                                        <p className="text-slate-400 text-sm font-medium mb-4">{new Date(order.issueDate).toLocaleDateString()}</p>
                                        
                                        <div className="bg-slate-900 rounded-xl p-3 flex justify-between items-center border border-slate-800">
                                            <span className="text-slate-400 font-bold text-sm">Artículos Esperados:</span>
                                            <span className="text-xl font-black text-white">{order.items?.length || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <button onClick={() => setSelectedOrder(null)} className="font-bold text-amber-500 hover:text-amber-400 mb-6 flex items-center transition-colors">
                             ← Volver al Andén
                        </button>
                        
                        <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-700">
                            <div className="bg-slate-900 px-8 py-6 border-b border-slate-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-white">{selectedOrder.supplier?.legalName}</h2>
                                    <p className="text-slate-400 font-mono text-sm mt-1">Recepción O.C. #{selectedOrder.id.split('-')[0]}</p>
                                </div>
                                <button 
                                    disabled={isSaving}
                                    onClick={handleReceive}
                                    className="bg-amber-500 hover:bg-amber-400 shadow-amber-500/30 shadow-lg text-slate-950 px-8 py-4 rounded-xl font-black text-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Registrando...' : 'Confirmar Pallet Recibido'}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900/50 text-slate-500 uppercase tracking-widest text-xs font-black">
                                            <th className="px-8 py-5">Ok</th>
                                            <th className="px-8 py-5">Identidad / SKU</th>
                                            <th className="px-8 py-5">Ubicación Destino</th>
                                            <th className="px-8 py-5 text-center">Faltante</th>
                                            <th className="px-8 py-5 bg-slate-950 border-l border-slate-800 w-48">Recibiendo Hoy</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {selectedOrder.items.map((item: any) => {
                                            const pendingQty = item.quantity - (item.receivedQuantity || 0);
                                            if (pendingQty <= 0) return null;
                                            
                                            const conf = receiveForm[item.id] || { receivedNow: 0, check: false };
                                            const p = item.product;

                                            return (
                                                <tr key={item.id} className={`transition-colors ${conf.check ? 'bg-amber-500/5' : 'hover:bg-slate-700/30'}`}>
                                                    <td className="px-8 py-6 align-middle">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                                                             style={conf.check ? { backgroundColor: '#f59e0b', borderColor: '#f59e0b' } : {}}
                                                             onClick={() => setReceiveForm({...receiveForm, [item.id]: {...conf, check: !conf.check}})}
                                                        >
                                                            {conf.check && <CheckSquare className="w-5 h-5 text-slate-900" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 align-middle">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                                                {p.imageUrl ? 
                                                                    <img src={`${typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005'}${p.imageUrl}`} className="w-full h-full object-cover relative z-10" /> 
                                                                : 
                                                                    <Package className="w-6 h-6 text-slate-600" />
                                                                }
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-white text-lg">{p.name}</h4>
                                                                <div className="flex gap-2 items-center mt-1">
                                                                    <span className="text-slate-400 font-mono text-sm">{p.sku || 'S/N'}</span>
                                                                    {conf.check && (
                                                                        <button onClick={(e) => { e.stopPropagation(); printReceiptLabel(p, Number(conf.receivedNow)); }} className="text-slate-500 hover:text-amber-500 bg-slate-800 hover:bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1 transition-colors z-10 text-xs font-bold" title="Imprimir Etiquetas">
                                                                            <QrCode className="w-3 h-3" /> ZPL
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 align-middle">
                                                        <div className="bg-slate-900 border border-slate-700 inline-block px-3 py-1.5 rounded-lg text-amber-500 font-bold text-sm">
                                                            {p.locationShelf || 'ALMACÉN GENERAL'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 align-middle text-center">
                                                        <span className="text-3xl font-black text-slate-500">{pendingQty}</span>
                                                    </td>
                                                    <td className="px-8 py-6 bg-slate-950 border-l border-slate-800 align-middle">
                                                        <div className="relative">
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                max={pendingQty}
                                                                value={conf.receivedNow}
                                                                disabled={!conf.check}
                                                                onChange={e => setReceiveForm({...receiveForm, [item.id]: {...conf, receivedNow: e.target.value}})}
                                                                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl text-center text-2xl font-black text-amber-500 outline-none focus:border-amber-500 py-3 disabled:opacity-30 transition-colors"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
