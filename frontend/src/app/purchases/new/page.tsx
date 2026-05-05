'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPurchasePage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId') || 'demo-tenant';
        Promise.all([
            fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/suppliers', { headers: { 'x-tenant-id': tenantId } }).then(res => res.json()),
            fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/products', { headers: { 'x-tenant-id': tenantId } }).then(res => res.json())
        ]).then(([sups, prods]) => {
            setSuppliers(sups);
            setProducts(prods);
        });
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/purchases', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant'
                },
                body: JSON.stringify({ supplierId, items: items.filter(i => i.productId) })
            });

            if (!res.ok) throw new Error('Error al crear orden');
            router.push('/purchases');
        } catch (err) {
            console.error(err);
            alert('Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 pb-20 max-w-4xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Nueva Orden de Compra</h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg">Información General</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">Proveedor</label>
                                    <select 
                                        className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={supplierId} 
                                        onChange={e => setSupplierId(e.target.value)} 
                                        required
                                    >
                                        <option value="" disabled>Seleccione un proveedor</option>
                                        {suppliers.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.legalName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden mb-6">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg">Artículos</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Producto</label>
                                            <select 
                                                className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                value={item.productId} 
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[index].productId = e.target.value;
                                                    setItems(newItems);
                                                }}
                                                required
                                            >
                                                <option value="" disabled>Seleccione un producto</option>
                                                {products.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.name} {p.hasSerials ? '(Lleva Series)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Cantidad</label>
                                            <input className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none" type="number" min="1" value={item.quantity} onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index].quantity = Number(e.target.value);
                                                setItems(newItems);
                                            }} />
                                        </div>
                                        <div className="w-32 space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Costo Unit.</label>
                                            <input className="w-full p-3 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none" type="number" step="0.01" min="0" value={item.unitCost} onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index].unitCost = Number(e.target.value);
                                                setItems(newItems);
                                            }} />
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 font-bold py-3 px-4 rounded-xl w-full transition-colors" onClick={() => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }])}>
                                    + Agregar Producto
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button type="button" className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" onClick={() => router.push('/purchases')}>Cancelar</button>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors disabled:opacity-50" disabled={loading || !supplierId || !items[0].productId}>Crear Orden</button>
                        </div>
                    </form>
        </div>
    );
}
