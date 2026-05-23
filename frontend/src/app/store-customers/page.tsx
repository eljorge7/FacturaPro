"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Users, CheckCircle, Clock, Search, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export default function StoreCustomersPage() {
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/users/store-customers");
      setCustomers(res.data);
    } catch (e) {
      console.error("Error fetching customers", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, isActive: boolean) => {
    if (!confirm(`¿Estás seguro de que deseas ${isActive ? 'aprobar' : 'desactivar'} a este cliente?`)) return;
    try {
      await api.patch(`/users/${id}/activate`, { isActive });
      fetchCustomers();
    } catch (error) {
      alert("Error al actualizar estado.");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCustomers = filteredCustomers.filter(c => !c.isActive);
  const activeCustomers = filteredCustomers.filter(c => c.isActive);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" /> Clientes de la Tienda
          </h1>
          <p className="text-slate-500 mt-2">Administra las cuentas y solicitudes de acceso a la tienda.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* SECCIÓN DE SOLICITUDES PENDIENTES */}
          {pendingCustomers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-600" /> Solicitudes Pendientes de Aprobación
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingCustomers.map(customer => (
                  <div key={customer.id} className="bg-white border border-amber-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h3 className="font-bold text-slate-900">{customer.name}</h3>
                      <p className="text-sm text-slate-500">{customer.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{customer.phone}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button onClick={() => handleUpdateStatus(customer.id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl">
                        <UserCheck className="w-4 h-4" /> Aprobar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN DE CLIENTES ACTIVOS */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Clientes Activos ({activeCustomers.length})
            </h2>
            {activeCustomers.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
                No hay clientes activos aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
                {activeCustomers.map(customer => (
                  <div key={customer.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 line-clamp-1" title={customer.name}>{customer.name}</h3>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">ACTIVO</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{customer.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{customer.phone}</p>
                      <p className="text-[10px] text-slate-300 mt-3">Registro: {new Date(customer.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button onClick={() => handleUpdateStatus(customer.id, false)} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium rounded-xl gap-2 h-8 text-xs">
                      <XCircle className="w-3.5 h-3.5" /> Desactivar Acceso
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
