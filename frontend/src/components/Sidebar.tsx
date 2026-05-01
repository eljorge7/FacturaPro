"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FileBox,
  Users,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Package,
  Wallet,
  Container,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  LogOut,
  User as UserIcon,
  Store,
  ShoppingCart,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  Landmark,
  Treasury,
  ChevronDown,
  Banknote,
  Truck
} from "lucide-react";
import { useAuth } from "./AuthProvider";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Member Switcher state
  const [memberships, setMemberships] = useState<any[]>([]);
  const [primaryTenant, setPrimaryTenant] = useState<any>(null);
  const [isAgencyAdmin, setIsAgencyAdmin] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const { user, logout, token, tenantId, switchActiveTenant } = useAuth();
  
  useEffect(() => {
     if (!user || !token) return;
     const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
     
     // Fetch Tier and Stats
     if (!tier) {
        fetch(`${baseUrl}/invoices/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => {
              setTier(data.subscriptionTier);
              if (data.tenantLogoUrl) setLogoUrl(`${baseUrl}${data.tenantLogoUrl}`);
          }).catch(e => console.error(e));
     }

         // Fetch Multi-Tenant Memberships
     fetch(`${baseUrl}/auth/memberships`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
            if (data.agencyMemberships && data.agencyMemberships.length > 0) {
               setMemberships(data.agencyMemberships);
               setPrimaryTenant(data.primaryTenant);
               setIsAgencyAdmin(!!data.isAgencyAdmin);
            }
        }).catch(e => console.error(e));
  }, [user, token, tier]);

  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/portal')) return null;

  let links = [
    { name: "Resumen", href: "/", icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    
    { isDivider: true, name: "VENTAS Y COBRANZA" } as any,
    { name: "Facturas", href: "/invoices", icon: <FileText className="w-5 h-5 shrink-0 text-blue-400" /> },
    { name: "Cuentas por Cobrar", href: "/ar", icon: <TrendingUp className="w-5 h-5 shrink-0 text-emerald-400" /> },
    { name: "Mostrador (POS)", href: "/pos", icon: <Store className="w-5 h-5 shrink-0 text-amber-400" /> },
    { name: "Cotizaciones", href: "/quotes", icon: <FileBox className="w-5 h-5 shrink-0" /> },
    { name: "Clientes", href: "/customers", icon: <Users className="w-5 h-5 shrink-0" /> },
    
    // Si el usuario pertenece a una Agencia (y es Admin/Dueño), mostrar portal de Despachos exclusivo
    ...(isAgencyAdmin ? [
       { isDivider: true, name: "AGENCIA CONTABLE" } as any,
       { name: "Portal Despacho", href: "/agency/dashboard", icon: <Container className="w-5 h-5 shrink-0 text-indigo-400" /> },
    ] : []),
    
    { isDivider: true, name: "COMPRAS Y EGRESOS" } as any,
    { name: "Compras", href: "/purchases", icon: <ShoppingCart className="w-5 h-5 shrink-0 text-indigo-400" /> },
    { name: "Cuentas por Pagar", href: "/ap", icon: <TrendingDown className="w-5 h-5 shrink-0 text-rose-400" /> },
    { name: "Gastos (PyME)", href: "/expenses", icon: <Wallet className="w-5 h-5 shrink-0" /> },
    { name: "Proveedores", href: "/suppliers", icon: <Container className="w-5 h-5 shrink-0" /> },
    { name: "Bóveda SAT", href: "/boveda-sat", icon: <Landmark className="w-5 h-5 shrink-0 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" /> },

    { isDivider: true, name: "TESORERÍA" } as any,
    { name: "Bancos (Conciliación)", href: "/banking", icon: <Banknote className="w-5 h-5 shrink-0 text-amber-300 drop-shadow-sm" /> },

    { isDivider: true, name: "OPERATIVO" } as any,
    { name: "Cubo Inventarios", href: "/inventory/dashboard", icon: <TrendingDown className="w-5 h-5 shrink-0 text-emerald-300 drop-shadow-sm" /> },
    { name: "Catálogo / Productos", href: "/products", icon: <Package className="w-5 h-5 shrink-0" /> },
    { name: "WMS (Andén Recepción)", href: "/warehouse", icon: <Container className="w-5 h-5 shrink-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> },
    { name: "Logística Y Traspasos", href: "/transfers", icon: <Truck className="w-5 h-5 shrink-0 text-blue-400" /> },
    { name: "Conteos (Auditorías)", href: "/inventory/audit", icon: <ClipboardList className="w-5 h-5 shrink-0 text-amber-500" /> },

    { isDivider: true, name: "RECURSOS HUMANOS" } as any,
    { name: "Directorio de Personal", href: "/settings/team", icon: <Users className="w-5 h-5 shrink-0 text-blue-400" /> },
    { name: "Asistencias / Faltas", href: "/admin/hr/attendance", icon: <ClipboardList className="w-5 h-5 shrink-0 text-orange-400" /> },
    { name: "Bandeja Vacaciones", href: "/admin/hr/time-off", icon: <Users className="w-5 h-5 shrink-0 text-teal-400" /> },
    { name: "Nóminas (ERP)", href: "/admin/hr/payroll", icon: <Landmark className="w-5 h-5 shrink-0 text-emerald-400" /> },

    { isDivider: true, name: "CONFIGURACIÓN" } as any,
    { name: "Roles de Seguridad (RBAC)", href: "/settings/roles", icon: <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500 drop-shadow-sm" /> },
    { name: "Configurar Sucursales", href: "/settings/warehouses", icon: <Settings className="w-5 h-5 shrink-0" /> },
  ];

  // RBAC: Roles Especializados
  if (user?.role === 'CASHIER') {
     links = [
       { name: "Mostrador (POS)", href: "/pos", icon: <Store className="w-5 h-5 shrink-0 text-emerald-400" /> }
     ];
  } else if (user?.role === 'WAREHOUSE') {
     links = [
       { isDivider: true, name: "OPERATIVO" } as any,
       { name: "WMS (Andén Recepción)", href: "/warehouse", icon: <Container className="w-5 h-5 shrink-0 text-amber-500" /> },
       { name: "Catálogo / Productos", href: "/products", icon: <Package className="w-5 h-5 shrink-0" /> },
       { name: "Mostrador (POS)", href: "/pos", icon: <Store className="w-5 h-5 shrink-0 text-emerald-400" /> }
     ];
  }

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1e293b] text-slate-300 flex flex-col h-screen border-r border-[#0f172a] font-sans shrink-0 transition-all duration-300 relative print:hidden`}>
      
      {/* Collapse Toggle */}
      <button 
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -right-3 top-6 bg-slate-700 text-white rounded-full p-1 shadow-md hover:bg-blue-600 transition-colors z-50 border border-slate-600"
      >
         {isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
      </button>

      {/* Brand Header */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} border-b border-slate-700/50 bg-[#0f172a] overflow-visible shrink-0 relative`}>
         {isCollapsed && (
            logoUrl ? (
               <img src={logoUrl} alt="Logo" className="max-h-8 max-w-[40px] object-contain shrink-0" />
            ) : (
               <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            )
         )}
         {!isCollapsed && (
           <div className="flex items-center ml-2 cursor-pointer hover:bg-slate-800/50 p-2 flex-1 rounded-lg transition-colors border border-transparent hover:border-slate-700" onClick={() => memberships.length > 0 && setShowSwitcher(!showSwitcher)}>
             <div className="flex items-center flex-1">
               {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-8 max-w-[100px] object-contain shrink-0" />
               ) : (
                 <>
                   <span className="font-bold text-white text-lg tracking-tight">FacturaPro</span>
                   <span className="ml-2 text-[10px] font-bold text-emerald-900 bg-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider">CFDI</span>
                 </>
               )}
             </div>
             {memberships.length > 0 && (
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
             )}
           </div>
         )}

        {/* WORKSPACE SWITCHER DROPDOWN */}
        {showSwitcher && !isCollapsed && memberships.length > 0 && (
           <div className="absolute top-14 left-4 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Despacho Contable</p>
                 <p className="text-xs font-semibold text-slate-700 mt-0.5">Mis Clientes</p>
              </div>
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                 {/* Mi Cuenta Principal */}
                 <button 
                    onClick={() => {
                       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
                       fetch(`${baseUrl}/auth/switch-tenant`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ targetTenantId: primaryTenant.id })
                       }).then(r => r.json()).then(data => switchActiveTenant(data.token, data.tenantId));
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-all ${tenantId === primaryTenant?.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                 >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{primaryTenant?.name || "Cuenta Principal"}</span>
                    {tenantId === primaryTenant?.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto shadow-sm"></div>}
                 </button>
                 
                 <div className="h-px bg-slate-100 my-1 mx-2"></div>

                 {memberships.map((m: any) => (
                    <button 
                       key={m.id}
                       onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
                          fetch(`${baseUrl}/auth/switch-tenant`, {
                             method: 'POST',
                             headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                             body: JSON.stringify({ targetTenantId: m.id })
                          }).then(r => r.json()).then(data => switchActiveTenant(data.token, data.tenantId));
                       }}
                       className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 transition-all ${tenantId === m.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                       <Container className="w-4 h-4 text-slate-400" />
                       <span className="truncate" title={m.name}>{m.name}</span>
                       {tenantId === m.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-auto shadow-sm"></div>}
                    </button>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* Main Apps Navigation */}
      <div className={`flex-1 py-6 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'} space-y-1`}>
        {!isCollapsed && <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Módulos</p>}
        
        {links.map((link, idx) => {
          if (link.isDivider) {
              return !isCollapsed ? (
                  <div key={`div-${idx}`} className="px-3 pt-4 pb-1 text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{link.name}</div>
              ) : (
                  <div key={`div-${idx}`} className="h-px bg-slate-700/50 my-2 mx-2"></div>
              );
          }

          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-[#2563eb] text-white shadow-lg shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-slate-100 text-slate-300"
              }`}
            >
              <div className={isActive ? "text-white" : ""}>{link.icon}</div>
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer / Settings Navigation */}
      {user?.role !== 'CASHIER' && (
        <div className={`border-t border-slate-700/50 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <Link 
            href="/settings/import"
            title={isCollapsed ? "Migración" : undefined}
            className={`flex items-center mb-2 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith("/settings/import")
                ? "bg-slate-700 text-white" 
                : "hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <UploadCloud className="w-5 h-5 shrink-0 text-indigo-400" />
            {!isCollapsed && <span>Migración Masiva</span>}
          </Link>
          <Link 
            href="/settings"
            title={isCollapsed ? "Configuración" : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all ${
              pathname === "/settings"
                ? "bg-slate-700 text-white" 
                : "hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Configuración</span>}
          </Link>
        </div>
      )}

      {/* User Profile & Logout */}
      {user && (
        <div className={`p-4 border-t border-slate-700/50 bg-[#0f172a] ${isCollapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between'}`}>
           {!isCollapsed && (
             <Link href="/profile" className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden">
                   {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                   ) : (
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                   )}
                </div>
                <div className="flex flex-col overflow-hidden">
                   <span className="text-sm font-bold text-white truncate max-w-[120px] group-hover:text-emerald-400 transition-colors">{user.name}</span>
                   <span className="flex flex-row items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 truncate uppercase tracking-wider">
                         {user.role === 'OWNER' ? 'Dueño' : user.role === 'CASHIER' ? 'Cajero' : 'Operador'}
                      </span>
                      {tier && (
                         <>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${tier === 'CORPORATIVO' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>{tier}</span>
                         </>
                      )}
                   </span>
                </div>
             </Link>
           )}
           
           <button 
             onClick={logout}
             title="Cerrar Sesión"
             className={`p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ${isCollapsed ? 'w-full flex justify-center' : ''}`}
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      )}
    </div>
  );
}
