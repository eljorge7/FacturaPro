'use client';

import { useState, useEffect } from 'react';
export default function InventoryPage() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/inventory/movements', {
            headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
        })
        .then(res => res.json())
        .then(data => {
            setMovements(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching inventory movements', err);
            setLoading(false);
        });
    }, []);

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto w-full">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Auditoría de Inventario (Kardex Global)</h1>
                        <p className="text-gray-500">Historial completo de movimientos de mercancía (entradas, salidas, ajustes, ventas).</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Historial de Movimientos</h3>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Cargando movimientos...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="py-3 px-4">Fecha</th>
                                            <th className="py-3 px-4">Categoría / Tipo</th>
                                            <th className="py-3 px-4">Producto</th>
                                            <th className="py-3 px-4">SKU Proveedor</th>
                                            <th className="py-3 px-4 text-right">Cantidad</th>
                                            <th className="py-3 px-4">Referencia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {movements.map((mov: any) => (
                                            <tr key={mov.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4">{new Date(mov.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${mov.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : (mov.type === 'OUT' || mov.type === 'SALE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700')}`}>
                                                        {mov.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{mov.product?.name}</td>
                                                <td className="py-3 px-4 text-slate-500">{mov.product?.supplierSku || '-'}</td>
                                                <td className={`py-3 px-4 text-right font-black ${mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">{mov.reference || '-'}</td>
                                            </tr>
                                        ))}
                                        {movements.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-slate-500">No hay movimientos registrados.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            )}
                        </div>
                    </div>
        </div>
    );
}
