"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Save, Loader2, X, FileEdit, Trash2, ChevronDown, MoreHorizontal, Package, Tag, ArrowLeft, Image as ImageIcon, XCircle, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId: activeTenantId, token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');
  const [movements, setMovements] = useState<any[]>([]);
  
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjType, setAdjType] = useState('IN');
  const [adjQty, setAdjQty] = useState('');
  const [adjRef, setAdjRef] = useState('');

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State for New/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [satProductCode, setSatProductCode] = useState("");
  const [satUnitCode, setSatUnitCode] = useState("H87"); // Pieza
  const [price, setPrice] = useState("");
  const [taxType, setTaxType] = useState("IVA_16");
  const [costPrice, setCostPrice] = useState("");
  const [type, setType] = useState("PRODUCT");
  const [kitComponents, setKitComponents] = useState<{componentId: string, quantity: string, name?: string}[]>([]);
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [locationShelf, setLocationShelf] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // SAT Catalogs
  const [satCatalogsOptions, setSatCatalogsOptions] = useState<any[]>([]);

  useEffect(() => {
    if (satProductCode && satProductCode.length >= 2) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const delayDebounceFn = setTimeout(() => {
        fetch(`${baseUrl}/sat-catalogs/products?q=${satProductCode}`)
          .then(res => res.json())
          .then(data => setSatCatalogsOptions(data))
          .catch(e => console.error(e));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSatCatalogsOptions([]);
    }
  }, [satProductCode]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSku("");
    setDescription("");
    setSatProductCode("");
    setSatUnitCode("H87");
    setPrice("");
    setCostPrice("");
    setType("PRODUCT");
    setTaxType("IVA_16");
    setKitComponents([]);
    setStock("");
    setMinStock("");
    setMaxStock("");
    setLocationShelf("");
    setImageUrl(null);
  };

  const openEdit = (product: any) => {
    resetForm();
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku || "");
    setDescription(product.description || "");
    setSatProductCode(product.satProductCode || "");
    setSatUnitCode(product.satUnitCode || "H87");
    setPrice(product.price.toString());
    setCostPrice(product.costPrice ? product.costPrice.toString() : "");
    setStock(product.stock ? product.stock.toString() : "0");
    setMinStock(product.minStock ? product.minStock.toString() : "0");
    setMaxStock(product.maxStock ? product.maxStock.toString() : "");
    setLocationShelf(product.locationShelf || "");
    setImageUrl(product.imageUrl || null);
    setType(product.type || "PRODUCT");
    
    if (product.kitComponents && Array.isArray(product.kitComponents)) {
       setKitComponents(product.kitComponents.map((k: any) => ({ componentId: k.childProductId, quantity: k.quantity.toString(), name: k.childProduct?.name })));
    } else {
       setKitComponents([]);
    }
    
    if (product.taxRate === 0.16) setTaxType("IVA_16");
    else if (product.taxRate === 0.08) setTaxType("IVA_8");
    else if (product.taxRate === 0) setTaxType("EXENTO");
    else if (product.taxRate < 0) setTaxType("RET_IVA_10_6");
    else setTaxType("IVA_16");

    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el artículo ${name} del catálogo?`)) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/products/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
         const err = await res.json().catch(() => ({}));
         alert(`No se puede eliminar el producto.\nMotivo: ${err.message || 'El artículo se encuentra en uso dentro de una factura activa.'}`);
         return;
      }
      
      fetchProducts();
      if(selectedProduct && selectedProduct.id === id) setSelectedProduct(null);
    } catch (e) {
      console.error("Error al eliminar", e);
      alert("Hubo un problema de conexión al intentar eliminar.");
    }
  };

  const fetchProducts = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
      const data = await res.json();
      setProducts(data);
      if (selectedProduct) {
         const updated = data.find((p: any) => p.id === selectedProduct.id);
         if (updated) setSelectedProduct(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    if (searchParams.get('openNew') === 'true') {
       resetForm();
       setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (selectedProduct) {
       fetchMovements(selectedProduct.id);
    }
  }, [selectedProduct]);

  const fetchMovements = async (pid: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/products/${pid}/movements`);
      if(res.ok) setMovements(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleAdjustment = async () => {
    if (!adjQty || parseFloat(adjQty) <= 0) return alert('Ingresa una cantidad válida');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
    await fetch(`${baseUrl}/products/${selectedProduct.id}/movements`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
       body: JSON.stringify({ type: adjType, quantity: adjQty, reference: adjRef })
    });
    setIsAdjusting(false);
    setAdjQty('');
    setAdjRef('');
    fetchMovements(selectedProduct.id);
    fetchProducts(); // Refresh list to get updated stock
    setTimeout(() => {
      const updated = products.find(p => p.id === selectedProduct.id);
      if(updated) setSelectedProduct(updated);
    }, 200);
  };

  if (!mounted) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

      const payload = {
        tenantId: activeTenantId,
        name,
        sku,
        description,
        satProductCode: satProductCode || '01010101',
        satUnitCode: satUnitCode || 'H87',
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        type,
        taxType,
        stock: stock ? parseFloat(stock) : 0,
        minStock: minStock ? parseFloat(minStock) : 0,
        maxStock: maxStock ? parseFloat(maxStock) : null,
        locationShelf: locationShelf || null,
        imageUrl: imageUrl,
        kitComponents: (type === 'KIT' || type === 'SERVICE') ? kitComponents : undefined
      };

      let response;
      if (editingId) {
         response = await fetch(`${baseUrl}/products/${editingId}`, {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
      } else {
         response = await fetch(`${baseUrl}/products`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
      }

      if (!response.ok) {
         const errText = await response.text();
         alert(`Error del backend al guardar producto:\n${errText}`);
         return;
      }

      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (e: any) {
      console.error(e);
      alert(`Error catch guardando producto:\n${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
     p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (p.satProductCode && p.satProductCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelect = (e: React.MouseEvent, id: string) => {
     e.stopPropagation();
     if(selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
     } else {
        setSelectedIds([...selectedIds, id]);
     }
  };

  const toggleSelectAll = () => {
     if(selectedIds.length === filteredProducts.length) {
        setSelectedIds([]);
     } else {
        setSelectedIds(filteredProducts.map(p => p.id));
     }
  };

  const handleBulkAction = async (action: string) => {
     if (action === 'Eliminar') {
        if (!confirm(`¿Estás seguro de querer intentar eliminar ${selectedIds.length} artículos?`)) return;
        
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        let successCount = 0;
        let failCount = 0;
        
        for (const id of selectedIds) {
           try {
              const res = await fetch(`${baseUrl}/products/${id}`, { method: "DELETE" });
              if (res.ok) successCount++;
              else failCount++;
           } catch {
              failCount++;
           }
        }
        
        alert(`Resultado:\n✅ Se eliminaron ${successCount} artículos.\n${failCount > 0 ? `❌ Se bloqueó la eliminación de ${failCount} artículo(s) porque ya están atados a una Factura fiscal válida.` : ''}`);
        setSelectedIds([]);
        fetchProducts();
     } else {
        alert(`Acción: ${action}`);
        setSelectedIds([]);
     }
  };

  // List View Mode
  if (!selectedProduct) {
    return (
      <div className="font-sans min-h-screen bg-[#f9fafb] relative">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-lg font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors">
                 Artículos activos <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#10b981] hover:bg-[#059669] text-white p-1.5 rounded transition-colors shadow-sm ml-2">
                 <Plus className="w-5 h-5" />
              </button>
           </div>
           
           <div className="flex border border-slate-200 rounded text-slate-400 bg-slate-50 items-center px-2 py-1 max-w-sm w-full focus-within:border-slate-400 focus-within:bg-white transition-colors">
              <Search className="w-4 h-4 mr-2 ml-1" />
              <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Nombre, SKU o Clave SAT..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-0.5 text-slate-800" 
              />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="hover:text-slate-600"><XCircle className="w-4 h-4 ml-1" /></button>}
           </div>
        </div>

        {/* Bulk Action Toolbar Overlay */}
        {selectedIds.length > 0 && (
           <div className="absolute top-[72px] left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-20 px-6 py-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => handleBulkAction('Eliminar')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-red-600 font-medium">Eliminar</button>
              
              <div className="flex items-center gap-2 ml-4">
                 <span className="bg-blue-100 text-[#2563eb] text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                 <span className="text-sm text-slate-600 font-medium">Seleccionado{selectedIds.length > 1 ? 's' : ''}</span>
              </div>

              <button onClick={() => setSelectedIds([])} className="ml-auto flex items-center text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">
                 Esc <XCircle className="w-4 h-4 ml-1" />
              </button>
           </div>
        )}

        {/* Table View */}
        <div className="bg-white overflow-x-auto min-h-[500px]">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-slate-200 text-[#64748b] text-[11px] font-bold uppercase tracking-wider bg-[#f8fafc]">
                    <th className="py-3 px-6 w-1"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} className="rounded border-slate-300" /></th>
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2">SKU</th>
                    <th className="py-3 px-2">Clave SAT</th>
                    <th className="py-3 px-2">Unidad</th>
                    <th className="py-3 px-6 text-right">Tarifa (MXN)</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {filteredProducts.map(p => (
                    <tr key={p.id} onClick={() => setSelectedProduct(p)} className={`border-b border-slate-100 cursor-pointer transition-colors group ${selectedIds.includes(p.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                       <td className="py-4 px-6" onClick={(e) => toggleSelect(e, p.id)}>
                          <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => {}} className="rounded border-slate-300" />
                       </td>
                       <td className="py-4 px-2">
                          <span className="text-[#2563eb] hover:underline font-medium flex items-center gap-2 focus:outline-none">
                             <div className="bg-slate-100 p-1 rounded-md text-slate-400">
                                {p.imageUrl ? <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${p.imageUrl}`} className="w-4 h-4 object-cover rounded-md" /> : <ImageIcon className="w-4 h-4"/>}
                             </div>
                             {p.type === 'KIT' && <span className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider align-middle">KIT</span>}
                             {p.name}
                          </span>
                       </td>
                       <td className="py-4 px-2 text-slate-500">{p.sku || '-'}</td>
                       <td className="py-4 px-2"><span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono text-xs border border-slate-200">{p.satProductCode || '-'}</span></td>
                       <td className="py-4 px-2 text-slate-500">{p.satUnitCode}</td>
                       <td className="py-4 px-6 text-right font-medium text-slate-800">{p.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                 ))}
                 {products.length === 0 && !isLoading && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400">No hay artículos aún. Da clic en el botón '+' para agregar.</td></tr>
                 )}
              </tbody>
           </table>
        </div>

        {isModalOpen && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
              {/* Product Modal Rendered below */}
              {renderProductModal()}
           </div>
        )}
      </div>
    );
  }

  // Master-Detail View Mode
  return (
    <div className="font-sans h-screen flex flex-col bg-[#f9fafb] overflow-hidden">
       {/* Toolbar */}
       <div className="flex items-center px-4 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm z-20">
           <div className="w-[320px] flex items-center gap-2 border-r border-slate-200">
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="flex items-center gap-1 text-[15px] font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors"
              >
                 Artículos activos <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => setSelectedProduct(null)} className="ml-auto mr-4 text-slate-400 hover:bg-slate-100 p-1 rounded">
                 <XCircle className="w-5 h-5"/>
              </button>
           </div>
           
           <div className="flex-1 flex justify-between items-center px-4">
              <div className="flex items-center gap-3">
                 <div className="bg-slate-100 text-slate-400 w-8 h-8 rounded border border-slate-200 flex items-center justify-center shadow-sm">
                    {selectedProduct.imageUrl ? <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${selectedProduct.imageUrl}`} className="w-full h-full object-cover rounded" /> : <ImageIcon className="w-4 h-4" />}
                 </div>
                 <h2 className="text-xl font-medium text-slate-800">
                    {selectedProduct.type === 'KIT' && <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider mr-2 align-middle">KIT</span>}
                    {selectedProduct.name}
                 </h2>
              </div>
              <div className="flex gap-2 items-center">
                 <button onClick={() => openEdit(selectedProduct)} className="border border-slate-200 bg-white hover:bg-slate-50 p-1.5 rounded text-slate-500"><FileEdit className="w-4 h-4"/></button>
                 <button onClick={() => handleDelete(selectedProduct.id, selectedProduct.name)} className="border border-slate-200 bg-white hover:bg-red-50 p-1.5 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
              </div>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar List */}
           <div className="w-[320px] overflow-y-auto bg-white border-r border-slate-200 shrink-0">
              {filteredProducts.map(p => (
                 <div 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className={`p-4 border-b border-slate-100 cursor-pointer flex justify-between group ${selectedProduct.id === p.id ? 'bg-[#f8fafc] border-l-4 border-l-[#10b981]' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                 >
                     <div className="space-y-1 overflow-hidden pr-2">
                        <p className={`text-sm font-medium truncate ${selectedProduct.id === p.id ? 'text-[#2563eb]' : 'text-slate-800'}`}>
                           {p.type === 'KIT' && <span className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider mr-1 align-middle">KIT</span>}
                           {p.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">SKU: {p.sku || 'N/A'}</p>
                     </div>
                 </div>
              ))}
           </div>

           {/* Detail View */}
           <div className="flex-1 overflow-y-auto bg-white">
              {/* TABS */}
              <div className="flex gap-8 border-b border-slate-200 pt-4 px-8 sticky top-0 bg-white z-10">
                 <button onClick={() => setActiveTab('resumen')} className={`border-b-[3px] pb-3 text-[13px] font-bold transition-colors ${activeTab === 'resumen' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Resumen</button>
                 <button onClick={() => setActiveTab('transacciones')} className={`border-b-[3px] pb-3 text-[13px] font-bold transition-colors ${activeTab === 'transacciones' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Transacciones (0)</button>
                 <button onClick={() => setActiveTab('kardex')} className={`border-b-[3px] pb-3 text-[13px] font-bold transition-colors ${activeTab === 'kardex' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Kardex (Auditoría)</button>
              </div>

              <div className="p-8 max-w-5xl">
                 {activeTab === 'resumen' ? (
                 <div className="grid grid-cols-[1fr_300px] gap-12">
                    
                    {/* Information Panel */}
                    <div className="space-y-10 text-sm">
                       
                       <div className="space-y-5">
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Tipo de artículo</div>
                             <div className="text-slate-700 font-medium">{selectedProduct.satProductCode ? 'Artículos de venta y compra' : 'Artículo Base'}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">SKU (Código de artículo)</div>
                             <div className="text-slate-700 font-medium uppercase">{selectedProduct.sku || '-'}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Código de artículo del SAT</div>
                             <div className="text-slate-700 font-medium">{selectedProduct.satProductCode || '-'}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Código de unidad del SAT</div>
                             <div className="text-slate-700 font-medium uppercase">{selectedProduct.satUnitCode}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Unidad</div>
                             <div className="text-slate-700 font-medium">pcs</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Origen creado</div>
                             <div className="text-slate-700 font-medium">Usuario</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Tax Preference</div>
                             <div className="text-slate-700 font-medium">Taxable</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Existencia Global</div>
                             <div className="text-slate-700 font-medium">{selectedProduct.stock} pz</div>
                          </div>
                          
                          {selectedProduct.warehouseStocks && selectedProduct.warehouseStocks.length > 0 && (
                              <div className="grid grid-cols-2 gap-4 items-start">
                                 <div className="text-slate-400 font-medium">Distribución (Bodegas)</div>
                                 <div className="flex flex-col gap-1">
                                     {selectedProduct.warehouseStocks.map((ws: any) => (
                                         <div key={ws.warehouseId} className="flex justify-between items-center text-sm bg-slate-50 border border-slate-100 rounded px-2 py-1">
                                             <span className="font-bold text-slate-600">{ws.warehouse?.name}</span>
                                             <span className="text-emerald-600 font-black">{ws.stock} pz</span>
                                         </div>
                                     ))}
                                 </div>
                              </div>
                          )}
                       </div>
                       
                       <div className="space-y-5 pt-4 border-t border-slate-100">
                          <h4 className="font-bold text-slate-800 text-base mb-4">Información de la compra</h4>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Precio de costo</div>
                             <div className="text-slate-700 font-medium">MXN{(selectedProduct.price * 0.7).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Cuenta de compra</div>
                             <div className="text-slate-700 font-medium">Costes de productos vendidos</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Impuesto</div>
                             <div className="text-slate-700 font-medium">Tipo estándar [{selectedProduct.taxRate * 100}%]</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-start">
                             <div className="text-slate-400 font-medium">Descripción</div>
                             <div className="text-slate-600 leading-relaxed max-w-sm">{selectedProduct.description || 'El producto está diseñado para ofrecer una experiencia visual de alta calidad... Leer Más'}</div>
                          </div>
                       </div>

                       <div className="space-y-5 pt-4 border-t border-slate-100 pb-10">
                          <h4 className="font-bold text-slate-800 text-base mb-4">Información de ventas</h4>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Precio de venta</div>
                             <div className="text-slate-700 font-medium">MXN{selectedProduct.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Cuenta de ventas</div>
                             <div className="text-slate-700 font-medium">Ventas</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-slate-400 font-medium">Impuesto</div>
                             <div className="text-slate-700 font-medium">Tipo estándar</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 items-start">
                             <div className="text-slate-400 font-medium">Descripción</div>
                             <div className="text-slate-600 leading-relaxed max-w-sm">{selectedProduct.description || 'El producto está diseñado para ofrecer una experiencia visual de alta calidad... Leer Más'}</div>
                          </div>
                       </div>

                    </div>

                    <div className="pt-4">
                       <label className="border border-slate-200 bg-white rounded-xl overflow-hidden flex flex-col justify-center items-center h-48 w-48 mx-auto group cursor-pointer relative shadow-sm">
                          {selectedProduct.imageUrl ? (
                             <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${selectedProduct.imageUrl}`} className="w-full h-full object-cover" />
                          ) : (
                             <Package className="w-16 h-16 text-slate-200 group-hover:scale-110 transition-transform" />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-white/90 border-t border-slate-100 py-2 hidden group-hover:block transition-all text-center">
                             <span className="text-[#2563eb] font-medium text-xs">Cambiar imagen <span className="ml-1 opacity-50">📷</span></span>
                          </div>
                          <input 
                             type="file" 
                             className="hidden" 
                             accept="image/*"
                             onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(!file) return;
                               const fd = new FormData();
                               fd.append('file', file);
                               const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
                               
                               const res = await fetch(`${baseUrl}/products/upload-image`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` },
                                  body: fd
                               });
                               
                               if(res.ok) {
                                  const d = await res.json();
                                  await fetch(`${baseUrl}/products/${selectedProduct.id}`, {
                                     method: 'PATCH',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ imageUrl: d.imageUrl, tenantId: activeTenantId })
                                  });
                                  setSelectedProduct({...selectedProduct, imageUrl: d.imageUrl});
                                  fetchProducts(); 
                               } else {
                                  alert('Error al subir imagen');
                               }
                             }}
                          />
                       </label>
                    </div>

                 </div>
                 ) : activeTab === 'kardex' ? (
                    <div className="animate-in fade-in">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-slate-800 text-lg">Historial de Movimientos (Kardex)</h3>
                          {(selectedProduct.type === 'PRODUCT' || selectedProduct.type === 'CONSUMABLE') && (
                             <button onClick={() => setIsAdjusting(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">+ Ajuste Manual</button>
                          )}
                       </div>
                       
                       {isAdjusting && (
                          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
                             <h4 className="font-bold text-slate-700 mb-3">Registrar Movimiento Extraordinario</h4>
                             <div className="flex gap-4">
                                <select value={adjType} onChange={e=>setAdjType(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium w-32">
                                   <option value="IN">Entrada (+)</option>
                                   <option value="OUT">Salida (-)</option>
                                   <option value="ADJUSTMENT">Ajuste</option>
                                </select>
                                <input type="number" value={adjQty} onChange={e=>setAdjQty(e.target.value)} placeholder="Cantidad" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm w-32" />
                                <input type="text" value={adjRef} onChange={e=>setAdjRef(e.target.value)} placeholder="Motivo (Ej. Merma, Recibo)" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1" />
                                <button onClick={handleAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Guardar</button>
                                <button onClick={() => setIsAdjusting(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold">Cerrar</button>
                             </div>
                          </div>
                       )}

                       <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-sm">
                             <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                   <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Fecha / Hora</th>
                                   <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Tipo</th>
                                   <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Cantidad</th>
                                   <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Motivo / Referencia</th>
                                </tr>
                             </thead>
                             <tbody>
                                {movements.length === 0 ? (
                                   <tr><td colSpan={4} className="py-8 text-center text-slate-400">No hay movimientos registrados para este artículo.</td></tr>
                                ) : (
                                   movements.map((m, i) => (
                                      <tr key={m.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                         <td className="py-3 px-4 text-slate-600 font-medium">
                                            {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         </td>
                                         <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${m.type==='IN'?'bg-emerald-100 text-emerald-700': m.type==='SALE'?'bg-blue-100 text-blue-700':'bg-rose-100 text-rose-700'}`}>
                                               {m.type}
                                            </span>
                                         </td>
                                         <td className={`py-3 px-4 font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                         </td>
                                         <td className="py-3 px-4 text-slate-500">{m.reference || '-'}</td>
                                      </tr>
                                   ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 ) : (
                    <div className="py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                       <FileText className="w-10 h-10 mb-2 opacity-50" />
                       <p className="font-medium text-sm">Contenido en construcción para la pestaña: <span className="capitalize">{activeTab}</span></p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {isModalOpen && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
              {renderProductModal()}
           </div>
        )}
    </div>
  );

  function renderProductModal() {
     return (
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in-95 duration-200">
           <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? "Editar Artículo" : "Nuevo Artículo"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5"/>
              </button>
           </div>
           
           <div className="px-6 pt-5 pb-5 overflow-y-auto max-h-[80vh]">
              {/* Foto de Producto */}
              <div className="flex flex-col items-center mb-6">
                 <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                    {imageUrl ? (
                       <img src={`${process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api"}${imageUrl}`} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                       <span className="text-slate-400 text-xs font-medium text-center px-2">📷 <br/>Agregar<br/>Foto</span>
                    )}
                    <input 
                       type="file" 
                       className="absolute inset-0 opacity-0 cursor-pointer" 
                       accept="image/*"
                       onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if(!file) return;
                         const fd = new FormData();
                         fd.append('file', file);
                         const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
                         const res = await fetch(`${baseUrl}/products/upload-image`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: fd
                         });
                         if(res.ok) {
                            const d = await res.json();
                            setImageUrl(d.imageUrl);
                         } else {
                            alert('Error al subir imagen');
                         }
                       }}
                    />
                 </div>
                 <span className="text-[10px] text-slate-400 font-medium mt-2">Opcional (JPG/PNG)</span>
              </div>
           <div className="p-6 space-y-5">
              <div className="grid grid-cols-[2fr_1fr] gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nombre del Concepto</label>
                    <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Suscripción Mensual" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">SKU</label>
                    <input type="text" value={sku} onChange={e=>setSku(e.target.value)} placeholder="SRV-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium uppercase" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Descripción de Venta (Opcional)</label>
                 <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Detalles visibles en la factura..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium h-20 resize-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Clave Prod/Serv (SAT)</label>
                    <input 
                      type="text" 
                      list="sat-codes-prods"
                      value={satProductCode} 
                      onChange={e=>setSatProductCode(e.target.value)} 
                      placeholder="Ej. 81112101" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" 
                    />
                    <datalist id="sat-codes-prods">
                       {satCatalogsOptions.map((opt) => (
                           <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                       ))}
                       {satCatalogsOptions.length === 0 && <option value="01010101">01010101 - No existe en el catálogo</option>}
                    </datalist>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Unidad (SAT)</label>
                    <input type="text" value={satUnitCode} onChange={e=>setSatUnitCode(e.target.value)} placeholder="E48" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium uppercase" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tipo de Artículo</label>
                    <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium appearance-none">
                       <option value="PRODUCT">Inventario (Físico)</option>
                       <option value="SERVICE">Servicio Mantenimiento</option>
                       <option value="CONSUMABLE">Consumible</option>
                       <option value="KIT">Kit / Combo</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Impuesto de Venta</label>
                    <select value={taxType} onChange={e=>setTaxType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium appearance-none">
                       <option value="IVA_16">IVA 16%</option>
                       <option value="IVA_8">IVA 8%</option>
                       <option value="EXENTO">Exento</option>
                       <option value="RET_IVA_10_6">Ret. IVA 10.66%</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Precio Compra (Opcional)</label>
                    <input type="number" value={costPrice} onChange={e=>setCostPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-500 font-bold text-slate-500" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Precio Venta Base</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-bold text-blue-600" />
                 </div>
              </div>

              {/* Inventory Control Section */}
              {(type === 'PRODUCT' || type === 'CONSUMABLE') && (
                 <div className="space-y-4 mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Stock Actual</label>
                          <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="Ej. 50" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-bold" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Min. Stock</label>
                          <input type="number" value={minStock} onChange={e=>setMinStock(e.target.value)} placeholder="Alerta" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 font-medium text-orange-600" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Max. Stock</label>
                          <input type="number" value={maxStock} onChange={e=>setMaxStock(e.target.value)} placeholder="Límite" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-medium text-emerald-600" />
                       </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Ubicación Física en Bodega (WMS)</label>
                        <input type="text" value={locationShelf} onChange={e=>setLocationShelf(e.target.value)} placeholder="Ej. Pasillo 3, Estante B" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                 </div>
              )}

              {/* BOM Recipe Section */}
              {(type === 'KIT' || type === 'SERVICE') && (
                 <div className="mt-6 bg-slate-100 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Receta de Consumibles/Partes (BOM)</h3>
                    <div className="space-y-3">
                       {kitComponents.map((kc, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                             <div className="flex-1">
                               <select 
                                  value={kc.componentId} 
                                  onChange={e => {
                                     const newComps = [...kitComponents];
                                     newComps[idx].componentId = e.target.value;
                                     newComps[idx].name = products.find(p => p.id === e.target.value)?.name;
                                     setKitComponents(newComps);
                                  }} 
                                  className="w-full bg-transparent text-sm focus:outline-none font-medium text-slate-700"
                               >
                                  <option value="">[ Seleccionar Artículo ]</option>
                                  {products.filter(p => p.type !== 'KIT' && p.type !== 'SERVICE').map(p => (
                                     <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                               </select>
                             </div>
                             <div className="w-24">
                               <input 
                                  type="number" 
                                  value={kc.quantity} 
                                  onChange={e => {
                                     const newComps = [...kitComponents];
                                     newComps[idx].quantity = e.target.value;
                                     setKitComponents(newComps);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-center"
                                  placeholder="Cant."
                               />
                             </div>
                             <button 
                                onClick={() => setKitComponents(kitComponents.filter((_, i) => i !== idx))} 
                                className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"
                             >
                                <XCircle className="w-4 h-4" />
                             </button>
                          </div>
                       ))}
                       <button 
                          onClick={() => setKitComponents([...kitComponents, { componentId: '', quantity: '1' }])} 
                          className="w-full border-2 border-dashed border-slate-300 rounded-lg py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                       >
                          + Añadir Componente a la Receta
                       </button>
                    </div>
                 </div>
              )}
           </div>
           </div>

           <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-all flex items-center gap-2">
                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                 {editingId ? "Actualizar" : "Guardar"}
              </button>
           </div>
        </div>
     );
  }
}
