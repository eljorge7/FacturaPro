'use client';

import { useState, useEffect } from 'react';
import { Plus, Eye, FileText, AlertOctagon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PurchasesPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertsCount, setAlertsCount] = useState(0);

    const loadOrders = () => {
        setLoading(true);
        Promise.all([
            fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/purchases', { headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' } }).then(r => r.json()),
            fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/products', { headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' } }).then(r => r.json())
        ])
        .then(([purchasesData, productsData]) => {
            setOrders(purchasesData);
            setLoading(false);

            // Compute incoming
            const incomingMap: any = {};
            purchasesData.forEach((po: any) => {
                if (po.status === 'PENDING' || po.status === 'PARTIAL') {
                    po.items?.forEach((item: any) => {
                        if (!incomingMap[item.productId]) incomingMap[item.productId] = 0;
                        incomingMap[item.productId] += Math.max(0, item.quantity - (item.receivedQuantity || 0));
                    });
                }
            });

            // Filter criticals
            const criticals = productsData.filter((p: any) => {
                if (p.type === 'SERVICE' || p.type === 'KIT') return false;
                if (!p.trackInventory) return false;
                
                const inTransit = incomingMap[p.id] || 0;
                return (p.stock + inTransit) <= p.minStock;
            });
            setAlertsCount(criticals.length);
        })
        .catch(err => {
            console.error('Error fetching data', err);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
                            <p className="text-gray-500">Gestiona los pedidos a proveedores y recepción de mercancía.</p>
                        </div>
                        <div className="flex gap-3">
                            {alertsCount > 0 && (
                                <button onClick={() => router.push('/purchases/alerts')} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2 px-4 rounded-xl flex items-center shadow-sm animate-pulse border border-rose-200 transition-colors">
                                    <AlertOctagon className="h-4 w-4 mr-2" />
                                    {alertsCount} Alertas de Desabasto
                                </button>
                            )}
                            <button onClick={() => router.push('/purchases/new')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center shadow-md">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Orden
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Historial de Órdenes</h3>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Cargando órdenes...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="py-3 px-4">ID Orden</th>
                                            <th className="py-3 px-4">Fecha</th>
                                            <th className="py-3 px-4">Proveedor</th>
                                            <th className="py-3 px-4">Total</th>
                                            <th className="py-3 px-4">Estado</th>
                                            <th className="py-3 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {orders.map((order: any) => (
                                            <tr key={order.id} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{order.id.split('-')[0].toUpperCase()}</td>
                                                <td className="py-3 px-4">{new Date(order.orderDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{order.supplier?.legalName || 'Proveedor Eliminado'}</td>
                                                <td className="py-3 px-4 font-black">${order.total.toFixed(2)}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {order.status === 'RECEIVED' ? 'RECIBIDO' : 'PENDIENTE'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right space-x-2">
                                                    <button onClick={() => router.push(`/purchases/${order.id}`)} className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-1.5 px-3 rounded-lg inline-flex items-center text-xs">
                                                        <Eye className="h-4 w-4 mr-1" /> Ver Detalles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-slate-500">No hay órdenes de compra registradas.</td>
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
