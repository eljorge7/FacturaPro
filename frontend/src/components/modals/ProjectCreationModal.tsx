import React, { useState, useEffect } from 'react';
import { XCircle, Plus, Trash2, HelpCircle } from 'lucide-react';

export default function ProjectCreationModal({ isOpen, onClose, quote, onSuccess }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    projectCode: '',
    billingMethod: 'FIXED_COST',
    description: '',
    costBudget: '',
    revenueBudget: '',
    tasks: [{ title: '', description: '', isBillable: true, hourlyRate: '' }],
    users: [] as { userId: string, hourlyRate: string }[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
          const res = await fetch(`${baseUrl}/users`, { headers: { 'x-tenant-id': tenantId } });
          if (res.ok) setUsers(await res.json());
        } catch (e) {
          console.error(e);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name) return alert('El nombre del proyecto es obligatorio');
    setIsSubmitting(true);
    try {
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'demo-tenant' : 'demo-tenant';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      const payload = {
        ...formData,
        quoteId: quote.id,
        customerId: quote.customerId
      };

      const res = await fetch(`${baseUrl}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      alert('Proyecto creado con éxito!');
      onSuccess();
    } catch (e) {
      alert('Error al crear el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Nuevo proyecto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
             <label className="text-sm font-bold text-slate-700 mt-2">Nombre del proyecto* <span className="text-red-500">*</span></label>
             <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />

             <label className="text-sm font-bold text-slate-700 mt-2">Código del proyecto</label>
             <input type="text" value={formData.projectCode} onChange={e => setFormData({...formData, projectCode: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />

             <label className="text-sm font-bold text-slate-700 mt-2">Nombre del cliente* <span className="text-red-500">*</span></label>
             <input type="text" disabled value={quote.customer?.legalName || quote.customer?.companyName || 'Cliente'} className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-md px-3 py-2 text-sm" />

             <label className="text-sm font-bold text-slate-700 mt-2">Método de facturación* <span className="text-red-500">*</span></label>
             <select value={formData.billingMethod} onChange={e => setFormData({...formData, billingMethod: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                <option value="FIXED_COST">Coste fijo para el proyecto</option>
                <option value="PROJECT_HOURS">Basado en las horas de proyecto</option>
                <option value="TASK_HOURS">Basado en las horas de tareas</option>
                <option value="STAFF_HOURS">Basado en las horas del personal</option>
             </select>

             <label className="text-sm font-bold text-slate-700 mt-2">Descripción</label>
             <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" placeholder="2000 caracteres como máximo" />
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Budget */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Presupuesto</h3>
            <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
               <label className="text-sm font-bold text-slate-700 mt-2 flex items-center gap-1">Presupuesto de costes <HelpCircle className="w-3.5 h-3.5 text-slate-400"/></label>
               <div className="flex">
                  <span className="bg-slate-100 border border-slate-300 border-r-0 px-3 py-2 rounded-l-md text-sm text-slate-500">MXN</span>
                  <input type="number" value={formData.costBudget} onChange={e => setFormData({...formData, costBudget: e.target.value})} className="w-full max-w-sm border border-slate-300 rounded-r-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
               </div>

               <label className="text-sm font-bold text-slate-700 mt-2 flex items-center gap-1">Presupuesto de ingresos <HelpCircle className="w-3.5 h-3.5 text-slate-400"/></label>
               <div className="flex">
                  <span className="bg-slate-100 border border-slate-300 border-r-0 px-3 py-2 rounded-l-md text-sm text-slate-500">MXN</span>
                  <input type="number" value={formData.revenueBudget} onChange={e => setFormData({...formData, revenueBudget: e.target.value})} className="w-full max-w-sm border border-slate-300 rounded-r-md px-3 py-2 text-sm focus:border-blue-500 outline-none" />
               </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Users */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Usuarios</h3>
            <div className="border border-slate-200 rounded-md overflow-hidden bg-white mb-3">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-3 w-16">S.NO</th>
                        <th className="px-4 py-3">USUARIO / CORREO ELECTRÓNICO</th>
                        {formData.billingMethod === 'STAFF_HOURS' && <th className="px-4 py-3 w-32">TARIFA/HR</th>}
                        <th className="px-4 py-3 w-16"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {formData.users.map((u, i) => (
                        <tr key={i}>
                           <td className="px-4 py-3 text-center">{i + 1}</td>
                           <td className="px-4 py-3">
                              <select value={u.userId} onChange={e => {
                                 const newUsers = [...formData.users];
                                 newUsers[i].userId = e.target.value;
                                 setFormData({...formData, users: newUsers});
                              }} className="w-full border border-slate-300 rounded px-2 py-1 outline-none">
                                 <option value="">Seleccionar usuario</option>
                                 {users.map((user:any) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                              </select>
                           </td>
                           {formData.billingMethod === 'STAFF_HOURS' && (
                              <td className="px-4 py-3"><input type="number" value={u.hourlyRate} onChange={e => {
                                 const newUsers = [...formData.users];
                                 newUsers[i].hourlyRate = e.target.value;
                                 setFormData({...formData, users: newUsers});
                              }} className="w-full border border-slate-300 rounded px-2 py-1 outline-none" /></td>
                           )}
                           <td className="px-4 py-3 text-center">
                              <button onClick={() => setFormData({...formData, users: formData.users.filter((_, idx) => idx !== i)})} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <button onClick={() => setFormData({...formData, users: [...formData.users, { userId: '', hourlyRate: '' }]})} className="text-[#2563eb] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Agregar usuario</button>
          </div>

          <hr className="border-slate-200" />

          {/* Section 4: Tasks */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex justify-between items-center">
               Tareas del proyecto
            </h3>
            <div className="border border-slate-200 rounded-md overflow-hidden bg-white mb-3">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-3 w-16">S.NO</th>
                        <th className="px-4 py-3">NOMBRE DE LA TAREA</th>
                        <th className="px-4 py-3">DESCRIPCIÓN</th>
                        {formData.billingMethod === 'TASK_HOURS' && <th className="px-4 py-3 w-32">TARIFA/HR</th>}
                        <th className="px-4 py-3 text-center w-28">FACTURABLE</th>
                        <th className="px-4 py-3 w-16"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {formData.tasks.map((t, i) => (
                        <tr key={i}>
                           <td className="px-4 py-3 text-center">{i + 1}</td>
                           <td className="px-4 py-3"><input type="text" value={t.title} onChange={e => {
                               const newTasks = [...formData.tasks];
                               newTasks[i].title = e.target.value;
                               setFormData({...formData, tasks: newTasks});
                           }} className="w-full border border-slate-300 rounded px-2 py-1 outline-none" placeholder="Nombre de la tarea" /></td>
                           <td className="px-4 py-3"><input type="text" value={t.description} onChange={e => {
                               const newTasks = [...formData.tasks];
                               newTasks[i].description = e.target.value;
                               setFormData({...formData, tasks: newTasks});
                           }} className="w-full border border-slate-300 rounded px-2 py-1 outline-none" placeholder="Descripción" /></td>
                           {formData.billingMethod === 'TASK_HOURS' && (
                              <td className="px-4 py-3"><input type="number" value={t.hourlyRate} onChange={e => {
                                 const newTasks = [...formData.tasks];
                                 newTasks[i].hourlyRate = e.target.value;
                                 setFormData({...formData, tasks: newTasks});
                              }} className="w-full border border-slate-300 rounded px-2 py-1 outline-none" /></td>
                           )}
                           <td className="px-4 py-3 text-center">
                               <input type="checkbox" checked={t.isBillable} onChange={e => {
                                  const newTasks = [...formData.tasks];
                                  newTasks[i].isBillable = e.target.checked;
                                  setFormData({...formData, tasks: newTasks});
                               }} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                           </td>
                           <td className="px-4 py-3 text-center">
                              {i > 0 && <button onClick={() => setFormData({...formData, tasks: formData.tasks.filter((_, idx) => idx !== i)})} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <button onClick={() => setFormData({...formData, tasks: [...formData.tasks, { title: '', description: '', isBillable: true, hourlyRate: '' }]})} className="text-[#2563eb] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Agregar la tarea del proyecto</button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex gap-3">
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-md shadow-sm disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
