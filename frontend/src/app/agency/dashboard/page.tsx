"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Users, Landmark, Activity, CreditCard, Play, Settings, Wallet, ArrowRight, Store, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InviteStaffModal from "@/components/modals/InviteStaffModal";
import AssignClientsModal from "@/components/modals/AssignClientsModal";
import AgencyKanban from "@/components/agency/AgencyKanban";
import AgencyMetrics from "@/components/agency/AgencyMetrics";

export default function AgencyDashboard() {
  const { token, tenantId, switchActiveTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [primaryTenant, setPrimaryTenant] = useState<any>(null);
  const [agencyDetails, setAgencyDetails] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'resumen' | 'clientes' | 'equipo' | 'tareas'>('resumen');
  const [isAutoBilling, setIsAutoBilling] = useState(false);
  const router = useRouter();

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
    try {
      const res = await fetch(`${baseUrl}/auth/memberships`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMemberships(data.agencyMemberships || []);
      setPrimaryTenant(data.primaryTenant);
      setAgencyDetails(data.agencyDetails);

      if (data.isAgencyAdmin) {
         fetch(`${baseUrl}/auth/agency/team`, { headers: { 'Authorization': `Bearer ${token}` }})
            .then(r => r.json())
            .then(teamData => setTeam(teamData || []))
            .catch(console.error);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSwitchTenant = async (targetId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
    try {
      const res = await fetch(`${baseUrl}/auth/switch-tenant`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTenantId: targetId })
      });
      if (res.ok) {
        const data = await res.json();
        switchActiveTenant(data.token, data.tenantId);
      }
    } catch(e) {}
  };

  const handleAutoBill = async () => {
    if (!confirm("¿Generar facturas Borrador de Igualas para todos los clientes del Despacho?")) return;
    
    setIsAutoBilling(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
    try {
      const res = await fetch(`${baseUrl}/auth/agency/auto-bill`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
         alert(`¡Éxito! Se generaron ${data.count} facturas en Borrador. Revisalas en tu módulo de Facturas.`);
         // Make sure we are viewing the agency tenant, then route to invoices
         if (tenantId !== primaryTenant?.id) {
             await handleSwitchTenant(primaryTenant?.id);
         }
         router.push('/invoices');
      } else {
         alert(data.message || "Error al auto-facturar");
      }
    } catch (e) {
      alert("Falla de red al generar igualas.");
    }
    setIsAutoBilling(false);
  };

  if (loading) return <div className="p-8">Cargando portafolio...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Portal de Despacho</h1>
           </div>
           <p className="text-slate-500 font-medium">Panel de control maestro para firmas contables y agencias.</p>
        </div>
      </div>


      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'resumen'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4 inline-block mr-2" />
            Resumen Ejecutivo
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'clientes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Store className="w-4 h-4 inline-block mr-2" />
            Directorio de Clientes
          </button>
          <button
            onClick={() => setActiveTab('equipo')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'equipo'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Mi Equipo (Staff)
          </button>
          <button
            onClick={() => setActiveTab('tareas')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tareas'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4 inline-block mr-2" />
            Operación (Kanban)
          </button>
        </nav>
      </div>

      {activeTab === 'resumen' && (
         <AgencyMetrics token={token || ""} />
      )}

      {activeTab === 'clientes' && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-700 text-sm">Cartera de Clientes ({memberships.length} / {agencyDetails?.maxTenants || 50})</h2>
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleAutoBill}
                  disabled={isAutoBilling || memberships.length === 0}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 text-xs font-black py-1.5 px-4 rounded-lg shadow-sm transition-all shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
               >
                  {isAutoBilling ? <Activity className="w-4 h-4 animate-spin" /> : <span>⚡</span>} 
                  {isAutoBilling ? "Generando..." : "Piloto Automático: Cobro Igualas"}
               </button>
               <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors">
                  + Nuevo Cliente
               </button>
            </div>
         </div>
         <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
               <tr>
                  <th className="px-6 py-4">Empresa (Tenant)</th>
                  <th className="px-6 py-4">Suscripción</th>
                  <th className="px-6 py-4">Estatus Fiscal</th>
                  <th className="px-6 py-4 text-right">Acción Domicilio</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {memberships.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">ID: {m.id.split('-')[0]}</div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                           {m.subscriptionTier || 'BÁSICO'}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                           <span className="text-xs font-semibold text-slate-600">Al día (FIEL ok)</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        {tenantId === m.id ? (
                           <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">Actualmente Operando</span>
                        ) : (
                           <button 
                             onClick={() => handleSwitchTenant(m.id)}
                             className="text-xs font-bold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-end w-full gap-2 shadow-sm"
                           >
                             Ingresar a empresa <ArrowRight className="w-3.5 h-3.5" />
                           </button>
                        )}
                     </td>
                  </tr>
               ))}
               {memberships.length === 0 && (
                  <tr>
                     <td colSpan={4} className="text-center py-12 text-slate-400">
                        <Wallet className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                        <p className="font-medium text-slate-500">Aún no tienes clientes asignados a tu cuenta de Despacho.</p>
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
      )}

      {activeTab === 'equipo' && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h2 className="font-bold text-slate-700 text-sm">Contadores y Auditores del Despacho</h2>
               <button onClick={() => setIsInviteModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors">
                  + Invitar Contador
               </button>
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                     <th className="px-6 py-4">Empleado</th>
                     <th className="px-6 py-4">Rango</th>
                     <th className="px-6 py-4">Ingreso</th>
                     <th className="px-6 py-4 text-right">Permisos</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {team.map((t: any) => (
                     <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-800">{t.user.name}</div>
                           <div className="text-xs text-slate-400 mt-0.5">{t.user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${t.role === 'OWNER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {t.role}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-slate-500 text-xs">{new Date(t.joinedAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => setSelectedStaffForAssign(t)} className="text-xs font-bold px-4 py-2 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                              Asignar Clientes
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {activeTab === 'tareas' && (
         <AgencyKanban token={token} memberships={memberships} staff={team} />
      )}

      <InviteStaffModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        token={token} 
        onInvite={fetchData} 
      />

      <AssignClientsModal
        isOpen={!!selectedStaffForAssign}
        onClose={() => setSelectedStaffForAssign(null)}
        token={token}
        onAssign={fetchData}
        staffMember={selectedStaffForAssign}
        allClients={memberships}
      />
    </div>
  );
}
