'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, Factory, PackageX, Activity, Send } from 'lucide-react';

export default function AlertsPage() {
    const router = useRouter();
    const [criticalItems, setCriticalItems] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Configuración activa por fila: { [productId]: { selected: boolean, orderQty: number, supplierId: string, unitCost: number } }
    const [orderConfig, setOrderConfig] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    const [movementsData, setMovementsData] = useState<any>({});
    const [loadingMovements, setLoadingMovements] = useState<any>({});

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId') || 'demo-tenant';
        
        Promise.all([
            fetch('http://localhost:3005/products', { headers: { 'x-tenant-id': tenantId } }).then(r => r.json()),
            fetch('http://localhost:3005/suppliers', { headers: { 'x-tenant-id': tenantId } }).then(r => r.json()),
            fetch('http://localhost:3005/purchases', { headers: { 'x-tenant-id': tenantId } }).then(r => r.json())
        ])
        .then(([productsData, suppliersData, purchasesData]) => {
            const incomingMap: any = {};
            purchasesData.forEach((po: any) => {
                if (po.status === 'PENDING' || po.status === 'PARTIAL') {
                    po.items?.forEach((item: any) => {
                        if (!incomingMap[item.productId]) incomingMap[item.productId] = 0;
                        incomingMap[item.productId] += Math.max(0, item.quantity - (item.receivedQuantity || 0));
                    });
                }
            });

            const filtered = productsData.filter((p: any) => {
                // Filtro SAP estricto: Sólo materiales físicos, cero servicios, cero KITS.
                if (p.type === 'SERVICE' || p.type === 'KIT') return false;
                if (!p.trackInventory) return false;
                
                const inTransit = incomingMap[p.id] || 0;
                return (p.stock + inTransit) <= p.minStock;
            });

            setSuppliers(suppliersData);
            setCriticalItems(filtered.map((p: any) => ({ ...p, inTransit: incomingMap[p.id] || 0 })));

            // Pre-populate defaults
            const defaultConfig: any = {};
            filtered.forEach((p: any) => {
                defaultConfig[p.id] = {
                    selected: true,
                    orderQty: Math.max(10, Math.ceil((p.maxStock || 0) - p.stock)),
                    supplierId: suppliersData.length > 0 ? suppliersData[0].id : '',
                    unitCost: p.costPrice || p.price || 0
                };
            });
            setOrderConfig(defaultConfig);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const updateConfig = (productId: string, key: string, value: any) => {
        setOrderConfig((prev: any) => ({
            ...prev,
            [productId]: { ...prev[productId], [key]: value }
        }));
    };

    const handleGeneratePOs = async () => {
        const tenantId = localStorage.getItem('tenantId') || 'demo-tenant';
        
        // Find selected items
        const selectedProducts = criticalItems.filter(p => orderConfig[p.id]?.selected);
        if (selectedProducts.length === 0) return alert('Selecciona al menos un producto.');

        // Verify all selected have a supplier
        for (const p of selectedProducts) {
             if (!orderConfig[p.id].supplierId) {
                 return alert(`Selecciona un proveedor válido para el producto ${p.name}`);
             }
        }

        // Group by supplier
        const itemsBySupplier: Record<string, any[]> = {};
        selectedProducts.forEach(p => {
             const conf = orderConfig[p.id];
             if (!itemsBySupplier[conf.supplierId]) itemsBySupplier[conf.supplierId] = [];
             
             itemsBySupplier[conf.supplierId].push({
                 productId: p.id,
                 quantity: Number(conf.orderQty),
                 unitCost: Number(conf.unitCost)
             });
        });

        setProcessing(true);
        try {
            // Generate one PO per supplier group sequentially
            for (const supplierId of Object.keys(itemsBySupplier)) {
                 const items = itemsBySupplier[supplierId];
                 await fetch('http://localhost:3005/purchases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
                    body: JSON.stringify({
                        supplierId,
                        items
                    })
                 });
            }
            alert(`Se han generado con éxito ${Object.keys(itemsBySupplier).length} Requisiciones/Órdenes de Compra en borrador.`);
            router.push('/purchases');
        } catch (e) {
            console.error(e);
            alert('Ocurrió un error al generar las órdenes.');
        } finally {
            setProcessing(false);
        }
    };

    const handleRequestQuote = () => {
        const selectedProducts = criticalItems.filter(p => orderConfig[p.id]?.selected);
        if (selectedProducts.length === 0) return alert('Selecciona al menos un producto para cotizar.');

        // Group by supplier
        const bySupplier: any = {};
        selectedProducts.forEach(p => {
             const supplierId = orderConfig[p.id].supplierId;
             if (!bySupplier[supplierId]) bySupplier[supplierId] = [];
             bySupplier[supplierId].push(`${orderConfig[p.id].orderQty} pz x ${p.name} (SKU: ${p.sku||'N/A'})`);
        });

        const firstSupplierId = Object.keys(bySupplier)[0];
        const supplier = suppliers.find(s => s.id === firstSupplierId);
        const itemList = bySupplier[firstSupplierId].join('%0A- ');

        const text = `Hola${supplier ? ' ' + supplier.legalName : ''},%0ASolicito existencia, precio actualizado y tiempo de entrega estimado para los siguientes materiales:%0A%0A- ${itemList}%0A%0AQuedo atento a tus comentarios.`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const loadMovements = async (productId: string) => {
        if (movementsData[productId]) {
            // toggle off
            const newMovs = {...movementsData};
            delete newMovs[productId];
            setMovementsData(newMovs);
            return;
        }

        setLoadingMovements({...loadingMovements, [productId]: true});
        try {
            const res = await fetch(`http://localhost:3005/products/${productId}/movements`, {
                headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
            });
            const data = await res.json();
            setMovementsData({ ...movementsData, [productId]: data.slice(0, 5) });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMovements({...loadingMovements, [productId]: false});
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Calculando proyecciones...</div>;

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto w-full">
            <button onClick={() => router.push('/purchases')} className="flex items-center text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors">
                 <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Compras
            </button>
            
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-rose-600 flex items-center gap-3">
                         <AlertTriangle className="w-8 h-8" />
                         Alertas de Desabasto Crítico
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Materiales que han llegado a su límite de seguridad (stock mínimo).</p>
                </div>
                {criticalItems.length > 0 && (
                    <div className="flex gap-3">
                        <button 
                             onClick={handleRequestQuote}
                             className="bg-white hover:bg-emerald-50 text-emerald-700 font-bold py-3 px-6 rounded-2xl flex items-center shadow-sm border border-emerald-200 transition-all text-lg"
                        >
                             <Send className="h-5 w-5 mr-2" />
                             Cotizar por WhatsApp
                        </button>
                        <button 
                             disabled={processing}
                             onClick={handleGeneratePOs} 
                             className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-2xl flex items-center shadow-md transition-all text-lg"
                        >
                             {processing ? (
                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                             ) : (
                                 <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-400" />
                             )}
                             Convertir en Requisiciones (PO)
                        </button>
                    </div>
                )}
            </div>

            {criticalItems.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventario Saludable</h2>
                    <p className="text-slate-500 mt-2 text-lg">No se detectaron productos por debajo de su stock mínimo.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-t-8 border-t-rose-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-slate-500 text-xs font-black uppercase tracking-wider">
                                    <th className="py-4 px-6 text-center w-16">Sel</th>
                                    <th className="py-4 px-6 w-1/3">Refacción / Producto</th>
                                    <th className="py-4 px-6 text-center">Faltante Real</th>
                                    <th className="py-4 px-1"></th>
                                    <th className="py-4 px-6 bg-slate-100">Cantidad a Comprar</th>
                                    <th className="py-4 px-6 bg-slate-100">Costo Estimado</th>
                                    <th className="py-4 px-6 bg-blue-50">Proveedor Destino</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {criticalItems.map(p => {
                                    const conf = orderConfig[p.id];
                                    if (!conf) return null;
                                    
                                    return (
                                        <Fragment key={p.id}>
                                        <tr className={conf.selected ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                                            <td className="py-4 px-6 text-center align-middle">
                                                <input 
                                                    type="checkbox" 
                                                    checked={conf.selected}
                                                    onChange={e => updateConfig(p.id, 'selected', e.target.checked)}
                                                    className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer" 
                                                />
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <div className="font-bold text-slate-800 flex items-start gap-3 text-sm">
                                                    <div className="mt-0.5 p-1.5 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                                                        <PackageX className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        {p.name}
                                                        <div className="text-xs text-slate-400 font-medium font-mono mt-0.5">SKU: {p.sku || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center align-middle">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xl font-black text-rose-600 leading-none">{p.stock}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Min: {p.minStock} | Max: {p.maxStock || 'N/A'}</span>
                                                    {p.inTransit > 0 && (
                                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-1">+ {p.inTransit} en tránsito</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td colSpan={1} className="py-4 px-1 align-middle">
                                                 <button onClick={() => loadMovements(p.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors" title="Ver velocidad de movimiento">
                                                     {loadingMovements[p.id] ? <div className="w-4 h-4 border-2 border-blue-600 border-b-transparent rounded-full animate-spin"></div> : <Activity className="w-4 h-4" />}
                                                 </button>
                                            </td>
                                            <td className="py-4 px-6 bg-slate-50/50 align-middle">
                                                    <div className="relative w-28">
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            value={conf.orderQty}
                                                            disabled={!conf.selected}
                                                            onChange={e => updateConfig(p.id, 'orderQty', e.target.value)}
                                                            className="w-full p-2 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 outline-none focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-400"
                                                        />
                                                    </div>
                                                    {p.satUnitCode && (
                                                        <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest text-center">{p.satUnitCode === 'H87' ? 'PIEZAS' : p.satUnitCode}</div>
                                                    )}
                                            </td>
                                            <td className="py-4 px-6 bg-slate-50/50 align-middle">
                                                <div className="relative w-32 flex items-center">
                                                    <span className="absolute left-3 text-slate-400 font-bold">$</span>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        value={conf.unitCost}
                                                        disabled={!conf.selected}
                                                        onChange={e => updateConfig(p.id, 'unitCost', e.target.value)}
                                                        className="w-full pl-7 pr-2 py-2 border-2 border-slate-200 rounded-xl font-bold text-emerald-700 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 bg-blue-50/20 align-middle">
                                                <select 
                                                    value={conf.supplierId}
                                                    disabled={!conf.selected}
                                                    onChange={e => updateConfig(p.id, 'supplierId', e.target.value)}
                                                    className="w-full p-2.5 border-2 border-blue-200 bg-blue-50/50 rounded-xl font-bold text-blue-900 outline-none focus:border-blue-500 focus:bg-white disabled:opacity-50 cursor-pointer"
                                                >
                                                    <option value="" disabled>Seleccione Proveedor...</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.legalName || s.tradeName}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        {movementsData[p.id] && (
                                            <tr className="bg-slate-50 border-b-2 border-slate-200">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="text-xs font-bold text-slate-500 uppercase mb-2">Últimos 5 movimientos (Velocidad)</div>
                                                    {movementsData[p.id].length === 0 ? <div className="text-slate-400 text-sm">Sin movimientos registrados.</div> : (
                                                        <div className="flex gap-2">
                                                            {movementsData[p.id].map((m: any) => (
                                                                <div key={m.id} className="bg-white border border-slate-200 rounded p-2 text-xs shadow-sm">
                                                                    <div className={`font-black ${m.type==='IN'?'text-emerald-500':'text-rose-500'}`}>{m.type==='IN'?'+':'-'} {m.quantity}</div>
                                                                    <div className="text-slate-400">{new Date(m.date).toLocaleDateString()}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td colSpan={6} className="py-4 px-6 text-right">
                                        <div className="text-sm font-bold text-slate-500">
                                            Subtotal Proyectado: <span className="text-xl font-black text-slate-800 ml-2">
                                                ${criticalItems.filter(p => orderConfig[p.id]?.selected).reduce((acc, p) => acc + (Number(orderConfig[p.id].orderQty) * Number(orderConfig[p.id].unitCost)), 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
