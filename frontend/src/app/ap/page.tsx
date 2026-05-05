'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Download, TrendingDown, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function APReportsPage() {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch((process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api') + '/purchases/ap-report', {
            headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
        })
        .then(res => res.json())
        .then(data => {
            setReport(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error', err);
            setLoading(false);
        });
    }, []);

    const downloadCsv = () => {
        if (!report || !report.payments) return;
        const rows = [
            ['ID Pago', 'ID Orden', 'Fecha', 'Proveedor', 'Metodo', 'Referencia', 'Notas', 'Monto'],
            ...report.payments.map((p: any) => [
                p.id,
                p.purchaseOrder.id.split('-')[0].toUpperCase(),
                new Date(p.paymentDate).toLocaleString(),
                `"${p.purchaseOrder.supplier?.legalName || '-'}"`,
                p.paymentMethod,
                `"${p.reference || ''}"`,
                `"${p.notes || ''}"`,
                p.amount.toString()
            ])
        ];

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Pagos_AP_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8">Calculando reportes...</div>;
    if (!report) return <div className="p-8">Error al cargar datos financieros.</div>;

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <TrendingDown className="mr-2 text-rose-500 w-6 h-6" />
                        Cuentas Por Pagar (Abonos)
                    </h1>
                    <p className="text-gray-500">Reporte global de compromisos financieros con proveedores.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={downloadCsv} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center shadow-md transition-all active:scale-95">
                        <Download className="h-4 w-4 mr-2" /> Excel (CSV)
                    </button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center hover:border-rose-200 transition-colors">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Deuda Pendiente Total</p>
                    <h2 className="text-4xl font-black text-rose-600">${report.totalDebt.toFixed(2)}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center hover:border-amber-200 transition-colors">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Órdenes con Adeudo</p>
                    <h2 className="text-4xl font-black text-amber-500">{report.pendingOrders.length}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center hover:border-emerald-200 transition-colors">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Abonos Históricos</p>
                    <h2 className="text-4xl font-black text-emerald-600">{report.payments.length}</h2>
                </div>
            </div>

            {/* Historial Global */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-100 flex items-center bg-slate-50/50">
                    <Wallet className="w-5 h-5 text-indigo-600 mr-2" />
                    <h3 className="font-bold text-slate-900 text-lg">Historial Global de Salidas (Abonos)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-slate-500 text-[10px] sm:text-xs uppercase font-bold border-b border-slate-200">
                            <tr>
                                <th className="py-4 px-6">Fecha y Hora</th>
                                <th className="py-4 px-6">Proveedor</th>
                                <th className="py-4 px-6 text-center">Ref / Orden</th>
                                <th className="py-4 px-6">Detalles de Pago</th>
                                <th className="py-4 px-6 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {report.payments.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                                        {new Date(p.paymentDate).toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="py-4 px-6 text-slate-800 font-bold break-words max-w-[200px]">
                                        {p.purchaseOrder.supplier?.legalName || 'Proveedor General'}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                       <button onClick={()=>router.push(`/purchases/${p.purchaseOrder.id}`)} className="text-indigo-600 font-mono font-bold hover:text-indigo-800 transition-colors mb-1 flex justify-center w-full items-center">
                                            #{p.purchaseOrder.id.split('-')[0].toUpperCase()}
                                       </button>
                                       {p.reference && <span className="text-[10px] bg-white border border-slate-200 shadow-sm px-1.5 py-0.5 rounded text-slate-500 font-mono inline-block truncate max-w-[80px]">{p.reference}</span>}
                                    </td>
                                    <td className="py-4 px-6 text-slate-500">
                                        <div>Método: <strong className="text-slate-700">{p.paymentMethod === '03' ? 'Transferencia' : p.paymentMethod === '01' ? 'Efectivo' : p.paymentMethod}</strong></div>
                                        {p.notes && <div className="text-[11px] italic mt-1 truncate max-w-[200px]">&quot;{p.notes}&quot;</div>}
                                    </td>
                                    <td className="py-4 px-6 text-right font-black text-slate-900 text-base sm:text-lg">
                                        ${p.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {report.payments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">Aún no hay salidas o abonos registrados en el sistema.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    );
}
