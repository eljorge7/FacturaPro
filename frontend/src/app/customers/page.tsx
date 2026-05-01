"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Save, Loader2, X, FileEdit, Trash2, ChevronDown, CheckCircle2, MoreHorizontal, Mail, Phone, MapPin, Building, Clock, ArrowUpRight, ArrowDownRight, User, XCircle, Info, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function CustomersPage() {
  const router = useRouter();
  const { tenantId: activeTenantId } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showTransactionMenu, setShowTransactionMenu] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State for New/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [legalName, setLegalName] = useState("");
  const [rfc, setRfc] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxRegime, setTaxRegime] = useState("601");
  const [zipCode, setZipCode] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setLegalName("");
    setRfc("");
    setEmail("");
    setPhone("");
    setTaxRegime("601");
    setZipCode("");
  };

  const openEdit = (customer: any) => {
    resetForm();
    setEditingId(customer.id);
    setLegalName(customer.legalName);
    setRfc(customer.rfc);
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setTaxRegime(customer.taxRegime || "601");
    setZipCode(customer.zipCode || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al cliente ${name}? Se perderá la relación si no tiene facturas activas.`)) return;
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/customers/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
         const err = await res.json().catch(() => ({}));
         alert(`No se puede eliminar el cliente.\nMotivo: ${err.message || 'El cliente probablemente está asociado a una factura existente, bloqueando su borrado por seguridad.'}`);
         return;
      }
      
      fetchCustomers();
      if(selectedCustomer && selectedCustomer.id === id) setSelectedCustomer(null);
    } catch (e) {
      console.error("Error al eliminar", e);
      alert("Hubo un problema de conexión al intentar eliminar.");
    }
  };

  const fetchCustomers = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/customers`, { cache: 'no-store' });
      const data = await res.json();
      setCustomers(data);
      if (selectedCustomer) {
         const updated = data.find((c: any) => c.id === selectedCustomer.id);
         if (updated) setSelectedCustomer(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, []);

  if (!mounted) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';

      const payload: any = {
        tenantId: activeTenantId,
        legalName,
        rfc,
        taxRegime,
        zipCode
      };

      if (email && email.trim() !== '') payload.email = email.trim();
      if (phone && phone.trim() !== '') payload.phone = phone.trim();

      let response;
      if (editingId) {
         response = await fetch(`${baseUrl}/customers/${editingId}`, {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
      } else {
         response = await fetch(`${baseUrl}/customers`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
      }

      if (!response.ok) {
         const errData = await response.text();
         alert(`Error del Servidor:\n${errData}`);
         return; // EVITAR que cierre el cuadro si falló
      }

      setIsModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (e: any) {
      console.error(e);
      alert(`Falla de Conexión:\n${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
     c.legalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
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
     if(selectedIds.length === filteredCustomers.length) {
        setSelectedIds([]);
     } else {
        setSelectedIds(filteredCustomers.map(c => c.id));
     }
  };

  const handleBulkAction = async (action: string) => {
     if (action === 'Eliminar') {
        if (!confirm(`¿Estás seguro de querer intentar eliminar ${selectedIds.length} clientes?`)) return;
        
        setIsLoading(true);
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        let successCount = 0;
        let failCount = 0;
        
        for (const id of selectedIds) {
           try {
              const res = await fetch(`${baseUrl}/customers/${id}`, { method: "DELETE" });
              if (res.ok) successCount++;
              else failCount++;
           } catch {
              failCount++;
           }
        }
        
        alert(`Resultado:\n✅ Se eliminaron ${successCount} clientes.\n${failCount > 0 ? `❌ Se bloqueó la eliminación de ${failCount} cliente(s) porque ya están atados a una Factura fiscal válida.` : ''}`);
        setSelectedIds([]);
        fetchCustomers();
     } else {
        alert(`Acción: ${action}`);
        setSelectedIds([]);
     }
  };

  // List View Mode
  if (!selectedCustomer) {
    return (
      <div className="font-sans min-h-screen bg-[#f9fafb] relative">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-lg font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors">
                 Clientes activos <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <Link href="/customers/new" className="bg-[#10b981] hover:bg-[#059669] text-white p-1.5 rounded transition-colors shadow-sm ml-2">
                 <Plus className="w-5 h-5" />
              </Link>
           </div>
           
           <div className="flex border border-slate-200 rounded text-slate-400 bg-slate-50 items-center px-2 py-1 max-w-sm w-full focus-within:border-slate-400 focus-within:bg-white transition-colors">
              <Search className="w-4 h-4 mr-2 ml-1" />
              <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Nombre, RFC o Correo..." 
                  className="bg-transparent border-none outline-none text-sm w-full py-0.5 text-slate-800" 
              />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="hover:text-slate-600"><XCircle className="w-4 h-4 ml-1" /></button>}
           </div>
        </div>

        {/* Bulk Action Toolbar Overlay */}
        {selectedIds.length > 0 && (
           <div className="absolute top-[72px] left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-20 px-6 py-2 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <button onClick={() => handleBulkAction('Eliminar')} className="text-sm border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded transition-colors text-red-600 font-medium">Eliminar</button>
              <button onClick={() => handleBulkAction('Enviar Estado de Cuenta')} className="text-sm font-medium border border-slate-200 bg-[#f9fafb] hover:bg-[#f1f5f9] px-3 py-1.5 rounded transition-colors text-slate-700">Estado de cuenta</button>
              
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
                    <th className="py-3 px-6 w-1"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0} className="rounded border-slate-300" /></th>
                    <th className="py-3 px-2">Nombre / Empresa</th>
                    <th className="py-3 px-2">RFC</th>
                    <th className="py-3 px-2">Correo electrónico</th>
                    <th className="py-3 px-2">Teléfono del trabajo</th>
                    <th className="py-3 px-6 text-right">Créditos a cobrar</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {filteredCustomers.map(c => (
                    <tr key={c.id} onClick={() => setSelectedCustomer(c)} className={`border-b border-slate-100 cursor-pointer transition-colors group ${selectedIds.includes(c.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                       <td className="py-4 px-6" onClick={(e) => toggleSelect(e, c.id)}>
                          <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => {}} className="rounded border-slate-300" />
                       </td>
                       <td className="py-4 px-2">
                          <span className="text-[#2563eb] hover:underline font-medium text-sm flex items-center gap-1.5 focus:outline-none">
                             <User className="w-4 h-4 text-slate-400" /> {c.legalName}
                          </span>
                       </td>
                       <td className="py-4 px-2 text-slate-600 font-mono text-xs">{c.rfc}</td>
                       <td className="py-4 px-2 text-slate-600">{c.email || '-'}</td>
                       <td className="py-4 px-2 text-slate-600">{c.phone || '-'}</td>
                       <td className="py-4 px-6 text-right font-medium text-slate-800">MXN0.00</td>
                    </tr>
                 ))}
                 {customers.length === 0 && !isLoading && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400">No hay clientes aún. Da clic en el botón '+' para agregar.</td></tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* Modal Reusable for List View if needed, though typically creating is enough */}
        {isModalOpen && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in-95 duration-200">
                 <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800">
                       {editingId ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Razón Social o Nombre Completo</label>
                       <input type="text" value={legalName} onChange={e=>setLegalName(e.target.value)} placeholder="Ej. Empresa SA de CV" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">RFC (SAT)</label>
                       <input type="text" value={rfc} onChange={e=>setRfc(e.target.value)} placeholder="XAXX010101000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Correo (Opcional)</label>
                          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contacto@empresa.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Teléfono (Opcional)</label>
                          <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="123 456 7890" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Régimen Fiscal (SAT)</label>
                          <select value={taxRegime} onChange={e=>setTaxRegime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium">
                             <option value="">-- Seleccionar Régimen --</option>
                             {rfc.length === 12 ? (
                                <>
                                   <option value="601">601 - General de Ley Personas Morales</option>
                                   <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                                   <option value="626">626 - Régimen Simplificado de Confianza</option>
                                </>
                             ) : rfc.length === 13 ? (
                                <>
                                   <option value="605">605 - Sueldos y Salarios / Asimilados</option>
                                   <option value="606">606 - Arrendamiento</option>
                                   <option value="612">612 - Actividades Empresariales y Profesionales</option>
                                   <option value="621">621 - Incorporación Fiscal (RIF)</option>
                                   <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                                </>
                             ) : (
                                <option value="616">616 - Sin obligaciones fiscales (Extranjeros/Público en General)</option>
                             )}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Código Postal (SAT)</label>
                          <input type="text" value={zipCode} onChange={e=>setZipCode(e.target.value)} placeholder="Ej. 85860" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                       </div>
                    </div>
                    {(!rfc || rfc.length < 12 || !taxRegime || !zipCode || zipCode.length < 5) && (
                       <div className="bg-orange-50 border border-orange-200 text-orange-700 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>⚠️ <b>Faltan datos fiscales para emitir facturas:</b> Puedes guardar al cliente ahora, pero asegúrate de ingresar un RFC válido (12-13 caracteres), su Régimen Fiscal y el CP exacto de su comprobante fiscal antes de timbrar.</p>
                       </div>
                    )}
                 </div>
                 <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-all flex items-center gap-2">
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} {editingId ? "Actualizar" : "Guardar"}
                    </button>
                 </div>
              </div>
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
                onClick={() => setSelectedCustomer(null)} 
                className="flex items-center gap-1 text-[15px] font-medium text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-colors"
              >
                 Clientes activos <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => setSelectedCustomer(null)} className="ml-auto mr-4 text-slate-400 hover:bg-slate-100 p-1 rounded">
                 <XCircle className="w-5 h-5"/>
              </button>
           </div>
           
           <div className="flex-1 flex justify-between items-center px-4">
              <div className="flex items-center gap-3">
                 <div className="bg-[#10b981] text-white w-8 h-8 rounded flex items-center justify-center font-bold shadow-sm">
                    {selectedCustomer.legalName.substring(0,2).toUpperCase()}
                 </div>
                 <h2 className="text-xl font-medium text-slate-800">{selectedCustomer.legalName}</h2>
              </div>
              <div className="flex gap-2 items-center">
                 <button onClick={() => alert('Función no disponible aún')} className="hover:text-slate-700 text-slate-500 font-medium text-sm flex gap-1 items-center mr-2"><ChevronDown className="w-4 h-4"/> Adjunto</button>
                 <button onClick={() => openEdit(selectedCustomer)} className="border border-slate-200 bg-white hover:bg-slate-50 p-1.5 rounded text-slate-500"><FileEdit className="w-4 h-4"/></button>
                 <div className="relative">
                    <button onClick={() => setShowTransactionMenu(!showTransactionMenu)} className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded transition-colors font-medium flex items-center gap-1 text-sm shadow-sm">
                       Nueva transacción <ChevronDown className="w-3 h-3"/>
                    </button>
                    {showTransactionMenu && (
                       <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden">
                          <button onClick={() => { setShowTransactionMenu(false); router.push('/invoices/new'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Nueva Factura</button>
                          <button onClick={() => { setShowTransactionMenu(false); router.push('/quotes/new'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Nueva Cotización</button>
                       </div>
                    )}
                 </div>
                 <button onClick={() => handleDelete(selectedCustomer.id, selectedCustomer.legalName)} className="border border-slate-200 bg-white hover:bg-red-50 p-1.5 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
              </div>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar List */}
           <div className="w-[320px] overflow-y-auto bg-white border-r border-slate-200 shrink-0">
              {filteredCustomers.map(c => (
                 <div 
                    key={c.id} 
                    onClick={() => setSelectedCustomer(c)}
                    className={`p-4 border-b border-slate-100 cursor-pointer flex justify-between group ${selectedCustomer.id === c.id ? 'bg-[#f8fafc] border-l-4 border-l-[#10b981]' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                 >
                    <div className="space-y-1 overflow-hidden pr-2">
                       <p className={`text-sm font-medium truncate ${selectedCustomer.id === c.id ? 'text-[#2563eb]' : 'text-slate-800'}`}>{c.legalName}</p>
                       <p className="text-xs text-slate-500 truncate">{c.email || 'Sin correo'}</p>
                    </div>
                 </div>
              ))}
           </div>

           {/* Detail View */}
           <div className="flex-1 overflow-y-auto bg-white">
              {/* TABS */}
              <div className="flex gap-8 border-b border-slate-200 pt-4 px-8 sticky top-0 bg-white z-10">
                 <button onClick={() => setActiveTab('resumen')} className={`border-b-[3px] pb-3 text-[13px] font-bold transition-colors ${activeTab === 'resumen' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Resumen</button>
                 <button onClick={() => setActiveTab('estado')} className={`border-b-[3px] pb-3 text-[13px] font-bold transition-colors ${activeTab === 'estado' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Estado de cuenta</button>
              </div>

              <div className="p-8 max-w-5xl">
                 {/* Alerta RentControl */}
                 {(!selectedCustomer.rfc || selectedCustomer.rfc.length < 5 || selectedCustomer.rfc === 'XAXX010101000') && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                       <div className="bg-amber-100 p-1 rounded-full shrink-0"><Info className="w-4 h-4 text-amber-600"/></div>
                       <div>
                          <p className="text-sm font-bold text-amber-800">Facturación Incompleta (Importado)</p>
                          <p className="text-xs text-amber-700 mt-0.5">El RFC o el Régimen Fiscal faltan. Por favor, edita la información para evitar errores al timbrar.</p>
                       </div>
                    </div>
                 )}

                 {activeTab === 'resumen' ? (
                 <div className="grid grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda: Información General */}
                    <div className="col-span-1 border-r border-slate-200 text-sm">
                       
                       {selectedCustomer.email && (
                          <div className="flex items-start gap-4 mb-6">
                             <div className="mt-1"><Mail className="w-4 h-4 text-slate-400" /></div>
                             <div>
                                <p className="font-bold text-[#2563eb] break-all">{selectedCustomer.email}</p>
                             </div>
                          </div>
                       )}

                       {selectedCustomer.phone && (
                          <div className="flex items-start gap-4 mb-6">
                             <div className="mt-1"><Phone className="w-4 h-4 text-slate-400" /></div>
                             <div>
                                <p className="text-slate-700">{selectedCustomer.phone}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Trabajo</p>
                             </div>
                          </div>
                       )}

                       <div className="flex items-start gap-4 mb-6">
                          <div className="mt-1"><MapPin className="w-4 h-4 text-slate-400" /></div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección de facturación</p>
                             <p className="text-slate-700 leading-relaxed font-medium">
                                México<br/>
                                <span className="text-[#2563eb] cursor-pointer hover:underline">Ver en el mapa</span>
                             </p>
                          </div>
                       </div>

                       <div className="flex items-start gap-4 mb-6">
                          <div className="mt-1"><Building className="w-4 h-4 text-slate-400" /></div>
                          <div className="w-full pr-4">
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Otros Detalles</p>
                             <div className="space-y-3">
                                <div>
                                   <p className="text-xs text-slate-500">RFC</p>
                                   <p className="font-medium text-slate-800 break-all">{selectedCustomer.rfc}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-500">Moneda</p>
                                   <p className="font-medium text-slate-800">MXN - Peso mexicano</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-500">Portal de cliente</p>
                                   <p className="text-xs text-slate-400 mt-1">Este cliente no ha sido invitado a su portal todavía.</p>
                                   <button onClick={() => alert('Invitación enviada por correo (simulado)')} className="text-[#2563eb] font-medium text-xs mt-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">Invitar</button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Columnas Derecha: Gráficas y Timeline Simulador */}
                    <div className="col-span-2 space-y-8 pl-4">
                       
                       {/* Chart Simulator */}
                       <div>
                          <div className="flex justify-between items-end mb-4">
                             <h4 className="font-bold text-slate-800">Ingresos dentro de los últimos 6 meses</h4>
                             <p className="text-sm font-bold text-slate-400">MXN</p>
                          </div>
                          
                          <div className="border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 relative h-48">
                             {/* Fake bars for screenshot similarity */}
                             <div className="absolute bottom-6 left-12 right-12 h-32 flex items-end justify-between px-4">
                               <div className="w-6 bg-slate-200 rounded-t h-4"></div>
                               <div className="w-6 bg-[#10b981] rounded-t h-16"></div>
                               <div className="w-6 bg-slate-200 rounded-t h-8"></div>
                               <div className="w-6 bg-slate-200 rounded-t h-2"></div>
                               <div className="w-6 bg-[#10b981] rounded-t h-24"></div>
                               <div className="w-6 bg-blue-400 rounded-t h-10"></div>
                             </div>
                             {/* X axis labels mock */}
                             <div className="absolute bottom-2 left-12 right-12 flex justify-between px-4 text-[10px] text-slate-400 font-bold">
                                <span>Nov</span><span>Dic</span><span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span>
                             </div>
                          </div>
                       </div>

                       {/* Receivables Snapshot */}
                       <div className="bg-[#f0f9ff] text-slate-700 border border-blue-100 rounded-lg p-6 flex">
                          <div className="w-1/2 border-r border-blue-200">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cuentas por cobrar</p>
                             <p className="text-3xl font-light text-[#2563eb]">MXN0.00</p>
                          </div>
                          <div className="w-1/2 pl-6">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Créditos de cliente</p>
                          <div className="h-48 flex justify-between items-end gap-2 overflow-x-auto relative w-full border-b border-slate-200 pb-4 mt-6">
                             {/* Eje Y Simulado */}
                             <div className="absolute left-0 bottom-4 top-0 w-8 flex flex-col justify-between text-[10px] text-slate-400 font-medium items-end pr-2">
                                <span>9 K</span>
                                <span>8 K</span>
                                <span>7 K</span>
                                <span>6 K</span>
                                <span>5 K</span>
                                <span>4 K</span>
                                <span>3 K</span>
                                <span>2 K</span>
                                <span>1 K</span>
                                <span>0</span>
                             </div>

                             {/* Barras */}
                             <div className="ml-10 flex flex-col items-center gap-2 group">
                                <div className="w-8 h-[60%] bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">oct<br/>2025</span>
                             </div>
                             <div className="flex flex-col items-center gap-2 group">
                                <div className="w-8 h-[95%] bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">nov<br/>2025</span>
                             </div>
                             <div className="flex flex-col items-center gap-2 group">
                                <div className="w-8 h-0 bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">dic<br/>2025</span>
                             </div>
                             <div className="flex flex-col items-center gap-2 group">
                                <div className="w-8 h-0 bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">ene<br/>2026</span>
                             </div>
                             <div className="flex flex-col items-center gap-2 group">
                                <div className="w-8 h-0 bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">feb<br/>2026</span>
                             </div>
                             <div className="flex flex-col items-center gap-2 group">
                                <div className="w-8 h-0 bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">mar<br/>2026</span>
                             </div>
                             <div className="flex flex-col items-center gap-2 group">
                                <div className="w-8 h-0 bg-[#a3da8d] rounded-sm group-hover:bg-[#86cd6b] transition-colors"></div>
                                <span className="text-[10px] text-slate-400 font-medium">abr<br/>2026</span>
                             </div>
                          </div>

                          <div className="mt-8 mb-12">
                             <p className="font-bold text-slate-800 text-sm">Total de ingresos ( Últimos 6 meses ) - MXN16,830.00</p>
                          </div>

                          {/* Timeline Simulator Extra (similar a captura 1) */}
                          <div className="relative pl-[110px] space-y-12">
                             {/* Linea vertical del timeline */}
                             <div className="absolute left-[118px] top-6 bottom-0 w-px bg-blue-200"></div>

                             <div className="relative">
                                {/* Fecha izquierda */}
                                <div className="absolute -left-[110px] top-1 text-right w-20">
                                   <p className="text-xs font-bold text-slate-600">15 nov 2025</p>
                                   <p className="text-[10px] text-slate-500 font-medium">11:05 AM</p>
                                </div>
                                {/* Circulo */}
                                <div className="absolute left-[2px] top-2 bg-white flex items-center justify-center -translate-x-[50%] z-10 w-5 h-5 rounded-full border border-blue-300">
                                   <div className="w-2.5 h-2.5 outline outline-white outline-2 bg-blue-100 border border-blue-400 rounded flex items-center justify-center"></div>
                                </div>

                                {/* Contenido */}
                                <div className="ml-5">
                                   <p className="text-sm font-bold text-slate-800 mb-2">Pagos recibidos agregados</p>
                                   <div className="bg-slate-50 border border-slate-100 rounded-md p-4 text-sm text-slate-600 leading-relaxed shadow-sm">
                                      El importe de pago MXN10,384.87 se ha recibido y aplicado a <a href="#" onClick={(e) => { e.preventDefault(); alert("Vista de factura no disponible"); }} className="text-[#2563eb] cursor-pointer hover:underline">INV-000073</a> por Jorge+Hurtado+Cota
                                   </div>
                                </div>
                             </div>

                             <div className="relative">
                                {/* Fecha izquierda */}
                                <div className="absolute -left-[110px] top-1 text-right w-20">
                                   <p className="text-xs font-bold text-slate-600">02 nov 2025</p>
                                   <p className="text-[10px] text-slate-500 font-medium">05:02 PM</p>
                                </div>
                                {/* Circulo */}
                                <div className="absolute left-[2px] top-2 bg-white flex items-center justify-center -translate-x-[50%] z-10 w-5 h-5 rounded-full border border-blue-300">
                                   <div className="w-2.5 h-2.5 outline outline-white outline-2 bg-blue-100 border border-blue-400 rounded flex items-center justify-center"></div>
                                </div>

                                {/* Contenido */}
                                <div className="ml-5">
                                   <p className="text-sm font-bold text-slate-800 mb-2">Factura actualizados</p>
                                   <div className="bg-slate-50 border border-slate-100 rounded-md p-4 text-sm text-slate-600 leading-relaxed shadow-sm">
                                      La factura <a href="#" onClick={(e) => { e.preventDefault(); alert("Vista de factura no disponible"); }} className="text-[#2563eb] cursor-pointer hover:underline">INV-000073</a> se ha enviado por correo electrónico por Jorge+Hurtado+Cota - <a href="#" onClick={(e) => { e.preventDefault(); alert("Detalles no disponibles"); }} className="text-[#2563eb] cursor-pointer hover:underline">Ver detalles</a>
                                   </div>
                                </div>
                             </div>

                          </div>

                       </div>


                       {/* Línea de Tiempo Mock */}
                       <div>
                          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400"/> Línea de tiempo</h4>
                          <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-4">
                             
                             <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-white"></div>
                                <p className="text-sm text-slate-700"><span className="font-bold">Factura #FAC-12495</span> creada</p>
                                <p className="text-xs text-slate-400 mt-1">Hoy 10:45 AM por Jorge Hurtado</p>
                             </div>

                             <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#2563eb] border-2 border-white"></div>
                                <p className="text-sm text-slate-700"><span className="font-bold">Estimación #EST-001</span> generada</p>
                                <p className="text-xs text-slate-400 mt-1">Hace 2 días por Jorge Hurtado</p>
                             </div>

                             <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                                <p className="text-sm text-slate-700"><span className="font-bold">Cliente Agregado</span> ({selectedCustomer.legalName})</p>
                                <p className="text-xs text-slate-400 mt-1">Hace 2 días por Sistema</p>
                             </div>
                             </div>
                             <div className="absolute bottom-0 -left-[5px] w-2 h-2 rounded-full bg-slate-200"></div>
                          </div>
                       </div>
                    </div>
                 </div>
                 ) : (
                    /* ESTADO DE CUENTA MOCK PDF */
                    <div className="bg-[#f3f4f6] -mt-8 -mx-8 sm:p-8 flex justify-center items-start min-h-[calc(100vh-140px)]">
                       
                       <div className="w-full max-w-[800px] bg-white shadow-lg border border-slate-200">
                          {/* Botonera superior simulada */}
                          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center text-sm">
                             <div className="flex bg-white border border-slate-200 rounded px-2 py-1 items-center gap-2 cursor-pointer shadow-sm">
                               <span className="font-medium">Este mes</span> <ChevronDown className="w-4 h-4 text-slate-400"/>
                             </div>
                             <div className="flex items-center gap-3">
                               <button onClick={() => alert("Descargando PDF...")} className="p-1.5 text-slate-500 hover:text-slate-700 border border-slate-200 bg-white rounded shadow-sm"><FileText className="w-4 h-4"/></button>
                               <button onClick={() => alert("Correo enviado")} className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded shadow-sm font-medium flex items-center gap-2">Enviar correo electrónico</button>
                             </div>
                          </div>

                          {/* PDF Content Area */}
                          <div className="p-16">
                             <h2 className="text-center text-slate-700 font-medium mb-1">Estado de cuenta de cliente para {selectedCustomer.legalName}</h2>
                             <p className="text-center text-slate-500 text-xs mb-10">Desde 01 abr 2026 A 30 abr 2026</p>

                             <div className="flex justify-between items-start mb-16">
                                <div>
                                   <div className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-1.5">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 grid grid-cols-2 gap-0.5 p-1">
                                        <div className="bg-white rounded-[2px]" /><div className="bg-white rounded-[2px]" />
                                        <div className="bg-white rounded-[2px]" /><div className="bg-white rounded-[2px]" />
                                      </div>
                                      radiotec
                                   </div>
                                </div>
                                <div className="text-right text-[11px] text-slate-600 leading-tight">
                                   <p className="font-bold text-slate-800 text-sm mb-1">Jorge Hurtado Cota</p>
                                   <p>Arnulfo Ruiz Gomez</p>
                                   <p>Avenida Sinaloa</p>
                                   <p>85860 Navojoa Sonora</p>
                                   <p>México</p>
                                   <p>IVA HUCJ87011253</p>
                                   <p>Régimen fiscal: 626 - Régimen Simplificado de Confianza</p>
                                   <p className="text-blue-500 mt-1">jorge.hurtadoc@live.com.mx</p>
                                </div>
                             </div>

                             <div className="flex justify-between items-start mb-16">
                                <div className="text-[12px] text-slate-600 leading-tight">
                                   <p className="font-bold text-slate-800 mb-1">Para</p>
                                   <p className="text-[13px] font-bold text-[#2563eb]">{selectedCustomer.legalName}</p>
                                   <p>85860</p>
                                   <p>México</p>
                                   <p>{selectedCustomer.rfc}</p>
                                </div>
                                <div className="text-right">
                                   <h3 className="text-2xl font-light text-slate-800 border-b-2 border-slate-200 pb-1 mb-1">Estado de cuentas</h3>
                                   <p className="text-xs text-slate-500">01 abr 2026 A 30 abr 2026</p>
                                </div>
                             </div>

                             <div className="flex justify-end mb-12">
                                <table className="w-72 text-sm">
                                   <thead>
                                      <tr><th colSpan={2} className="bg-slate-100 text-left px-3 py-1 font-bold text-slate-700">Resumen de la cuenta</th></tr>
                                   </thead>
                                   <tbody className="text-xs">
                                      <tr>
                                         <td className="py-1.5 px-3 border-b border-slate-100 text-slate-600">Saldo de inicio</td>
                                         <td className="py-1.5 px-3 border-b border-slate-100 text-right font-medium">MXN 0.00</td>
                                      </tr>
                                      <tr>
                                         <td className="py-1.5 px-3 border-b border-slate-100 text-slate-600">Cantidad facturada</td>
                                         <td className="py-1.5 px-3 border-b border-slate-100 text-right font-medium">MXN 0.00</td>
                                      </tr>
                                      <tr>
                                         <td className="py-1.5 px-3 border-b border-slate-100 text-slate-600">Importe recibido</td>
                                         <td className="py-1.5 px-3 border-b border-slate-100 text-right font-medium">MXN 0.00</td>
                                      </tr>
                                      <tr>
                                         <td className="py-1.5 px-3 text-slate-600">Saldo adeudado</td>
                                         <td className="py-1.5 px-3 text-right font-medium">MXN 0.00</td>
                                      </tr>
                                   </tbody>
                                </table>
                             </div>

                             <table className="w-full text-xs text-left mb-6">
                                <thead>
                                   <tr className="bg-slate-700 text-white leading-none">
                                      <th className="py-2.5 px-3 font-medium">Fecha</th>
                                      <th className="py-2.5 px-3 font-medium">Transacciones</th>
                                      <th className="py-2.5 px-3 font-medium">Detalles</th>
                                      <th className="py-2.5 px-3 font-medium text-right">Cantidad</th>
                                      <th className="py-2.5 px-3 font-medium text-right">Pagos</th>
                                      <th className="py-2.5 px-3 font-medium text-right">Saldo</th>
                                   </tr>
                                </thead>
                                <tbody className="text-slate-600 border-b border-slate-200">
                                   <tr>
                                      <td className="py-4 px-3 border-b border-slate-100">01 abr 2026</td>
                                      <td className="py-4 px-3 border-b border-slate-100 font-medium">***Saldo de Inicio***</td>
                                      <td className="py-4 px-3 border-b border-slate-100"></td>
                                      <td className="py-4 px-3 border-b border-slate-100 text-right">0.00</td>
                                      <td className="py-4 px-3 border-b border-slate-100 text-right"></td>
                                      <td className="py-4 px-3 border-b border-slate-100 text-right">0.00</td>
                                   </tr>
                                </tbody>
                             </table>

                             <div className="flex justify-end pr-3">
                                <p className="font-bold text-slate-800 text-sm">Saldo adeudado <span className="ml-8 font-medium">MXN 0.00</span></p>
                             </div>

                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Modal Reusable for Edit inside Detail View */}
        {isModalOpen && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden scale-in-95 duration-200">
                 <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800">
                       {editingId ? "Editar Cliente" : "Nuevo Cliente"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">Razón Social o Nombre Completo</label>
                       <input type="text" value={legalName} onChange={e=>setLegalName(e.target.value)} placeholder="Ej. Empresa SA de CV" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">RFC (SAT)</label>
                       <input type="text" value={rfc} onChange={e=>setRfc(e.target.value)} placeholder="XAXX010101000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Correo (Opcional)</label>
                          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="contacto@empresa.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Teléfono (Opcional)</label>
                          <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="123 456 7890" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Régimen Fiscal (SAT)</label>
                          <select value={taxRegime} onChange={e=>setTaxRegime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium">
                             <option value="">-- Seleccionar Régimen --</option>
                             {rfc.length === 12 ? (
                                <>
                                   <option value="601">601 - General de Ley Personas Morales</option>
                                   <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                                   <option value="626">626 - Régimen Simplificado de Confianza</option>
                                </>
                             ) : rfc.length === 13 ? (
                                <>
                                   <option value="605">605 - Sueldos y Salarios / Asimilados</option>
                                   <option value="606">606 - Arrendamiento</option>
                                   <option value="612">612 - Actividades Empresariales y Profesionales</option>
                                   <option value="621">621 - Incorporación Fiscal (RIF)</option>
                                   <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                                </>
                             ) : (
                                <option value="616">616 - Sin obligaciones fiscales (Extranjeros/Público en General)</option>
                             )}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Código Postal (SAT)</label>
                          <input type="text" value={zipCode} onChange={e=>setZipCode(e.target.value)} placeholder="Ej. 85860" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                       </div>
                    </div>
                    {(!rfc || rfc.length < 12 || !taxRegime || !zipCode || zipCode.length < 5) && (
                       <div className="bg-orange-50 border border-orange-200 text-orange-700 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>⚠️ <b>Faltan datos fiscales para emitir facturas:</b> Puedes guardar al cliente ahora, pero asegúrate de ingresar un RFC válido (12-13 caracteres), su Régimen Fiscal y el CP exacto de su comprobante fiscal antes de timbrar.</p>
                       </div>
                    )}
                 </div>
                 <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-all flex items-center gap-2">
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} {editingId ? "Actualizar" : "Guardar"}
                    </button>
                 </div>
              </div>
           </div>
        )}
    </div>
  );
}
