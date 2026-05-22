"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useParams } from "next/navigation";
import { Package, Clock, CheckCircle2, Truck, FileText, ChevronRight, User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface StoreOrder {
  id: string;
  totalAmount: number;
  status: string;
  isFacturado: boolean;
  createdAt: string;
  items: OrderItem[];
}

export default function StoreAccountPage() {
  const { user, loading: authLoading, token } = useAuth();
  const params = useParams();
  const slug = params?.slug as string || "default";

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && token) {
      fetchMyOrders();
    }
  }, [user, authLoading, token]);

  const fetchMyOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/public-store/${slug}/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());

      const profileRes = await fetch(`${API_URL}/users/my-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) setProfile(await profileRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (orderId: string) => {
    try {
      const res = await fetch(`${API_URL}/public-store/${slug}/order/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      } else {
        alert("No se pudo generar el link de pago.");
      }
    } catch (e) {
      alert("Error al intentar generar el pago.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Pendiente de Pago</span>;
      case 'PAID': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Pagado (En Preparación)</span>;
      case 'SHIPPED': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 w-fit"><Package className="w-3 h-3"/> Enviado</span>;
      case 'DELIVERED': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1 w-fit"><Truck className="w-3 h-3"/> Entregado</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold w-fit">{status}</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'CUSTOMER') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Acceso Denegado</h2>
        <p className="text-slate-500">Debes iniciar sesión como cliente para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Lado Izquierdo - Perfil */}
        <div className="md:w-1/3">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-24">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">{user.name}</h2>
            <p className="text-slate-500 text-sm mb-6">{user.email}</p>
            <div className="h-px bg-slate-100 w-full mb-6"></div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-4 py-3 rounded-xl font-bold text-sm">
                <Package className="w-5 h-5" /> Mis Pedidos
              </div>
              
              {profile && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-xs">Datos de Empresa</h4>
                  {profile.companyName ? (
                    <>
                      <div className="font-medium text-slate-700">{profile.companyName}</div>
                      <div className="text-slate-500 text-xs">RFC: {profile.rfc || 'No especificado'}</div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-xs italic">Sin datos de empresa</div>
                  )}

                  <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-xs mt-4">Dirección Predeterminada</h4>
                  {profile.street ? (
                    <div className="text-slate-600 text-xs leading-relaxed">
                      {profile.street} {profile.exteriorNum}<br/>
                      Col. {profile.neighborhood}<br/>
                      {profile.city}, {profile.state} CP: {profile.zipCode}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs italic">No has guardado una dirección</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho - Pedidos */}
        <div className="md:w-2/3">
          <h1 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
            Historial de Compras
          </h1>

          {orders.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aún no tienes pedidos</h3>
              <p className="text-slate-500 text-sm">Cuando realices tu primera compra, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          ORD-{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-sm text-slate-500 font-medium mb-1">Total Pagado</div>
                      <div className="text-xl font-black text-slate-900">
                        ${order.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Artículos</h4>
                    <div className="space-y-3">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded text-xs mt-0.5">{item.quantity}x</span>
                            <span className="font-medium text-slate-700">{item.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {order.isFacturado ? (
                      <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Factura Generada
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <FileText className="w-4 h-4 opacity-50" /> Factura Pendiente
                      </span>
                    )}

                    {order.status === 'PENDING' && (
                      <button onClick={() => handlePayNow(order.id)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                        Pagar Ahora <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
