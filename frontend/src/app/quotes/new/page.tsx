"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, Save, Send, Loader2, Info, Search, FileText, ChevronDown, PlusCircle, PanelRight, MessageCircle, FileEdit, Trash2, Globe, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const shouldClear = searchParams.get('clear');
  const { tenantId: activeTenantId } = useAuth();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  // Syscom Integration States
  const [isSyscomModalOpen, setIsSyscomModalOpen] = useState(false);
  const [syscomSearch, setSyscomSearch] = useState("");
  const [syscomResults, setSyscomResults] = useState<any[]>([]);
  const [isSearchingSyscom, setIsSearchingSyscom] = useState(false);
  const [addedSyscomItemId, setAddedSyscomItemId] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [quoteNumber, setQuoteNumber] = useState(`EST-${Date.now().toString().slice(-5)}`);
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { productId: "", description: "", imageUrl: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0, type: "ITEM" }
  ]);

  const [taxIncluded, setTaxIncluded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState("MXN");
  const [exchangeRate, setExchangeRate] = useState(18.0);

  // Proposal States
  const [isProposal, setIsProposal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [proposalData, setProposalData] = useState({
     projectName: "",
     templateId: "",
     projectScope: "",
     projectNotes: "",
     personnel: "",
     materials: "",
     coverImageUrl: "",
     coordinates: ""
  });

  // States para interceptar items no registrados
  const [unregisteredItems, setUnregisteredItems] = useState<any[]>([]);
  const [pendingSaveParams, setPendingSaveParams] = useState<boolean | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Cliente Modal y Detalles
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
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

  // Load draft or quote on mount
  useEffect(() => {
    if (editId) {
       const fetchQuoteForEdit = async () => {
         try {
           const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
           const res = await fetch(`${baseUrl}/quotes/${editId}`);
           if (res.ok) {
             const data = await res.json();
             setQuoteNumber(data.quoteNumber);
             setCustomerId(data.customerId);
             setReference(data.reference || "");
             setDate(data.createdAt.split('T')[0]);
             setExpirationDate(data.expiresAt?.split('T')[0] || "");
             setNotes(data.notes || "");
             setTaxIncluded(data.taxIncluded || false);
             setCurrency(data.currency || "MXN");
             setExchangeRate(data.exchangeRate || 18.0);
             if (data.items && data.items.length > 0) {
                setItems(data.items.sort((a:any,b:any) => (a.orderIndex||0) - (b.orderIndex||0)).map((i: any) => ({
                   productId: i.productId || "",
                   description: i.description,
                   imageUrl: i.imageUrl || "",
                   quantity: i.quantity,
                   unitPrice: i.unitPrice,
                   taxRate: i.taxRate,
                   discount: i.discount || 0,
                   type: i.type || "ITEM"
                })));
             }
             if (data.isProposal) {
                setIsProposal(true);
                setProposalData({
                   projectName: data.projectName || "",
                   templateId: data.templateId || "",
                   projectScope: data.projectScope || "",
                   projectNotes: data.projectNotes || "",
                   personnel: data.personnel || "",
                   materials: data.materials || "",
                   coverImageUrl: data.coverImageUrl || "",
                   coordinates: data.coordinates || ""
                });
             }
           }
         } catch(e) {
           console.error("Error loading quote for edit:", e);
         }
       };
       fetchQuoteForEdit();
    } else if (shouldClear === 'true') {
       localStorage.removeItem('facturapro_draft_quote');
       setItems([{ productId: "", description: "", imageUrl: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0, type: "ITEM" }]);
       setCustomerId("");
       setReference("");
       setNotes("");
    } else {
       const saved = localStorage.getItem('facturapro_draft_quote');
       if (saved) {
         try {
           const parsed = JSON.parse(saved);
           if (parsed.items && parsed.items.length > 0) setItems(parsed.items);
           if (parsed.customerId) setCustomerId(parsed.customerId);
           if (parsed.reference) setReference(parsed.reference);
           if (parsed.issueDate) setDate(parsed.issueDate);
           if (parsed.dueDate) setExpirationDate(parsed.dueDate);
           if (parsed.subject) setNotes(parsed.subject);
         } catch(e) {}
       }
    }
    fetchCatalogs();
  }, [editId, shouldClear]);

  // Autosave draft
  useEffect(() => {
    if (items.length > 1 || items[0].description || customerId || reference || notes) {
      localStorage.setItem('facturapro_draft_quote', JSON.stringify({
        items, customerId, reference, issueDate: date, dueDate: expirationDate, subject: notes, currency, exchangeRate
      }));
    }
  }, [items, customerId, reference, date, expirationDate, notes, currency, exchangeRate]);

  useEffect(() => {
    const fetchSyscom = async () => {
      if (syscomSearch.length < 3) {
        setSyscomResults([]);
        return;
      }
      setIsSearchingSyscom(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
        const res = await fetch(`${baseUrl}/public-store/radiotec/products?search=${encodeURIComponent(syscomSearch)}`);
        const data = await res.json();
        const syscomOnly = (data.products || []).filter((p: any) => p.source === 'syscom');
        setSyscomResults(syscomOnly.slice(0, 8)); // Top 8 results
      } catch (e) {
        console.error("Syscom API Error:", e);
      } finally {
        setIsSearchingSyscom(false);
      }
    };
    const timeoutId = setTimeout(fetchSyscom, 500);
    return () => clearTimeout(timeoutId);
  }, [syscomSearch]);

  const fetchCatalogs = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const token = localStorage.getItem('facturapro_token');
      const headers = { 'x-tenant-id': activeTenantId || "", 'Authorization': `Bearer ${token}` };
      
      const [cusRes, prodRes, tplRes] = await Promise.all([
        fetch(`${baseUrl}/customers`, { headers }),
        fetch(`${baseUrl}/products`, { headers }),
        fetch(`${baseUrl}/proposal-templates`, { headers })
      ]);
      if (cusRes.ok) setCustomers(await cusRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (tplRes.ok) setTemplates(await tplRes.json());
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
        description: product.description || product.name || "",
        imageUrl: product.imageUrl || "",
        quantity: 1,
        unitPrice: Number(product.price),
        taxRate: product.taxRate
      };
    } else {
       newItems[index] = {
         productId: "",
         description: "",
         imageUrl: "",
         quantity: 1,
         unitPrice: 0,
         taxRate: 0.16,
         discount: 0
       };
    }
    setItems(newItems);
  };

  
  const calculateSectionSubtotal = (startIndex: number) => {
    let sub = 0;
    for(let i = startIndex + 1; i < items.length; i++) {
       if(items[i].type === 'SECTION_HEADER') break;
       const it = items[i];
       const discount = it.discount || 0;
       if (taxIncluded) {
          const lineTotal = (it.quantity * it.unitPrice) - discount;
          sub += lineTotal / (1 + it.taxRate);
       } else {
          sub += (it.quantity * it.unitPrice) - discount;
       }
    }
    return sub;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxes = 0;
    
    items.filter(it => it.type !== "SECTION_HEADER").forEach(it => {
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

    let tds = 0;
    if (selectedCustomerObj?.tdsEnabled) {
       tds = subtotal * 0.0125;
    }

    return { subtotal, taxes, tds, total: subtotal + taxes - tds };
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
               mappedItems = mappedItems.map(i => i === uItem ? {...i, productId: newProduct.id} : i);
            }
         }
      }

      const url = editId ? `${baseUrl}/quotes/${editId}` : `${baseUrl}/quotes`;
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          customerId,
          expirationDate: expirationDate || undefined,
          notes,
          taxIncluded,
          isProposal,
          currency,
          exchangeRate,
          ...proposalData,
          items: mappedItems.map(i => ({
             ...i,
             unitPrice: (taxIncluded && i.type !== "SECTION_HEADER") ? (i.unitPrice / (1 + i.taxRate)) : i.unitPrice,
             type: i.type || "ITEM",
             orderIndex: idx,
             productId: i.productId || undefined
          }))
        })
      });

      if (!res.ok) throw new Error("Error al guardar");

      // Clear draft on successful save
      localStorage.removeItem('facturapro_draft_quote');
      
      router.push('/quotes');
    } catch (e) {
      console.error(e);
      alert("Error al guardar cotización.");
      setSaving(false);
    }
  };

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
         cleanPayload.tdsEnabled = newCustomerData.enableTds;
         cleanPayload.taxRegime = (newCustomerData.taxRegime || '601').substring(0, 3);

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
            setNewCustomerData({ legalName: "", rfc: "", taxRegime: "", zipCode: "", email: "", phone: "", currency: "MXN", vatTreatment: "within_mexico", enableTds: false });
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

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/quotes" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-lg font-medium text-slate-800">
            <FileText className="w-5 h-5 text-indigo-500" />
            Estimación nuevo
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
                        className="w-full border border-slate-300 border-r-0 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white transition-colors"
                     >
                        <option value="">Seleccionar o añadir un cliente</option>
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
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Estimación#*</label>
                <div className="w-full md:w-1/2">
                   <input type="text" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-slate-700">N.º de referencia</label>
                <div className="w-full md:w-1/2">
                   <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Fechas y Moneda */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Fecha del Estimación*</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                <label className="text-sm font-medium text-slate-700 md:text-right pr-4">Fecha de vencimiento</label>
                <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-500" placeholder="dd MMM yyyy" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px_1fr] items-center gap-4 mt-4">
                <label className="text-sm font-medium text-slate-700">Moneda</label>
                <select value={currency} onChange={e=>setCurrency(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                   <option value="MXN">MXN - Pesos Mexicanos</option>
                   <option value="USD">USD - Dólares</option>
                </select>
                <label className="text-sm font-medium text-slate-700 md:text-right pr-4" title="Tasa usada para convertir equipos de Syscom (USD) a MXN">T. Cambio Syscom</label>
                <input type="number" step="0.01" value={exchangeRate} onChange={e=>setExchangeRate(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>

              {/* Asunto */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4 pt-6">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 mt-2">
                   Asunto <Info className="w-4 h-4 text-slate-400" />
                </div>
                <div className="w-full md:w-3/4">
                   <textarea 
                     rows={3} 
                     value={notes} 
                     onChange={e=>setNotes(e.target.value)} 
                     placeholder="Informe a su cliente para qué sirve este Estimación" 
                     className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-y" 
                   />
                </div>
              </div>

            </div>

            {/* --- PROPOSAL MODE TOGGLE --- */}
            <div className="mt-8 border border-amber-200 bg-amber-50 rounded-xl p-5">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="font-bold text-amber-900 flex items-center gap-2"><FileText className="w-5 h-5"/> Modo Propuesta Comercial</h3>
                     <p className="text-sm text-amber-700 mt-1">Convierte esta cotización en una presentación completa para tu cliente (con imágenes, alcance, personal).</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isProposal} onChange={e=>setIsProposal(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
               </div>
               
               {isProposal && (
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-amber-200">
                     <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                           <label className="text-sm font-bold text-amber-900 block">Cargar desde Plantilla</label>
                           <Link href="/settings/proposal-templates" target="_blank" className="text-xs font-bold text-indigo-600 hover:underline">
                              ⚙️ Configurar Plantillas
                           </Link>
                        </div>
                        <select 
                           value={proposalData.templateId} 
                           onChange={e => {
                              const tpl = templates.find(t => t.id === e.target.value);
                              if (tpl) {
                                 setProposalData({
                                    ...proposalData,
                                    templateId: tpl.id,
                                    projectScope: tpl.defaultScope || "",
                                    projectNotes: tpl.defaultNotes || "",
                                    personnel: tpl.defaultPersonnel || "",
                                    materials: tpl.defaultMaterials || "",
                                    coverImageUrl: tpl.coverImageUrl || ""
                                 });
                              } else {
                                 setProposalData({...proposalData, templateId: ""});
                              }
                           }}
                           className="w-full border border-amber-300 bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        >
                           <option value="">Seleccionar plantilla...</option>
                           {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        {templates.length === 0 && (
                           <p className="text-xs text-amber-700 mt-1">Aún no tienes plantillas creadas. Usa el enlace de arriba para crear tu primera plantilla base.</p>
                        )}
                     </div>
                     <div>
                        <label className="text-sm font-bold text-amber-900 block mb-1">Nombre del Proyecto</label>
                        <input type="text" value={proposalData.projectName} onChange={e=>setProposalData({...proposalData, projectName: e.target.value})} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="Ej. Enlace PTP 5km" />
                     </div>
                     <div>
                        <label className="text-sm font-bold text-amber-900 block mb-1">URL Imagen de Portada</label>
                        <input type="text" value={proposalData.coverImageUrl} onChange={e=>setProposalData({...proposalData, coverImageUrl: e.target.value})} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="https://" />
                     </div>
                     <div>
                        <label className="text-sm font-bold text-amber-900 block mb-1">Coordenadas GPS (Opcional)</label>
                        <input type="text" value={proposalData.coordinates} onChange={e=>setProposalData({...proposalData, coordinates: e.target.value})} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" placeholder="Ej. 19.4326, -99.1332" />
                     </div>
                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                           <label className="text-sm font-bold text-amber-900 block mb-1">Alcance del Proyecto</label>
                           <textarea value={proposalData.projectScope} onChange={e=>setProposalData({...proposalData, projectScope: e.target.value})} rows={3} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                           <label className="text-sm font-bold text-amber-900 block mb-1">Personal / Ejecución</label>
                           <textarea value={proposalData.personnel} onChange={e=>setProposalData({...proposalData, personnel: e.target.value})} rows={3} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                           <label className="text-sm font-bold text-amber-900 block mb-1">Listado de Materiales</label>
                           <textarea value={proposalData.materials} onChange={e=>setProposalData({...proposalData, materials: e.target.value})} rows={3} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                           <label className="text-sm font-bold text-amber-900 block mb-1">Notas Comerciales (Garantía, Tiempos)</label>
                           <textarea value={proposalData.projectNotes} onChange={e=>setProposalData({...proposalData, projectNotes: e.target.value})} rows={3} className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
                        </div>
                     </div>
                  </div>
               )}
            </div>
            {/* ----------------------------- */}

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
                        {items.map((item, index) => {
                           if (item.type === 'SECTION_HEADER') {
                              return (
                                 <tr key={index} className="group bg-slate-100/80 border-y border-slate-200">
                                    <td colSpan={5} className="p-0 border-r border-slate-200">
                                       <div className="flex h-full items-center px-4 py-2">
                                          <input 
                                             value={item.description}
                                             onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index].description = e.target.value;
                                                setItems(newItems);
                                             }}
                                             className="w-full font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
                                             placeholder="Título de la Sección (ej. Sistema de Comunicación)"
                                          />
                                       </div>
                                    </td>
                                    <td className="p-4 align-middle text-right font-bold text-slate-700 tracking-tight bg-slate-200/50">
                                       {calculateSectionSubtotal(index).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2 align-middle text-center bg-slate-200/50">
                                       <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { if(index > 0) { const newI = [...items]; const tmp = newI[index-1]; newI[index-1] = newI[index]; newI[index] = tmp; setItems(newI); } }} className="text-slate-400 hover:text-slate-600"><ArrowUp className="w-3 h-3" /></button>
                                          <button onClick={() => { if(index < items.length - 1) { const newI = [...items]; const tmp = newI[index+1]; newI[index+1] = newI[index]; newI[index] = tmp; setItems(newI); } }} className="text-slate-400 hover:text-slate-600"><ArrowDown className="w-3 h-3" /></button>
                                          <button onClick={() => { if(items.length > 1) setItems(items.filter((_, i) => i !== index)); }} className="text-red-400 hover:text-red-600 ml-1"><X className="w-4 h-4" /></button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           }

                           return (
                           <tr key={index} className="group hover:bg-slate-50 transition-colors">
                              <td className="p-0 border-r border-slate-50 group-hover:border-slate-200 pl-6 border-l-2 border-l-transparent hover:border-l-indigo-400">
                                 <div className="flex h-full relative items-start p-1.5 gap-2">
                                    {item.imageUrl && (
                                       <div className="w-12 h-12 bg-white border border-slate-200 rounded shrink-0 p-1 flex items-center justify-center overflow-hidden">
                                          <img src={item.imageUrl} className="w-full h-full object-contain" />
                                       </div>
                                    )}
                                    <div className="flex-1 relative h-full">
                                       <textarea 
                                          value={item.description}
                                          onChange={(e) => {
                                             const newItems = [...items];
                                             newItems[index].description = e.target.value;
                                             newItems[index].productId = ""; // Reset FK if typed manually
                                             setItems(newItems);
                                          }}
                                          className="w-full border-none bg-transparent hover:bg-white px-2 py-2 outline-none text-slate-800 text-sm resize-none h-12"
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
                                 {((item.quantity * item.unitPrice) - item.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 align-top text-center">
                                 <div className="flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    <div className="flex gap-1">
                                      <button onClick={() => { if(index > 0) { const newI = [...items]; const tmp = newI[index-1]; newI[index-1] = newI[index]; newI[index] = tmp; setItems(newI); } }} className="text-slate-400 hover:text-slate-600"><ArrowUp className="w-3 h-3" /></button>
                                      <button onClick={() => { if(index < items.length - 1) { const newI = [...items]; const tmp = newI[index+1]; newI[index+1] = newI[index]; newI[index] = tmp; setItems(newI); } }} className="text-slate-400 hover:text-slate-600"><ArrowDown className="w-3 h-3" /></button>
                                    </div>
                                    <button onClick={() => {
                                       if(items.length > 1) setItems(items.filter((_, i) => i !== index));
                                    }} className="text-red-400 hover:text-red-600">
                                       <X className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        )})}
                     </tbody>
                  </table>
               </div>

               {/* Sub-table actions: Add / Tax Settings Zoho Style */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 px-1 gap-4">
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setItems([...items, { productId: "", description: "", imageUrl: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0, type: "ITEM" }])}
                        className="flex items-center gap-2 text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                     >
                        <Plus className="w-4 h-4" /> Añadir nueva fila
                     </button>
                     <button 
                        onClick={() => setItems([...items, { productId: "", description: "Nueva Sección", imageUrl: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0, type: "SECTION_HEADER" }])}
                        className="flex items-center gap-2 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                     >
                        <PlusCircle className="w-4 h-4" /> Añadir Título de Sección
                     </button>
                     <button 
                        onClick={() => setIsSyscomModalOpen(true)}
                        className="flex items-center gap-2 text-purple-600 bg-white border border-purple-200 hover:border-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                     >
                        <Globe className="w-4 h-4" /> Buscar en Syscom
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
                        <span className="font-bold text-slate-900">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center px-3 text-sm text-slate-600">
                        <span>Impuesto</span>
                        <span>{totals.taxes.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                     {selectedCustomerObj?.tdsEnabled && (
                        <>
                          <div className="flex justify-between items-center px-3 text-sm font-bold text-slate-700 mt-2">
                             <span>Impuesto retenido en origen</span>
                          </div>
                          <div className="flex justify-between items-center px-3 text-sm text-slate-600">
                             <span>Impuestos retenidos ISR [1.25%]</span>
                             <span>-{totals.tds.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                     )}
                     <div className="flex justify-between items-center px-3 text-lg font-bold">
                        <span className="text-slate-800">Total ( {currency} )</span>
                        <span className="text-slate-900 font-mono tracking-tight text-xl">{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
         <Link href="/quotes" className="bg-[#f1f5f9] border border-slate-300 hover:bg-[#e2e8f0] text-slate-700 font-medium px-4 py-1.5 rounded transition-colors ml-auto">
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
                     ¿Deseas agregarlos a tu inventario de productos para que puedas seleccionarlos rápidamente en cotizaciones futuras?
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
                        No, sólo cotizar
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
                        <input 
                           list="miniTaxRegimes"
                           value={newCustomerData.taxRegime} 
                           onChange={e=>setNewCustomerData({...newCustomerData, taxRegime: e.target.value})} 
                           placeholder="Ej. 601"
                           className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#10b981]" 
                        />
                        <datalist id="miniTaxRegimes">
                           <option value="601">601 - General de Ley Personas Morales</option>
                           <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                           <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                           <option value="606">606 - Arrendamiento</option>
                           <option value="608">608 - Demás ingresos</option>
                           <option value="609">609 - Consolidación</option>
                           <option value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</option>
                           <option value="611">611 - Ingresos por Dividendos (socios y accionistas)</option>
                           <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                           <option value="614">614 - Ingresos por intereses</option>
                           <option value="615">615 - Régimen de los ingresos por obtención de premios</option>
                           <option value="616">616 - Sin obligaciones fiscales</option>
                           <option value="620">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</option>
                           <option value="621">621 - Incorporación Fiscal</option>
                           <option value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                           <option value="623">623 - Opcional para Grupos de Sociedades</option>
                           <option value="624">624 - Coordinados</option>
                           <option value="625">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                           <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                        </datalist>
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
      {/* SYSCOM SEARCH MODAL */}
      {isSyscomModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-purple-50">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900">Búsqueda en Red Global Syscom</h3>
                  <p className="text-xs text-slate-500">Agrega productos directamente a tu cotización sin darlos de alta.</p>
                </div>
              </div>
              <button onClick={() => setIsSyscomModalOpen(false)} className="p-2 hover:bg-purple-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  autoFocus
                  placeholder="Ej. Kit 4 Cámaras, Bobina Cat 6..." 
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-slate-800 transition-all"
                  value={syscomSearch}
                  onChange={e => setSyscomSearch(e.target.value)}
                />
                {isSearchingSyscom && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 animate-spin" />}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
              {syscomSearch.length > 0 && syscomSearch.length < 3 && (
                <div className="p-8 text-center text-sm text-slate-500">Escribe al menos 3 letras para buscar...</div>
              )}
              {syscomResults.map(prod => (
                <div key={prod.id} className="flex gap-4 p-4 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 hover:shadow-sm transition-all group items-center">
                  <div className="w-24 h-24 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 p-2">
                    {prod.imageUrl ? <img src={prod.imageUrl} className="w-full h-full object-contain" /> : <span className="text-xs text-slate-300">No Img</span>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[#3b82f6] font-black tracking-tight text-lg leading-none">{prod.model}</span>
                      {prod.stock !== undefined && (
                        <div className="bg-[#1f2937] text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                          Inventario <span className="bg-white text-slate-900 px-1.5 py-0.5 rounded-sm text-[10px] leading-none">{prod.stock > 500 ? '500+' : prod.stock}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-slate-600 text-sm line-clamp-2 leading-snug">{prod.title}</h4>
                    <div className="flex gap-3 mt-2 text-xs items-center">
                      <span className="font-bold text-emerald-600 text-base">${prod.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[10px] font-normal text-slate-500 uppercase">USD</span></span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{prod.brand}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newItems = [...items];
                      // Find first empty item or add new
                      let targetIdx = newItems.findIndex(i => !i.description && !i.productId);
                      if (targetIdx === -1) {
                         newItems.push({ productId: "", description: "", imageUrl: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0 });
                         targetIdx = newItems.length - 1;
                      }
                      let finalPrice = prod.price;
                      if (currency === 'MXN') {
                         finalPrice = prod.price * exchangeRate;
                      }

                      newItems[targetIdx] = {
                        productId: "", // Keep it empty so it treats it as manual/Syscom
                        description: `[${prod.model}] ${prod.title}`,
                        imageUrl: prod.imageUrl || "",
                        quantity: 1,
                        unitPrice: finalPrice / 1.16, // Syscom API returns price with IVA, we need base price
                        taxRate: 0.16,
                        discount: 0
                      };
                      setItems(newItems);
                      setAddedSyscomItemId(prod.id);
                      setTimeout(() => setAddedSyscomItemId(null), 2000);
                    }}
                    className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                      addedSyscomItemId === prod.id 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white'
                    }`}
                  >
                    {addedSyscomItemId === prod.id ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {addedSyscomItemId === prod.id ? 'Agregado' : 'Agregar'}
                  </button>
                </div>
              ))}
              {!isSearchingSyscom && syscomSearch.length >= 3 && syscomResults.length === 0 && (
                 <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                    <Search className="w-12 h-12 mb-3 opacity-20" />
                    <p>No se encontraron resultados en Syscom.</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
