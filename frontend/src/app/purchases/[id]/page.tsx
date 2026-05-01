'use client';

import { useState, useEffect, use } from 'react';
import { ChevronLeft, CheckCircle, PackageSearch, PenTool, Trash2, Send, Printer, Plus, CreditCard, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PurchaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Receipt state
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    // quantities to receive now: [itemId] -> number
    const [receiveQuantities, setReceiveQuantities] = useState<{ [itemId: string]: number }>({});
    // serials input: [itemId] -> string
    const [serialsInput, setSerialsInput] = useState<{ [itemId: string]: string }>({});

    // Payment state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string | number>('');
    const [paymentMethod, setPaymentMethod] = useState('03');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const loadOrder = () => {
        setLoading(true);
        fetch('http://localhost:3005/purchases', { headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' } })
        .then(res => res.json())
        .then(data => {
            const found = data.find((o: any) => o.id === id);
            setOrder(found);
            
            // initialize receiveQuantities to the pending amount
            const initQ: any = {};
            found?.items?.forEach((i: any) => {
                initQ[i.id] = Math.max(0, i.quantity - (i.receivedQuantity || 0));
            });
            setReceiveQuantities(initQ);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadOrder();
    }, [id]);

    const handleReceive = async () => {
        const providedItems = order.items.map((i: any) => {
            const receivedNow = receiveQuantities[i.id] || 0;
            const raw = serialsInput[i.id] || '';
            const serials = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            return { itemId: i.id, receivedNow, serials };
        }).filter((p: any) => p.receivedNow > 0);

        if (providedItems.length === 0) {
            alert('Debe ingresar cantidad a recibir en al menos una partida.');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3005/purchases/${id}/receive`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant'
                },
                body: JSON.stringify({ items: providedItems })
            });

            if (!res.ok) {
                const err = await res.json();
                alert('Error al recibir: ' + err.message);
                return;
            }

            setShowReceiveModal(false);
            loadOrder();

        } catch (e) {
            console.error(e);
            alert('Error al procesar recepción');
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Está seguro de eliminar esta orden?')) return;
        try {
            const res = await fetch(`http://localhost:3005/purchases/${id}`, {
                method: 'DELETE',
                headers: { 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
            });
            if (!res.ok) throw new Error();
            router.push('/purchases');
        } catch {
            alert('Error eliminando la orden (puede que ya tenga recepciones parciales).');
        }
    };

    const handlePayment = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            alert('Ingrese un monto válido.');
            return;
        }
        try {
            const res = await fetch(`http://localhost:3005/purchases/${id}/payment`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant'
                },
                body: JSON.stringify({ amount: Number(paymentAmount), paymentMethod, reference: paymentReference, notes: paymentNotes })
            });

            if (!res.ok) {
                const err = await res.json();
                alert('Error al registrar pago: ' + err.message);
                return;
            }

            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentReference('');
            setPaymentNotes('');
            loadOrder();

        } catch (e) {
            console.error(e);
            alert('Error al procesar pago');
        }
    };

    const printPdf = () => {
        window.print();
    };

    if (loading) return <div className="p-8">Cargando...</div>;
    if (!order) return <div className="p-8">Orden no encontrada</div>;

    const printHeaderName = localStorage.getItem('tenantId')?.toUpperCase() || 'MI EMPRESA';

    return (
        <>
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body { background-color: white !important; }
                .print-hidden { display: none !important; }
                .print-block { display: block !important; }
            }
        `}} />

        <div className="p-8 pb-20 max-w-7xl mx-auto w-full bg-slate-50 print:bg-white min-h-screen">
            {/* Cabecera Impresión (solo visible al imprimir) */}
            <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-6">
                <div className="flex justify-between">
                     <div>
                         <h1 className="text-3xl font-black text-slate-900">{printHeaderName}</h1>
                         <p className="text-slate-500 font-medium">Orden de Compra Autorizada</p>
                     </div>
                     <div className="text-right">
                         <h2 className="text-xl font-bold text-slate-900">ORDEN #{order.id.split('-')[0].toUpperCase()}</h2>
                         <p className="text-slate-500">Fecha: {new Date(order.orderDate).toLocaleDateString()}</p>
                         <p className="text-slate-500">Estatus: {order.status === 'RECEIVED' ? 'COMPLETADA' : order.status === 'PARTIAL' ? 'PARCIAL' : 'PENDIENTE'}</p>
                     </div>
                </div>
                <div className="mt-6 flex justify-between">
                     <div className="w-1/2 pr-4 border-r border-slate-200">
                         <p className="text-xs uppercase font-bold text-slate-400 mb-1">Proveedor</p>
                         <p className="font-bold text-slate-900">{order.supplier?.legalName}</p>
                         <p className="text-slate-500">{order.supplier?.rfc || 'Sin RFC'}</p>
                         <p className="text-slate-500">{order.supplier?.email || ''}</p>
                         <p className="text-slate-500">{order.supplier?.phone || ''}</p>
                     </div>
                </div>
            </div>

            {/* Cabecera Interactiva */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orden de Compra {order.id.split('-')[0].toUpperCase()}</h1>
                    <p className="text-gray-500">Proveedor: {order.supplier?.legalName}</p>
                </div>
                <div className="flex flex-wrap gap-2">                            
                    <button onClick={() => router.push('/purchases')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 flex items-center">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                    </button>
                    <button onClick={printPdf} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center shadow-md">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir PDF
                    </button>
                    {order.status === 'PENDING' && (
                        <>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-blue-600 rounded-xl font-bold hover:bg-blue-50 flex items-center transition-colors">
                            <PenTool className="w-4 h-4 mr-2" /> Editar
                        </button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center transition-colors">
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </button>
                        </>
                    )}
                    <button className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center shadow-md">
                        <Send className="w-4 h-4 mr-2" /> Enviar
                    </button>

                    {order.status !== 'RECEIVED' && (
                        <button onClick={() => setShowReceiveModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center shadow-md ml-2">
                            <CheckCircle className="w-4 h-4 mr-2" /> Recibir Mercancía
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl print:rounded-none border border-slate-200/60 print:border-none shadow-sm print:shadow-none overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100 print:hidden">
                    <h3 className="font-bold text-slate-900 text-lg">Detalles de la Orden</h3>
                </div>
                <div className="p-6 print:p-0">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 print:bg-white text-slate-500 print:text-black text-xs uppercase font-bold border-b border-slate-200 print:border-black">
                            <tr>
                                <th className="py-3 px-4 print:px-0">Producto</th>
                                <th className="py-3 px-4">SKU</th>
                                <th className="py-3 px-4 text-center">Recibido</th>
                                <th className="py-3 px-4 text-right">Costo Unit.</th>
                                <th className="py-3 px-4 text-right print:px-0">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {order.items?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-white">
                                    <td className="py-3 px-4 print:px-0 font-bold text-slate-800">
                                        {item.product?.name}
                                        {item.product?.hasSerials && (
                                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-bold uppercase print:border print:border-black">Lleva Series</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500">{item.product?.sku || '-'}</td>
                                    <td className="py-3 px-4 text-center font-bold">
                                        <span className={item.receivedQuantity >= item.quantity ? "text-emerald-600" : "text-amber-600"}>{item.receivedQuantity || 0}</span> / {item.quantity}
                                    </td>
                                    <td className="py-3 px-4 text-right">${item.unitCost.toFixed(2)}</td>
                                    <td className="py-3 px-4 print:px-0 text-right font-black text-slate-900">${item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 print:bg-white print:border-none flex justify-end">
                     <div className="text-right">
                         <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Total Orden</p>
                         <h2 className="text-3xl font-black text-indigo-900 print:text-black">${order.total?.toFixed(2) || '0.00'}</h2>
                     </div>
                 </div>
            </div>

            {order.serialNumbers && order.serialNumbers.length > 0 && (
                <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-sm overflow-hidden mb-6 print:hidden">
                    <div className="p-6 border-b border-indigo-50 bg-indigo-50/30">
                        <h3 className="font-bold text-indigo-900 text-lg flex items-center">
                            <PackageSearch className="w-5 h-5 mr-2 text-indigo-600" /> 
                            Números de Serie Recibidos Oportunamente
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            {order.items.filter((i: any) => i.product.hasSerials).map((item: any) => {
                                const serials = order.serialNumbers?.filter((s: any) => s.productId === item.product.id) || [];
                                if (serials.length === 0) return null;
                                return (
                                    <div key={item.id} className="border border-slate-100 rounded-xl p-4">
                                        <h4 className="font-bold text-slate-800 mb-3">{item.product.name} ({serials.length})</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {serials.map((serial: any) => (
                                                <div key={serial.id} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-mono flex items-center shadow-sm">
                                                    {serial.serial}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Cuentas Por Pagar / Historial de Abonos */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden mb-6 print:hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-indigo-600" /> 
                        Cuentas Por Pagar (Abonos)
                    </h3>
                    <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 flex items-center transition-colors text-sm">
                        <Plus className="w-4 h-4 mr-1" /> Registrar Abono
                    </button>
                </div>
                <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                    <div className="flex gap-12">
                         <div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Monto Total</p>
                             <p className="text-xl font-black text-slate-900">${order.total?.toFixed(2) || '0.00'}</p>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pagado (Abonos)</p>
                             <p className="text-xl font-black text-emerald-600">${order.amountPaid?.toFixed(2) || '0.00'}</p>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Pendiente</p>
                             <p className="text-xl font-black text-rose-600">${Math.max(0, order.total - (order.amountPaid || 0)).toFixed(2)}</p>
                         </div>
                    </div>
                    <div>
                         <span className={`px-3 py-1 text-xs font-bold uppercase rounded-lg tracking-wider ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : order.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                             {order.paymentStatus === 'PAID' ? 'LIQUIDADO' : order.paymentStatus === 'PARTIAL' ? 'ABONADO PARCIAL' : 'PENDIENTE PAGO'}
                         </span>
                    </div>
                </div>
                {order.supplierPayments && order.supplierPayments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-6">Fecha</th>
                                    <th className="py-3 px-6">Método</th>
                                    <th className="py-3 px-6 text-center">Referencia</th>
                                    <th className="py-3 px-6 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {order.supplierPayments.map((payment: any) => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="py-3 px-6 font-medium text-slate-600">
                                            {new Date(payment.paymentDate).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-6 font-medium text-slate-800">
                                            {payment.paymentMethod === '03' ? 'Transferencia' : payment.paymentMethod === '01' ? 'Efectivo' : payment.paymentMethod}
                                        </td>
                                        <td className="py-3 px-6 text-center text-slate-500 font-mono text-xs">
                                            {payment.reference || '-'}
                                        </td>
                                        <td className="py-3 px-6 text-right font-black text-slate-900">
                                            ${payment.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

            {/* Print Footer */}
            <div className="hidden print:block fixed bottom-0 left-0 w-full text-center text-xs text-slate-400 p-4 border-t border-slate-200">
                Documento generado electrónicamente por FacturaPro SaaS | {new Date().toLocaleString()}
            </div>

            {/* Modal Avanzado de Recepciones Parciales */}
            {showReceiveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center"><PackageSearch className="mr-2 text-indigo-600"/> Recibir Mercancía (Global o Parcial)</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Indique la cantidad exacta a recibir hoy para cada partida.</p>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
                            {order.items.map((item: any) => {
                                const pending = item.quantity - (item.receivedQuantity || 0);
                                if (pending <= 0) return null; // Ya recibido
                                const currentReceivingNow = receiveQuantities[item.id] || 0;

                                return (
                                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{item.product.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium">Faltantes: <span className="text-rose-600 font-black">{pending}</span></p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm font-bold text-slate-700">Recibir hoy:</label>
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    max={pending}
                                                    value={currentReceivingNow}
                                                    onChange={e => setReceiveQuantities({...receiveQuantities, [item.id]: parseInt(e.target.value)||0})}
                                                    className="w-24 px-3 py-2 border border-slate-200 rounded-lg font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                                                />
                                            </div>
                                        </div>

                                        {/* Series Logic */}
                                        {item.product.hasSerials && currentReceivingNow > 0 && (
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4">
                                                <label className="block text-amber-900 font-bold mb-2 text-sm">
                                                    Ingrese exactamente {currentReceivingNow} serie(s) para esta recepción
                                                </label>
                                                <textarea 
                                                    className="w-full font-mono text-sm p-3 border border-amber-200 rounded-lg min-h-[100px] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                                    placeholder={`Serie 1\nSerie 2\n...`}
                                                    value={serialsInput[item.id] || ''}
                                                    onChange={(e) => setSerialsInput({...serialsInput, [item.id]: e.target.value})}
                                                />
                                                {(()=>{
                                                    const lines = (serialsInput[item.id] || '').split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length;
                                                    return (
                                                        <p className={`text-xs mt-2 font-bold ${lines === currentReceivingNow ? 'text-emerald-600' : 'text-neutral-500'}`}>
                                                            Leídas: {lines} / {currentReceivingNow}
                                                        </p>
                                                    )
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button onClick={() => setShowReceiveModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleReceive} className="px-5 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition-colors">
                                Procesar Entradas (Kardex)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Abonos y Pago a Proveedores */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center"><Wallet className="mr-2 text-indigo-600 w-5 h-5"/> Registrar Abono a Proveedor</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Registra un pago parcial o total para esta orden de compra.</p>
                        </div>
                        
                        <div className="p-6 bg-slate-50/50 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Monto del Abono</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    placeholder="Ej. 1500.00"
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Método de Pago</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="03">Transferencia (03)</option>
                                        <option value="01">Efectivo (01)</option>
                                        <option value="04">Tarjeta C. (04)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Folio/Referencia</label>
                                    <input 
                                        type="text" 
                                        value={paymentReference}
                                        onChange={e => setPaymentReference(e.target.value)}
                                        placeholder="Ej. SPEI12345"
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Notas (Opcional)</label>
                                <textarea 
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handlePayment} className="px-5 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition-colors">
                                Guardar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

