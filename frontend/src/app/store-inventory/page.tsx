"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Package, Plus, Trash2, Edit2, CheckCircle2, Box, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalProduct {
  id: string;
  syscomId: string | null;
  title: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  isActive: boolean;
}

export default function StoreInventoryAdmin() {
  const { token } = useAuth();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LocalProduct>>({
    title: "",
    brand: "",
    model: "",
    price: 0,
    stock: 1,
    imageUrl: "",
    category: "",
    isActive: true,
  });

  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/store-management/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: LocalProduct) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        brand: "",
        model: "",
        price: 0,
        stock: 1,
        imageUrl: "",
        category: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`${baseUrl}/store-management/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${baseUrl}/store-management/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      alert("Error guardando producto.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto local?")) return;
    try {
      await fetch(`${baseUrl}/store-management/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProducts();
    } catch (error) {
      alert("Error eliminando producto.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Store className="h-8 w-8 text-blue-600" /> Catálogo de Tienda (Inventario Local)
          </h1>
          <p className="text-slate-500 mt-1">
            Gestiona los productos propios que aparecerán en la tienda pública junto al catálogo de Syscom.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      {loading ? (
        <div className="p-10 text-center animate-pulse text-slate-400">Cargando inventario...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No tienes productos locales</h3>
          <p className="text-slate-500 mb-6">Actualmente tu tienda solo muestra los equipos automatizados de Syscom.</p>
          <Button onClick={() => handleOpenModal()} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            Añadir mi primer producto local
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Precio Público</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Box className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{p.title}</div>
                        <div className="text-xs text-slate-500">{p.brand} {p.model ? `- ${p.model}` : ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      ${p.price.toLocaleString('es-MX')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock} pz
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-4 h-4"/> Activo</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg">{editingId ? 'Editar Producto Local' : 'Nuevo Producto Local'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="productForm" onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título del Producto</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca</label>
                      <input type="text" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
                      <input type="text" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Público (MXN)</label>
                      <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Disponible</label>
                      <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL de Imagen (Opcional)</label>
                    <input type="url" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Producto Visible en Tienda</label>
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" form="productForm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {editingId ? 'Guardar Cambios' : 'Añadir a la Tienda'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
