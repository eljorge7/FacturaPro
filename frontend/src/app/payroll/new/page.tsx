"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Loader2, DollarSign, CheckCircle, Save, ChevronRight, Calculator, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function NewPayrollWizard() {
  const router = useRouter();
  const { tenantId: activeTenantId, token } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Step 1: Period
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  
  // Step 2: Payroll Run Data
  const [runId, setRunId] = useState("");
  const [runData, setRunData] = useState<any>(null);
  
  const handleGenerateDraft = async () => {
     if (!periodStart || !periodEnd) return alert("Selecciona la fecha de inicio y fin del periodo.");
     if (periodEnd < periodStart) return alert("La fecha de fin no puede ser anterior a la de inicio.");
     
     setIsProcessing(true);
     try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/payroll`, {
           method: "POST",
           headers: { 
              "Content-Type": "application/json",
              "x-tenant-id": activeTenantId,
              "Authorization": `Bearer ${token}`
           },
           body: JSON.stringify({ periodStart, periodEnd }),
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        const data = await res.json();
        setRunId(data.id);
        fetchRunDetails(data.id);
     } catch (e: any) {
        alert(`Error generando borrador: ${e.message}`);
        setIsProcessing(false);
     }
  };

  const fetchRunDetails = async (id: string) => {
     try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/payroll/${id}`, {
           headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           setRunData(await res.json());
           setStep(2);
        }
     } catch(e) {
        console.error(e);
     } finally {
        setIsProcessing(false);
     }
  };

  const updatePayslip = async (payslipId: string, field: 'bonuses' | 'deductions', value: string) => {
     const numValue = value ? parseFloat(value) : 0;
     
     // Optimistic UI Update
     const originalData = {...runData};
     const newPayslips = runData.payslips.map((p: any) => {
        if (p.id === payslipId) {
           const updated = { ...p, [field]: numValue };
           updated.netPay = updated.baseSalary + updated.bonuses - updated.deductions;
           return updated;
        }
        return p;
     });
     
     const newTotalAmount = newPayslips.reduce((acc: number, curr: any) => acc + curr.netPay, 0);
     setRunData({ ...runData, payslips: newPayslips, totalAmount: newTotalAmount });

     try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/payroll/${runId}/payslips/${payslipId}`, {
           method: "PATCH",
           headers: { 
              "Content-Type": "application/json",
              "x-tenant-id": activeTenantId,
              "Authorization": `Bearer ${token}`
           },
           body: JSON.stringify({ [field]: numValue }),
        });
        if (!res.ok) throw new Error("Sync fail");
     } catch (e) {
        // Rollback on fail
        setRunData(originalData);
        alert('Error al guardar el ajuste en el servidor.');
     }
  };

  const executePayroll = async () => {
     if (!confirm(`¿Estás seguro de Aprobar y Ejecutar esta nómina?\nSe sellará por un total de $${runData.totalAmount.toLocaleString()} MXN`)) return;
     
     setIsProcessing(true);
     try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/payroll/${runId}/execute`, {
           method: "POST",
           headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        setStep(3); // Success
     } catch (e: any) {
        alert(`Error ejecutando nómina: ${e.message}`);
     } finally {
        setIsProcessing(false);
     }
  };

  const cancelDraft = async () => {
     if (!confirm("¿Descartar este borrador de nómina?")) return;
     try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        await fetch(`${baseUrl}/payroll/${runId}`, {
           method: "DELETE",
           headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
        });
        router.push('/payroll');
     } catch (e) {
        console.error(e);
     }
  };

  return (
    <div className="font-sans min-h-screen bg-[#f9fafb] flex flex-col">
       {/* Topbar */}
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button onClick={() => step === 2 ? cancelDraft() : router.push('/payroll')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
             <h1 className="text-xl font-bold text-slate-800">Generador de Nóminas</h1>
             <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>1. Periodo</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>2. Ajustes</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className={`text-xs font-bold uppercase tracking-wider ${step === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>3. Dispersión</span>
             </div>
          </div>
       </div>

       <div className="flex-1 max-w-5xl w-full mx-auto p-8">
          
          {step === 1 && (
             <div className="animate-in fade-in max-w-xl mx-auto">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                   <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                      <Calendar className="w-8 h-8" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-800 mb-2">Definir Periodo</h2>
                   <p className="text-slate-500 mb-8 leading-relaxed">Selecciona las fechas de inicio y fin para esta corrida de nómina. El sistema buscará a todos tus empleados activos y calculará su salario correspondiente a estos días.</p>
                   
                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700">Fecha de Inicio</label>
                         <input 
                            type="date" 
                            value={periodStart} 
                            onChange={e=>setPeriodStart(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700">Fecha de Fin</label>
                         <input 
                            type="date" 
                            value={periodEnd} 
                            onChange={e=>setPeriodEnd(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" 
                         />
                      </div>
                   </div>

                   <button 
                      onClick={handleGenerateDraft} 
                      disabled={isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-lg"
                   >
                      {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Calculator className="w-6 h-6" />}
                      Calcular Salarios
                   </button>
                </div>
             </div>
          )}

          {step === 2 && runData && (
             <div className="animate-in fade-in flex flex-col gap-6">
                {/* Summary Card */}
                <div className="bg-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center shadow-lg gap-6">
                   <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Pre-nómina generada</p>
                      <h2 className="text-xl font-bold">
                         Del {new Date(runData.periodStart).toLocaleDateString()} al {new Date(runData.periodEnd).toLocaleDateString()}
                      </h2>
                      <p className="text-slate-300 text-sm mt-1">{runData.payslips?.length || 0} empleados calculados.</p>
                   </div>
                   <div className="text-right flex items-center gap-6">
                      <div>
                         <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total a Dispersar</p>
                         <p className="text-3xl font-black text-emerald-400">${runData.totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                      </div>
                      <button 
                         onClick={executePayroll} 
                         disabled={isProcessing}
                         className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors flex items-center gap-2"
                      >
                         {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                         Aprobar Nómina
                      </button>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-lg">Ajustes Individuales</h3>
                      <p className="text-sm text-slate-500">Agrega bonos (ej. Comisiones) o deducciones (ej. Retardos).</p>
                   </div>
                   
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                               <th className="py-4 px-6">Empleado</th>
                               <th className="py-4 px-4 text-right">Salario Base</th>
                               <th className="py-4 px-4 text-right">Bonos (+)</th>
                               <th className="py-4 px-4 text-right">Deducciones (-)</th>
                               <th className="py-4 px-6 text-right text-slate-800">Neto a Pagar</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 text-sm">
                            {runData.payslips?.map((slip: any) => (
                               <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-4 px-6">
                                     <p className="font-bold text-slate-800">{slip.employee?.firstName} {slip.employee?.lastName}</p>
                                     <p className="text-xs text-slate-500">{slip.employee?.jobTitle || 'Sin puesto'}</p>
                                  </td>
                                  <td className="py-4 px-4 text-right font-medium text-slate-500">
                                     ${slip.baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                  </td>
                                  <td className="py-4 px-4">
                                     <div className="flex justify-end relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                                        <input 
                                           type="number" 
                                           defaultValue={slip.bonuses || ""}
                                           onBlur={(e) => updatePayslip(slip.id, 'bonuses', e.target.value)}
                                           placeholder="0.00"
                                           className="w-32 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-right focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                                        />
                                     </div>
                                  </td>
                                  <td className="py-4 px-4">
                                     <div className="flex justify-end relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
                                        <input 
                                           type="number" 
                                           defaultValue={slip.deductions || ""}
                                           onBlur={(e) => updatePayslip(slip.id, 'deductions', e.target.value)}
                                           placeholder="0.00"
                                           className="w-32 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-right focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                                        />
                                     </div>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                     <span className="bg-slate-800 text-white font-black px-3 py-1.5 rounded-lg">
                                        ${slip.netPay.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {step === 3 && (
             <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                   <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4">¡Nómina Generada!</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                   La nómina ha sido aprobada, bloqueada y sellada con éxito. Los recibos de pago han sido generados y guardados en el expediente de cada empleado.
                </p>
                <div className="flex gap-4">
                   <Link href="/payroll" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                      Volver al Dashboard
                   </Link>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}
