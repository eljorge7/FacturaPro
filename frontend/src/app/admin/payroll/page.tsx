'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Calculator, CheckCircle2, ChevronRight, FileText, Banknote, CalendarDays, Plus, Search, HelpCircle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

export default function PayrollDashboard() {
  const { token, tenantId: activeTenantId } = useAuth();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Draft Creation
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Selected Run View
  const [selectedRun, setSelectedRun] = useState<any>(null);

  useEffect(() => {
    if (token && activeTenantId) loadRuns();
  }, [token, activeTenantId]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/payroll`, {
        headers: { 'x-tenant-id': activeTenantId || '', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRuns(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadRunDetail = async (id: string) => {
    try {
      const res = await fetch(`${baseUrl}/payroll/${id}`, {
        headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSelectedRun(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ periodStart, periodEnd })
      });
      if (res.ok) {
        setShowDraftModal(false);
        loadRuns();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al generar la nómina.');
      }
    } catch (e) { console.error(e); }
  };

  const handleExecutePayRun = async (id: string) => {
    if (!confirm('¿Estás seguro de PAGAR esta nómina? Esto convertirá todo el dinero acumulado en un Egreso Contable inmodificable para Auditoría y bloqueará futuras ediciones de estos recibos.')) return;
    try {
      const res = await fetch(`${baseUrl}/payroll/${id}/execute`, {
        method: 'POST',
        headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        alert(result.message);
        loadRuns();
        loadRunDetail(id);
      } else {
        const err = await res.json();
        alert(err.message || 'Error crítico contactando al banco / motor de nómina.');
      }
    } catch (e) { console.error(e); }
  };

  const handlePayslipChange = async (payslipId: string, field: string, val: string) => {
    const numericVal = parseFloat(val) || 0;
    
    // Optimistic Update Limitado
    const updatedSlip = selectedRun.payslips.find((p: any) => p.id === payslipId);
    if (!updatedSlip) return;
    
    const payload = {
      baseSalary: updatedSlip.baseSalary,
      bonuses: updatedSlip.bonuses,
      deductions: updatedSlip.deductions,
      [field]: numericVal
    };

    try {
      const res = await fetch(`${baseUrl}/payroll/${selectedRun.id}/payslips/${payslipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
         loadRunDetail(selectedRun.id);
         loadRuns(); // Para actualizar el total
      } else {
         alert('Error al ajustar el recibo.');
      }
    } catch (e) {}
  };

  const handleDeleteRun = async (id: string) => {
      if(!confirm('Borrar este borrador?')) return;
      const res = await fetch(`${baseUrl}/payroll/${id}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': activeTenantId, 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
          setSelectedRun(null);
          loadRuns();
      } else {
          alert('No se puede borrar.');
      }
  }

  // UI
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <Calculator className="w-10 h-10 text-emerald-600" />
            Nóminas y Compensaciones
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-2">
            Emite, audita y dispersa el pago quincenal / semanal de tus empleados.
          </p>
        </div>
        <button onClick={() => setShowDraftModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2">
          <CalendarDays className="w-5 h-5" /> Nueva Corrida (Borrador)
        </button>
      </div>

      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Generar Quincena / Periodo</h3>
            <form onSubmit={handleCreateDraft} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Comienza el (Start Date)</label>
                <input type="date" required value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Finaliza el (End Date)</label>
                <input type="date" required value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl">
                 <p className="text-xs text-emerald-800 font-medium leading-relaxed">Se recopilarán todos los empleados que tengan un **Salario Base** configurado en su perfil de HR y se pre-llenará un tabulador en formato <b>Borrador</b> para revisión.</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowDraftModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:-translate-y-1 transition-all">Construir Borrador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRun && (
        <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
           {selectedRun.status === 'PAID' && (
              <div className="absolute inset-0 border-[6px] border-emerald-500/50 pointer-events-none rounded-3xl z-10" />
           )}
           <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                 <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                   {selectedRun.status === 'PAID' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <FileSpreadsheet className="w-8 h-8 text-amber-400" />}
                   Periodo: {new Date(selectedRun.periodStart).toLocaleDateString()} al {new Date(selectedRun.periodEnd).toLocaleDateString()}
                 </h2>
                 <div className="flex gap-4 text-sm font-medium text-slate-400">
                    <span className="bg-white/10 px-3 py-1 rounded-full">ID: {selectedRun.id.split('-')[0].toUpperCase()}</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full">Recibos Emitidos: {selectedRun.payslips?.length || 0}</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest break-words mb-1">Total a Dispersar (MXN)</p>
                 <p className="text-5xl font-black text-emerald-400">${(selectedRun.totalAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                 {selectedRun.status === 'DRAFT' && (
                     <button onClick={() => handleDeleteRun(selectedRun.id)} className="text-xs text-red-400 hover:text-red-300 font-bold mt-2 underline block text-right w-full">Borrar Borrador</button>
                 )}
              </div>
           </div>

           <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                 <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                       <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Empleado</th>
                       <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Sueldo Base</th>
                       <th className="p-4 text-xs font-black text-emerald-400 uppercase tracking-widest text-right">+ Bonos/Extras</th>
                       <th className="p-4 text-xs font-black text-rose-400 uppercase tracking-widest text-right">- Deducciones</th>
                       <th className="p-4 text-xs font-black text-white uppercase tracking-widest text-right">Neto a Pagar</th>
                       {selectedRun.status === 'PAID' && <th className="p-4 text-xs font-black text-emerald-400 uppercase tracking-widest text-center">Firma Auditoría</th>}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {selectedRun.payslips?.map((slip: any) => (
                       <tr key={slip.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                             <p className="font-bold text-lg">{slip.employee.firstName} {slip.employee.lastName}</p>
                             <p className="text-xs text-slate-400 font-medium">{slip.employee.jobTitle || 'Empleado'} • {slip.employee.department || 'General'}</p>
                          </td>
                          <td className="p-4 text-right">
                             {selectedRun.status === 'DRAFT' ? (
                                <input type="number" onBlur={(e) => handlePayslipChange(slip.id, 'baseSalary', e.target.value)} defaultValue={slip.baseSalary} className="w-32 bg-white/10 text-white rounded-lg px-3 py-2 outline-none text-right font-mono" />
                             ) : (
                                <span className="font-mono text-slate-300">${slip.baseSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             )}
                          </td>
                          <td className="p-4 text-right">
                             {selectedRun.status === 'DRAFT' ? (
                                <input type="number" onBlur={(e) => handlePayslipChange(slip.id, 'bonuses', e.target.value)} defaultValue={slip.bonuses} className="w-32 bg-emerald-900/30 text-emerald-300 border border-emerald-800 rounded-lg px-3 py-2 outline-none text-right font-mono" />
                             ) : (
                                <span className="font-mono text-emerald-400">${slip.bonuses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             )}
                          </td>
                          <td className="p-4 text-right">
                             {selectedRun.status === 'DRAFT' ? (
                                <input type="number" onBlur={(e) => handlePayslipChange(slip.id, 'deductions', e.target.value)} defaultValue={slip.deductions} className="w-32 bg-rose-900/30 text-rose-300 border border-rose-800 rounded-lg px-3 py-2 outline-none text-right font-mono" />
                             ) : (
                                <span className="font-mono text-rose-400">${slip.deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                             )}
                          </td>
                          <td className="p-4 text-right font-black text-xl font-mono text-white">
                             ${slip.netPay.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          {selectedRun.status === 'PAID' && (
                              <td className="p-4 text-center">
                                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/10 px-2 py-1 rounded truncate max-w-[150px] inline-block" title={slip.auditSignature}>{slip.auditSignature}</span>
                              </td>
                          )}
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="p-6 bg-slate-950 flex justify-between items-center border-t border-white/5">
              <button onClick={() => setSelectedRun(null)} className="text-slate-400 font-bold hover:text-white px-4 py-2">Volver al Historial</button>

              {selectedRun.status === 'DRAFT' ? (
                 <button onClick={() => handleExecutePayRun(selectedRun.id)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 px-10 rounded-xl shadow-lg shadow-emerald-500/20 transition-transform hover:-translate-y-1">
                    APROBAR, DISPERSAR Y CERRAR NÓMINA (PAGAR)
                 </button>
              ) : (
                 <div className="flex items-center gap-3 bg-emerald-900/50 text-emerald-400 px-6 py-3 rounded-xl border border-emerald-800">
                    <CheckCircle2 className="w-6 h-6" />
                    <div>
                        <p className="font-black">LOCKED & PAID / CERRADO</p>
                        <p className="text-xs">Este documento no se puede alterar.</p>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Histórico */}
      {!selectedRun && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
               <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600"/> Historial de Corridas</h3>
            </div>
            {runs.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                    <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No hay registros de nómina.</p>
                    <p className="text-sm">Inicia construyendo tu primer Borrador de Quincena.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {runs.map(run => (
                        <div key={run.id} onClick={() => loadRunDetail(run.id)} className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${run.status === 'PAID' ? 'hover:bg-emerald-50/50' : 'hover:bg-amber-50/50 bg-amber-50/20'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm ${run.status === 'PAID' ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-white border-amber-300 text-amber-500'}`}>
                                    {run.status === 'PAID' ? <CheckCircle2 className="w-6 h-6"/> : <FileSpreadsheet className="w-7 h-7"/>}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg">Del {new Date(run.periodStart).toLocaleDateString()} al {new Date(run.periodEnd).toLocaleDateString()}</h4>
                                    <div className="flex gap-4 mt-1 text-sm font-medium">
                                        <span className="text-slate-500">ID: {run.id.split('-')[0].toUpperCase()}</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-slate-500">{run._count?.payslips || 0} Recibos</span>
                                        <span className="text-slate-500">•</span>
                                        {run.status === 'PAID' ? (
                                            <span className="text-emerald-600 bg-emerald-50 px-2 rounded">✓ PAGADO Y CONTABILIZADO</span>
                                        ) : (
                                            <span className="text-amber-600 bg-amber-50 px-2 rounded font-bold">⚠️ EN BORRADOR (POR REVISAR)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monto Total</p>
                                    <p className="text-2xl font-black text-slate-700">${(run.totalAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
}
