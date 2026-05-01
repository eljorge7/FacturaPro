"use client";

import { CheckCircle2, Zap, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export default function PlansPage() {
  const { tenantId, token } = useAuth();
  const [activating, setActivating] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const handleActivate = async (tier: string, stamps: number) => {
    if (!tenantId || !token) return;

    setActivating(tier);
    try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/tenants/${tenantId}/upgrade-request`, {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
             tier: tier,
             isAnnual: isAnnual
             // Phone is now taken automatically from the Auth Context / Tenant Registration
          })
       });

       if (!res.ok) throw new Error('Error al solicitar plan');
       
       const data = await res.json();
       alert(`¡Solicitud enviada! Tu referencia es ${data.refNumber}.\n\nRevisa tu WhatsApp registrado para continuar con el pago.`);
       window.location.href = '/dashboard';
    } catch (e) {
       console.error(e);
       alert('Hubo un error contactando a la pasarela.');
       setActivating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] w-full font-sans pb-20">
      
      <div className="max-w-6xl mx-auto px-6 pt-16">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-tight">
            Potencia tu <span className="text-blue-600">Agencia</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium">
            Lleva la administración de tus propiedades al siguiente nivel añadiendo facturación electrónica nativa y atención al cliente impulsada por IA.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-800' : 'text-slate-400'}`}>Mensual</span>
            <div 
              className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${isAnnual ? 'bg-emerald-500' : 'bg-blue-100'}`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'bg-blue-600'}`}></div>
            </div>
            <span className={`text-sm font-bold ${isAnnual ? 'text-slate-800' : 'text-slate-400'}`}>
              Anual <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${isAnnual ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>2 Meses Gratis</span>
            </span>
          </div>
        </div>

        {/* FacturaPro Branding */}
        <div className="flex items-center gap-4 mb-8 pl-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-black text-2xl">
            F
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">FacturaPro</h2>
            <p className="text-slate-500 text-sm font-medium">Facturación Electrónica CFDI 4.0 con complementos de pago.</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Emprendedor */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col relative transition-transform hover:-translate-y-2 duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-1">Emprendedor</h3>
            
            <div className="mt-4 mb-6 flex flex-col gap-1 min-h-[90px]">
              {isAnnual && (
                <div className="inline-flex max-w-fit px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 mb-1 border border-emerald-100">
                  Ahorras $598 al año
                </div>
              )}
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">
                   {isAnnual ? '$249' : '$299'}
                </span>
                <span className="text-slate-400 font-bold mb-2">
                   / mes
                </span>
              </div>
              {isAnnual ? (
                <span className="text-slate-400 text-sm font-medium">Facturado anualmente por $2,988</span>
              ) : (
                <span className="text-transparent text-sm font-medium">.</span>
              )}
            </div>
            
            <div className="bg-slate-100/80 rounded-xl py-2 px-4 inline-flex items-center gap-2 mb-8 w-fit text-sm font-bold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              50 Timbres / Créditos al mes
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                50 facturas mensuales
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                Catálogo de clientes
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                Reporte básico
              </li>
            </ul>

            <button onClick={() => handleActivate('EMPRENDEDOR', 50)} disabled={activating !== null} className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex flex-row items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-auto">
              {activating === 'EMPRENDEDOR' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar Módulo'}
              {activating !== 'EMPRENDEDOR' && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* PyME (Most Popular) */}
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-blue-900/10 border-2 border-blue-600 flex flex-col relative transition-transform hover:-translate-y-2 duration-300 translate-y-[-16px]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/30">
              MÁS POPULAR
            </div>
            <h3 className="text-xl font-black text-blue-700 mb-1">PyME</h3>
            
            <div className="mt-4 mb-6 flex flex-col gap-1 min-h-[90px]">
              {isAnnual && (
                <div className="inline-flex max-w-fit px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 mb-1 border border-emerald-100">
                  Ahorras $1,398 al año
                </div>
              )}
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">
                   {isAnnual ? '$582' : '$699'}
                </span>
                <span className="text-slate-400 font-bold mb-2">
                   / mes
                </span>
              </div>
              {isAnnual ? (
                <span className="text-slate-400 text-sm font-medium">Facturado anualmente por $6,988</span>
              ) : (
                <span className="text-transparent text-sm font-medium">.</span>
              )}
            </div>
            
            <div className="bg-slate-100/80 rounded-xl py-2 px-4 inline-flex items-center gap-2 mb-8 w-fit text-sm font-bold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              300 Timbres / Créditos al mes
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                300 facturas mensuales
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                Módulo Web de Gastos
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                Conciliación contable
              </li>
            </ul>

            <button onClick={() => handleActivate('PYME', 300)} disabled={activating !== null} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-row items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 mt-auto">
              {activating === 'PYME' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar Módulo'}
              {activating !== 'PYME' && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Corporativo */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col relative transition-transform hover:-translate-y-2 duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-1">Corporativo</h3>
            
            <div className="mt-4 mb-6 flex flex-col gap-1 min-h-[90px]">
              {isAnnual && (
                <div className="inline-flex max-w-fit px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 mb-1 border border-emerald-100">
                  Ahorras $2,998 al año
                </div>
              )}
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black text-slate-800 tracking-tighter">
                   {isAnnual ? '$1,249' : '$1,499'}
                </span>
                <span className="text-slate-400 font-bold mb-2">
                   / mes
                </span>
              </div>
              {isAnnual ? (
                <span className="text-slate-400 text-sm font-medium">Facturado anualmente por $14,988</span>
              ) : (
                <span className="text-transparent text-sm font-medium">.</span>
              )}
            </div>
            
            <div className="bg-slate-100/80 rounded-xl py-2 px-4 inline-flex items-center gap-2 mb-8 w-fit text-sm font-bold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Timbres Ilimitados
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                Facturación sin límites
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                API de Automatización
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                Analíticas Avanzadas
              </li>
            </ul>

            <button onClick={() => handleActivate('CORPORATIVO', 9999)} disabled={activating !== null} className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex flex-row items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-auto">
              {activating === 'CORPORATIVO' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar Módulo'}
              {activating !== 'CORPORATIVO' && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
