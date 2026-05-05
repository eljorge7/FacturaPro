import React, { useState, useEffect } from 'react';
import { Building2, Shield, X, Loader2, Search, CheckSquare, Square } from 'lucide-react';

export default function AssignClientsModal({ isOpen, onClose, onAssign, token, staffMember, allClients }: any) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && staffMember) {
      // In a real scenario, we'd fetch the user's existing permissions first.
      // For now, we assume a blank slate or previously cached.
      setSelectedIds([]);
    }
  }, [isOpen, staffMember]);

  if (!isOpen || !staffMember) return null;

  const toggleClient = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map((c: any) => c.id));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api");
    try {
      const res = await fetch(`${baseUrl}/auth/agency/team/${staffMember.id}/assign-tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tenantIds: selectedIds })
      });
      if (res.ok) {
        onAssign();
        onClose();
      } else {
        alert('Hubo un error al asignar los clientes');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
    setLoading(false);
  };

  const filteredClients = (allClients || []).filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.tradeName && c.tradeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-600 text-white rounded-xl">
               <Shield className="h-5 w-5" />
             </div>
             <div>
               <h2 className="font-bold text-slate-800 text-lg leading-tight">Asignar Clientes</h2>
               <p className="text-xs text-slate-500">Permisos para: <span className="font-bold">{staffMember.user.name}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-5 shrink-0 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all" 
              placeholder="Buscar por Razón Social o Nombre Corporativo..." 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
           <div className="flex justify-between items-center px-4 py-2 mb-2">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{filteredClients.length} Empresas Disponibles</span>
             <button onClick={handleSelectAll} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                {selectedIds.length === filteredClients.length && filteredClients.length > 0 ? "Deseleccionar Todos" : "Seleccionar Todos"}
             </button>
           </div>
           
           <div className="space-y-1">
             {filteredClients.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm">No se encontraron clientes.</div>
             ) : (
               filteredClients.map((client: any) => {
                 const isChecked = selectedIds.includes(client.id);
                 return (
                   <button 
                     key={client.id}
                     onClick={() => toggleClient(client.id)}
                     className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isChecked ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}
                   >
                     <div className="flex items-center gap-3">
                        <div className={`${isChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                           {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isChecked ? 'text-emerald-900' : 'text-slate-700'}`}>{client.name}</div>
                          <div className="text-[11px] text-slate-400">Tenant ID: {client.id.split('-')[0]}</div>
                        </div>
                     </div>
                     <Building2 className={`w-4 h-4 ${isChecked ? 'text-emerald-400' : 'text-slate-200'}`} />
                   </button>
                 );
               })
             )}
           </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-between items-center shrink-0 bg-white">
          <div className="text-xs font-bold text-slate-500">
            <span className="text-emerald-600">{selectedIds.length}</span> clientes seleccionados
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="px-5 py-2 font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Guardar Accesos
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
