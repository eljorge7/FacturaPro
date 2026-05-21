"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Plus, Edit2, Trash2, Save, X, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function ProposalTemplatesPage() {
  const { tenantId, token } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultScope: "",
    defaultNotes: "",
    defaultPersonnel: "",
    defaultMaterials: "",
    coverImageUrl: ""
  });

  const fetchTemplates = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/proposal-templates`, {
        headers: { 'x-tenant-id': tenantId || "", 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al cargar plantillas");
      const data = await res.json();
      setTemplates(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && token) {
      fetchTemplates();
    }
  }, [tenantId, token]);

  const openModal = (template?: any) => {
    if (template) {
      setEditingId(template.id);
      setForm({
        name: template.name,
        description: template.description || "",
        defaultScope: template.defaultScope || "",
        defaultNotes: template.defaultNotes || "",
        defaultPersonnel: template.defaultPersonnel || "",
        defaultMaterials: template.defaultMaterials || "",
        coverImageUrl: template.coverImageUrl || ""
      });
    } else {
      setEditingId(null);
      setForm({
        name: "", description: "", defaultScope: "", defaultNotes: "", defaultPersonnel: "", defaultMaterials: "", coverImageUrl: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("El nombre es obligatorio");
    
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `${baseUrl}/proposal-templates/${editingId}` : `${baseUrl}/proposal-templates`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId || "", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) throw new Error("Error al guardar");
      
      toast.success(editingId ? "Plantilla actualizada" : "Plantilla creada");
      setIsModalOpen(false);
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      await fetch(`${baseUrl}/proposal-templates/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId || "", 'Authorization': `Bearer ${token}` }
      });
      toast.success("Eliminada");
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-8 font-sans max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-500" /> Plantillas de Propuestas
          </h1>
          <p className="text-slate-500 mt-1">Crea plantillas predefinidas (ej. Paneles Solares, Enlaces) para acelerar tus cotizaciones.</p>
        </div>
        <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" /> Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-32 bg-slate-100 relative">
              {tpl.coverImageUrl ? (
                 <img src={tpl.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-10 h-10" />
                 </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-1">{tpl.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mb-4">{tpl.description || 'Sin descripción'}</p>
              
              <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => openModal(tpl)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => handleDelete(tpl.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500"/> 
                {editingId ? "Editar Plantilla" : "Nueva Plantilla"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Plantilla</label>
                  <input type="text" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" placeholder="Ej. Instalación de Internet" required />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL de Portada (Opcional)</label>
                  <input type="text" value={form.coverImageUrl} onChange={e=>setForm({...form, coverImageUrl: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descripción corta (Para uso interno)</label>
                  <input type="text" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Alcance del Proyecto (Default)</label>
                    <textarea value={form.defaultScope} onChange={e=>setForm({...form, defaultScope: e.target.value})} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="Describe qué incluye el proyecto..."></textarea>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Materiales a Utilizar (Default)</label>
                    <textarea value={form.defaultMaterials} onChange={e=>setForm({...form, defaultMaterials: e.target.value})} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="Listado de equipo, cableado, paneles..."></textarea>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Personal Involucrado (Default)</label>
                    <textarea value={form.defaultPersonnel} onChange={e=>setForm({...form, defaultPersonnel: e.target.value})} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="Ingenieros, técnicos, tiempo estimado..."></textarea>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Notas Comerciales / Tiempos</label>
                    <textarea value={form.defaultNotes} onChange={e=>setForm({...form, defaultNotes: e.target.value})} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="Vigencia, tiempos de entrega..."></textarea>
                 </div>
              </div>
            </form>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button disabled={isSubmitting} type="button" onClick={() => setIsModalOpen(false)} className="bg-white hover:bg-slate-100 text-slate-700 px-5 py-2 rounded-xl font-bold border border-slate-200 transition-all">Cancelar</button>
              <button disabled={isSubmitting} type="button" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Plantilla</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
