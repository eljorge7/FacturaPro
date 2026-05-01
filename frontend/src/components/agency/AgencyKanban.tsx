import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, PlayCircle, Building2, User, MoreHorizontal, Trash } from 'lucide-react';

export default function AgencyKanban({ token, memberships, staff }: any) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    if (!token) return;
    const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
    try {
      const res = await fetch(`${baseUrl}/auth/agency/tasks`, { headers: { 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      setTasks(data || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const createTask = async () => {
    if (!title) return;
    const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
    try {
      const res = await fetch(`${baseUrl}/auth/agency/tasks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, assignedToId, tenantId, dueDate, status: 'TODO' })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTitle(''); setDescription(''); setAssignedToId(''); setTenantId(''); setDueDate('');
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic UI Update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
    try {
      await fetch(`${baseUrl}/auth/agency/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch(e) {
      // Revert on fail
      fetchTasks();
    }
  };

  const onDragStart = (e: any, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: any, status: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      updateTaskStatus(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  };

  const renderColumn = (status: string, label: string, color: string, icon: any) => {
    const columnTasks = tasks.filter(t => (t.status || 'TODO') === status);
    
    return (
      <div 
        className="flex-1 min-w-[300px] bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, status)}
      >
        <div className={`p-4 border-b border-slate-200/60 sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-slate-700">{label}</h3>
          </div>
          <span className="bg-white text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">{columnTasks.length}</span>
        </div>
        
        <div className="p-3 bg-slate-50/30 flex-1 space-y-3 min-h-[500px] overflow-y-auto custom-scrollbar">
           {columnTasks.map(t => (
             <div 
               key={t.id} 
               draggable 
               onDragStart={(e) => onDragStart(e, t.id)}
               className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all group"
             >
                <div className="flex justify-between items-start mb-2">
                   <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${color}`}>
                      {t.tenant?.tradeName || t.tenant?.name || 'Interna (Despacho)'}
                   </div>
                   <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 leading-snug">{t.title}</h4>
                {t.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{t.description}</p>}
                
                <div className="flex items-center justify-between mt-4">
                   <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-md text-[10px] font-semibold border border-slate-100">
                     <User className="w-3 h-3" />
                     {t.assignedTo ? t.assignedTo.name.split(' ')[0] : 'S/Asignar'}
                   </div>
                   {t.dueDate && (
                     <div className={`text-[10px] font-bold ${new Date(t.dueDate) < new Date() ? 'text-rose-500' : 'text-slate-400'}`}>
                       {new Date(t.dueDate).toLocaleDateString()}
                     </div>
                   )}
                </div>
             </div>
           ))}
           {columnTasks.length === 0 && (
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium">Soltar aquí</div>
           )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-slate-500">Cargando tablero...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
       <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-700 text-sm">Tablero Operativo del Despacho</h2>
            <p className="text-xs text-slate-500">Gestiona las tareas de tu equipo y asócialas a clientes.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1">
             <Plus className="w-4 h-4" /> Nueva Tarea
          </button>
       </div>

       <div className="p-6 overflow-x-auto">
          <div className="flex gap-6 min-w-full">
            {renderColumn('TODO', 'Por Hacer', 'bg-slate-100 text-slate-600', <Clock className="w-4 h-4 text-slate-400" />)}
            {renderColumn('IN_PROGRESS', 'En Proceso', 'bg-sky-100 text-sky-700', <PlayCircle className="w-4 h-4 text-sky-500" />)}
            {renderColumn('REVIEW', 'En Revisión', 'bg-amber-100 text-amber-700', <CheckCircle2 className="w-4 h-4 text-amber-500" />)}
            {renderColumn('DONE', 'Completado', 'bg-emerald-100 text-emerald-700', <CheckCircle2 className="w-4 h-4 text-emerald-500" />)}
          </div>
       </div>

       {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm shadow-2xl z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
               <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-800">Crear Nueva Tarea</div>
               <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título de la Acción</label>
                    <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ejem: Cálculo de Nómina Mensual..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción</label>
                    <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Instrucciones adicionales..."></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Asignar a</label>
                      <select value={assignedToId} onChange={e=>setAssignedToId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">(Sin asignar)</option>
                        {staff.map((s:any) => <option key={s.user.id} value={s.user.id}>{s.user.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Para Cliente</label>
                      <select value={tenantId} onChange={e=>setTenantId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option value="">(Bóveda Interna)</option>
                        {memberships.map((m:any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Entrega</label>
                    <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
               </div>
               <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl text-sm transition-colors">Cancelar</button>
                  <button onClick={createTask} disabled={!title} className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm transition-colors disabled:opacity-50">Crear Ticket</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
