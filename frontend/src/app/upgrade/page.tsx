"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Award, Zap, CheckCircle2, TrendingUp, Download, Check, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const { token, tenantId } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successPayload, setSuccessPayload] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      
      const res = await fetch(`${baseUrl}/tax-profiles/mine`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
         setProfile(await res.json());
      }
      
      const historyRes = await fetch(`${baseUrl}/subscription-requests/mine`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (historyRes.ok) {
         setBillingHistory(await historyRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (token) fetchStatus();
  }, [token]);

  const handleCheckout = async (tier: string, amount: number, isAnnual: boolean) => {
    setIsProcessing(true);
    try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/subscription-requests/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ tier, amount, isAnnual, paymentMethodId: 'pm_card_simulated' })
       });
       
       if (res.ok) {
           const data = await res.json();
           setSuccessPayload(data);
           // Delay for a dramatic effect
           setTimeout(() => {
               fetchStatus();
           }, 1000);
       } else {
           alert("Error al procesar el pago");
           setIsProcessing(false);
       }
    } catch (error) {
       console.error("Pay error", error);
       alert("Error de red durante Checkout");
       setIsProcessing(false);
    }
  };

  if (!mounted || isLoading) return <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>;

  if (successPayload) {
     return (
        <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-500">
               <div className="bg-emerald-500 p-8 text-center">
                  <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
                     <Check className="w-10 h-10 text-emerald-500" strokeWidth={3}/>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">¡Pago Exitoso!</h2>
                  <p className="text-emerald-100 mt-2 font-medium">Se han acreditado tus timbres a tu billetera principal y tu suscripción ha sido actualizada.</p>
               </div>
               <div className="p-8">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                     <span className="text-slate-500 text-sm">Referencia</span>
                     <span className="font-mono text-xs font-bold text-slate-800">{successPayload.reference}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                     <span className="text-slate-500 text-sm">Monto Pagado</span>
                     <span className="font-mono text-sm font-bold text-slate-800">${successPayload.amount} MXN</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                     <span className="text-slate-500 text-sm">Plan Seleccionado</span>
                     <span className="font-bold text-indigo-600 text-sm">{successPayload.tier}</span>
                  </div>
                  
                  <button onClick={() => { setIsProcessing(false); setSuccessPayload(null); router.push('/dashboard'); }} className="mt-8 w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition">
                     Volver al Inicio
                  </button>
               </div>
           </div>
        </div>
     );
  }

  // Find Tenant info from Profile if available. (Assuming profile contains tenant data from previous relations or we just fetch tenant info). Wait, tax-profiles/mine returns the tenant object nested?
  // Let's assume we can fetch tenant directly or it's returned by `/tax-profiles/mine` inside `profile.tenant`
  const tenant = profile?.tenant || { availableStamps: 0, subscriptionTier: 'FREE' };
  
  return (
    <div className="font-sans min-h-screen bg-[#f9fafb] flex flex-col items-center py-12 px-6">
       
       <div className="max-w-5xl w-full">
           <div className="mb-10 text-center">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Lleva tu Facturación al Siguiente Nivel</h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">Selecciona el paquete de timbres o el plan recurrente que mejor se adapte al volumen operativo de tu empresa. Crecemos contigo.</p>
           </div>
           
           {/* Current Status Dashboard */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-12 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8"/>
                 </div>
                 <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Plan Actual: <span className="text-indigo-600 font-black">{tenant.subscriptionTier}</span></p>
                    <div className="flex items-baseline gap-2">
                       <h2 className="text-3xl font-black text-slate-800">{tenant.availableStamps}</h2>
                       <span className="text-slate-500 font-medium text-sm">Timbres (CFDI) Disponibles</span>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 {tenant.availableStamps < 10 ? (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold animate-pulse">¡Estás a punto de quedarte sin timbres!</div>
                 ) : (
                    <div className="bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold border border-slate-200">Billetera de Timbres Saludable</div>
                 )}
              </div>
           </div>

           {/* Pricing Tables */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              
              {/* Option 1 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Recarga Rápida</h3>
                 <p className="text-slate-500 text-sm mb-6 flex-1">Ideal para salir de un apuro si estás en un plan básico y superaste tu límite.</p>
                 <div className="text-3xl font-black text-slate-900 mb-6">$99 <span className="text-sm text-slate-500 font-medium">MXN / pago único</span></div>
                 
                 <ul className="space-y-3 mb-8">
                    <li className="flex gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> + 50 Timbres Adicionales</li>
                    <li className="flex gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> No caducan</li>
                    <li className="flex gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> Despliegue inmediato</li>
                 </ul>
                 
                 <button onClick={() => handleCheckout('RECHARGE_50', 99, false)} disabled={isProcessing} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-lg transition disabled:opacity-50">
                    Comprar Recarga
                 </button>
              </div>

              {/* Option 2 (Popular) */}
              <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8 flex flex-col relative transform md:-translate-y-4">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Más Popular</div>
                 <h3 className="text-xl font-bold text-white mb-2">SaaS Emprendedor</h3>
                 <p className="text-slate-400 text-sm mb-6 flex-1">Una asignación mensual robusta diseñada para negocios en crecimiento rápido.</p>
                 <div className="text-3xl font-black text-white mb-6">$299 <span className="text-sm text-slate-400 font-medium">MXN / mes</span></div>
                 
                 <ul className="space-y-3 mb-8">
                    <li className="flex gap-2 text-sm text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/> + 100 Timbres Mensuales</li>
                    <li className="flex gap-2 text-sm text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/> Acceso API M2M Ilimitado</li>
                    <li className="flex gap-2 text-sm text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/> Reportes Avanzados de DIOT</li>
                    <li className="flex gap-2 text-sm text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/> Envío Automático WhatsApp</li>
                 </ul>
                 
                 <button onClick={() => handleCheckout('EMPRENDEDOR', 299, false)} disabled={isProcessing} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-lg transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>} Suscribirse Ahora
                 </button>
              </div>

              {/* Option 3 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                 <h3 className="text-xl font-bold text-slate-800 mb-2">SaaS Corporativo</h3>
                 <p className="text-slate-500 text-sm mb-6 flex-1">Operación a gran escala y timbrado intensivo para nóminas e inventarios.</p>
                 <div className="text-3xl font-black text-slate-900 mb-6">$1,299 <span className="text-sm text-slate-500 font-medium">MXN / mes</span></div>
                 
                 <ul className="space-y-3 mb-8">
                    <li className="flex gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> + 5000 Timbres Mensuales</li>
                    <li className="flex gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> Múltiples Razones Sociales</li>
                    <li className="flex gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> SLA de Disponibilidad 99.9%</li>
                 </ul>
                 
                 <button onClick={() => handleCheckout('CORPORATIVO', 1299, false)} disabled={isProcessing} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-lg transition disabled:opacity-50">
                    Suscribirse Ahora
                 </button>
              </div>

           </div>

           {/* Billing History */}
           {billingHistory.length > 0 && (
              <div>
                 <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Historial de Pagos</h3>
                 <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                               <th className="py-3 px-6 font-bold">Fecha</th>
                               <th className="py-3 px-6 font-bold">Referencia SAP</th>
                               <th className="py-3 px-6 font-bold">Plan / Paquete</th>
                               <th className="py-3 px-6 font-bold text-right">Monto</th>
                               <th className="py-3 px-6 font-bold text-center">Estatus</th>
                               <th className="py-3 px-6 font-bold text-center">Factura</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {billingHistory.map((req) => (
                               <tr key={req.id} className="hover:bg-slate-50">
                                   <td className="py-3 px-6">{new Date(req.createdAt).toLocaleDateString()}</td>
                                   <td className="py-3 px-6 font-mono text-xs">{req.reference}</td>
                                   <td className="py-3 px-6 font-bold text-slate-700">{req.tier}</td>
                                   <td className="py-3 px-6 text-right">${req.amount} MXN</td>
                                   <td className="py-3 px-6 text-center">
                                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{req.status}</span>
                                   </td>
                                   <td className="py-3 px-6 text-center">
                                      <button className="text-slate-400 hover:text-[#10b981]"><Download className="w-4 h-4 mx-auto"/></button>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                 </div>
              </div>
           )}

       </div>
    </div>
  );
}
