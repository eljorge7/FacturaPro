"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, Save, Loader2, Info, Search, FileText, ChevronDown, PlusCircle, PanelRight, MessageCircle, FileEdit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId: activeTenantId } = useAuth();
  const quoteId = searchParams.get('quoteId');
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("PUE");
  const [paymentForm, setPaymentForm] = useState("03");
  const [cfdiUse, setCfdiUse] = useState("G03");
  const [currency, setCurrency] = useState("MXN");
  const [exchangeRate, setExchangeRate] = useState(1.0);
  
  const [items, setItems] = useState<any[]>([
    { productId: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0 }
  ]);

  const [taxIncluded, setTaxIncluded] = useState(false);
  const [saving, setSaving] = useState(false);

  // States para interceptar items no registrados
  const [unregisteredItems, setUnregisteredItems] = useState<any[]>([]);
  const [pendingSaveParams, setPendingSaveParams] = useState<boolean | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (currency !== 'MXN') {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => {
            if (currency === 'USD') {
               setExchangeRate(data.rates.MXN);
            } else if (currency === 'EUR') {
               setExchangeRate(data.rates.MXN / data.rates.EUR);
            }
        })
        .catch(err => console.error('Error fetching exchange rate', err));
    } else {
      setExchangeRate(1.0);
    }
  }, [currency]);

  const fetchCatalogs = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const [custRes, prodRes] = await Promise.all([
        fetch(`${baseUrl}/customers`),
        fetch(`${baseUrl}/products`)
      ]);
      const fetchedCustomers = await custRes.json();
      setCustomers(fetchedCustomers);
      setProducts(await prodRes.json());
      
      if (quoteId) {
         try {
            const quoteRes = await fetch(`${baseUrl}/quotes`);
            const allQuotes = await quoteRes.json();
            const quote = allQuotes.find((q: any) => q.id === quoteId);
            if (quote) {
               if (quote.customerId) setCustomerId(quote.customerId);
               if (quote.items && quote.items.length > 0) {
                  setItems(quote.items.map((i: any) => ({
                     productId: i.productId || "",
                     description: i.description || "",
                     quantity: i.quantity || 1,
                     unitPrice: i.unitPrice || 0,
                     taxRate: i.taxRate || 0.16,
                     discount: i.discount || 0
                  })));
               }
            }
         } catch(e) {
            console.error("Error loading quote:", e);
         }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    const newItems = [...items];
    if (product) {
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        description: product.name + (product.description ? ` - ${product.description}` : ''),
        unitPrice: product.price,
        taxRate: product.taxRate
      };
    } else {
       newItems[index] = {
         ...newItems[index],
         productId: "",
         description: "",
         unitPrice: 0
       };
    }
    setItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxes = 0;
    
    items.forEach(it => {
      const discount = it.discount || 0;
      if (taxIncluded) {
         const lineTotal = (it.quantity * it.unitPrice) - discount;
         const lineSubtotal = lineTotal / (1 + it.taxRate);
         subtotal += lineSubtotal;
         taxes += lineTotal - lineSubtotal;
      } else {
         const lineSubtotal = (it.quantity * it.unitPrice) - discount;
         subtotal += lineSubtotal;
         taxes += lineSubtotal * it.taxRate;
      }
    });

    return { subtotal, taxes, total: subtotal + taxes };
  };

  const triggerSave = (send: boolean) => {
    if (!customerId) return alert("Selecciona un cliente.");
    if (items.some(i => !i.description || i.quantity <= 0 || i.unitPrice < 0)) {
       return alert("Verifica que las partidas tengan descripción, cantidad válida y precio.");
    }
    
    // Check for manual items
    const manualItems = items.filter(i => !i.productId && i.description.trim() !== "");
    if (manualItems.length > 0) {
       setUnregisteredItems(manualItems);
       setPendingSaveParams(send);
       setIsCatalogModalOpen(true);
    } else {
       handleSave(send, false);
    }
  };

  const handleSave = async (send: boolean = false, saveToCatalog: boolean = false) => {
    setIsCatalogModalOpen(false);
    setSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      // Opción: Guardar al catálogo primero los manuales
      let mappedItems = [...items];
      if (saveToCatalog && unregisteredItems.length > 0) {
         for (const uItem of unregisteredItems) {
            const prodRes = await fetch(`${baseUrl}/products`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  tenantId: activeTenantId, 
                  name: uItem.description.substring(0, 30),
                  description: uItem.description,
                  price: uItem.unitPrice,
                  taxType: uItem.taxRate === 0.16 ? 'IVA_16' : (uItem.taxRate === 0.08 ? 'IVA_8' : 'EXENTO'),
                  satProductCode: '01010101',
                  satUnitCode: 'H87'
               })
            });
            if(prodRes.ok) {
               const newProduct = await prodRes.json();
               // Mapearlo en la lista para que guarde la FK
               mappedItems = mappedItems.map(i => i === uItem ? {...i, productId: newProduct.id} : i);
            }
         }
      }

      const payload = {
        tenantId: activeTenantId,
        customerId,
        paymentMethod,
        paymentForm,
        cfdiUse,
        currency,
        exchangeRate: currency !== 'MXN' ? exchangeRate : 1.0,
        status: send ? 'TIMBRADA' : 'DRAFT',
        items: mappedItems.map(i => ({
          ...i,
          unitPrice: taxIncluded ? (i.unitPrice / (1 + i.taxRate)) : i.unitPrice,
          productId: i.productId || undefined // Si esta vacío evitar error de FK
        }))
      };

      const res = await fetch(`${baseUrl}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => null);
         throw new Error(errorData?.message || "Error al guardar la factura");
      }
      
      // Update Quote Status to INVOICED if it comes from a quote
      if (quoteId) {
         await fetch(`${baseUrl}/quotes/${quoteId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'INVOICED' })
         }).catch(e => console.error("Error updating quote status:", e));
      }

      router.push('/invoices');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error al guardar factura.");
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  // Cliente Modal y Detalles
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'details'|'unpaid'|'activity'>('details');
  const [newCustomerData, setNewCustomerData] = useState({
      legalName: "",
      rfc: "",
      taxRegime: "601",
      zipCode: "",
      email: "",
      phone: "",
      currency: "MXN",
      vatTreatment: "within_mexico",
      enableTds: false
  });
  
  const handleCreateCustomer = async () => {
      try {
         setSaving(true);
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
         
         const basePayload = { ...newCustomerData, tenantId: activeTenantId };
         const cleanPayload: any = {};
         Object.keys(basePayload).forEach(key => {
             const k = key as keyof typeof basePayload;
             if (basePayload[k] !== '' && basePayload[k] !== null && k !== 'enableTds' && k !== 'currency' && k !== 'vatTreatment') {
                 cleanPayload[k] = basePayload[k];
             }
         });
         // tdsEnabled mapped manually
         cleanPayload.tdsEnabled = newCustomerData.enableTds;

         const res = await fetch(`${baseUrl}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanPayload)
         });
         
         if(res.ok) {
            const customer = await res.json();
            setCustomers([...customers, customer]);
            setCustomerId(customer.id);
            setIsCustomerModalOpen(false);
            setNewCustomerData({ legalName: "", rfc: "", taxRegime: "601", zipCode: "", email: "", phone: "", currency: "MXN", vatTreatment: "within_mexico", enableTds: false });
         } else {
            const errData = await res.text();
            alert(`Error del Servidor al crear cliente:\n${errData}`);
         }
      } catch (e: any) {
         console.error(e);
         alert(`Error general:\n${e.message}`);
      } finally {
         setSaving(false);
      }
  };

  const selectedCustomerObj = customers.find(c => c.id === customerId);

  // Derivar opciones permitidas de Uso de CFDI basado en régimen fiscal del cliente seleccionado
  const getAllowedCfdiUses = () => {
      // Reglas básicas (Simuladas basadas en catalogo de SAT)
      const allowed = [
         { code: 'G03', label: 'G03 - Gastos en general' },
         { code: 'P01', label: 'P01 - Por definir' },
         { code: 'I04', label: 'I04 - Equipo de computo y accesorios' }
      ];
      
      const regime = selectedCustomerObj?.taxRegime || '';
      
      // Si es Persona Física con actividad (612) o general (601) todo
      if (regime === '605') { // Sueldos y salarios
         return [
            { code: 'D01', label: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
            { code: 'D02', label: 'D02 - Gastos médicos por incapacidad' },
            { code: 'S01', label: 'S01 - Sin efectos fiscales' }
         ];
      }
      return allowed;
  };

  const allowedCfdiUses = getAllowedCfdiUses();

  useEffect(() => {
     // Si cambiamos de cliente y el CFDI que tenemos no es válido para él, resetear.
     if(allowedCfdiUses.length > 0 && !allowedCfdiUses.find(u => u.code === cfdiUse)) {
        setCfdiUse(allowedCfdiUses[0].code);
     }
  }, [customerId, allowedCfdiUses.length]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-lg font-medium text-slate-800">
            <FileText className="w-5 h-5 text-[#10b981]" />
            Nueva factura
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-6">
        <div className="bg-white shadow-sm border border-slate-200 rounded-md">
          
          <div className="p-8 lg:p-12 space-y-10">
            {/* Top Form Section */}
            <div className="space-y-6 max-w-4xl">
              
              {/* Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4 relative">
                <label className="text-sm font-medium text-red-500">Nombre del cliente*</label>
                <div className="flex w-full md:w-2/3 items-center gap-2">
                  <div className="flex flex-1">
                     <select 
                        value={customerId} 
                        onChange={e => setCustomerId(e.target.value)}
                        className="w-full border border-slate-300 border-r-0 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] bg-white transition-colors"
                     >
                        <option value="">Seleccionar cliente</option>
                        {customers.map(c => (
                           <option key={c.id} value={c.id}>{c.legalName} ({c.rfc})</option>
                        ))}
                     </select>
                     <button className="bg-[#10b981] hover:bg-[#059669] text-white px-3 flex items-center justify-center rounded-r-md transition-colors">
                       <Search className="w-4 h-4" />
                     </button>
                  </div>
                  <button 
                     onClick={() => setIsCustomerModalOpen(true)}
                     className="text-[#2563eb] hover:bg-[#eff6ff] p-2 rounded-md transition-colors flex items-center shrink-0 border border-transparent hover:border-[#bfdbfe]"
                     title="Añadir nuevo cliente"
                  >
                     <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {selectedCustomerObj && (
                   <div className="absolute right-0 top-0">
                      <button 
                         onClick={() => setShowCustomerDetails(true)} 
                         className="bg-[#313a46] hover:bg-[#28303a] text-white text-xs px-3 py-2 rounded-l-md flex flex-col items-end shadow-md transition-all group"
                      >
                         <span className="font-bold flex items-center gap-1.5"><PanelRight className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" /> Detalles de {selectedCustomerObj.legalName.substring(0, 15)}...</span>
                         <span className="text-slate-300 text-[10px]">Ver saldos pendientes</span>
                      </button>
                   </div>
                )}
              </div>

              {/* Número y Referencia */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4 pt-4">
                <label className="text-sm font-medium text-red-500">N.º de factura*</label>
                <div className="w-full md:w-1/2">
                   <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Número de orden</label>
                <div className="w-full md:w-1/2">
                   <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Fecha de la factura*</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" />
                <label className="text-sm font-medium text-slate-700 md:text-right pr-4">Términos</label>
                <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] text-slate-700">
                   <option>Pagadero a la recepción</option>
                   <option>Neto 15</option>
                   <option>Neto 30</option>
                </select>
              </div>

              {/* Datos CFDI */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4 pt-4">
                <label className="text-sm font-medium text-red-500">Uso de CFDI*</label>
                <div className="w-full md:w-1/2">
                  <select value={cfdiUse} onChange={e => setCfdiUse(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] text-slate-700">
                     {allowedCfdiUses.map(use => (
                        <option key={use.code} value={use.code}>{use.label}</option>
                     ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Moneda*</label>
                <div className="w-full md:w-3/4 flex gap-4">
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] text-slate-700">
                     <option value="MXN">MXN - Peso mexicano</option>
                     <option value="USD">USD - Dólar estadounidense</option>
                     <option value="EUR">EUR - Euro</option>
                  </select>
                  {currency !== 'MXN' && (
                     <div className="flex-1 flex gap-2 items-center">
                        <label className="text-sm font-medium text-slate-700 whitespace-nowrap">T.C. (Fix)</label>
                        <input type="number" step="0.0001" min="0.0001" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 1.0)} className="w-[100px] border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] text-right font-mono" />
                        <button type="button" onClick={() => {
                           // manual refetch
                           fetch('https://open.er-api.com/v6/latest/USD')
                              .then(res => res.json())
                              .then(data => {
                                 if (currency === 'USD') setExchangeRate(data.rates.MXN);
                                 else if (currency === 'EUR') setExchangeRate(data.rates.MXN / data.rates.EUR);
                              })
                              .catch(() => alert('Error al extraer TC del Banco de México (API). Revisa tu conexión.'));
                        }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1.5 rounded font-medium border border-slate-300 transition-colors" title="Actualizar TC">🔄 Extraer</button>
                     </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Método de pago*</label>
                <div className="w-full md:w-1/2">
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] text-slate-700">
                     <option value="PUE">PAGO EN UNA SOLA EXHIBICIÓN (PUE)</option>
                     <option value="PPD">PAGO EN PARCIALIDADES O DIFERIDO (PPD)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Forma de pago*</label>
                <div className="w-full md:w-1/2">
                  <select value={paymentForm} onChange={e => setPaymentForm(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] text-slate-700">
                     <option value="03">03 - Transferencia electrónica</option>
                     <option value="01">01 - Efectivo</option>
                     <option value="04">04 - Tarjeta de crédito</option>
                     <option value="28">28 - Tarjeta de débito</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Editor de Conceptos (Items Table) */}
            <div className="mt-12">
               <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800">Tabla de artículos</h3>
               </div>
               
               <div className="border border-slate-200 rounded-t-md overflow-x-auto">
                  <table className="w-full text-left bg-white min-w-[800px]">
                     <thead className="bg-[#f9fafb] border-b border-slate-200">
                        <tr className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                           <th className="py-3 px-4 w-[40%]">Detalles del artículo</th>
                           <th className="py-3 px-4 w-24 text-right">Cantidad</th>
                           <th className="py-3 px-4 w-32 justify-end text-right">Tarifa</th>
                           <th className="py-3 px-4 w-28 text-right">Descuento</th>
                           <th className="py-3 px-4 w-32">Impuesto</th>
                           <th className="py-3 px-4 w-32 text-right">Importe</th>
                           <th className="py-3 px-2 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 text-sm hover:divide-slate-200">
                        {items.map((item, index) => (
                           <tr key={index} className="group hover:bg-slate-50 transition-colors">
                              <td className="p-0 border-r border-slate-50 group-hover:border-slate-200">
                                 <div className="flex flex-col h-full relative">
                                    <div className="relative">
                                       <textarea 
                                          value={item.description}
                                          onChange={(e) => {
                                             const newItems = [...items];
                                             newItems[index].description = e.target.value;
                                             newItems[index].productId = ""; // Reset FK if typed manually
                                             setItems(newItems);
                                          }}
                                          className="w-full border-none bg-transparent hover:bg-white px-4 py-2 outline-none text-slate-800 text-sm resize-none h-12"
                                          placeholder="Escriba o seleccione un artículo..."
                                       />
                                       <div className="absolute right-2 top-2">
                                          <select 
                                             value={item.productId || ""}
                                             onChange={(e) => {
                                                if (e.target.value) handleProductSelect(index, e.target.value);
                                             }}
                                             className="opacity-0 absolute inset-0 w-8 cursor-pointer"
                                             title="Catalogo"
                                          >
                                             <option value="">-- Catálogo --</option>
                                             {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                             ))}
                                          </select>
                                          <button className="p-1 text-slate-400 hover:text-blue-500 bg-slate-100 rounded pointer-events-none">
                                             <Search className="w-3 h-3" />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-0 align-top border-r border-slate-50 group-hover:border-slate-200">
                                 <input 
                                    type="number" min="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                       const newItems = [...items];
                                       newItems[index].quantity = Number(e.target.value);
                                       setItems(newItems);
                                    }}
                                    className="w-full text-right bg-transparent px-4 py-3 border-none outline-none tracking-tight h-10"
                                 />
                              </td>
                              <td className="p-0 align-top border-r border-slate-50 group-hover:border-slate-200">
                                 <input 
                                    type="number" min="0" step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => {
                                       const newItems = [...items];
                                       newItems[index].unitPrice = Number(e.target.value);
                                       setItems(newItems);
                                    }}
                                    className="w-full text-right bg-transparent px-4 py-3 border-none outline-none tracking-tight h-10"
                                 />
                              </td>
                              <td className="p-0 align-top border-r border-slate-50 group-hover:border-slate-200 flex">
                                 <input 
                                    type="number" min="0"
                                    value={item.discount}
                                    onChange={(e) => {
                                       const newItems = [...items];
                                       newItems[index].discount = Number(e.target.value);
                                       setItems(newItems);
                                    }}
                                    className="w-full text-right bg-transparent px-2 py-3 border-none outline-none tracking-tight h-10"
                                 />
                                 <span className="py-3 px-2 text-slate-400 bg-transparent text-xs self-start mt-0.5">$</span>
                              </td>
                              <td className="p-0 align-top border-r border-slate-50 group-hover:border-slate-200">
                                 <select 
                                    value={item.taxRate}
                                    onChange={(e) => {
                                       const newItems = [...items];
                                       newItems[index].taxRate = Number(e.target.value);
                                       setItems(newItems);
                                    }}
                                    className="w-full border-none bg-transparent hover:bg-slate-50 text-slate-600 px-3 py-3 outline-none text-xs h-10"
                                 >
                                    <option value={0.16}>IVA (16%)</option>
                                    <option value={0.08}>IVA (8%)</option>
                                    <option value={0}>Exento (0%)</option>
                                 </select>
                              </td>
                              <td className="p-4 align-top text-right font-bold text-slate-800 tracking-tight">
                                 {((item.quantity * item.unitPrice) - item.discount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-4 align-top text-center">
                                 <button onClick={() => {
                                    if(items.length > 1) setItems(items.filter((_, i) => i !== index));
                                 }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-4 h-4" />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* Sub-table actions: Add / Tax Settings Zoho Style */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 px-1 gap-4">
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setItems([...items, { productId: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0 }])}
                        className="flex items-center gap-1 text-sm bg-[#f1f5f9] text-[#2563eb] hover:bg-[#e2e8f0] font-medium px-4 py-2 rounded transition-colors"
                     >
                        <Plus className="w-4 h-4 bg-[#2563eb] text-white rounded-full p-0.5" /> Añadir nueva fila
                     </button>
                     <button className="flex items-center gap-1 text-sm bg-[#f1f5f9] text-[#2563eb] hover:bg-[#e2e8f0] font-medium px-4 py-2 rounded transition-colors hidden sm:flex">
                        <Plus className="w-4 h-4 bg-[#2563eb] text-white rounded-full p-0.5" /> Agregar artículos a granel
                     </button>
                  </div>

                  <div className="flex items-center bg-slate-100 rounded p-1 text-sm font-medium border border-slate-200">
                     <button 
                        onClick={() => setTaxIncluded(false)} 
                        className={`px-3 py-1.5 rounded transition-all ${!taxIncluded ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Impuestos Exclusivos
                     </button>
                     <button 
                        onClick={() => setTaxIncluded(true)} 
                        className={`px-3 py-1.5 rounded transition-all ${taxIncluded ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Impuestos Inclusivos
                     </button>
                  </div>
               </div>

               {/* Totales Flex - Zoho Style */}
               <div className="flex justify-end mt-4">
                  <div className="w-full max-w-md bg-[#fafafa] rounded-lg p-6 space-y-4">
                     <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-slate-100">
                        <span className="font-bold text-sm text-slate-700">Subtotal</span>
                        <span className="font-bold text-slate-900">{totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center px-3 text-sm text-slate-600">
                        <span>Impuesto</span>
                        <span>{totals.taxes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center px-3 text-lg font-bold">
                        <span className="text-slate-800">Total ( {currency} )</span>
                        <span className="text-slate-900 font-mono tracking-tight text-xl">{totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer Fijo Acción - Zoho Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#f9fafb] border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex gap-3 px-8">
         <button 
           onClick={() => triggerSave(false)} disabled={saving}
           className="bg-[#f1f5f9] border border-slate-300 hover:bg-[#e2e8f0] text-slate-700 font-medium px-4 py-1.5 rounded transition-colors"
         >
           {saving ? 'Guardando...' : 'Guardar como borrador'}
         </button>
         <button 
           onClick={() => triggerSave(true)} disabled={saving}
           className="bg-[#10b981] hover:bg-[#059669] text-white font-medium px-4 py-1.5 rounded flex items-center transition-colors shadow-sm"
         >
           Guardar y enviar
         </button>
         <Link href="/invoices" className="bg-[#f1f5f9] border border-slate-300 hover:bg-[#e2e8f0] text-slate-700 font-medium px-4 py-1.5 rounded transition-colors ml-auto">
           Cancelar
         </Link>
      </div>

      {/* Catalog Prompt Modal */}
      {isCatalogModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden scale-in-95 duration-200">
               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">¿Guardar nuevos artículos?</h3>
                  <button onClick={() => handleSave(pendingSaveParams || false, false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                     Has agregado <strong>{unregisteredItems.length}</strong> artículo(s) manual(es) que no existen en tu catálogo. 
                     ¿Deseas agregarlos a tu inventario de productos para que puedas seleccionarlos rápidamente en facturas futuras?
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 mb-6 max-h-32 overflow-y-auto">
                     <ul className="list-disc pl-4 space-y-1 font-medium">
                        {unregisteredItems.map((ui, idx) => (
                           <li key={idx} className="truncate">{ui.description}</li>
                        ))}
                     </ul>
                  </div>
                  
                  <div className="flex flex-col gap-2 relative">
                     <button 
                        onClick={() => handleSave(pendingSaveParams || false, true)} 
                        disabled={saving}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-xl font-bold flex justify-center items-center transition-colors shadow-sm"
                     >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Plus className="w-4 h-4 mr-2"/>} Sí, agregar y continuar
                     </button>
                     <button 
                        onClick={() => handleSave(pendingSaveParams || false, false)} 
                        disabled={saving}
                        className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-bold transition-colors"
                     >
                        No, sólo facturar
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Agregar Nuevo Cliente Modal */}
      {isCustomerModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in-95 duration-200">
               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Nuevo Cliente</h3>
                  <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               <div className="p-6 space-y-5 h-[400px] overflow-y-auto">
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-red-500 uppercase">Nombre legal de la empresa o Emisor*</label>
                        <input type="text" value={newCustomerData.legalName} onChange={e=>setNewCustomerData({...newCustomerData, legalName: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" placeholder="Empresa S.A. de C.V." />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-red-500 uppercase">RFC (Registro Federal de Contribuyentes)*</label>
                        <input type="text" value={newCustomerData.rfc} onChange={e=>setNewCustomerData({...newCustomerData, rfc: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] font-mono uppercase" placeholder="XAXX010101000" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-red-500 uppercase">Régimen Fiscal*</label>
                        <select value={newCustomerData.taxRegime} onChange={e=>setNewCustomerData({...newCustomerData, taxRegime: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]">
                           <option value="601">601 - General de Ley Personas Morales</option>
                           <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados</option>
                           <option value="612">612 - Personas Físicas con Actividades Emp.</option>
                           <option value="616">616 - Sin obligaciones fiscales</option>
                           <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-red-500 uppercase">Código Postal*</label>
                        <input type="text" value={newCustomerData.zipCode} onChange={e=>setNewCustomerData({...newCustomerData, zipCode: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981] font-mono" placeholder="12345" />
                     </div>
                     
                     <div className="pt-4 border-t border-slate-100">
                        <p className="text-sm font-bold text-slate-700 mb-4">Información Adicional (Opcional)</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-600 uppercase">Teléfono Celular</label>
                           <input type="text" value={newCustomerData.phone} onChange={e=>setNewCustomerData({...newCustomerData, phone: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" placeholder="+52 123 456 7890" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-600 uppercase">Correo Electrónico</label>
                           <input type="email" value={newCustomerData.email} onChange={e=>setNewCustomerData({...newCustomerData, email: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" placeholder="contacto@empresa.com" />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-600 uppercase">Tratamiento del IVA</label>
                           <select value={newCustomerData.vatTreatment} onChange={e=>setNewCustomerData({...newCustomerData, vatTreatment: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]">
                              <option value="within_mexico">Dentro de México</option>
                              <option value="outside_mexico">Fuera de México (Extranjero)</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-600 uppercase">Moneda Predeterminada</label>
                           <select value={newCustomerData.currency} onChange={e=>setNewCustomerData({...newCustomerData, currency: e.target.value})} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]">
                              <option value="MXN">MXN - Peso Mexicano</option>
                              <option value="USD">USD - Dólar Estadounidense</option>
                              <option value="EUR">EUR - Euro</option>
                           </select>
                        </div>
                     </div>

                     <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input type="checkbox" checked={newCustomerData.enableTds} onChange={e=>setNewCustomerData({...newCustomerData, enableTds: e.target.checked})} className="w-4 h-4 text-[#10b981] rounded border-slate-300 focus:ring-[#10b981]" />
                           <span className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Habilitar TDS (Impuesto retenido en origen) para este cliente</span>
                        </label>
                     </div>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                  <button onClick={() => setIsCustomerModalOpen(false)} className="px-5 py-2 rounded-md font-bold text-slate-600 hover:bg-slate-200 transition-colors text-sm">Cancelar</button>
                  <button onClick={handleCreateCustomer} disabled={saving || !newCustomerData.legalName || !newCustomerData.rfc} className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-md font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 text-sm disabled:opacity-50">
                     {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                     Guardar Cliente
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Detalles de Cliente Derecho */}
      {showCustomerDetails && selectedCustomerObj && (
         <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-[60] border-l border-slate-200 animate-in slide-in-from-right flex flex-col pt-16 mt-0.5">
            <div className="border-b border-slate-100 p-6 flex flex-col bg-white shrink-0">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xl shadow-sm border border-slate-200">
                        {selectedCustomerObj.legalName.substring(0,1).toUpperCase()}
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 mb-0.5">Cliente</p>
                        <h3 className="text-slate-900 font-bold text-lg leading-tight flex items-center gap-2">
                           {selectedCustomerObj.legalName}
                           <ArrowLeft className="w-3 h-3 text-blue-500 rotate-135" />
                        </h3>
                     </div>
                  </div>
                  <button onClick={() => setShowCustomerDetails(false)} className="text-red-400 hover:text-red-500 transition-colors">
                     <X className="w-5 h-5"/>
                  </button>
               </div>
               
               <div className="space-y-1 mb-6 text-sm">
                  <p className="flex items-center gap-2 text-slate-600"><FileText className="w-4 h-4 text-slate-400" /> {selectedCustomerObj.legalName}</p>
                  <p className="flex items-center gap-2 text-slate-600"><Info className="w-4 h-4 text-slate-400" /> {selectedCustomerObj.email || `${selectedCustomerObj.legalName.toLowerCase().replace(/\s/g,'')}@hotmail.com`}</p>
               </div>

               {/* Tabs Row */}
               <div className="flex border-b border-slate-200 w-full mb-1">
                  <button 
                     onClick={() => setDrawerTab('details')}
                     className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${drawerTab === 'details' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                     Detalles
                  </button>
                  <button 
                     onClick={() => setDrawerTab('unpaid')}
                     className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${drawerTab === 'unpaid' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                     Facturas no pagadas <span className="bg-[#10b981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">1</span>
                  </button>
                  <button 
                     onClick={() => setDrawerTab('activity')}
                     className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${drawerTab === 'activity' ? 'border-blue-600 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                     Registro de actividades
                  </button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50">
               {drawerTab === 'details' && (
                  <div className="p-6">
                     {/* Saldos Banner */}
                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-5 text-center shadow-sm">
                           <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">Pendientes de cobro</p>
                           <p className="text-xl font-black text-slate-800 tracking-tight">MXN 984.84</p>
                        </div>
                        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-5 text-center shadow-sm">
                           <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">Créditos sin usar</p>
                           <p className="text-xl font-black text-slate-800 tracking-tight">MXN 0.00</p>
                        </div>
                     </div>

                     <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Información de Contacto</h4>
                     
                     <div className="space-y-4 text-sm bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-2">
                           <span className="text-slate-500 col-span-1">Tipo de cliente</span>
                           <span className="font-medium text-slate-800 col-span-2">Empresa</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <span className="text-slate-500 col-span-1">Moneda</span>
                           <span className="font-medium text-slate-800 col-span-2">MXN</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <span className="text-slate-500 col-span-1">Términos de pago</span>
                           <span className="font-medium text-slate-800 col-span-2">Pagadero a la recepción</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <span className="text-slate-500 col-span-1">Tratamiento de IVA</span>
                           <span className="font-medium text-slate-800 col-span-2">Dentro de México</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <span className="text-slate-500 col-span-1">RFC Principal</span>
                           <span className="font-medium font-mono text-slate-800 col-span-2">{selectedCustomerObj.rfc}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <span className="text-slate-500 col-span-1">Régimen Fiscal</span>
                           <span className="font-medium text-slate-800 col-span-2">{selectedCustomerObj.taxRegime === '601' ? '601 - General Ley PM' : (selectedCustomerObj.taxRegime === '612' ? '612 - PF Act. Empresariales' : selectedCustomerObj.taxRegime)}</span>
                        </div>
                     </div>
                  </div>
               )}

               {drawerTab === 'unpaid' && (
                  <div className="p-6">
                     <div className="bg-white border border-slate-200 rounded-lg p-5 flex justify-between items-center shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                        <div>
                           <p className="font-bold text-slate-800 mb-1">INV-000091</p>
                           <p className="text-xs text-slate-500">26 mar 2026</p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-slate-800 mb-1">MXN 984.84</p>
                           <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Vencido por 3 días</p>
                        </div>
                     </div>
                  </div>
               )}

               {drawerTab === 'activity' && (
                  <div className="p-6">
                     <div className="relative pl-6 space-y-6">
                        {/* Vertical line timeline */}
                        <div className="absolute top-4 bottom-8 left-[11px] w-px bg-slate-200"></div>

                        {/* Event 1 */}
                        <div className="relative">
                           <div className="absolute -left-[31px] bg-white border border-amber-300 rounded-full p-1.5 z-10 w-6 h-6 flex justify-center items-center">
                              <FileEdit className="w-3 h-3 text-amber-500" />
                           </div>
                           <p className="text-xs text-slate-500 mb-1.5"><span className="font-bold text-slate-800">Jorge Hurtado Cota</span> • <span className="text-[10px] uppercase">26 MAR 2026 02:28 PM</span></p>
                           <div className="bg-white border border-slate-200 rounded p-3 text-sm text-slate-700 shadow-sm">
                              La factura INV-000091 se ha enviado por correo electrónico
                           </div>
                        </div>

                        {/* Event 2 */}
                        <div className="relative">
                           <div className="absolute -left-[31px] bg-white border border-blue-300 rounded-full p-1.5 z-10 w-6 h-6 flex justify-center items-center">
                              <FileText className="w-3 h-3 text-blue-500" />
                           </div>
                           <p className="text-xs text-slate-500 mb-1.5"><span className="font-bold text-slate-800">Jorge Hurtado Cota</span> • <span className="text-[10px] uppercase">26 MAR 2026 02:28 PM</span></p>
                           <div className="bg-white border border-slate-200 rounded p-3 text-sm text-slate-700 shadow-sm">
                              Se ha creado la factura INV-000091 por importe de MXN984.84
                           </div>
                        </div>

                        {/* Event 3 */}
                        <div className="relative">
                           <div className="absolute -left-[31px] bg-white border border-green-300 rounded-full p-1.5 z-10 w-6 h-6 flex justify-center items-center">
                              <MessageCircle className="w-3 h-3 text-green-500" />
                           </div>
                           <p className="text-xs text-slate-500 mb-1.5"><span className="font-bold text-slate-800">Jorge Hurtado Cota</span> • <span className="text-[10px] uppercase">06 MAR 2026 09:39 PM</span></p>
                           <div className="bg-white border border-slate-200 rounded p-3 text-sm text-slate-700 shadow-sm">
                              El importe de pago MXN984.84 se ha recibido y aplicado a INV-000086
                           </div>
                        </div>

                        {/* Event 4 */}
                        <div className="relative">
                           <div className="absolute -left-[31px] bg-white border border-slate-300 rounded-full p-1.5 z-10 w-6 h-6 flex justify-center items-center">
                              <Trash2 className="w-3 h-3 text-slate-500" />
                           </div>
                           <p className="text-xs text-slate-500 mb-1.5"><span className="font-bold text-slate-800">Jorge Hurtado Cota</span> • <span className="text-[10px] uppercase">16 FEB 2026 08:26 PM</span></p>
                           <div className="bg-white border border-slate-200 rounded p-3 text-sm text-slate-700 shadow-sm">
                              La factura INV-000083 se ha eliminado
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
}
