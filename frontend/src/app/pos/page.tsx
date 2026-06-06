"use client";

import { useState, useEffect } from "react";

import { Search, ShoppingCart, CheckCircle, CreditCard, Banknote, Trash2, Tag, Box, X, AlertTriangle, Plus, FileText, User, Smartphone } from "lucide-react";
import Link from "next/link";
import TopupModal from '@/components/pos/TopupModal';
import { useAuth } from "@/components/AuthProvider";

export default function PosPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
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

  // == FIADO / CUSTOMER STATES ==
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [authModal, setAuthModal] = useState<{isOpen: boolean; resolve: (pin: string|null)=>void; message: string} | null>(null);
  const [creditStatement, setCreditStatement] = useState<any>(null);

  // == SCALE HARDWARE STATE ==
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [scaleProduct, setScaleProduct] = useState<any>(null);
  const [scaleWeight, setScaleWeight] = useState<string>("0.000");
  const [isReadingScale, setIsReadingScale] = useState(false);

  // == TOPUPS STATE ==
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);

  const requestScaleWeight = (product: any) => {
     if (!('serial' in navigator)) {
         console.warn("Tu navegador no soporta Web Serial API.");
     }
     setScaleProduct(product);
     setScaleWeight("0.000");
     setScaleModalOpen(true);
  };

  const readFromScale = async () => {
     if (!('serial' in (navigator as any))) {
         alert("Web Serial no está soportado en tu navegador actual. Usa Chrome o Edge para conectar la báscula.");
         return;
     }
     try {
         setIsReadingScale(true);
         // @ts-ignore
         const port = await navigator.serial.requestPort();
         await port.open({ baudRate: 9600 });
         
         const reader = port.readable.getReader();
         const decoder = new TextDecoder();
         let buffer = "";
         
         // Timeout after 5 seconds if no data
         const timeoutId = setTimeout(() => {
             reader.cancel();
         }, 5000);
         
         while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value);
            if (buffer.includes("\n") || buffer.includes("\r")) {
                reader.cancel();
                break;
            }
         }
         clearTimeout(timeoutId);
         
         const matches = buffer.match(/[\d.]+/);
         if (matches) {
            setScaleWeight(parseFloat(matches[0]).toFixed(3));
         } else {
            alert("No se pudo leer el formato de la báscula. Recibido: " + buffer);
         }
         
         reader.releaseLock();
         await port.close();
     } catch (e: any) {
         console.error("Error leyendo báscula", e);
         if (e.message?.includes('cancel')) {
             // Ignorar cancelaciones intencionales
         } else {
             alert("Error conectando con la báscula: " + e.message);
         }
     } finally {
         setIsReadingScale(false);
     }
  };

  const confirmScaleWeight = () => {
     const weight = parseFloat(scaleWeight);
     if (isNaN(weight) || weight <= 0) {
        alert("Peso inválido.");
        return;
     }
     
     if (scaleProduct.trackInventory && weight > scaleProduct.stock) {
        alert(`Solo quedan ${scaleProduct.stock} kg en inventario de ${scaleProduct.name}`);
        return;
     }

     const existing = cart.find(i => i.productId === scaleProduct.id);
     if (existing) {
        setCart(cart.map(i => i.productId === scaleProduct.id ? { ...i, quantity: existing.quantity + weight } : i));
     } else {
        setCart([...cart, { 
           productId: scaleProduct.id, 
           name: scaleProduct.name, 
           unitPrice: scaleProduct.price, 
           quantity: weight,
           taxRate: scaleProduct.taxRate || 0.16
        }]);
     }
     setScaleModalOpen(false);
     setScaleProduct(null);
  };

  // == KEYBOARD SHORTCUTS STATE ==
  const [shortcutsConfig, setShortcutsConfig] = useState({
     search: 'F2',
     payMethod: 'F4',
     checkout: 'F8',
     cancel: 'Escape'
  });

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
         const tag = (e.target as HTMLElement).tagName.toLowerCase();
         if (tag === 'textarea') return;
         if (tag === 'input' && (e.target as HTMLInputElement).id !== 'pos-search-input') {
             // Si el foco está en un input (ej. recargas, cantidades), solo permitimos F-keys y Escape
             if (!e.key.startsWith('F') && e.key !== 'Escape') return;
         }

         if (e.key === shortcutsConfig.search) {
             e.preventDefault();
             document.getElementById('pos-search-input')?.focus();
         }
         else if (e.key === shortcutsConfig.payMethod) {
             e.preventDefault();
             setPaymentMethod(prev => prev === '01' ? '04' : (prev === '04' ? '99' : '01'));
         }
         else if (e.key === shortcutsConfig.checkout) {
             e.preventDefault();
             document.getElementById('btn-checkout')?.click();
         }
         else if (e.key === shortcutsConfig.cancel) {
             if (scaleModalOpen) setScaleModalOpen(false);
             else if (showCustomerModal) setShowCustomerModal(false);
             else if (showSerialsModal) setShowSerialsModal(false);
         }
     };

     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsConfig, scaleModalOpen, showCustomerModal, showSerialsModal]);

  // == PRINTER HARDWARE STATE ==
  const [printerPort, setPrinterPort] = useState<any>(null);

  // == QUICK KEYS STATE ==
  const [showQuickKeysOnly, setShowQuickKeysOnly] = useState(false);

  // == TOPUP STATE ==
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupData, setTopupData] = useState({ provider: 'Telcel', phone: '', amount: '50' });

  const addTopupToCart = () => {
      if (topupData.phone.length !== 10) {
          alert('El número debe tener 10 dígitos');
          return;
      }
      const existing = cart.find(i => i.name === `Recarga ${topupData.provider} - ${topupData.phone}` && i.unitPrice === parseFloat(topupData.amount));
      if (existing) {
          setCart(cart.map(i => i.productId === existing.productId ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
          setCart([...cart, {
              productId: 'virtual-topup-' + Date.now(),
              name: `Recarga ${topupData.provider} - ${topupData.phone}`,
              unitPrice: parseFloat(topupData.amount),
              quantity: 1,
              taxRate: 0,
              type: 'SERVICE',
              customFields: { phone: topupData.phone, provider: topupData.provider, type: 'TOPUP' }
          }]);
      }
      setShowTopupModal(false);
      setTopupData({ provider: 'Telcel', phone: '', amount: '50' });
  };

  const connectPrinter = async () => {
      if (!('serial' in (navigator as any))) {
         alert("Web Serial no está soportado en tu navegador actual.");
         return;
      }
      try {
         // @ts-ignore
         const port = await navigator.serial.requestPort();
         await port.open({ baudRate: 9600 });
         setPrinterPort(port);
         alert("Impresora conectada exitosamente para Impresión Silenciosa.");
      } catch (e: any) {
         console.error(e);
         if (!e.message?.includes('cancel')) {
             alert("Error conectando a la impresora: " + e.message);
         }
      }
  };

  const printTicket = async (cartItems: any[], ticketTotal: number) => {
      if (!printerPort) return;
      try {
          const writer = printerPort.writable.getWriter();
          const encoder = new TextEncoder();
          
          const INIT = new Uint8Array([0x1B, 0x40]);
          const ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01]);
          const ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00]);
          const BOLD_ON = new Uint8Array([0x1B, 0x45, 0x01]);
          const BOLD_OFF = new Uint8Array([0x1B, 0x45, 0x00]);
          const CUT = new Uint8Array([0x1D, 0x56, 0x41, 0x10]);
          const NL = "\n";
          
          await writer.write(INIT);
          await writer.write(ALIGN_CENTER);
          await writer.write(BOLD_ON);
          await writer.write(encoder.encode("FACTURAPRO POS" + NL));
          await writer.write(BOLD_OFF);
          await writer.write(encoder.encode("Ticket de Venta" + NL));
          await writer.write(encoder.encode("================================" + NL));
          
          await writer.write(ALIGN_LEFT);
          for (const item of cartItems) {
              await writer.write(encoder.encode(`${item.name}${NL}`));
              const line = `  ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`;
              await writer.write(encoder.encode(line + NL));
          }
          await writer.write(ALIGN_CENTER);
          await writer.write(encoder.encode("================================" + NL));
          await writer.write(BOLD_ON);
          await writer.write(encoder.encode(`TOTAL: $${ticketTotal.toFixed(2)}${NL}${NL}${NL}${NL}`));
          
          await writer.write(CUT);
          writer.releaseLock();
      } catch(e) {
          console.error("Printer error", e);
      }
  };

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
           fetchCustomers();
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
       const res = await fetch(`${baseUrl}/pos/shifts/current`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
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
        const res = await fetch(`${baseUrl}/pos/shifts/open`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' },
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
      const res = await fetch(`${baseUrl}/products`, {
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
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

  const fetchCustomers = async () => {
    if (!token) return;
    try {
       const res = await fetch(`${baseUrl}/customers`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
       });
       if (res.ok) setCustomers(await res.json());
    } catch(e) { console.error("Error fetching customers", e); }
  };

  const loadCreditStatement = async (custId: string) => {
     try {
        const res = await fetch(`${baseUrl}/customers/${custId}/credit`, {
           headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
        });
        if (res.ok) setCreditStatement(await res.json());
     } catch(e) { console.error(e); }
  };

  const selectCustomer = (c: any) => {
     setSelectedCustomer(c);
     setShowCustomerModal(false);
     if (c) loadCreditStatement(c.id);
     else setCreditStatement(null);
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
             const res = await fetch(`${baseUrl}/pos/checkout`, {
                method: 'POST',
                headers: { 
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' 
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
    if (product.soldByWeight) {
        requestScaleWeight(product);
        return;
    }

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
      const taxRate = product.taxRate !== undefined ? product.taxRate : 0.16;
      const basePrice = product.taxIncluded ? (product.price / (1 + taxRate)) : product.price;

      setCart([...cart, { 
         productId: product.id, 
         name: product.name, 
         unitPrice: basePrice, 
         displayPrice: product.price, // Store the sticker price for UI
         taxIncluded: product.taxIncluded,
         quantity: 1,
         taxRate: taxRate
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

  const filteredProducts = products.filter(p => {
      if (showQuickKeysOnly) return p.isFavorite || !p.barcode; // Mostrar favoritos o los que no tienen código
      return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm));
  });

  const handleCheckout = async () => {
     if (cart.length === 0) return;

     const itemsWithSerials = cart.filter(i => i.hasSerials);
     const missingSerials = itemsWithSerials.some(i => !i.serials || i.serials.length !== i.quantity);
     if (missingSerials) {
         setShowSerialsModal(true);
         return;
     }

     if (paymentMethod === '99' && !selectedCustomer) {
         setShowCustomerModal(true);
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

  const executeCheckout = async (itemsToCheckout: any[], overridePin?: string) => {
     const payload: any = {
         items: itemsToCheckout,
         paymentMethod: paymentMethod === '99' ? '99' : 'PUE',
         paymentForm: paymentMethod === '99' ? '99' : paymentMethod,
         cashShiftId: currentShift?.id,
         customFields: customFields,
         _offlineId: Date.now() // to track
     };
     if (selectedCustomer) payload.customerId = selectedCustomer.id;
     if (overridePin) payload.overridePin = overridePin;

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
       const res = await fetch(`${baseUrl}/pos/checkout`, {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' 
          },
          body: JSON.stringify(payload)
       });

       if (res.ok) {
          setSuccessMode(true);
          const currentTotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
          printTicket(itemsToCheckout, currentTotal * 1.16); // Assuming tax calculation roughly
          
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
          
          if (res.status === 400 && err.message?.includes('Requiere PIN de Encargado')) {
             // Abrir modal de PIN
             setCheckoutLoading(false);
             const pin = await new Promise<string|null>((resolve) => {
                setAuthModal({ isOpen: true, resolve, message: err.message });
             });
             setAuthModal(null);
             if (pin) {
                // Reintentar con el PIN
                executeCheckout(itemsToCheckout, pin);
             }
             return;
          }
          
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

  // == BLIND CLOSE STATE ==
  const [requireBlindClose, setRequireBlindClose] = useState(true); // Demo toggle for Phase 5
  const [showBlindCloseModal, setShowBlindCloseModal] = useState(false);
  const [cashCount, setCashCount] = useState({
      b1000: 0, b500: 0, b200: 0, b100: 0, b50: 0, b20: 0,
      m20: 0, m10: 0, m5: 0, m2: 0, m1: 0, m05: 0
  });

  const getPhysicalTotal = () => {
      return (cashCount.b1000 * 1000) + (cashCount.b500 * 500) + (cashCount.b200 * 200) + 
             (cashCount.b100 * 100) + (cashCount.b50 * 50) + (cashCount.b20 * 20) +
             (cashCount.m20 * 20) + (cashCount.m10 * 10) + (cashCount.m5 * 5) + 
             (cashCount.m2 * 2) + (cashCount.m1 * 1) + (cashCount.m05 * 0.5);
  };

  const confirmBlindClose = () => {
      const physical = getPhysicalTotal();
      setShiftSummary({
          ...shiftSummary,
          physicalCash: physical,
          cashDiff: physical - shiftSummary.expectedCash
      });
      setShowBlindCloseModal(false);
      setShowShiftSummary(true);
  };

  const loadShiftSummary = async () => {
      try {
         const res = await fetch(`${baseUrl}/pos/shifts/${currentShift.id}/summary`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' }
         });
         if (res.ok) {
            setShiftSummary(await res.json());
            if (requireBlindClose) {
                setShowBlindCloseModal(true);
            } else {
                setShowShiftSummary(true);
            }
         }
      } catch (e) { console.error(e); }
  };

  const handleCloseShift = async () => {
      try {
         const res = await fetch(`${baseUrl}/pos/shifts/${currentShift.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenantId') || 'demo-tenant' },
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
               {printerPort ? (
                   <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200">
                      🖨️ Impresora USB
                   </div>
               ) : (
                   <button onClick={connectPrinter} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 border border-slate-200">
                      🖨️ Conectar Impresora
                   </button>
               )}
              <button onClick={() => alert('Movimiento Manual')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">Retiro / Ingreso</button>
              <button onClick={loadShiftSummary} className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-sm transition-colors">Corte de Caja</button>
           </div>
       </div>

       <div className="flex-1 flex gap-6 overflow-hidden">
       {/* LEFT COLUMN: Products Grid */}
       <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                   id="pos-search-input"
                   type="text" 
                   autoFocus
                   placeholder="Buscar producto o escanear código (F2)..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   onKeyDown={e => {
                      if (e.key === 'Enter') {
                         if (filteredProducts.length === 1) {
                            addToCart(filteredProducts[0]);
                            setSearchTerm('');
                         } else {
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
             
             <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm h-[60px]">
                <button onClick={() => setShowQuickKeysOnly(false)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${!showQuickKeysOnly ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                   Lista
                </button>
                <button onClick={() => setShowQuickKeysOnly(true)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${showQuickKeysOnly ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                   ⭐ Táctil
                </button>
             </div>

             <button 
                 onClick={() => setShowTopupModal(true)} 
                 className="px-6 h-[60px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                 📱 Recargas
              </button>
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
             
             <button onClick={() => setIsTopupModalOpen(true)} className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-bold transition-colors shadow-sm text-sm shrink-0">
                <Smartphone className="w-4 h-4" />
                Recargas / Servicios
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
                   {cart.map(item => {
                      const displayP = item.displayPrice || item.unitPrice;
                      return (
                      <div key={item.productId} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group">
                         <div className="flex-1 pr-6">
                            <p className="font-bold text-slate-800 text-sm line-clamp-2">{item.name}</p>
                            <p className="text-slate-500 font-medium text-xs mt-1">${displayP.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                         </div>
                         <div className="flex flex-col items-end justify-between">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                               <button onClick={() => changeQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-md font-bold">-</button>
                               <span className="w-6 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                               <button onClick={() => changeQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-md font-bold">+</button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                               <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors p-1 bg-slate-50 rounded-md" title="Eliminar del carrito">
                                   <Trash2 className="w-4 h-4" />
                               </button>
                               <p className="font-black text-slate-900">${(displayP * item.quantity).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                         </div>
                      </div>
                   )})}
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

             <div className="grid grid-cols-4 gap-2 mb-6">
                <button 
                   onClick={() => setPaymentMethod('01')}
                   className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === '01' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                   <Banknote className="w-5 h-5 mb-1" />
                   <span className="text-[10px] font-bold">Efectivo</span>
                </button>
                <button 
                   onClick={() => setPaymentMethod('04')}
                   className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === '04' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                   <CreditCard className="w-5 h-5 mb-1" />
                   <span className="text-[10px] font-bold">Tarjeta</span>
                </button>
                <button 
                   onClick={() => setPaymentMethod('MP')}
                   className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'MP' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                   <CreditCard className="w-5 h-5 mb-1 text-blue-500" />
                   <span className="text-[10px] font-bold text-center leading-tight">Mercado Pago</span>
                </button>
                <button 
                    onClick={() => { setPaymentMethod('99'); if(!selectedCustomer) setShowCustomerModal(true); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === '99' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                 >
                    <FileText className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Fiado</span>
                 </button>
             </div>

             {selectedCustomer && (
                 <div className="mb-4 p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                       <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Cliente Seleccionado</p>
                       <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{selectedCustomer.legalName}</p>
                       {creditStatement && (
                          <p className={`text-xs font-bold mt-1 ${creditStatement.customer.availableCredit >= total ? 'text-emerald-600' : 'text-rose-600'}`}>
                             Crédito disp: ${(creditStatement.customer.availableCredit).toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </p>
                       )}
                    </div>
                    <button onClick={() => selectCustomer(null)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg">
                       <X className="w-4 h-4" />
                    </button>
                 </div>
              )}

             <button 
                id="btn-checkout"
                onClick={handleCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
             >
                {checkoutLoading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : "Cobrar Ticket (F8)"}
             </button>
          </div>
       </div>

       </div>

        {showBlindCloseModal && shiftSummary && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm shadow-2xl z-50 flex items-center justify-center animate-in fade-in p-4">
               <div className="bg-white rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl scale-in-95 duration-200">
                  <button onClick={() => setShowBlindCloseModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-700">
                     <X className="w-6 h-6" />
                  </button>

                  <div className="mb-6 text-center">
                     <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
                        <Banknote className="w-8 h-8" />
                     </div>
                     <h2 className="text-3xl font-black text-slate-800">Arqueo de Caja (Corte Ciego)</h2>
                     <p className="text-slate-500 font-medium mt-2">Ingresa la cantidad de billetes y monedas que tienes físicamente en el cajón.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                     <div>
                         <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Billetes</h3>
                         <div className="space-y-3">
                             {[1000, 500, 200, 100, 50, 20].map(val => (
                                 <div key={`b${val}`} className="flex items-center gap-3">
                                     <span className="w-16 font-bold text-slate-600">${val}</span>
                                     <span className="text-slate-400">x</span>
                                     <input 
                                         type="number" min="0" 
                                         value={(cashCount as any)[`b${val}`] || ''} 
                                         onChange={e => setCashCount({...cashCount, [`b${val}`]: parseInt(e.target.value) || 0})}
                                         className="w-full p-2 border border-slate-200 rounded-lg text-center bg-slate-50 focus:bg-white focus:ring-2 ring-indigo-500" 
                                         placeholder="0"
                                     />
                                 </div>
                             ))}
                         </div>
                     </div>
                     <div>
                         <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Monedas</h3>
                         <div className="space-y-3">
                             {[20, 10, 5, 2, 1, '05'].map(val => (
                                 <div key={`m${val}`} className="flex items-center gap-3">
                                     <span className="w-16 font-bold text-slate-600">${val === '05' ? '0.50' : val}</span>
                                     <span className="text-slate-400">x</span>
                                     <input 
                                         type="number" min="0" 
                                         value={(cashCount as any)[`m${val}`] || ''} 
                                         onChange={e => setCashCount({...cashCount, [`m${val}`]: parseInt(e.target.value) || 0})}
                                         className="w-full p-2 border border-slate-200 rounded-lg text-center bg-slate-50 focus:bg-white focus:ring-2 ring-indigo-500" 
                                         placeholder="0"
                                     />
                                 </div>
                             ))}
                         </div>
                     </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-xl flex justify-between items-center mb-6">
                      <span className="font-bold text-indigo-700">Total Físico Contado:</span>
                      <span className="text-3xl font-black text-indigo-700">${getPhysicalTotal().toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                  </div>

                  <button onClick={confirmBlindClose} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all">
                     Confirmar Arqueo y Revelar Corte
                  </button>
               </div>
            </div>
        )}

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
                       <span className="font-bold text-slate-700">Efectivo Esperado (Sistema):</span>
                       <span className="text-2xl font-black text-blue-600">${shiftSummary.expectedCash.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                    </div>

                    {shiftSummary.physicalCash !== undefined && (
                        <div className="p-4 bg-slate-50 rounded-xl flex flex-col gap-2 mt-4 border-t-2 border-slate-200">
                           <div className="flex justify-between items-center">
                               <span className="font-bold text-slate-700">Efectivo Físico (Arqueo):</span>
                               <span className="text-xl font-black text-indigo-600">${shiftSummary.physicalCash.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
                           </div>
                           <div className={`flex justify-between items-center p-3 rounded-lg ${shiftSummary.cashDiff < 0 ? 'bg-rose-100' : shiftSummary.cashDiff > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                               <span className={`font-bold ${shiftSummary.cashDiff < 0 ? 'text-rose-700' : shiftSummary.cashDiff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                   {shiftSummary.cashDiff < 0 ? 'Faltante en Caja:' : shiftSummary.cashDiff > 0 ? 'Sobrante en Caja:' : 'Caja Cuadrada Perfectamente'}
                               </span>
                               <span className={`text-xl font-black ${shiftSummary.cashDiff < 0 ? 'text-rose-700' : shiftSummary.cashDiff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                   {shiftSummary.cashDiff !== 0 ? `$${Math.abs(shiftSummary.cashDiff).toLocaleString('en-US',{minimumFractionDigits:2})}` : '✓'}
                               </span>
                           </div>
                        </div>
                    )}
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

        {scaleModalOpen && scaleProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                       <Tag className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 mb-1">{scaleProduct.name}</h2>
                    <p className="text-sm text-slate-500 mb-6">Coloque el producto en la báscula y presione el botón para leer el peso.</p>
                    
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 mb-6">
                       <div className="flex items-end justify-center gap-2">
                           <input 
                              type="number" 
                              step="0.001"
                              value={scaleWeight} 
                              onChange={(e) => setScaleWeight(e.target.value)}
                              className="text-4xl font-black text-slate-800 bg-transparent w-32 text-center focus:outline-none" 
                           />
                           <span className="text-xl font-bold text-slate-500 mb-1">KG</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                           onClick={readFromScale} 
                           disabled={isReadingScale}
                           className="w-full py-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                        >
                           {isReadingScale ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Obtener Peso de Báscula"}
                        </button>
                        <button 
                           onClick={confirmScaleWeight} 
                           className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
                        >
                           Confirmar e Ingresar
                        </button>
                        <button 
                           onClick={() => setScaleModalOpen(false)} 
                           className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold transition-all"
                        >
                           Cancelar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showTopupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                    <h2 className="text-2xl font-black text-slate-800 mb-6">📱 Recarga Electrónica</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Compañía</label>
                            <select 
                                value={topupData.provider} 
                                onChange={e => setTopupData({...topupData, provider: e.target.value})}
                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            >
                                <option value="Telcel">Telcel</option>
                                <option value="AT&T">AT&T</option>
                                <option value="Movistar">Movistar</option>
                                <option value="Unefon">Unefon</option>
                                <option value="Bait">Bait</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Número a Recargar (10 dígitos)</label>
                            <input 
                                type="text" 
                                maxLength={10}
                                value={topupData.phone} 
                                onChange={e => setTopupData({...topupData, phone: e.target.value.replace(/\D/g, '')})}
                                placeholder="0000000000"
                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg tracking-widest text-center"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Monto ($)</label>
                            <select 
                                value={topupData.amount} 
                                onChange={e => setTopupData({...topupData, amount: e.target.value})}
                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            >
                                <option value="20">$20.00</option>
                                <option value="30">$30.00</option>
                                <option value="50">$50.00</option>
                                <option value="100">$100.00</option>
                                <option value="200">$200.00</option>
                                <option value="500">$500.00</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setShowTopupModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">Cancelar</button>
                        <button onClick={addTopupToCart} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all">Agregar a Caja</button>
                    </div>
                </div>
            </div>
        )}

        {showCustomerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-xl flex flex-col max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-2xl font-black text-slate-800">Seleccionar Cliente</h2>
                       <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                    </div>
                    
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Buscar cliente..." 
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {customers.filter(c => c.legalName.toLowerCase().includes(customerSearch.toLowerCase()) || c.rfc.includes(customerSearch)).map(c => (
                            <button 
                               key={c.id}
                               onClick={() => selectCustomer(c)}
                               className="w-full flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                               <div>
                                  <p className="font-bold text-slate-800">{c.legalName}</p>
                                  <p className="text-sm text-slate-500">RFC: {c.rfc}</p>
                               </div>
                               {c.creditEnabled && (
                                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg uppercase">
                                     Crédito Activo
                                  </div>
                               )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {authModal?.isOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
               <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                   <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                   <h2 className="text-2xl font-black text-slate-800 mb-2">Autorización Requerida</h2>
                   <p className="text-slate-600 text-sm mb-6">{authModal.message}</p>
                   
                   <input 
                      type="password" 
                      placeholder="PIN de Encargado" 
                      id="authPinInput"
                      autoFocus
                      onKeyDown={e => {
                         if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            authModal.resolve(val);
                         }
                      }}
                      className="w-full text-center tracking-[0.5em] font-black text-2xl py-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-blue-500 focus:outline-none mb-4" 
                   />

                   <div className="flex gap-3">
                      <button onClick={() => authModal.resolve(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold">Cancelar</button>
                      <button onClick={() => {
                         const val = (document.getElementById('authPinInput') as HTMLInputElement).value;
                         authModal.resolve(val);
                      }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Autorizar</button>
                   </div>
               </div>
           </div>
        )}
        <ShiftSummaryModal />
        <TopupModal 
           isOpen={isTopupModalOpen}
           onClose={() => setIsTopupModalOpen(false)}
           onAdd={(item) => {
               setCart([...cart, { ...item, quantity: 1 }]);
           }}
        />
    </div>
  );
}
