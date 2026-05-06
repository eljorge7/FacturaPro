"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, ArrowDownRight, FileText, CheckCircle2, TrendingUp, Download, XCircle, CreditCard, Banknote, History, ShieldCheck, Settings, X, Plus, GripHorizontal } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";

// ==========================================
// WIDGET LIBRARY MAP
// ==========================================

const ALL_WIDGETS = [
  { id: 'MTD', title: 'Ingresos MTD', span: 'col-span-1' },
  { id: 'PROFIT', title: 'Utilidad Neta (P&L)', span: 'col-span-1' },
  { id: 'EXPENSES', title: 'Egresos / Gastos', span: 'col-span-1' },
  { id: 'HISTORICAL', title: 'Total Facturado', span: 'col-span-1' },
  { id: 'EMISSION', title: 'Tasa de Efectividad', span: 'col-span-1' },
  { id: 'CHART', title: 'Evolución de Ingresos', span: 'lg:col-span-2' },
  { id: 'RECENT', title: 'Actividad Reciente', span: 'lg:col-span-1' }
];

export default function Dashboard() {
  const router = useRouter();
  const { tenantId: activeTenantId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ====== MODULAR DASHBOARD STATES ======
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<string[]>(['MTD', 'PROFIT', 'EXPENSES', 'HISTORICAL', 'EMISSION', 'CHART', 'RECENT']);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    // Load saved layout
    if (activeTenantId && typeof window !== 'undefined') {
       const saved = localStorage.getItem(`facturapro_layout_${activeTenantId}`);
       if (saved) {
         try { setLayout(JSON.parse(saved)); } catch(e) {}
       }
    }
    fetchStats();
  }, [activeTenantId]);

  const saveLayout = (newLayout: string[]) => {
    setLayout(newLayout);
    if (activeTenantId) {
      localStorage.setItem(`facturapro_layout_${activeTenantId}`, JSON.stringify(newLayout));
    }
  };

  const fetchStats = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/invoices/stats`, {
        cache: 'no-store',
        headers: { 'x-tenant-id': activeTenantId || 'demo-tenant' }
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
           <p className="text-slate-500 text-sm font-medium animate-pulse">Analizando finanzas...</p>
        </div>
      </div>
    );
  }

  const thisMonth = stats?.thisMonthRevenue || 0;
  const lastMonth = stats?.lastMonthRevenue || 0;
  const percentChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  const isPositive = percentChange >= 0;
  const totalExpenses = stats?.totalExpenses || 0;
  const thisMonthExpenses = stats?.thisMonthExpenses || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const netProfit = totalRevenue - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // ====== DND HANDLERS ======
  const onDragStart = (e: any, index: number) => {
    setDraggedIdx(index);
    // e.dataTransfer.effectAllowed = "move";
  };
  
  const onDragOver = (e: any, index: number) => {
    e.preventDefault(); 
  };

  const onDrop = (e: any, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newLayout = [...layout];
    const draggedItem = newLayout[draggedIdx];
    newLayout.splice(draggedIdx, 1);
    newLayout.splice(index, 0, draggedItem);
    
    saveLayout(newLayout);
    setDraggedIdx(null);
  };

  const removeWidget = (id: string) => {
    saveLayout(layout.filter(l => l !== id));
  };

  const addWidget = (id: string) => {
    saveLayout([...layout, id]);
    setIsLibraryOpen(false);
  };

  const missingWidgets = ALL_WIDGETS.filter(w => !layout.includes(w.id));

  // ====== WIDGET RENDERER ======
  const renderWidgetContent = (id: string) => {
    switch(id) {
      case 'MTD': return (
        <div className="flex justify-between items-start h-full">
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ingresos MTD</p>
             <h3 className="text-3xl font-black text-slate-900 mt-2">${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
             <div className="mt-4 flex items-center text-sm font-medium">
                <span className={`flex items-center ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                   {Math.abs(percentChange).toFixed(1)}%
                </span>
                <span className="text-slate-400 ml-2">vs mes anterior</span>
             </div>
           </div>
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
        </div>
      );
      case 'PROFIT': return (
        <div className="flex justify-between items-start h-full">
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Utilidad Neta (P&L)</p>
             <h3 className="text-3xl font-black text-slate-900 mt-2">${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
             <div className="mt-4 flex items-center text-sm font-medium">
                <span className={`flex items-center ${netProfitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{netProfitMargin.toFixed(1)}% Margen</span>
                <span className="text-slate-400 ml-2">histórico</span>
             </div>
           </div>
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Banknote className="h-6 w-6" /></div>
        </div>
      );
      case 'EXPENSES': return (
        <div className="flex justify-between items-start h-full">
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Egresos / Gastos</p>
             <h3 className="text-3xl font-black text-slate-900 mt-2">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
             <div className="mt-4 flex items-center text-sm font-medium text-slate-500 gap-2">
                <span>Este mes: </span><span className="font-bold text-rose-600">${thisMonthExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
             </div>
           </div>
           <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownRight className="h-6 w-6" /></div>
        </div>
      );
      case 'HISTORICAL': return (
        <div className="flex justify-between items-start h-full">
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Facturado</p>
             <h3 className="text-3xl font-black text-slate-900 mt-2">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
             <div className="mt-4 flex items-center text-sm font-medium text-slate-500">Histórico global (Cuentas Anuales)</div>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Banknote className="h-6 w-6" /></div>
        </div>
      );
      case 'EMISSION': return (
        <div className="flex justify-between items-start h-full">
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tasa de Efectividad</p>
             <h3 className="text-3xl font-black text-slate-900 mt-2">{stats?.totalInvoices === 0 ? 0 : Math.round(((stats.totalInvoices - stats.cancelledInvoices) / stats.totalInvoices) * 100)}%</h3>
             <div className="mt-4 flex items-center text-sm font-medium text-slate-500 gap-2">
                <span>{stats?.totalInvoices || 0} Emitidas</span><span>•</span><span className="text-rose-500">{stats?.cancelledInvoices || 0} Canceladas</span>
             </div>
           </div>
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><CheckCircle2 className="h-6 w-6" /></div>
        </div>
      );
      case 'CHART': return (
        <div className="flex flex-col h-full">
           <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className="font-black text-slate-900 text-lg">Evolución de Ingresos</h3>
              <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                 <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Contado</div>
                 <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-300"></span> Crédito</div>
              </div>
           </div>
           <div className="flex-1 min-h-[300px]">
              {stats?.chartData && stats.chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.chartData} barSize={40} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                     <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Monto']} />
                     <Bar dataKey="efectivo" stackId="a" fill="#6366f1" radius={[0, 0, 8, 8]} />
                     <Bar dataKey="credito" stackId="a" fill="#7dd3fc" radius={[8, 8, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-medium">Sin datos para graficar</div>
              )}
           </div>
        </div>
      );
      case 'RECENT': return (
        <div className="flex flex-col h-full">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><History className="h-5 w-5" /></div>
              <h3 className="font-bold text-slate-900 text-lg">Actividad Reciente</h3>
           </div>
           <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar max-h-[300px]">
              {(!stats?.recentInvoices || stats.recentInvoices.length === 0) ? (
                 <div className="text-center text-slate-500 text-sm py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Sin facturas emitidas.</div>
              ) : (
                 stats.recentInvoices.map((inv: any) => (
                    <div key={inv.id} onClick={() => router.push(`/invoices?targetId=${inv.id}`)} className="group p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all flex justify-between items-center bg-white cursor-pointer shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckCircle2 className="h-5 w-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight max-w-[150px] truncate" title={inv.customer?.legalName}>{inv.customer?.legalName || 'Consumidor Final'}</h4>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{inv.invoiceNumber}</span>
                            <span>•</span><span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status === 'PAID' ? 'PAGADA' : inv.status}</p>
                      </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <>
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 ${isEditMode ? 'bg-slate-50/50 p-4 rounded-3xl border-2 border-dashed border-slate-200' : ''}`}>
      
      {/* HEADER TÁCTICO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-900 to-black p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 z-20">
           <button 
             onClick={() => setIsEditMode(!isEditMode)} 
             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isEditMode ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/50' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10'}`}
           >
             {isEditMode ? <CheckCircle2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
             {isEditMode ? "Guardar Diseño" : "Configurar Tablero"}
           </button>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenido a <span className="text-emerald-400">{stats?.tenantTradeName || 'FacturaPro'}</span></h1>
          <p className="text-indigo-200 mt-2 max-w-lg">Visión global de tus ingresos y ciclo de facturación. Mantén el ritmo, estás haciendo un excelente trabajo.</p>
        </div>
      </div>

      {/* REJILLA DINÁMICA DE WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 px-2 lg:px-6">
         {layout.map((id, index) => {
            const definition = ALL_WIDGETS.find(w => w.id === id);
            if (!definition) return null;
            
            return (
              <div 
                key={id}
                draggable={isEditMode}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                className={`
                  bg-white/40 dark:bg-slate-900/50 backdrop-blur-3xl rounded-3xl border border-white/80 dark:border-slate-700/50 transition-all overflow-hidden flex flex-col relative
                  ${definition.span} 
                  ${isEditMode ? 'border-2 border-indigo-400 border-dashed shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-grab active:cursor-grabbing hover:scale-[1.02]' : 'shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 duration-300'}
                `}
              >
                 {isEditMode && (
                    <div className="absolute top-0 left-0 right-0 h-8 bg-indigo-50 flex items-center justify-between px-3 z-10 border-b border-indigo-100">
                       <div className="flex items-center gap-2 text-indigo-400">
                         <GripHorizontal className="w-4 h-4" />
                         <span className="text-[10px] font-bold tracking-wider uppercase">{definition.title}</span>
                       </div>
                       <button onClick={() => removeWidget(id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-100 p-1 rounded-full transition-colors">
                          <X className="w-4 h-4" />
                       </button>
                    </div>
                 )}
                 <div className={`flex-1 p-6 ${isEditMode ? 'pt-10 opacity-60 pointer-events-none' : ''}`}>
                    {renderWidgetContent(id)}
                 </div>
              </div>
            );
         })}

         {/* BOTÓN ADD WIDGET EN MODO EDICIÓN */}
         {isEditMode && (
           <button 
             onClick={() => setIsLibraryOpen(true)}
             className="min-h-[150px] col-span-1 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all gap-2"
           >
             <Plus className="w-8 h-8" />
             <span className="text-sm font-bold tracking-wide">Añadir Widget</span>
           </button>
         )}
      </div>
    </div>
    
    {!stats?.tenantLogoUrl && !isEditMode && <OnboardingWizard tenantId={activeTenantId || 'demo-tenant'} initialLegalName={stats?.tenantTradeName || ''} />}

    {/* LIBRERÍA DE WIDGETS */}
    {isLibraryOpen && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
               <h3 className="font-bold text-lg text-slate-800">Catálogo de Widgets</h3>
               <button onClick={() => setIsLibraryOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
               {missingWidgets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                     <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                     <p className="font-medium">Ya tienes todos los widgets activos en tu tablero.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-3">
                     {missingWidgets.map(w => (
                        <button key={w.id} onClick={() => addWidget(w.id)} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group">
                           <div>
                              <p className="font-bold text-slate-800 group-hover:text-indigo-700">{w.title}</p>
                              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{w.span === 'col-span-1' ? 'Tamaño Normal' : 'Tamaño Extendido'}</p>
                           </div>
                           <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                             <Plus className="w-5 h-5" />
                           </div>
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
    )}
    </>
  );
}
