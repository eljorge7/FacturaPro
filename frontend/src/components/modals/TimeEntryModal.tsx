import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';

export default function TimeEntryModal({ isOpen, onClose, onSuccess }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    userId: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        try {
          const [resP, resU] = await Promise.all([
            fetch(`${baseUrl}/projects`, { headers: { 'x-tenant-id': tenantId } }),
            fetch(`${baseUrl}/users`, { headers: { 'x-tenant-id': tenantId } })
          ]);
          if (resP.ok) setProjects(await resP.json());
          if (resU.ok) setUsers(await resU.json());
        } catch (e) {
          console.error(e);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedProject = projects.find(p => p.id === formData.projectId);

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.userId || !formData.duration) {
      return alert('Proyecto, Usuario y Duración son obligatorios');
    }
    setIsSubmitting(true);
    try {
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      const res = await fetch(`${baseUrl}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error();
      alert('Tiempo registrado con éxito!');
      onSuccess();
    } catch (e) {
      alert('Error al registrar tiempo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Registrar Tiempo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
        </div>
        <div className="p-6 space-y-4 text-sm text-slate-700 bg-slate-50/50">
          
          <div>
             <label className="block font-bold mb-1">Proyecto *</label>
             <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value, taskId: ''})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white">
                <option value="">Seleccionar proyecto</option>
                {projects.map((p:any) => <option key={p.id} value={p.id}>{p.name} {p.customer ? `(${p.customer.legalName})` : ''}</option>)}
             </select>
          </div>

          {selectedProject && selectedProject.tasks && selectedProject.tasks.length > 0 && (
             <div>
                <label className="block font-bold mb-1">Tarea</label>
                <select value={formData.taskId} onChange={e => setFormData({...formData, taskId: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white">
                   <option value="">Opcional: Seleccionar tarea</option>
                   {selectedProject.tasks.map((t:any) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block font-bold mb-1">Usuario *</label>
                <select value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white">
                   <option value="">Seleccionar usuario</option>
                   {users.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
             </div>
             <div>
                <label className="block font-bold mb-1">Fecha</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white" />
             </div>
          </div>

          <div>
             <label className="block font-bold mb-1">Duración (Horas) *</label>
             <input type="number" step="0.5" placeholder="Ej: 2.5" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white" />
          </div>

          <div>
             <label className="block font-bold mb-1">Notas</label>
             <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500 bg-white" placeholder="Descripción de las actividades realizadas..." />
          </div>

        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors text-sm">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-md shadow-sm disabled:opacity-50 transition-colors text-sm">
            {isSubmitting ? 'Guardando...' : 'Registrar Tiempo'}
          </button>
        </div>
      </div>
    </div>
  );
}
