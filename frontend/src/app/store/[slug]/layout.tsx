"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { StoreProvider, useStore } from "./StoreContext";
import { useAuth } from "@/components/AuthProvider";
import { Search, ShoppingCart, ArrowLeft, Package, Trash2, Check, X, Send, Menu, Tag, ChevronDown, DollarSign, ArrowUp, Camera, Mic, Bot, Rss, UserCircle, LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

function StoreLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string || "default";
  const { 
     cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart,
     isAddedPanelOpen, setIsAddedPanelOpen, addedProduct, complementaryProducts, addToCart,
     globalSearchTerm, setGlobalSearchTerm, currency, setCurrency, includeIva, setIncludeIva
  } = useStore();

  const isCustomDomain = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('facturapro.radiotecpro.com');
  const storeHomeUrl = isCustomDomain ? '/' : `/store/${slug}`;

  const { user, logout } = useAuth();

  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutStreet, setCheckoutStreet] = useState("");
  const [checkoutExteriorNum, setCheckoutExteriorNum] = useState("");
  const [checkoutColonia, setCheckoutColonia] = useState("");
  const [checkoutCity, setCheckoutCity] = useState("");
  const [checkoutState, setCheckoutState] = useState("");
  const [checkoutZip, setCheckoutZip] = useState("");
  
  const [billingRfc, setBillingRfc] = useState("");
  const [billingName, setBillingName] = useState("");
  const [wantsBilling, setWantsBilling] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);

  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteProjectName, setQuoteProjectName] = useState("");
  const [quoteClientName, setQuoteClientName] = useState("");
  const [quoteMarkup, setQuoteMarkup] = useState("30");
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  // New states for Syscom dropdown
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!globalSearchTerm || globalSearchTerm.length < 2) {
      setSearchDropdownOpen(false);
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchDropdownOpen(true);
      try {
        const res = await axios.get(`${API_URL}/public-store/${slug}/products?search=${encodeURIComponent(globalSearchTerm)}&page=1`);
        if (res.data && res.data.products) {
          setSearchResults(res.data.products.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchTerm]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    
    // Fetch initial layout data like logo
    axios.get(`${API_URL}/public-store/${slug}/products?search=&page=1`)
      .then(res => {
         if (res.data && res.data.logoUrl) {
            setStoreLogoUrl(`${API_URL}${res.data.logoUrl}`);
         }
      })
      .catch(e => console.error("Error fetching store logo", e));

    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      const fetchProfile = async () => {
        try {
          const res = await axios.get(`${API_URL}/users/my-profile`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.data) {
            if (res.data.street) setCheckoutStreet(res.data.street);
            if (res.data.exteriorNum) setCheckoutExteriorNum(res.data.exteriorNum);
            if (res.data.neighborhood) setCheckoutColonia(res.data.neighborhood);
            if (res.data.city) setCheckoutCity(res.data.city);
            if (res.data.state) setCheckoutState(res.data.state);
            if (res.data.zipCode) setCheckoutZip(res.data.zipCode);
            if (res.data.rfc) { setBillingRfc(res.data.rfc); setWantsBilling(true); }
            if (res.data.companyName) setBillingName(res.data.companyName);
          }
        } catch (e) {
          console.error("Error fetching profile", e);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    try {
      const orderData = {
        userId: user?.id,
        customerName: checkoutName || user?.name || "Cliente Invitado",
        customerPhone: checkoutPhone || user?.phone || "0000000000",
        street: checkoutStreet,
        exteriorNum: checkoutExteriorNum,
        neighborhood: checkoutColonia,
        city: checkoutCity,
        state: checkoutState,
        zipCode: checkoutZip,
        billingRfc: wantsBilling ? billingRfc : null,
        billingName: wantsBilling ? billingName : null,
        totalAmount: cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0),
        items: cart.map(item => ({
          productId: item.product.source === 'local' ? item.product.id : null,
          syscomId: item.product.source === 'syscom' ? item.product.id.replace('syscom_', '') : null,
          title: item.product.title,
          price: getDisplayPrice(item.product),
          quantity: item.quantity
        }))
      };

      if (user && saveAddress) {
        try {
          await axios.patch(`${API_URL}/users/my-profile`, {
            street: checkoutStreet,
            exteriorNum: checkoutExteriorNum,
            neighborhood: checkoutColonia,
            city: checkoutCity,
            state: checkoutState,
            zipCode: checkoutZip
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (e) {
          console.error("Error saving address", e);
        }
      }

      const res = await axios.post(`${API_URL}/public-store/${slug}/order`, orderData);
        
      if (res.data.checkoutUrl) {
         window.location.href = res.data.checkoutUrl;
      } else {
         clearCart();
         setIsCartOpen(false);
         setCheckoutName("");
         setCheckoutPhone("");
         setCheckoutStreet("");
         setCheckoutColonia("");
         setCheckoutCity("");
         setCheckoutState("");
         setCheckoutZip("");
         alert("¡Pedido guardado! (Hubo un problema generando el enlace de pago, te contactaremos pronto).");
      }
      router.push(storeHomeUrl);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el pedido");
    }
  };

  const handleDownloadQuote = async () => {
    if (cart.length === 0) return;
    setIsGeneratingQuote(true);
    try {
      const orderData = {
        customerName: checkoutName || user?.name || "Cliente Invitado",
        totalAmount: cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0),
        items: cart.map(item => ({
          title: item.product.title,
          price: getDisplayPrice(item.product),
          quantity: item.quantity
        })),
        clientName: quoteClientName,
        projectName: quoteProjectName,
        markupPercentage: quoteMarkup,
        senderName: user?.name || checkoutName || 'Instalador Independiente'
      };
      
      const res = await axios.post(`${API_URL}/public-store/${slug}/quote-pdf`, orderData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cotizacion_${slug}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setShowQuoteModal(false);
    } catch (e) {
      console.error(e);
      alert("Error al generar la cotización");
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Navbar (Header) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 md:gap-8 py-3 md:h-20 md:py-0">
            <Link href={storeHomeUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 order-1">
              <img src={storeLogoUrl || "/logo-transparent.png"} alt="Tienda" className="h-[32px] md:h-[40px] object-contain" />
            </Link>

            <form onSubmit={(e) => { e.preventDefault(); setSearchDropdownOpen(false); router.push(storeHomeUrl); }} className="w-full md:flex-1 max-w-4xl relative flex items-center gap-2 md:gap-4 order-3 md:order-2">
              <div className="relative flex-1 flex items-center">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={globalSearchTerm}
                   onChange={e => setGlobalSearchTerm(e.target.value)}
                   onFocus={() => { if(globalSearchTerm.length >= 2) setSearchDropdownOpen(true); }}
                   placeholder="Buscar modelo, marca o categoría..." 
                   className="w-full h-11 bg-white border-2 border-blue-600 rounded-lg pl-10 pr-20 text-sm font-medium transition-all outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
                    <Search className="w-4 h-4 text-blue-600" />
                 </div>

                 {/* Syscom Dropdown Overlay */}
                 {searchDropdownOpen && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setSearchDropdownOpen(false)}></div>
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex min-h-[300px]">
                     {/* Right Panel: Results (Now takes full width) */}
                     <div className="flex-1 p-4 bg-white">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                           <button className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">Productos Sugeridos</button>
                        </div>
                        
                        {isSearching ? (
                           <div className="flex justify-center items-center h-32">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                           </div>
                        ) : searchResults.length > 0 ? (
                           <div className="space-y-3 relative z-50">
                              {searchResults.map((product) => (
                                 <div key={product.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors group cursor-pointer" onClick={() => { setSearchDropdownOpen(false); router.push(`/store/${slug}/product/${product.id}`); }}>
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-lg p-1 shrink-0 flex items-center justify-center">
                                       {product.imageUrl ? <img src={product.imageUrl} alt={product.model} className="max-w-full max-h-full object-contain" /> : <Package className="w-8 h-8 text-slate-300"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <h5 className="text-xs font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{product.title}</h5>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-bold text-slate-400">{product.model}</span>
                                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">{product.brand}</span>
                                       </div>
                                       <div className="flex items-center justify-between mt-2">
                                          <div className="text-blue-700 font-bold text-sm">
                                             {currency === 'MXN' ? 'MXN' : 'USD'} ${getDisplayPrice(product).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}
                                             <span className="text-[9px] font-normal text-slate-400 ml-1 block leading-none">IVA incluido</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                {product.stock > 0 ? '✓ ' + product.stock : 'Agotado'}
                                             </span>
                                             {product.stock > 0 && (
                                                <button 
                                                   onClick={(e) => { e.stopPropagation(); addToCart(product); setSearchDropdownOpen(false); }}
                                                   className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                                                >
                                                   Agregar <ShoppingCart className="w-3 h-3"/>
                                                </button>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                              <Package className="w-8 h-8 mb-2 opacity-50" />
                              <p className="text-sm font-medium">No se encontraron productos</p>
                           </div>
                        )}
                     </div>
                   </div>
                   </>
                 )}
              </div>
            </form>

            <div className="flex items-center gap-3 md:gap-6 shrink-0 relative order-2 md:order-3">
               {/* Currency & Tax Configurator */}
               <div className="relative">
                 <button 
                   onClick={() => setShowConfigDropdown(!showConfigDropdown)} 
                   className="hidden md:flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                 >
                   <div className="text-right">
                     <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                       {currency === 'MXN' ? <img src="https://flagcdn.com/w20/mx.png" alt="MXN" className="w-4 h-3 object-cover rounded-sm" /> : <img src="https://flagcdn.com/w20/us.png" alt="USD" className="w-4 h-3 object-cover rounded-sm" />} 
                       {currency}
                     </div>
                     <div className="text-[10px] text-slate-500 font-medium">{includeIva ? 'Con IVA' : 'Sin IVA'}</div>
                   </div>
                   <ChevronDown className="w-4 h-4 text-slate-400" />
                 </button>

                 {/* Dropdown Menu */}
                 {showConfigDropdown && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowConfigDropdown(false)}></div>
                     <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                       <div className="p-4 border-b border-slate-100 bg-slate-50">
                         <div className="text-xs font-semibold text-slate-500">Tipo de cambio aproximado:</div>
                         <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-1">
                           <DollarSign className="w-4 h-4 text-emerald-600" /> $17.50 MXN / USD
                         </div>
                       </div>
                       
                       <div className="p-2">
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">Seleccionar Moneda</div>
                         <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                           <input type="radio" name="currency" checked={currency === 'MXN'} onChange={() => {setCurrency('MXN'); setShowConfigDropdown(false)}} className="w-4 h-4 text-blue-600" />
                           <img src="https://flagcdn.com/w20/mx.png" alt="MXN" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                           <span className="text-sm font-medium text-slate-700">MXN (Pesos)</span>
                         </label>
                         <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors mb-2">
                           <input type="radio" name="currency" checked={currency === 'USD'} onChange={() => {setCurrency('USD'); setShowConfigDropdown(false)}} className="w-4 h-4 text-blue-600" />
                           <img src="https://flagcdn.com/w20/us.png" alt="USD" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                           <span className="text-sm font-medium text-slate-700">USD (Dólares)</span>
                         </label>

                         <div className="h-px bg-slate-100 my-1 mx-2"></div>

                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">Impuestos</div>
                         <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                           <input type="radio" name="iva" checked={includeIva === true} onChange={() => {setIncludeIva(true); setShowConfigDropdown(false)}} className="w-4 h-4 text-blue-600" />
                           <span className="text-sm font-medium text-slate-700">Con IVA (16%)</span>
                         </label>
                         <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                           <input type="radio" name="iva" checked={includeIva === false} onChange={() => {setIncludeIva(false); setShowConfigDropdown(false)}} className="w-4 h-4 text-blue-600" />
                           <span className="text-sm font-medium text-slate-700">Sin IVA</span>
                         </label>
                       </div>
                     </div>
                   </>
                 )}
               </div>

               {/* Auth Dropdown */}
               <div className="relative">
                 {user && user.role === 'CUSTOMER' ? (
                   <>
                     <button type="button" onClick={() => setShowAuthDropdown(!showAuthDropdown)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0">
                       <UserCircle className="w-5 h-5 text-blue-600" />
                       <span className="text-sm font-bold text-slate-700 hidden md:block line-clamp-1 max-w-[100px]">{user.name.split(' ')[0]}</span>
                     </button>
                     {showAuthDropdown && (
                       <>
                         <div className="fixed inset-0 z-40" onClick={() => setShowAuthDropdown(false)}></div>
                         <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                           <div className="px-4 py-2 border-b border-slate-100 mb-2">
                             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mi Cuenta</p>
                             <p className="text-sm font-medium text-slate-900 truncate mt-1">{user.email}</p>
                           </div>
                           <Link href={`/store/${slug}/account`} onClick={() => setShowAuthDropdown(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700">
                             <Package className="w-4 h-4 text-blue-500" /> Mis Compras
                           </Link>
                           <button onClick={() => { logout(); setShowAuthDropdown(false); router.push(storeHomeUrl); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm font-medium text-red-600 mt-2 border-t border-slate-100 pt-3">
                             <LogOut className="w-4 h-4" /> Cerrar Sesión
                           </button>
                         </div>
                       </>
                     )}
                   </>
                 ) : (
                    <Link href={`/store/${slug}/login`} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0 text-sm font-bold text-slate-700">
                      <UserCircle className="w-5 h-5 text-blue-600" /> <span className="hidden md:inline">Entrar</span>
                    </Link>
                 )}
               </div>

               <Button variant="ghost" onClick={() => { setIsCartOpen(!isCartOpen); window.scrollTo(0,0); }} className="relative p-2 md:p-3 hover:bg-slate-100 rounded-xl h-auto">
                 <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 text-slate-700" />
                 {cart.length > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                     {cart.reduce((sum, item) => sum + item.quantity, 0)}
                   </span>
                 )}
               </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {isCartOpen ? (
        <main className="container mx-auto px-4 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
           <Button variant="ghost" onClick={() => setIsCartOpen(false)} className="mb-6 text-slate-500 hover:text-blue-600 -ml-4 font-bold text-sm bg-white rounded-full px-6 py-2 shadow-sm border border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> Seguir Comprando
           </Button>

           <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                 <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-blue-600" /> Mi Carrito
                 </h2>

                 {cart.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                       <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                       <h3 className="text-xl font-bold text-slate-800">Tu carrito est vaco</h3>
                       <p className="text-slate-500 mt-2 mb-6">Parece que an no has agregado productos.</p>
                       <Button onClick={() => setIsCartOpen(false)} className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl h-12 px-8 font-bold">Explorar Catlogo</Button>
                    </div>
                 ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                       <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                   <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20">Imagen</th>
                                   <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Producto</th>
                                   <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Precio Lista</th>
                                   <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Precio U.</th>
                                   <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                                   <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                                </tr>
                             </thead>
                             <tbody>
                                {cart.map((item, idx) => (
                                   <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                      <td className="p-4 align-top">
                                         <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-1 shrink-0">
                                            {item.product.imageUrl ? (
                                               <img src={item.product.imageUrl} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                            ) : <Package className="w-8 h-8 text-slate-200" />}
                                         </div>
                                      </td>
                                      <td className="p-4 align-top">
                                         <div className="text-[10px] font-bold text-blue-600 mb-1">{item.product.brand || 'GENÉRICO'}</div>
                                         <div 
                                            onClick={() => { setIsCartOpen(false); router.push(`/store/${slug}/product/${item.product.id}`); }}
                                            className="text-sm font-semibold text-slate-800 line-clamp-3 mb-2 hover:text-blue-600 cursor-pointer transition-colors"
                                         >
                                            {item.product.title}
                                         </div>
                                         <div className="inline-block bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Inventario {item.product.stock}</div>
                                      </td>
                                      <td className="p-4 align-top text-center">
                                         <div className="text-xs text-slate-400 line-through mt-2 font-medium">
                                            ${(getDisplayPrice(item.product) * 1.15).toLocaleString('es-MX', {minimumFractionDigits: 2})} <span className="text-[9px]">{currency}</span>
                                         </div>
                                      </td>
                                      <td className="p-4 align-top text-center">
                                         <div className="text-sm font-bold text-slate-900 mt-1">
                                            ${(includeIva ? getDisplayPrice(item.product) / 1.16 : getDisplayPrice(item.product)).toLocaleString('es-MX', {minimumFractionDigits: 2})} <span className="text-[9px]">{currency}</span>
                                         </div>
                                      </td>
                                      <td className="p-4 align-top">
                                         <div className="flex justify-center mt-1">
                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-9 shadow-sm">
                                               <button onClick={() => updateQuantity(item.product.id, -1)} className="px-3 h-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-bold">-</button>
                                               <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                                               <button onClick={() => updateQuantity(item.product.id, 1)} className="px-3 h-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-bold">+</button>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="p-4 align-top text-right">
                                         <div className="text-base font-black text-slate-900 mt-1">
                                            ${((includeIva ? getDisplayPrice(item.product) / 1.16 : getDisplayPrice(item.product)) * item.quantity).toLocaleString('es-MX', {minimumFractionDigits: 2})}
                                            <span className="text-[10px] text-slate-500 block">{currency}</span>
                                         </div>
                                      </td>
                                      <td className="p-4 align-top text-right">
                                         <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors mt-1">
                                            <Trash2 className="w-5 h-5" />
                                         </button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 )}
              </div>

              {cart.length > 0 && (
                 <div className="w-full lg:w-[380px] shrink-0">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sticky top-28">
                       <h3 className="text-xl font-black text-slate-900 mb-6">Resumen de Orden</h3>
                       
                       <div className="space-y-4 mb-6">
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-500 font-medium">Subtotal</span>
                             <span className="font-bold text-slate-700">${(cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0) / (includeIva ? 1.16 : 1)).toLocaleString('es-MX', {minimumFractionDigits: 2})} {currency}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-500 font-medium">IVA (16%)</span>
                             <span className="font-bold text-slate-700">${(cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0) / (includeIva ? 1.16 : 1) * 0.16).toLocaleString('es-MX', {minimumFractionDigits: 2})} {currency}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-500 font-medium">Envío Nacional</span>
                             <span className="font-bold text-emerald-500">GRATIS! 🚚</span>
                          </div>
                          <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
                             <span className="text-lg font-black text-slate-900">TOTAL</span>
                             <div className="text-right">
                                <span className="text-2xl font-black text-blue-600">${(cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0) / (includeIva ? 1 : (1/1.16))).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                                <span className="text-xs font-bold text-blue-600/60 ml-1">{currency}</span>
                             </div>
                          </div>
                       </div>

                       <form onSubmit={handleCheckout} className="space-y-4">
                        {!user && (
                          <>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
                               <input required type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} 
                                      placeholder="Tu nombre"
                                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Celular (WhatsApp)</label>
                               <input required type="tel" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} 
                                      placeholder="10 dígitos"
                                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                          </>
                        )}
                        {user && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                            <span className="font-bold">Facturación a:</span> {user.name}<br/>
                            <span className="font-bold">Contacto:</span> {user.phone || user.email}
                          </div>
                        )}
                          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
                             <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Tag className="w-4 h-4 text-slate-400" /> Dirección de Envío</h4>
                             
                             <div className="grid grid-cols-[2fr_1fr] gap-3">
                               <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Calle</label>
                                 <input required type="text" placeholder="Ej. Av. Reforma" value={checkoutStreet} onChange={e => setCheckoutStreet(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Número</label>
                                 <input required type="text" placeholder="Ej. 123" value={checkoutExteriorNum} onChange={e => setCheckoutExteriorNum(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                               </div>
                             </div>
                             
                             <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Colonia</label>
                               <input required type="text" placeholder="Ej. Centro" value={checkoutColonia} onChange={e => setCheckoutColonia(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                             </div>

                             <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Ciudad</label>
                                 <input required type="text" placeholder="Ciudad" value={checkoutCity} onChange={e => setCheckoutCity(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Estado</label>
                                 <input required type="text" placeholder="Estado" value={checkoutState} onChange={e => setCheckoutState(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                               </div>
                             </div>

                             <div className="space-y-1">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Código Postal</label>
                               <input required type="text" placeholder="Ej. 85860" value={checkoutZip} onChange={e => setCheckoutZip(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                             </div>

                             <div className="mt-4 pt-4 border-t border-slate-100">
                               <label className="flex items-center gap-2 cursor-pointer mb-3">
                                 <input type="checkbox" checked={wantsBilling} onChange={e => setWantsBilling(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                                 <span className="text-sm font-bold text-slate-700">Requiero Factura CFDI</span>
                               </label>
                               
                               {wantsBilling && (
                                 <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                   <div className="space-y-1">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">RFC</label>
                                     <input required={wantsBilling} type="text" placeholder="ABC123456T1" value={billingRfc} onChange={e => setBillingRfc(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white uppercase transition-colors" />
                                   </div>
                                   <div className="space-y-1">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Razón Social</label>
                                     <input required={wantsBilling} type="text" placeholder="Mi Empresa S.A. de C.V." value={billingName} onChange={e => setBillingName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-colors" />
                                   </div>
                                 </div>
                               )}
                             </div>
                             
                             {user && user.role === 'CUSTOMER' && (
                               <label className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 cursor-pointer">
                                 <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                                 <span className="text-xs font-medium text-slate-600">Guardar como dirección predeterminada</span>
                               </label>
                             )}
                          </div>
                          
                          <Button type="submit" className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/30 transition-all text-base">
                             Finalizar Pedido
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsCartOpen(false)} className="w-full h-12 mt-2 font-bold text-slate-600">
                             Guardar Carrito (Seguir)
                          </Button>
                          <Button type="button" onClick={() => setShowQuoteModal(true)} className="w-full h-12 mt-2 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border-none flex items-center justify-center gap-2">
                             <FileText className="w-4 h-4" /> Generar Cotización B2B
                          </Button>
                       </form>
                    </div>
                 </div>
              )}
           </div>
        </main>
      ) : (
        <>
          {children}
          {/* Global Footer based on MAGIA OS standard */}
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 mt-20">
             <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                   <div>
                      <img src="/logo-transparent.png" alt="RadioTec Pro" className="h-[40px] object-contain mb-6 brightness-0 invert" />
                      <p className="text-sm text-slate-400 leading-relaxed mb-6">
                         Distribuidores mayoristas de equipo de telecomunicaciones, redes y seguridad electrónica en México. Expertos en soluciones empresariales.
                      </p>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">Respaldado por</div>
                      <div className="text-lg font-black text-white bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Grupo Hurtado</div>
                   </div>
                   
                   <div>
                      <h4 className="text-white font-bold mb-6 flex items-center gap-2">Contacto</h4>
                      <ul className="space-y-4 text-sm text-slate-400">
                         <li className="flex items-center gap-3"><img src="https://flagcdn.com/w20/mx.png" alt="MX" className="w-4 h-3 rounded-sm" /> +52 (642) 164-4126</li>
                         <li className="flex items-center gap-3">✉️ ventas@radiotecpro.com</li>
                         <li className="flex items-center gap-3">📍 Navojoa, Sonora</li>
                      </ul>
                   </div>

                   <div>
                      <h4 className="text-white font-bold mb-6">Herramientas</h4>
                      <ul className="space-y-3 text-sm text-slate-400">
                         <li><Link href={storeHomeUrl} className="hover:text-blue-400 transition-colors">Cotizador Rápido</Link></li>
                         <li><a href="https://facturapro.radiotecpro.com" target="_blank" className="hover:text-blue-400 transition-colors">Facturación Electrónica</a></li>
                         <li><Link href={storeHomeUrl} className="hover:text-blue-400 transition-colors">Garantías y Soporte</Link></li>
                         <li><Link href={storeHomeUrl} className="hover:text-blue-400 transition-colors">Guías Técnicas</Link></li>
                      </ul>
                   </div>

                   <div>
                      <h4 className="text-white font-bold mb-6">MAGIA OS</h4>
                      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                         <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            Esta tienda está potenciada por <strong>MAGIA OS</strong>, el ecosistema inteligente de Grupo Hurtado para la gestión de negocios de alto rendimiento.
                         </p>
                         <Link href="https://radiotecpro.com" target="_blank" rel="noopener noreferrer">
                           <button className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full">
                              Conocer más sobre MAGIA OS
                           </button>
                         </Link>
                      </div>
                   </div>
                </div>

                <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                   <div>&copy; {new Date().getFullYear()} RadioTec Internet y Comunicaciones. Todos los derechos reservados.</div>
                   <div className="flex gap-4">
                      <a href="#" className="hover:text-white transition-colors">Aviso de Privacidad</a>
                      <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
                   </div>
                </div>
             </div>
          </footer>
        </>
      )}

      {/* Added to Cart Panel (Slide Over Cross-Selling) */}
      {isAddedPanelOpen && addedProduct && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={() => setIsAddedPanelOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-slate-50 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between shadow-md relative z-10">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                 </div>
                 <h2 className="font-bold text-lg">Equipo Agregado</h2>
              </div>
              <button onClick={() => setIsAddedPanelOpen(false)} className="text-emerald-100 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* Product Added Confirmation */}
              <div className="bg-white p-4 mb-2 shadow-sm flex gap-4 items-center">
                 <div className="w-16 h-16 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 p-1">
                   {addedProduct.imageUrl ? (
                     <img src={addedProduct.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                   ) : (
                     <Package className="h-8 w-8 text-slate-300" />
                   )}
                 </div>
                 <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400">{addedProduct.brand}</div>
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">{addedProduct.title}</h4>
                 </div>
              </div>

              {/* Cross Selling Area */}
              <div className="p-4">
                 <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Equipos Complementarios
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                   {complementaryProducts.map(cp => (
                      <div key={cp.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:border-blue-300 transition-colors" onClick={() => { setIsAddedPanelOpen(false); router.push(`/store/${slug}/product/${cp.id}`); }}>
                         <div className="aspect-square p-2 border-b border-slate-100 flex items-center justify-center relative bg-white">
                           {cp.imageUrl ? (
                             <img src={cp.imageUrl} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                           ) : (
                             <Package className="h-8 w-8 text-slate-200" />
                           )}
                           {cp.stock > 0 && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); addToCart(cp); }}
                               className="absolute bottom-2 right-2 bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white p-2 rounded-full shadow-sm transition-colors z-10"
                             >
                               <ShoppingCart className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                         <div className="p-3 flex flex-col flex-1">
                            <div className="text-[10px] font-bold text-emerald-600 mb-1">{cp.brand || 'GENÉRICO'}</div>
                            <h4 className="text-[11px] font-semibold text-slate-700 leading-tight mb-2 flex-1 line-clamp-3">{cp.title}</h4>
                            <div className="font-black text-slate-900 text-sm">
                               ${getDisplayPrice(cp).toLocaleString('es-MX', {minimumFractionDigits:2})}
                               <span className="text-[9px] text-slate-400 block">{currency} inc. IVA</span>
                            </div>
                            <div className="mt-2 text-[10px] font-bold">
                               {cp.stock > 0 ? (
                                  <span className="text-emerald-600 flex items-center gap-1"><Package className="w-3 h-3"/> {cp.stock} disponibles</span>
                               ) : (
                                  <span className="text-red-500 flex items-center gap-1"><X className="w-3 h-3"/> Agotado</span>
                               )}
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
               <Button variant="outline" onClick={() => setIsAddedPanelOpen(false)} className="w-full mb-3 h-12 font-bold text-slate-600 rounded-xl">
                  Seguir Comprando
               </Button>
               <Button onClick={() => { setIsAddedPanelOpen(false); setIsCartOpen(true); }} className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/30">
                  <ShoppingCart className="w-5 h-5" /> Ir al Carrito
               </Button>
            </div>
          </div>
        </>
      )}

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
         <div className="flex gap-3 items-end">
            {showScrollTop && (
               <button 
                  onClick={scrollToTop} 
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-500/30 transition-all animate-in fade-in"
                  title="Volver arriba"
               >
                  <ArrowUp className="w-6 h-6" />
               </button>
            )}
         </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQuoteModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2"><FileText className="w-5 h-5" /> Cotizador B2B</h3>
                <p className="text-blue-100 text-sm mt-1">Genera una cotización elegante para tu cliente</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="text-blue-200 hover:text-white transition-colors bg-blue-700/50 p-2 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Título del Proyecto (Opcional)</label>
                  <input type="text" value={quoteProjectName} onChange={e => setQuoteProjectName(e.target.value)} placeholder="Ej: Proyecto CCTV Residencial" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Cotizar a (Nombre del cliente final)</label>
                  <input type="text" value={quoteClientName} onChange={e => setQuoteClientName(e.target.value)} placeholder="Nombre o empresa de TU cliente" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">Tu Margen de Ganancia (%) <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Sugerido: 30%</span></label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setQuoteMarkup(String(Math.max(0, parseInt(quoteMarkup||'0') - 5)))} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-black text-2xl transition-colors shadow-sm border border-slate-200">-</button>
                    <div className="relative flex-1">
                      <input type="number" min="0" max="500" value={quoteMarkup} onChange={e => setQuoteMarkup(e.target.value)} className="w-full border-2 border-blue-100 rounded-xl px-4 py-3 text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/50 hover:bg-white transition-colors text-xl font-black text-blue-600" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-blue-300">%</span>
                    </div>
                    <button type="button" onClick={() => setQuoteMarkup(String(parseInt(quoteMarkup||'0') + 5))} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-black text-2xl transition-colors shadow-sm border border-slate-200">+</button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-500">Costo Subtotal (Tienda)</span>
                  <span className="font-bold text-slate-700">${(cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0) / (includeIva ? 1.16 : 1)).toLocaleString('es-MX', {minimumFractionDigits: 2})} {currency}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-emerald-600 font-bold">Tu Ganancia Estimada</span>
                  <span className="font-bold text-emerald-600">+ ${( (cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0) / (includeIva ? 1.16 : 1)) * (parseFloat(quoteMarkup||'0')/100) ).toLocaleString('es-MX', {minimumFractionDigits: 2})} {currency}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-black text-slate-900">Total sugerido para el cliente</span>
                  <span className="text-xl font-black text-blue-600">${( (cart.reduce((sum, item) => sum + (getDisplayPrice(item.product) * item.quantity), 0) / (includeIva ? 1.16 : 1)) * (1 + parseFloat(quoteMarkup||'0')/100) ).toLocaleString('es-MX', {minimumFractionDigits: 2})} {currency}</span>
                </div>
              </div>

              {!user && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4 items-start">
                  <UserCircle className="w-8 h-8 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-indigo-900 leading-relaxed">
                    <strong>¿Quieres profesionalizar más tus cotizaciones?</strong> Regístrate o inicia sesión en la tienda para llevar el control de tus compras. Y si necesitas agregar tu propio logo y administrar clientes, ¡con FacturaPro lo resolvemos!
                  </div>
                </div>
              )}
              {user && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-center border border-slate-700 shadow-lg shadow-slate-900/20">
                  <div className="bg-blue-500/20 p-3 rounded-xl shrink-0 hidden sm:block">
                    <Check className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed flex-1 text-center sm:text-left">
                    <strong className="text-white block mb-1 text-base">Personaliza tu Logo con FacturaPro</strong>
                    Esta es una cotización rápida. Si quieres incluir tu <strong>logotipo</strong>, guardar el historial de tus clientes y emitir facturas oficiales, adquiere tu cuenta de FacturaPro desde $399 MXN.
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto shrink-0 text-xs h-10 px-6 bg-blue-600/20 border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-600 transition-all font-bold" onClick={() => window.open('https://facturapro.radiotecpro.com', '_blank')}>
                    Ver Planes
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowQuoteModal(false)} className="text-slate-500 hover:bg-slate-200">Cancelar</Button>
              <Button onClick={handleDownloadQuote} disabled={isGeneratingQuote} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-500/30">
                {isGeneratingQuote ? 'Generando PDF...' : 'Generar PDF Elegante'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <StoreLayoutContent>{children}</StoreLayoutContent>
    </StoreProvider>
  );
}
