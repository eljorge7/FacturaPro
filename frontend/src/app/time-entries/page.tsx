'use client';
import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Search, Filter } from 'lucide-react';
import TimeEntryModal from '@/components/modals/TimeEntryModal';

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/time-entries`, { headers: { 'x-tenant-id': tenantId } });
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de tiempo?')) return;
    try {
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      await fetch(`${baseUrl}/time-entries/${id}`, { method: 'DELETE', headers: { 'x-tenant-id': tenantId } });
      fetchEntries();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-7 h-7 text-blue-500" />
            Registro de Tiempo
          </h1>
          <p className="text-slate-500 mt-1">Controla las horas dedicadas a proyectos y tareas.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 shadow-sm transition-colors">
          <Plus className="w-5 h-5" /> Nueva entrada de tiempo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
           <div className="flex items-center gap-2 relative">
             <Search className="w-4 h-4 absolute left-3 text-slate-400" />
             <input type="text" placeholder="Buscar registros..." className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-500 w-64" />
           </div>
           <button className="flex items-center gap-2 text-slate-600 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-bold bg-white hover:bg-slate-50">
             <Filter className="w-4 h-4" /> Filtrar
           </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Cargando registros...</div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center">
             <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-700">Sin registros de tiempo</h3>
             <p className="text-slate-500">Aún no has registrado horas en ningún proyecto.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Proyecto</th>
                <th className="px-6 py-4">Tarea</th>
                <th className="px-6 py-4">Notas</th>
                <th className="px-6 py-4 text-center">Horas</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-slate-700 font-medium">
                     {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{entry.user?.name || 'Desconocido'}</td>
                  <td className="px-6 py-4">
                     <span className="font-bold text-slate-700">{entry.project?.name}</span>
                     {entry.project?.projectCode && <span className="block text-xs text-slate-400">{entry.project.projectCode}</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{entry.task?.title || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{entry.notes || '-'}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/50">{entry.duration} h</td>
                  <td className="px-6 py-4 text-right">
                     <button onClick={() => handleDelete(entry.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <TimeEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); fetchEntries(); }} 
      />
    </div>
  );
}
