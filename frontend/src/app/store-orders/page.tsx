"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ShoppingBag, FileText, CheckCircle2, Clock, User, Phone, MapPin, Receipt, X, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  satKey: string;
}

interface StoreOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: string;
  isFacturado: boolean;
  facturaId: string | null;
  items: OrderItem[];
  createdAt: string;
}

export default function StoreOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // CFDI Modal State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<StoreOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    rfc: "",
    razonSocial: "",
    regimen: "612",
    cp: "",
    usoCfdi: "G03"
  });

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${baseUrl}/store-management/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFacturar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForInvoice) return;
    try {
      setIsSubmitting(true);
      // Facturar orden de tienda - will use existing CFDI logic in FacturaPro
      const res = await fetch(`${baseUrl}/invoices/from-store/${selectedOrderForInvoice.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(invoiceForm)
      });
      
      if (!res.ok) {
        throw new Error("No se pudo generar la factura");
      }
      
      alert("Factura generada y enviada correctamente");
      setSelectedOrderForInvoice(null);
      fetchOrders();
    } catch (error) {
      alert("Error al facturar la orden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${baseUrl}/store-management/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (e) {
      alert("Error actualizando estatus");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">Pendiente de Pago</span>;
      case 'PAID': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Pagado (Preparar)</span>;
      case 'SHIPPED': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1"><Package className="w-3 h-3"/> Enviado</span>;
      case 'DELIVERED': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1"><Truck className="w-3 h-3"/> Entregado</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-indigo-600" /> Órdenes de la Tienda
        </h1>
        <p className="text-slate-500 mt-1">
          Aquí caen las compras generadas desde radiotecpro.com/store. Pásalas a FacturaPro con un solo clic.
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center animate-pulse text-slate-400">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
          <Receipt className="h-16 w-16 mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Aún no hay órdenes</h3>
          <p className="text-slate-500">Las compras de tus clientes aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between p-6 bg-slate-50 border-b border-slate-100 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                      ORD-{order.id.substring(0, 8).toUpperCase()}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString('es-MX')}</span>
                    {order.isFacturado ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> Facturada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" /> Pendiente de Factura
                      </span>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> <span className="font-semibold text-slate-900">{order.customerName}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400"/> {order.customerPhone}</div>
                    <div className="flex items-start gap-2 md:col-span-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/> {order.customerAddress}</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-start md:items-end justify-between">
                  <div className="text-2xl font-black text-slate-900 mb-4">
                    ${order.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {order.status === 'PAID' && (
                      <Button onClick={() => handleUpdateStatus(order.id, 'SHIPPED')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold w-full shadow-md gap-2 rounded-xl text-xs h-9">
                        <Package className="w-4 h-4" /> Marcar como Enviado
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full shadow-md gap-2 rounded-xl text-xs h-9">
                        <Truck className="w-4 h-4" /> Marcar como Entregado
                      </Button>
                    )}
                    {!order.isFacturado && (
                      <Button onClick={() => {
                        setSelectedOrderForInvoice(order);
                        setInvoiceForm({...invoiceForm, razonSocial: order.customerName});
                      }} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-bold w-full gap-2 rounded-xl text-xs h-9">
                        <FileText className="w-4 h-4" /> Timbrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Productos en la Orden</h4>
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                        <span className="font-medium text-slate-700">{item.title}</span>
                      </div>
                      <div className="font-bold text-slate-900">
                        ${(item.price * item.quantity).toLocaleString('es-MX')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Facturación */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Datos de Facturación</h3>
                <p className="text-sm text-slate-500">Completar para generar CFDI 4.0</p>
              </div>
              <button onClick={() => setSelectedOrderForInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleFacturar} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">RFC</label>
                <input required value={invoiceForm.rfc} onChange={e => setInvoiceForm({...invoiceForm, rfc: e.target.value.toUpperCase()})} placeholder="XAXX010101000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-purple-500 outline-none uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Razón Social</label>
                <input required value={invoiceForm.razonSocial} onChange={e => setInvoiceForm({...invoiceForm, razonSocial: e.target.value})} placeholder="Nombre completo o Empresa" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-purple-500 outline-none uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Régimen</label>
                  <select value={invoiceForm.regimen} onChange={e => setInvoiceForm({...invoiceForm, regimen: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-purple-500 outline-none">
                    <option value="601">601 - General Ley Personas Morales</option>
                    <option value="612">612 - Personas Físicas con Actividades Emp.</option>
                    <option value="626">626 - RESICO</option>
                    <option value="616">616 - Sin obligaciones fiscales</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">C.P.</label>
                  <input required value={invoiceForm.cp} onChange={e => setInvoiceForm({...invoiceForm, cp: e.target.value})} placeholder="00000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Uso de CFDI</label>
                <select value={invoiceForm.usoCfdi} onChange={e => setInvoiceForm({...invoiceForm, usoCfdi: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-purple-500 outline-none">
                  <option value="G03">G03 - Gastos en general</option>
                  <option value="G01">G01 - Adquisición de mercancías</option>
                  <option value="I08">I08 - Otra maquinaria y equipo</option>
                  <option value="S01">S01 - Sin efectos fiscales</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <Button type="button" onClick={() => setSelectedOrderForInvoice(null)} variant="outline" className="flex-1 rounded-xl h-12">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold">
                  {isSubmitting ? 'Timbrando...' : 'Generar CFDI 4.0'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
