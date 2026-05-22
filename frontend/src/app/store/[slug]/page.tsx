"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStore, Product } from "./StoreContext";
import { Search, ShoppingCart, Package, Filter, Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

export default function StorePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string || "default";
  const { addToCart, globalSearchTerm, setGlobalSearchTerm, currency, includeIva } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset to page 1 on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [globalSearchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = activeFilter ? activeFilter : debouncedSearch;
        const res = await axios.get(`${API_URL}/public-store/${slug}/products?search=${encodeURIComponent(q)}&page=${currentPage}`, {
           signal: controller.signal
        });
        if (res.data && res.data.products) {
          setProducts(res.data.products);
          setTotalPages(res.data.paginas || 1);
        }
      } catch (error: any) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error(error);
        }
      }
      setLoading(false);
    };

    fetchProducts();
    
    return () => {
       controller.abort();
    };
  }, [debouncedSearch, activeFilter, currentPage]);

  const handleFilterClick = (term: string) => {
    setActiveFilter(term);
    setGlobalSearchTerm("");
    setShowMobileFilters(false);
    window.scrollTo(0,0);
  };

  const getDisplayPrice = (product: any) => {
    let price = product.price;
    // If currency is USD, divide by the actual exchange rate from the API, default to 18.0
    if (currency === 'USD') {
      const exRate = product.exchangeRate || 18.0;
      price = price / exRate;
    }
    // Backend returns price WITH IVA. If includeIva is false, remove it.
    if (!includeIva) {
      price = price / 1.16;
    }
    return price; 
  };

  const FilterContent = () => (
    <>
      <div className="flex items-center justify-between mb-6">
         <h3 className="font-black tracking-tight text-xl text-slate-800 flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" /> Filtros</h3>
         {showMobileFilters && (
            <button onClick={() => setShowMobileFilters(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
               x
            </button>
         )}
      </div>
      
      <div className="space-y-8">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Marcas Populares</h4>
          <ul className="space-y-1">
            {['MIKROTIK', 'UBIQUITI', 'TP-LINK', 'HIKVISION', 'EPCOM', 'Dahua'].map(brand => (
              <li key={brand}>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
                  <input 
                    type="checkbox" 
                    checked={activeFilter === brand}
                    onChange={() => handleFilterClick(activeFilter === brand ? "" : brand)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className={`text-sm font-medium transition-colors ${activeFilter === brand ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{brand}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Categoras</h4>
          <ul className="space-y-1">
            {['Enlaces PtP y PtMP', 'Redes Inalmbricas', 'Switches y Routers', 'Cmaras de Seguridad', 'Cableado Estructurado', 'Accesorios'].map(cat => (
              <li key={cat}>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
                  <input 
                    type="checkbox" 
                    checked={activeFilter === cat}
                    onChange={() => handleFilterClick(activeFilter === cat ? "" : cat)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                  />
                  <span className={`text-sm font-medium transition-colors ${activeFilter === cat ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{cat}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 flex flex-col lg:flex-row gap-8 relative">
      {/* Desktop Sidebar (Filtros) */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-28 shadow-sm">
          <FilterContent />
        </div>
      </aside>

      {/* Mobile Sidebar Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-80 max-w-[80%] bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left">
            <FilterContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls Bar (Mobile Only) */}
        <div className="lg:hidden bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 w-full">
            <Button onClick={() => setShowMobileFilters(true)} variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold">
               <Menu className="w-5 h-5 mr-2" /> Mostrar Filtros y Categorías
            </Button>
          </div>
        </div>
        
        {/* Active Filter Pill */}
        {activeFilter && (
           <div className="mb-6 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtrando por:</span>
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                 {activeFilter}
                 <button onClick={() => handleFilterClick("")} className="hover:bg-blue-200 rounded-full p-0.5"><span className="sr-only">Quitar filtro</span> x</button>
              </div>
           </div>
        )}

        {/* Main Product Grid */}
        {loading ? (
          <div className="flex justify-center py-32">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold">No encontramos productos</h3>
            <p className="text-slate-500">Intenta con otra palabra clave o limpia los filtros.</p>
            {activeFilter && (
              <Button onClick={() => handleFilterClick("")} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md shadow-blue-500/20">
                Ver Todo el Catlogo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map(product => (
              <div 
                key={product.id} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all group flex flex-col cursor-pointer relative"
              >
                {/* Quick Add Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                  disabled={product.stock <= 0}
                  className="absolute bottom-4 right-4 z-10 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  title="Agregar al carrito rpido"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>

                <div onClick={() => router.push(`/store/${slug}/product/${product.id}`)} className="aspect-square bg-white p-4 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="h-12 w-12 text-slate-200" />
                  )}
                  
                  {/* Tags */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.stock > 0 ? (
                      <div className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Stock: {product.stock}
                      </div>
                    ) : (
                      <div className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Agotado
                      </div>
                    )}
                    {product.source === 'local' && (
                      <div className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        RadioTec
                      </div>
                    )}
                  </div>
                </div>
                <div onClick={() => router.push(`/store/${slug}/product/${product.id}`)} className="p-3 md:p-4 flex flex-col flex-1 pb-16">
                  <div className="text-[10px] md:text-xs font-bold text-blue-600 mb-1 tracking-wide">{product.brand || 'GENRICO'}</div>
                  <h3 className="font-semibold text-xs md:text-sm text-slate-800 line-clamp-3 mb-2 flex-1 group-hover:text-blue-700 transition-colors" title={product.title}>
                    {product.title}
                  </h3>
                  <div className="mt-auto">
                    <div className="text-xs md:text-sm text-slate-400 line-through mb-0.5">
                      ${(getDisplayPrice(product) * 1.15).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                      ${getDisplayPrice(product).toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-[10px] md:text-xs text-slate-500 font-medium block sm:inline">{currency} {includeIva ? 'IVA inc.' : '+ IVA'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center pb-8">
             <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-2">
                <Button 
                   variant="ghost" 
                   disabled={currentPage === 1} 
                   onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo(0,0); }}
                   className="font-bold text-slate-500 hover:text-slate-900 h-10 px-4"
                >
                   Anterior
                </Button>
                <div className="hidden sm:flex items-center gap-1 px-2">
                   <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                      {currentPage}
                   </div>
                   <span className="text-slate-400 font-medium px-2">de {totalPages}</span>
                </div>
                <div className="sm:hidden flex items-center px-4 font-bold text-slate-700">
                   {currentPage} / {totalPages}
                </div>
                <Button 
                   variant="ghost" 
                   disabled={currentPage >= totalPages} 
                   onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo(0,0); }}
                   className="font-bold text-slate-500 hover:text-slate-900 h-10 px-4"
                >
                   Siguiente
                </Button>
             </div>
          </div>
        )}

      </div>
    </main>
  );
}
