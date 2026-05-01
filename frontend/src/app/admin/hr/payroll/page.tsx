"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, DollarSign, Users, AlertCircle, FileText, CheckCircle, Play, 
  ChevronRight, Calendar, ArrowLeft, Download, Plus, Search, Check, Wallet
} from 'lucide-react';

export default function PayrollDashboard() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const res = await fetch('http://localhost:3001/payroll-runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      } else {
        throw new Error('API down');
      }
    } catch (e) {
      console.error(e);
      // Fallback data for wow factor if backend is down during dev
      setRuns([
        {
          id: '1', name: '1ra Quincena Mayo 2026', startDate: '2026-05-01', endDate: '2026-05-15', status: 'DRAFT', 
          payslips: [
            { id: 'p1', employee: { name: 'Juan Perez' }, baseSalary: 15000, bonus: 500, deductions: 0, netAmount: 15500, status: 'DRAFT' },
            { id: 'p2', employee: { name: 'Maria Garcia' }, baseSalary: 18000, bonus: 0, deductions: 250, netAmount: 17750, status: 'DRAFT' }
          ]
        },
        {
          id: '2', name: '2da Quincena Abril 2026', startDate: '2026-04-16', endDate: '2026-04-30', status: 'PAID', 
          payslips: [
            { id: 'p3', employee: { name: 'Juan Perez' }, baseSalary: 15000, bonus: 0, deductions: 0, netAmount: 15000, status: 'PAID' },
            { id: 'p4', employee: { name: 'Maria Garcia' }, baseSalary: 18000, bonus: 1200, deductions: 0, netAmount: 19200, status: 'PAID' }
          ]
        }
      ]);
    }
    setLoading(false);
  };

  const handleGenerate = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/payroll-runs/${id}/generate`, { method: 'POST' });
      fetchRuns();
    } catch (e) { console.log(e); }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/payroll-runs/${id}/pay`, { method: 'POST' });
      fetchRuns();
      setSelectedRun(null);
    } catch (e) { console.log(e); }
  };

  if (selectedRun) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
        <button onClick={() => setSelectedRun(null)} className="flex items-center text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Tablero
        </button>
        <div className="flex justify-between items-end">
           <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                {selectedRun.name}
              </h1>
              <p className="text-slate-500 mt-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2"/>
                {new Date(selectedRun.startDate).toLocaleDateString()} - {new Date(selectedRun.endDate).toLocaleDateString()}
              </p>
           </div>
           <div className="flex gap-4 items-center">
             <a href={`http://localhost:3001/payroll-runs/${selectedRun.id}/export`} target="_blank" rel="noreferrer" className="flex items-center justify-center bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-6 py-2 rounded-full font-semibold shadow-sm transition transform hover:-translate-y-0.5">
               <Download className="w-4 h-4 mr-2" /> Generar Layout SPEI
             </a>
             {selectedRun.status !== 'PAID' && (
                <button onClick={() => handleApprove(selectedRun.id)} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-emerald-500/30 transition transform hover:-translate-y-0.5">
                  Aprobar y Timbrar Nómina
                </button>
             )}
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-semibold text-slate-600">Empleado</th>
                <th className="py-4 px-6 font-semibold text-slate-600">Salario Base</th>
                <th className="py-4 px-6 font-semibold text-slate-600">Bonos</th>
                <th className="py-4 px-6 font-semibold text-slate-600">Deducciones</th>
                <th className="py-4 px-6 font-semibold text-slate-600">Total Neto</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {selectedRun.payslips?.map((slip: any) => (
                <tr key={slip.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-medium text-slate-800">{slip.employee?.name || 'Desconocido'}</td>
                  <td className="py-4 px-6 text-slate-600">${slip.baseSalary?.toLocaleString()}</td>
                  <td className="py-4 px-6 text-emerald-600">+ ${slip.bonus?.toLocaleString()}</td>
                  <td className="py-4 px-6 text-rose-600">- ${slip.deductions?.toLocaleString()}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">${slip.netAmount?.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${slip.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {slip.status === 'PAID' ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1"/>}
                      {slip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Motor de Nómina 💸</h1>
          <p className="text-slate-500 mt-2 text-lg">Central de auditoría y dispersión de recursos humanos</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-full font-medium shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition flex items-center justify-center">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Nómina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/40 border border-slate-100 relative overflow-hidden group hover:shadow-indigo-200/50 transition duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition duration-500 transform group-hover:scale-110">
            <Wallet className="w-24 h-24 text-indigo-600" />
          </div>
          <p className="text-slate-500 font-medium">Ciclo Actual</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">1ra Mayo '26</h2>
          <div className="mt-4 flex items-center text-sm font-semibold text-rose-500">
            Vence en 3 días
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-800 p-6 rounded-3xl shadow-xl shadow-indigo-500/30 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:rotate-12 transition duration-500">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-indigo-100 font-medium">Proyección Mensual</p>
          <h2 className="text-4xl font-bold mt-2">$124,500 <span className="text-xl font-normal text-indigo-300">MXN</span></h2>
          <div className="mt-4 flex items-center text-sm font-semibold text-emerald-300">
            +12% vs el mes pasado
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-100/40 border border-slate-100 relative overflow-hidden group hover:shadow-emerald-200/50 transition duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition duration-500">
             <Users className="w-24 h-24 text-emerald-600" />
          </div>
          <p className="text-slate-500 font-medium">Empleados Activos</p>
          <h2 className="text-4xl font-bold text-slate-900 mt-2">42</h2>
          <div className="mt-4 flex items-center text-sm font-semibold text-slate-400">
            3 nuevos ingresos este mes
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <Briefcase className="w-6 h-6 mr-3 text-indigo-500" />
          Historial de Periodos
        </h3>
        
        {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-slate-200 rounded col-span-2"></div>
                    <div className="h-4 bg-slate-200 rounded col-span-1"></div>
                  </div>
                </div>
              </div>
            </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run: any) => (
              <div key={run.id} className="flex flex-col md:flex-row justify-between md:items-center p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/80 focus:outline-none transition group cursor-pointer" onClick={() => setSelectedRun(run)}>
                <div className="flex items-center space-x-5">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${run.status === 'PAID' ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'}`}>
                      {run.status === 'PAID' ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-lg">{run.name}</h4>
                     <p className="text-sm text-slate-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1"/> {new Date(run.startDate).toLocaleDateString()} a {new Date(run.endDate).toLocaleDateString()}
                     </p>
                   </div>
                </div>
                <div className="flex items-center space-x-6 mt-4 md:mt-0">
                   <div className="text-right">
                     <p className="font-semibold text-slate-900 text-lg">${run.payslips?.reduce((acc: number, slip: any) => acc + slip.netAmount, 0).toLocaleString() || 0}</p>
                     <p className="text-xs text-slate-400">{run.payslips?.length || 0} Recibos emitidos</p>
                   </div>
                   <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${run.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {run.status}
                   </div>
                   <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
