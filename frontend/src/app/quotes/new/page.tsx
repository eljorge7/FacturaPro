"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, Save, Send, Loader2, Info, Search, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewQuotePage() {
  const router = useRouter();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [customerId, setCustomerId] = useState("");
  const [quoteNumber, setQuoteNumber] = useState(`EST-${Date.now().toString().slice(-5)}`);
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { productId: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0.16, discount: 0 }
  ]);

  const [taxIncluded, setTaxIncluded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const [custRes, prodRes] = await Promise.all([
        fetch(`${baseUrl}/customers`),
        fetch(`${baseUrl}/products`)
      ]);
      setCustomers(await custRes.json());
      setProducts(await prodRes.json());
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

  const handleSave = async (send: boolean = false) => {
    if (!customerId) return alert("Selecciona un cliente.");
    if (items.some(i => !i.description || i.quantity <= 0 || i.unitPrice < 0)) {
       return alert("Verifica que las partidas tengan descripción, cantidad válida y precio.");
    }

    setSaving(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          expirationDate: expirationDate || undefined,
          notes,
          taxIncluded,
          items // Quote number and date custom support not yet exposed fully in API but handled transparently.
        })
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      router.push('/quotes');
    } catch (e) {
      console.error(e);
      alert("Error al guardar cotización.");
      setSaving(false);
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Nombre del cliente*</label>
                <div className="flex w-full md:w-2/3">
                  <select 
                     value={customerId} 
                     onChange={e => setCustomerId(e.target.value)}
                     className="w-full border border-slate-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  >
                     <option value="">Seleccionar o añadir un cliente</option>
                     {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.legalName} ({c.rfc})</option>
                     ))}
                  </select>
                  <button className="bg-[#10b981] hover:bg-[#059669] text-white px-3 flex items-center justify-center rounded-r-md transition-colors">
                    <Search className="w-4 h-4" /> {/* Imitating Zoho's magnifying glass */}
                  </button>
                </div>
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

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px_1fr] items-center gap-4">
                <label className="text-sm font-medium text-red-500">Fecha del Estimación*</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                <label className="text-sm font-medium text-slate-700 md:text-right pr-4">Fecha de vencimiento</label>
                <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-500" placeholder="dd MMM yyyy" />
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
                                 <div className="flex flex-col h-full">
                                    <select 
                                       value={item.productId}
                                       onChange={(e) => handleProductSelect(index, e.target.value)}
                                       className="w-full border-none bg-transparent hover:bg-slate-50 px-4 py-3 outline-none text-slate-700 h-10 w-full text-xs text-slate-500"
                                    >
                                       <option value="">Escriba o haga clic para seleccionar un artículo.</option>
                                       {products.map(p => (
                                          <option key={p.id} value={p.id}>{p.name}</option>
                                       ))}
                                    </select>
                                    <textarea 
                                       value={item.description}
                                       onChange={(e) => {
                                          const newItems = [...items];
                                          newItems[index].description = e.target.value;
                                          setItems(newItems);
                                       }}
                                       className="w-full border-none bg-transparent hover:bg-white px-4 py-2 outline-none text-slate-800 text-sm resize-none h-12"
                                       placeholder=""
                                    />
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
                        <span className="font-bold text-slate-900">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center px-3 text-sm text-slate-600">
                        <span>Impuesto</span>
                        <span>{totals.taxes.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                     <div className="flex justify-between items-center px-3 text-lg font-bold">
                        <span className="text-slate-800">Total ( MXN )</span>
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
           onClick={() => handleSave(false)} disabled={saving}
           className="bg-[#f1f5f9] border border-slate-300 hover:bg-[#e2e8f0] text-slate-700 font-medium px-4 py-1.5 rounded transition-colors"
         >
           {saving ? 'Guardando...' : 'Guardar como borrador'}
         </button>
         <button 
           onClick={() => handleSave(true)} disabled={saving}
           className="bg-[#10b981] hover:bg-[#059669] text-white font-medium px-4 py-1.5 rounded flex items-center transition-colors shadow-sm"
         >
           Guardar y enviar
         </button>
         <Link href="/quotes" className="bg-[#f1f5f9] border border-slate-300 hover:bg-[#e2e8f0] text-slate-700 font-medium px-4 py-1.5 rounded transition-colors ml-auto">
           Cancelar
         </Link>
      </div>

    </div>
  );
}
