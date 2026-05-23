"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStore } from "../../StoreContext";
import { ArrowLeft, Package, Check, X, Tag, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const slug = params.slug as string;
  
  const { addToCart, currency, includeIva } = useStore();

  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      const controller = new AbortController();
      setLoading(true);
      axios.get(`${API_URL}/public-store/${slug}/products/${productId}`, { signal: controller.signal })
        .then(res => {
           setProductData(res.data);
           setActiveImage(res.data.imageUrl || null);
           
           if (!res.data.alternativas || res.data.alternativas.length === 0) {
              const query = res.data.brand && res.data.brand !== 'Local' ? res.data.brand : res.data.category;
              if (query) {
                 axios.get(`${API_URL}/public-store/${slug}/products?search=${encodeURIComponent(query)}&page=1`, { signal: controller.signal })
                   .then(altRes => {
                      if (altRes.data && altRes.data.products) {
                         const alts = altRes.data.products.filter((p: any) => String(p.id) !== String(productId)).slice(0, 4);
                         setProductData((prev: any) => ({ ...prev, alternativas: alts }));
                      }
                   }).catch(() => {});
              }
           }
        })
        .catch(err => {
           if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
              console.error(err);
           }
        })
        .finally(() => setLoading(false));

      return () => controller.abort();
    }
  }, [productId]);

  const getDisplayPrice = (product: any) => {
    let price = product.price;
    const exRate = product.exchangeRate || 18.0;

    if (product.source === 'syscom') {
       price = price * exRate; // Syscom price is USD without IVA. Convert to MXN.
       if (includeIva) price = price * 1.16; // Add IVA if requested
    } else {
       if (!includeIva) price = price / 1.16; // Local price is MXN with IVA. Remove if requested.
    }
    
    if (currency === 'USD') {
      price = price / exRate;
    }
    return price;
  };

  const handleConsultAvailability = (p: any) => {
     window.open(`https://wa.me/526421644126?text=Hola, me interesa saber la disponibilidad del modelo ${p.model}`, '_blank');
  };

  if (loading || !productData) {
     return (
        <div className="container mx-auto px-4 py-32 flex justify-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
     );
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
       <Button variant="ghost" onClick={() => router.push(`/store/${slug}`)} className="mb-4 text-slate-500 hover:text-blue-600 -ml-4 font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al catálogo
       </Button>
       
       <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {/* Top Section: Images and Main Details */}
          <div className="flex flex-col lg:flex-row border-b border-slate-100">
             {/* Image Gallery */}
             <div className="w-full lg:w-1/2 p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 bg-white">
                <div className="aspect-square relative flex items-center justify-center bg-white rounded-2xl border border-slate-100 p-4 mb-4">
                   {activeImage ? (
                     <img src={activeImage} alt={productData.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                   ) : (
                     <Package className="h-32 w-32 text-slate-200" />
                   )}
                   {productData.brand && (
                     <div className="absolute top-4 left-4 opacity-10 text-4xl font-black uppercase tracking-tighter">
                       {productData.brand}
                     </div>
                   )}
                </div>
                {/* Thumbnails */}
                {productData.imagenesExtra && productData.imagenesExtra.length > 0 && (
                   <div className="flex gap-2 overflow-x-auto pb-2">
                      {[productData.imageUrl, ...productData.imagenesExtra.map((i:any)=>i.imagen)].filter(Boolean).map((imgUrl: string, idx: number) => (
                         <button key={idx} onClick={() => setActiveImage(imgUrl)} className={`w-20 h-20 shrink-0 rounded-lg border-2 p-1 bg-white ${activeImage === imgUrl ? 'border-blue-600' : 'border-slate-200 hover:border-blue-300'}`}>
                            <img src={imgUrl} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                         </button>
                      ))}
                   </div>
                )}
             </div>

             {/* Details Area */}
             <div className="w-full lg:w-1/2 p-6 md:p-10 bg-slate-50 flex flex-col">
                <div className="mb-3">
                   <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">
                     {productData.brand || 'Genérico'}
                   </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4">
                   {productData.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-6">
                   <div><span className="font-semibold text-slate-800">Modelo:</span> {productData.model}</div>
                   <div><span className="font-semibold text-slate-800">SAT:</span> 43222609</div>
                   {productData.source === 'syscom' && <div className="text-blue-600 font-semibold bg-blue-50 px-2 rounded border border-blue-100">Distribución Oficial</div>}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                   <div className="text-sm text-slate-500 line-through mb-1">Precio de Lista: ${(getDisplayPrice(productData) * 1.15).toLocaleString('es-MX', {minimumFractionDigits: 2})} {currency}</div>
                   <div className="text-4xl md:text-5xl font-black text-slate-900">
                     ${(getDisplayPrice(productData)).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                     <span className="text-base text-slate-500 font-medium ml-2 block sm:inline">{currency} {includeIva ? 'IVA inc.' : '+ IVA'}</span>
                   </div>
                </div>

                {/* Add to Cart Area */}
                <div className="mt-auto">
                   <div className={`font-bold flex items-center gap-2 text-sm mb-4 ${productData.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {productData.stock > 0 ? <><Check className="w-5 h-5"/> {productData.stock} unidades listas para envío</> : <><X className="w-5 h-5"/> Agotado temporalmente</>}
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden h-14 w-full sm:w-auto shadow-sm">
                         <button onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))} className="flex-1 sm:px-4 text-slate-500 hover:bg-slate-50 h-full font-bold text-xl">-</button>
                         <span className="w-16 text-center font-bold text-slate-900 text-lg border-x border-slate-200">{detailQuantity}</span>
                         <button onClick={() => setDetailQuantity(detailQuantity + 1)} className="flex-1 sm:px-4 text-slate-500 hover:bg-slate-50 h-full font-bold text-xl">+</button>
                      </div>
                      {productData.stock > 0 ? (
                         <Button onClick={() => addToCart(productData, detailQuantity)} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all">
                            Agregar al Carrito
                         </Button>
                      ) : (
                         <Button onClick={() => handleConsultAvailability(productData)} className="flex-1 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-slate-500/30 transition-all">
                            Consultar Disponibilidad
                         </Button>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Middle Section: Specs and Resources */}
          <div className="flex flex-col md:flex-row border-b border-slate-100">
             <div className="w-full md:w-2/3 p-6 md:p-10 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                {productData.caracteristicas && productData.caracteristicas.length > 0 && (
                   <div className="mb-10">
                      <h3 className="text-2xl font-black text-slate-900 mb-6">Características Principales</h3>
                      <ul className="space-y-3">
                         {productData.caracteristicas.map((c:string, idx:number) => (
                            <li key={idx} className="flex gap-3 text-slate-700">
                               <div className="mt-1 shrink-0"><Check className="w-4 h-4 text-emerald-500" /></div>
                               <span dangerouslySetInnerHTML={{__html: c}} className="text-sm leading-relaxed" />
                            </li>
                         ))}
                      </ul>
                   </div>
                )}
                
                {productData.description && (
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-6">Especificaciones</h3>
                      {/* Styled container to handle raw HTML from Syscom gracefully */}
                      <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed
                                    [&>img]:rounded-xl [&>img]:border [&>img]:border-slate-200 [&>img]:my-6 [&>img]:mx-auto [&>img]:max-w-full
                                    [&>table]:w-full [&>table]:border-collapse [&>table]:my-6
                                    [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:p-3 [&>table>tbody>tr>td]:border-slate-200
                                    [&>table>tbody>tr:nth-child(odd)]:bg-slate-50
                                    [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-6
                                    [&>p]:mb-4"
                           dangerouslySetInnerHTML={{__html: productData.description}} />
                   </div>
                )}
             </div>

             <div className="w-full md:w-1/3 p-6 md:p-10 bg-slate-50">
                <h3 className="text-xl font-black text-slate-900 mb-6">Recursos y Descargas</h3>
                {productData.resources && productData.resources.length > 0 ? (
                   <div className="space-y-3">
                      {productData.resources.map((r:any, idx:number) => (
                         <a key={idx} href={r.path} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                               <Tag className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                               <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{r.recurso || 'Documento PDF'}</div>
                               <div className="text-[10px] text-slate-400">Ver / Descargar</div>
                            </div>
                         </a>
                      ))}
                   </div>
                ) : (
                   <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                     <Tag className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                     <p className="text-sm text-slate-500 font-medium">No hay descargas disponibles para este equipo.</p>
                   </div>
                )}
             </div>
          </div>

          {/* Bottom Section: Alternatives */}
          {productData.alternativas && productData.alternativas.length > 0 && (
             <div className="p-6 md:p-10 bg-slate-50">
                <h3 className="text-xl font-black text-slate-900 mb-6">Alternativas Similares</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {productData.alternativas.map((alt:any) => (
                      <div key={alt.id} onClick={() => router.push(`/store/${slug}/product/${alt.id}`)} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col">
                         <div className="aspect-square p-4 flex items-center justify-center relative border-b border-slate-100">
                            {alt.imageUrl ? (
                              <img src={alt.imageUrl} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" alt="" />
                            ) : (
                              <Package className="w-10 h-10 text-slate-200" />
                            )}
                            {alt.stock > 0 && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); addToCart(alt, 1); }}
                                 className="absolute bottom-2 right-2 bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white p-2 rounded-full shadow-sm transition-colors z-10"
                               >
                                 <ShoppingCart className="w-4 h-4" />
                               </button>
                             )}
                         </div>
                         <div className="p-3 flex flex-col flex-1">
                            <div className="text-[10px] font-bold text-blue-600 mb-1">{alt.brand || 'GENÉRICO'}</div>
                            <div className="text-xs font-semibold text-slate-800 line-clamp-2 mb-2 flex-1">{alt.title}</div>
                            <div className="font-black text-slate-900 text-sm">
                               ${getDisplayPrice(alt).toLocaleString('es-MX', {minimumFractionDigits:2})} <span className="text-[9px] text-slate-400">{currency}</span>
                            </div>
                            <div className="mt-2 text-[10px] font-bold">
                               {alt.stock > 0 ? (
                                  <span className="text-emerald-600 flex items-center gap-1"><Package className="w-3 h-3"/> {alt.stock} disponibles</span>
                               ) : (
                                  <span className="text-red-500 flex items-center gap-1"><X className="w-3 h-3"/> Agotado</span>
                               )}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
       </div>
    </main>
  );
}
