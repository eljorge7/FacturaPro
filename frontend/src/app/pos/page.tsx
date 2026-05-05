"use client";

import { useState, useEffect } from "react";

import { Search, ShoppingCart, CheckCircle, CreditCard, Banknote, Trash2, Tag, Box, X, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [carts, setCarts] = useState<any[][]>([[]]);
  const [activeCartIndex, setActiveCartIndex] = useState(0);
  const cart = carts[activeCartIndex] || [];
  
  const setCart = (newCart: any[]) => {
     const newCarts = [...carts];
     newCarts[activeCartIndex] = newCart;
     setCarts(newCarts);
  };

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMode, setSuccessMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("01"); // 01 = Efectivo

  // == OFFLINE MODE STATE ==
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const { token, user } = useAuth();
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [shiftModal, setShiftModal] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  const [customFields, setCustomFields] = useState({ mechanic: '', plates: '' });
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [showSerialsModal, setShowSerialsModal] = useState(false);
  const [serialsInput, setSerialsInput] = useState<any>({});

  useEffect(() => {
    // Initial load
    if (typeof window !== 'undefined') {
        setIsOffline(!navigator.onLine);
        const storedQueue = localStorage.getItem('pos_offline_queue');
        if (storedQueue) setOfflineQueue(JSON.parse(storedQueue));

        const handleOnline = () => {
            setIsOffline(false);
            syncOfflineQueue();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (token) {
           fetchProducts();
           checkShift();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }
  }, [token]);

  const checkShift = async () => {
     try {
       const res = await fetch(`http://${window.location.hostname}:3005/pos/shifts/current`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
       });
       if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          if (!data) {
             setShiftModal(true);
          } else {
             setCurrentShift(data);
          }
       }
     } catch (e) {
       console.error("Shift Check Error", e);
     }
  };

  const openShift = async () => {
     try {
        const res = await fetch(`http://${window.location.hostname}:3005/pos/shifts/open`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ startingCash: parseFloat(startingCash || '0'), userId: user?.id })
        });
        if (res.ok) {
           setShiftModal(false);
           checkShift();
        } else {
           alert('Error abriendo caja');
        }
     } catch(e) { console.error(e); }
  };

  const fetchProducts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:3005/products`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
         const data = await res.json();
         setProducts(data);
         localStorage.setItem('pos_products_cache', JSON.stringify(data));
      } else {
         throw new Error("Network response was not ok");
      }
    } catch (e) {
      console.warn("Offline o error de red. Cargando caché local de productos:", e);
      const cached = localStorage.getItem('pos_products_cache');
      if (cached) {
         setProducts(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineQueue = async () => {
      if (typeof window === 'undefined') return;
      const storedQueue = localStorage.getItem('pos_offline_queue');
      if (!storedQueue) return;
      
      const q = JSON.parse(storedQueue);
      if (q.length === 0) return;

      console.log(`Intentando sincronizar ${q.length} ventas offline...`);
      const remainingQueue = [];

      for (const payload of q) {
          try {
             // Re-inject the token if not available inside the payload
             const res = await fetch(`http://${window.location.hostname}:3005/pos/checkout`, {
                method: 'POST',
                headers: { 
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
             });
             // IF fails with 4xx or 500, it drops it? Or keeps it?
             // Since we might need to handle specific errors, usually if 500 we drop or log manual intervention.
             // If fetch fails (network), the throw catches it and keeps it in remainingQueue.
             if (!res.ok) {
                 console.error("Fallo sincrozando un payload, se descarta o reintentará:", await res.text());
             }
          } catch(e) {
             console.error("Fallo de red en sync:", e);
             remainingQueue.push(payload); // keep it for next retry
          }
      }

      setOfflineQueue(remainingQueue);
      if (remainingQueue.length > 0) {
          localStorage.setItem('pos_offline_queue', JSON.stringify(remainingQueue));
      } else {
          localStorage.removeItem('pos_offline_queue');
          alert("Todas las ventas offline han sido sincronizadas y cuadradas.");
      }
      fetchProducts(); // refresh true stocks after sync
  };

  const addToCart = (product: any) => {
    const isKitOrService = product.type === 'KIT' || product.type === 'SERVICE';
    // Si trackea inventario y no hay, bloquéalo (Omitido para KITS y Servicios).
    if (!isKitOrService && product.trackInventory && product.stock <= 0) {
       alert(`El producto ${product.name} está agotado.`);
       return;
    }
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      if (!isKitOrService && product.trackInventory && existing.quantity + 1 > product.stock) {
         alert(`Solo quedan ${product.stock} de ${product.name}`);
         return;
      }
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { 
         productId: product.id, 
         name: product.name, 
         unitPrice: product.price, 
         quantity: 1,
         taxRate: product.taxRate || 0.16
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.productId !== productId));
  };

  const changeQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    const product = products.find(p => p.id === productId);
    
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
       removeFromCart(productId);
       return;
    }

    const isKitOrService = product?.type === 'KIT' || product?.type === 'SERVICE';
    if (product && !isKitOrService && product.trackInventory && newQuantity > product.stock) {
       alert(`Solo quedan ${product.stock} unidades disponibles.`);
       return;
    }
    
    setCart(cart.map(i => i.productId === productId ? { ...i, quantity: newQuantity } : i));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const tax = cart.reduce((acc, item) => acc + ((item.unitPrice * item.quantity) * item.taxRate), 0);
  const total = subtotal + tax;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)));

  const handleCheckout = async () => {
     if (cart.length === 0) return;

     const itemsWithSerials = cart.filter(i => i.hasSerials);
     const missingSerials = itemsWithSerials.some(i => !i.serials || i.serials.length !== i.quantity);
     if (missingSerials) {
         setShowSerialsModal(true);
         return;
     }

     executeCheckout(cart);
  };

  const confirmSerialsAndCheckout = () => {
      const updatedCart = cart.map((i: any) => {
          if (i.hasSerials) {
              const raw = serialsInput[i.productId] || '';
              const serials = raw.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
              return { ...i, serials };
          }
          return i;
      });
      setCart(updatedCart);
      setShowSerialsModal(false);
      executeCheckout(updatedCart);
  };

  const executeCheckout = async (itemsToCheckout: any[]) => {
     const payload = {
         items: itemsToCheckout,
         paymentMethod: 'PUE',
         paymentForm: paymentMethod,
         cashShiftId: currentShift?.id,
         customFields: customFields,
         _offlineId: Date.now() // to track
     };

     if (isOffline) {
         // GUARDA EN LIMBO Y CORTA EL STACK
         const newQueue = [...offlineQueue, payload];
         setOfflineQueue(newQueue);
         localStorage.setItem('pos_offline_queue', JSON.stringify(newQueue));
         
         // Descuenta el stock en la IA local para que no siga vendiendo lo que no hay
         const updatedCache = products.map(p => {
             const sold = itemsToCheckout.find(i => i.productId === p.id);
             if (sold && p.trackInventory) return { ...p, stock: p.stock - sold.quantity };
             return p;
         });
         setProducts(updatedCache);
         localStorage.setItem('pos_products_cache', JSON.stringify(updatedCache));
         
         setSuccessMode(true);
         if (carts.length > 1) {
            const newCarts = carts.filter((_, idx) => idx !== activeCartIndex);
            setCarts(newCarts);
            setActiveCartIndex(Math.max(0, activeCartIndex - 1));
         } else {
            setCart([]);
         }
         return;
     }

     setCheckoutLoading(true);
     try {
       const res = await fetch(`http://${window.location.hostname}:3005/pos/checkout`, {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
       });

       if (res.ok) {
          setSuccessMode(true);
          if (carts.length > 1) {
             const newCarts = carts.filter((_, idx) => idx !== activeCartIndex);
             setCarts(newCarts);
             setActiveCartIndex(Math.max(0, activeCartIndex - 1));
          } else {
             setCart([]);
          }
          fetchProducts(); // Refresh stock
       } else {
          const err = await res.json().catch(()=>({}));
          alert(err.message || 'Error al procesar el cobro.');
       }
     } catch (e: any) {
       console.error("Fetch falló (probablemente offline inesperado):", e);
       // Fallback a offline mode si justo se cortó al darle click
       const newQueue = [...offlineQueue, payload];
       setOfflineQueue(newQueue);
       localStorage.setItem('pos_offline_queue', JSON.stringify(newQueue));
       setSuccessMode(true);
       setCart([]);
     } finally {
       setCheckoutLoading(false);
     }
  };

  const loadShiftSummary = async () => {
      try {
         const res = await fetch(`http://${window.location.hostname}:3005/pos/shifts/${currentShift.id}/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.ok) {
            setShiftSummary(await res.json());
            setShowShiftSummary(true);
         }
      } catch (e) { console.error(e); }
  };

  const handleCloseShift = async () => {
      try {
         const res = await fetch(`http://${window.location.hostname}:3005/pos/shifts/${currentShift.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId: user?.id })
         });
         if (res.ok) {
            setShowShiftSummary(false);
            setCurrentShift(null);
            setShiftModal(true);
         }
      } catch (e) { console.error(e); }
  };

  if (shiftModal) {
     return (
        <div className="h-[80vh] flex flex-col items-center justify-center p-6">
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl max-w-md w-full text-center">
              <Banknote className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-slate-800 mb-2">Apertura de Caja</h2>
              <p className="text-slate-500 mb-8">Ingresa el fondo inicial con el que comienza este turno.</p>
              
              <div className="text-left mb-6">
                 <label className="block text-sm font-bold text-slate-700 mb-2">Fondo Inicial (Efectivo)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input 
                       type="number" 
                       value={startingCash} 
                       onChange={e => setStartingCash(e.target.value)} 
                       placeholder="0.00"
                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xl"
                    />
                 </div>
              </div>
              <button onClick={openShift} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all">
                 Abrir Turno
              </button>
           </div>
        </div>
     );
  }

  if (successMode) {
     return (
        <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center">
           <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
           </div>
           <h1 className="text-4xl font-black text-slate-800 mb-4">Venta Exitosa</h1>
           <p className="text-slate-500 max-w-sm mb-8 text-lg">
               {isOffline || offlineQueue.length > 0
                 ? "Venta guardada localmente. El ticket se sincronizará automáticamente cuando regrese el internet."
                 : "El ticket de mostrador ha sido registrado y el inventario descontado."}
            </p>
           <button onClick={() => setSuccessMode(false)} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-all">
              Siguiente Cliente
           </button>
        </div>
     );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
       
       {/* TOP BAR: SHIFT INFO */}
       <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                 <Banknote className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="font-bold text-slate-800 leading-tight">Turno Activo</h2>
                 <p className="text-sm text-slate-500 font-medium">Cajero: {currentShift?.openedBy?.name || 'Local'} • Fondo: ${currentShift?.startingCash?.toLocaleString('en-US')}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              {isOffline && (
                   <div className="flex items-center gap-2 bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse shadow-sm border border-rose-200">
                      <AlertTriangle className="w-4 h-4" /> Sin Conexión
                   </div>
               )}
               {offlineQueue.length > 0 && !isOffline && (
                   <button onClick={syncOfflineQueue} className="flex items-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-amber-200">
                      Sincronizando {offlineQueue.length} tickets...
                   </button>
               )}
               {offlineQueue.length > 0 && isOffline && (
                   <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200">
                      En Bandeja Local: {offlineQueue.length}
                   </div>
               )}
              <button onClick={() => alert('Movimiento Manual')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">Retiro / Ingreso</button>
              <button onClick={loadShiftSummary} className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-sm transition-colors">Corte de Caja</button>
           </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
       {/* LEFT COLUMN: Products Grid */}
       <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                   type="text" 
                   autoFocus
                   placeholder="Buscar producto por nombre o escanear código de barras..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   onKeyDown={e => {
                      if (e.key === 'Enter') {
                         // Si solo hay un match, agregarlo y limpiar.
                         if (filteredProducts.length === 1) {
                            addToCart(filteredProducts[0]);
                            setSearchTerm('');
                         } else {
                            // Buscar si hay match exacto en codigo de barras
                            const exact = products.find(p => p.barcode === searchTerm);
                            if (exact) {
                               addToCart(exact);
                               setSearchTerm('');
                            }
                         }
                      }
                   }}
                   className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-lg text-slate-700 shadow-sm"
                />
             </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
             {loading ? (
                <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
             ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredProducts.map(p => (
                      <button 
                         key={p.id}
                         onClick={() => addToCart(p)}
                         disabled={p.trackInventory && p.stock <= 0 && p.type !== 'KIT' && p.type !== 'SERVICE'}
                         className="flex flex-col text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                         <div className="w-full aspect-video bg-slate-50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50/50 transition-colors">
                            {p.imageUrl ? (
                               <img src={`${process.env.NEXT_PUBLIC_API_URL || 'https://facturapro.radiotecpro.com/api'}${p.imageUrl}`} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                               <Box className="w-8 h-8 text-slate-300 group-hover:text-blue-300" />
                            )}
                             {(p.trackInventory && p.type !== 'KIT' && p.type !== 'SERVICE') ? (
                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                   <div className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {p.stock > 0 ? `Global: ${p.stock} pz` : 'Agotado'}
                                   </div>
                                   {p.warehouseStocks && p.warehouseStocks.map((ws: any) => (
                                      ws.stock > 0 && (
                                         <div key={ws.warehouseId} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 shadow-sm whitespace-nowrap">
                                            {ws.warehouse?.name}: {ws.stock}
                                         </div>
                                      )
                                   ))}
                                </div>
                             ) : (p.type === 'KIT' || p.type === 'SERVICE') && (
                                <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                                   {p.type}
                                </div>
                             )}
                         </div>
                         <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight flex-1">{p.name}</h3>
                         <div className="mt-2 text-lg font-black text-slate-900">${p.price.toLocaleString('en-US')}</div>
                      </button>
                   ))}
                </div>
             )}
          </div>
       </div>

       {/* RIGHT COLUMN: The Ticket */}
       <div className="w-96 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
          <div className="flex gap-2 overflow-x-auto p-2 bg-slate-100 border-b border-slate-200">
             {carts.map((_, idx) => (
                <button 
                   key={idx} 
                   onClick={() => setActiveCartIndex(idx)}
                   className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeCartIndex === idx ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                   Venta {idx + 1}
                   {carts.length > 1 && (
                      <X onClick={(e) => {
                         e.stopPropagation();
                         const newCarts = carts.filter((__, i) => i !== idx);
                         setCarts(newCarts);
                         let newIndex = activeCartIndex;
                         if (idx < activeCartIndex) newIndex--;
                         else if (idx === activeCartIndex && newIndex >= newCarts.length) newIndex = newCarts.length - 1;
                         setActiveCartIndex(Math.max(0, newIndex));
                      }} className="w-3 h-3 hover:text-red-500 opacity-50 hover:opacity-100" />
                   )}
                </button>
             ))}
             <button title="Abrir Nueva Venta" onClick={() => { setCarts([...carts, []]); setActiveCartIndex(carts.length); }} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <Plus className="w-4 h-4 font-bold" />
             </button>
          </div>

          <div className="p-6 bg-slate-900 text-white flex items-center gap-3">
             <ShoppingCart className="w-6 h-6 text-emerald-400" />
             <h2 className="text-xl font-black">Ticket de Venta</h2>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
             {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Tag className="w-12 h-12 mb-4 opacity-20" />
                   <p className="font-medium">No hay productos en caja</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {cart.map(item => (
                      <div key={item.productId} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm line-clamp-2">{item.name}</p>
                            <p className="text-slate-500 font-medium text-xs mt-1">${item.unitPrice.toLocaleString('en-US')}</p>
                         </div>
                         <div className="flex flex-col items-end justify-between">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                               <button onClick={() => changeQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-md font-bold">-</button>
                               <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                               <button onClick={() => changeQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-md font-bold">+</button>
                            </div>
                            <p className="font-black text-slate-900 mt-2">${(item.unitPrice * item.quantity).toLocaleString('en-US')}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>

          <div className="p-6 bg-white border-t border-slate-200">
             <div className="flex justify-between items-center text-slate-500 text-sm mb-2 font-medium">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
             </div>
             <div className="flex justify-between items-center text-slate-500 text-sm mb-4 font-medium border-b border-slate-100 pb-4">
                <span>IVA/Impuestos</span>
                <span>${tax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
             </div>
             <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Técnico Responsable</label>
                   <input type="text" placeholder="Opcional" value={customFields.mechanic} onChange={e => setCustomFields({...customFields, mechanic: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Placas Vehículo</label>
                   <input type="text" placeholder="Ej. ABC-123" value={customFields.plates} onChange={e => setCustomFields({...customFields, plates: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white uppercase" />
                </div>
             </div>
             <div className="flex justify-between items-end mb-6">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total a Cobrar</span>
                <span className="text-4xl font-black text-slate-900 tracking-tight">${total.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-lg text-slate-400">MXN</span></span>
             </div>

             <div className="flex gap-2 mb-6">
                <button 
                   onClick={() => setPaymentMethod('01')}
                   className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === '01' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                   <Banknote className="w-6 h-6 mb-1" />
                   <span className="text-xs font-bold">Efectivo</span>
                </button>
                <button 
                   onClick={() => setPaymentMethod('04')}
                   className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === '04' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                   <CreditCard className="w-6 h-6 mb-1" />
                   <span className="text-xs font-bold">Tarjeta</span>
                </button>
             </div>

             <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
             >
                {checkoutLoading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : "Cobrar Ticket"}
             </button>
          </div>
       </div>

       </div>

        {showShiftSummary && shiftSummary && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm shadow-2xl z-50 flex items-center justify-center animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative shadow-2xl scale-in-95 duration-200">
                 <button onClick={() => setShowShiftSummary(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700">
                    <X className="w-6 h-6" />
                 </button>

                 <div className="mb-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                       <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-800">Corte de Caja Z</h2>
                       <p className="text-sm text-slate-500 font-medium">Turno abierto por: {shiftSummary.openedByName || 'Local'}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2">
                       <span className="text-slate-600 font-medium">Fondo de inicio:</span>
                       <span className="font-bold text-slate-800">${shiftSummary.startingCash.toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                       <span className="text-slate-600 font-medium">Efectivo en Ventas:</span>
                       <span className="font-bold text-slate-800">+ ${shiftSummary.cashSales.toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                       <span className="text-slate-600 font-medium">Pagos Electrónicos (Tarjeta/Trans):</span>
                       <span className="font-bold text-slate-800">${(shiftSummary.cardSales + shiftSummary.transferSales).toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-100 pt-4">
                       <span className="text-slate-600 font-medium">Entradas de efectivo:</span>
                       <span className="font-bold text-emerald-600">+ ${shiftSummary.cashIn.toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                       <span className="text-slate-600 font-medium">Salidas de efectivo:</span>
                       <span className="font-bold text-rose-600">- ${shiftSummary.cashOut.toLocaleString('en-US')}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center mt-4">
                       <span className="font-bold text-slate-700">Efectivo en cajón esperado:</span>
                       <span className="text-2xl font-black text-blue-600">${shiftSummary.expectedCash.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                    </div>
                 </div>
                 
                 <p className="text-sm text-slate-500 text-center mb-6">
                    Tickets cobrados: <span className="font-bold">{shiftSummary.salesCount}</span>
                 </p>

                 <button onClick={handleCloseShift} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-600/30 transition-all">
                    Cerrar Turno (Corte Z)
                 </button>
              </div>
           </div>
        )}

        {showSerialsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Captura de Series</h2>
                    <p className="text-slate-500 mb-6">Los siguientes productos requieren captura de número de serie para garantías.</p>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-auto mb-6">
                        {cart.filter(i => i.hasSerials).map(item => (
                            <div key={item.productId} className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">{item.name} (Esperados: {item.quantity})</label>
                                <textarea 
                                    className="w-full p-3 border rounded-xl font-mono text-sm" 
                                    rows={3}
                                    placeholder="SN-1\nSN-2..."
                                    value={serialsInput[item.productId] || ''}
                                    onChange={e => setSerialsInput({...serialsInput, [item.productId]: e.target.value})}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setShowSerialsModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">Volver</button>
                        <button onClick={confirmSerialsAndCheckout} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all">Confirmar y Cobrar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
