import React, { useState } from 'react';
import { Mail, User, Shield, X, Loader2 } from 'lucide-react';

export default function InviteStaffModal({ isOpen, onClose, onInvite, token }: any) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api");
    try {
      const res = await fetch(`${baseUrl}/auth/agency/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, name, role })
      });
      if (res.ok) {
        onInvite();
        onClose();
        setEmail('');
        setName('');
        setRole('STAFF');
      } else {
        alert('Hubo un error al invitar al contador');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-xl">
               <User className="h-5 w-5" />
             </div>
             <h2 className="font-bold text-slate-800 text-lg">Invitar Contador</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-4">
            Ingresa los datos del empleado. Le enviaremos un correo con instrucciones para crear su contraseña segura.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm" placeholder="Ej. Juan Pérez" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm" placeholder="juan@tudespacho.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nivel de Acceso (Rol)</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white appearance-none">
                <option value="STAFF">Staff (Contador Jr. / Auxiliar)</option>
                <option value="MANAGER">Manager (Auditor / Supervisor)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-5 py-2 font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enviar Invitación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
