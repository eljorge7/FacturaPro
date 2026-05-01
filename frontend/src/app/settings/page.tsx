"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, FileText, Lock, Plus, Save, Upload, XCircle, Settings as SettingsIcon, Image as ImageIcon, Loader2, Users, Key, Hash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profile, setProfile] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'CASHIER' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Series State
  const [series, setSeries] = useState<any[]>([]);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [newSeries, setNewSeries] = useState({ name: '', prefix: '', nextFolio: 1, type: 'INVOICE', isDefault: false });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      legalName: "",
      rfc: "",
      taxRegime: "",
      zipCode: "",
      pdfTemplate: "Estándar - Estilo europeo",
      cerBase64: "",
      keyBase64: "",
      keyPassword: "",
      fielCerBase64: "",
      fielKeyBase64: "",
      fielPassword: "",
      logoWidth: 120,
      baseCurrency: "MXN",
      brandColor: "#10b981",
      brandFont: "Helvetica"
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/tax-profiles/mine`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
         const data = await res.json();
         setProfile(data);
         setFormData({
            legalName: data.legalName || "",
            rfc: data.rfc || "",
            taxRegime: data.taxRegime || "",
            zipCode: data.zipCode || "",
            pdfTemplate: data.pdfTemplate || "Estándar - Estilo europeo",
            cerBase64: data.cerBase64 || "",
            keyBase64: data.keyBase64 || "",
            keyPassword: data.keyPassword || "",
            fielCerBase64: data.fielCerBase64 || "",
            fielKeyBase64: data.fielKeyBase64 || "",
            fielPassword: data.fielPassword || "",
            logoWidth: data.logoWidth || 120,
            baseCurrency: data.baseCurrency || "MXN",
            brandColor: data.brandColor || "#10b981",
            brandFont: data.brandFont || "Helvetica"
         });
         if (data.logoUrl) {
            setLogoPreview(`${baseUrl}${data.logoUrl}`);
         }
         
         // fetch api keys
         const keysRes = await fetch(`${baseUrl}/api-keys/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
         if (keysRes.ok) {
           setApiKeys(await keysRes.json());
         }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSeries = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/tax-profiles/series`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSeries(await res.json());
    } catch(e) {}
  };

  const fetchApiKeys = async () => {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const keysRes = await fetch(`${baseUrl}/api-keys/mine`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (keysRes.ok) {
        setApiKeys(await keysRes.json());
      }
  };

  const fetchEmployees = async () => {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const usersRes = await fetch(`${baseUrl}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (usersRes.ok) {
        setEmployees(await usersRes.json());
      }
      setIsLoading(false);
  };

  const handleGenerateApiKey = async () => {
     setIsGeneratingKey(true);
     setNewRawKey(null);
     try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const res = await fetch(`${baseUrl}/api-keys/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: `Token M2M ${new Date().toLocaleDateString()}` })
       });
       if (res.ok) {
          const newKey = await res.json();
          setApiKeys([...apiKeys, newKey]);
          setNewRawKey(newKey.rawKey);
       }
     } catch (e) {
        console.error(e);
     } finally {
        setIsGeneratingKey(false);
     }
  };

  useEffect(() => {
    setMounted(true);
    if (token) {
        fetchProfile();
        fetchApiKeys();
        fetchEmployees();
        fetchSeries();
    }
  }, [token]);

  const handleCreateUser = async () => {
      setIsSaving(true);
      try {
         const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
         const res = await fetch(`${baseUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newUser)
         });
         if (res.ok) {
            alert('Usuario creado exitosamente');
            setIsUserModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'CASHIER' });
            fetchEmployees();
         } else {
            const e = await res.json();
            alert(e.message || 'Error al crear usuario');
         }
      } catch (e) {
         console.error(e);
      } finally {
         setIsSaving(false);
      }
  };

  const handleDeleteUser = async (id: string, role: string) => {
     if(role === 'OWNER') return alert('No se puede eliminar al dueño.');
     if(confirm('¿Eliminar permanente a este usuario?')) {
        try {
           const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
           await fetch(`${baseUrl}/users/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
           });
           fetchEmployees();
        } catch(e) { console.error(e) }
     }
  };

  const handleSaveSeries = async () => {
     setIsSaving(true);
     try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       const method = editingSeriesId ? 'PATCH' : 'POST';
       const url = editingSeriesId ? `${baseUrl}/tax-profiles/series/${editingSeriesId}` : `${baseUrl}/tax-profiles/series`;
       
       const res = await fetch(url, {
           method,
           headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
           body: JSON.stringify(newSeries)
       });
       if (res.ok) {
           setIsSeriesModalOpen(false);
           setEditingSeriesId(null);
           setNewSeries({ name: '', prefix: '', nextFolio: 1, type: 'INVOICE', isDefault: false });
           fetchSeries();
       }
     } catch(e) {}
     setIsSaving(false);
  };
  
  const handleDeleteSeries = async (id: string) => {
     if(!confirm("¿Eliminar configuración de serie?")) return;
     try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       await fetch(`${baseUrl}/tax-profiles/series/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
       fetchSeries();
     } catch(e){}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onloadend = () => {
        setLogoPreview(reader.result as string);
     };
     reader.readAsDataURL(file);
  };

  const handleDeleteLogo = () => {
     if(confirm("¿Estás seguro de eliminar tu logo?")) {
        setLogoPreview("");
     }
  };

  const handleFileAsBase64 = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onloadend = () => {
        const base64String = (reader.result as string).replace(/^data:(.*,)?/, '');
        setFormData(prev => ({...prev, [fieldName]: base64String}));
     };
     reader.readAsDataURL(file);
  };

   const handleSaveTemplate = async (templateName: string) => {
      setFormData({...formData, pdfTemplate: templateName});
      setIsSaving(true);
      try {
         const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
         const payload: any = { pdfTemplate: templateName };
         const res = await fetch(`${baseUrl}/tax-profiles/${profile.id}`, {
            method: 'PATCH',
            headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
         });
         if (res.ok) {
            fetchProfile();
         } else {
            alert('Oh no, hubo un error al guardar plantilla.');
         }
      } catch(e) {
         console.error(e);
      } finally {
         setIsSaving(false);
      }
   };

   const handleSave = async () => {
      setIsSaving(true);
      try {
         const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
         
         const payload: any = { ...formData, logoWidth: Number(formData.logoWidth) };
         if (logoPreview && logoPreview.startsWith('data:image')) {
            payload.logoBase64 = logoPreview;
         } else if (logoPreview === "") {
            payload.removeLogo = true;
         }

         const res = await fetch(`${baseUrl}/tax-profiles/${profile.id}`, {
            method: 'PATCH',
            headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
         });

         if (res.ok) {
            alert('¡Configuración guardada exitosamente!');
            window.location.reload();
         } else {
            alert('Oh no, hubo un error al guardar.');
         }
      } catch(e) {
         console.error(e);
      } finally {
         setIsSaving(false);
      }
  };

  if (!mounted || isLoading) return <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#10b981] animate-spin" /></div>;

  return (
    <>
      <div className="font-sans min-h-screen bg-[#f9fafb] flex flex-col">
       {/* Header */}
       <div className="bg-white border-b border-slate-200 px-8 py-6 z-10 shrink-0">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><SettingsIcon className="w-6 h-6 text-[#10b981]"/> Ajustes Organizacionales</h1>
                <p className="text-sm text-slate-500 mt-1">Configura la identidad operativa y fiscal de este espacio de trabajo.</p>
             </div>
             <button onClick={handleSave} disabled={isSaving} className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-md font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Guardar Cambios
             </button>
          </div>
       </div>

       <div className="flex-1 max-w-5xl mx-auto w-full flex mt-8 gap-8 px-8 pb-12">
          {/* Sidebar Tabs */}
          <div className="w-64 shrink-0">
             <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-emerald-50 text-[#10b981] border-l-4 border-l-[#10b981]' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                   <Building2 className="w-5 h-5"/> Perfil Comercial
                </button>
                <div className="h-px bg-slate-100"></div>
                <button 
                  onClick={() => setActiveTab('sat')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'sat' ? 'bg-emerald-50 text-[#10b981] border-l-4 border-l-[#10b981]' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                   <Lock className="w-5 h-5"/> Datos Fiscales (SAT)
                </button>
                <div className="h-px bg-slate-100"></div>
                <button 
                  onClick={() => setActiveTab('series')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'series' ? 'bg-emerald-50 text-[#10b981] border-l-4 border-l-[#10b981]' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                   <Hash className="w-5 h-5"/> Series y Folios
                </button>
                <div className="h-px bg-slate-100"></div>
                <button 
                  onClick={() => setActiveTab('pdf')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'pdf' ? 'bg-emerald-50 text-[#10b981] border-l-4 border-l-[#10b981]' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                   <FileText className="w-5 h-5"/> Plantillas PDF
                </button>
                <div className="h-px bg-slate-100"></div>
                
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-t border-slate-100">Administración</p>
                
                <button 
                  onClick={() => setActiveTab('users')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-emerald-50 text-[#10b981] border-l-4 border-l-[#10b981]' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                   <Users className="w-5 h-5"/> Usuarios y Roles
                </button>
                <div className="h-px bg-slate-100"></div>
                <button 
                  onClick={() => setActiveTab('api')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'api' ? 'bg-emerald-50 text-[#10b981] border-l-4 border-l-[#10b981]' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                   <Key className="w-5 h-5"/> Integración API
                </button>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
             
             {/* Profile TAB */}
             {activeTab === 'profile' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 animate-in fade-in">
                   <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">Detalles de la Empresa</h2>
                   
                   {/* Logo Upload Section */}
                   <div className="mb-8 flex items-start gap-6">
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                         {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                         ) : (
                            <div className="text-center text-slate-400">
                               <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50"/>
                               <span className="text-[10px] font-medium uppercase tracking-wider">Subir Logo</span>
                            </div>
                         )}
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => fileInputRef.current?.click()} className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Upload className="w-3 h-3"/> Cambiar</button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/svg+xml" className="hidden" />
                         </div>
                      </div>
                      <div className="flex-1 pt-2">
                         <h3 className="font-bold text-slate-700 text-sm mb-1">Logotipo Comercial</h3>
                         <p className="text-xs text-slate-500 mb-3">Este logo aparecerá en todas tus facturas y estimaciones PDF automáticas. Se prefieren imágenes cuadradas o rectangulares (PNG/JPG).</p>
                         <div className="flex gap-2 items-center">
                            <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50 text-slate-700 transition">Examinar archivos</button>
                            {logoPreview && <button onClick={handleDeleteLogo} className="text-xs font-bold text-red-500 border border-transparent hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition">Quitar Logo</button>}
                         </div>
                      </div>
                   </div>

                   {/* Form */}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2">
                         <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nombre / Razón Social Fiscal</label>
                         <input type="text" value={formData.legalName} onChange={e => setFormData({...formData, legalName: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">RFC Emisor</label>
                         <input type="text" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Código Postal (Expedición)</label>
                         <input type="text" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]" />
                      </div>
                      <div className="col-span-2">
                         <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Régimen Fiscal</label>
                         <select value={formData.taxRegime} onChange={e => setFormData({...formData, taxRegime: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] bg-white">
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                            <option value="616">616 - Sin obligaciones fiscales</option>
                            <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                         </select>
                      </div>
                      <div className="col-span-2 pt-4 border-t border-slate-100 mt-2">
                         <h3 className="text-sm font-bold text-slate-800 mb-4">Contabilidad Global Institucional</h3>
                         <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Moneda Principal de la Empresa (Base Currency)</label>
                         <p className="text-xs text-slate-500 mb-3">Establece la moneda en la que se registrará el inventario y se reportará la utilidad final. Podrás seguir comprando y facturando en monedas extranjeras (se aplicará el TC de la fecha local de forma automática).</p>
                         <select value={formData.baseCurrency} onChange={e => setFormData({...formData, baseCurrency: e.target.value})} className="w-full md:w-1/2 border border-[#10b981] bg-emerald-50 rounded-md px-3 py-2.5 text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#10b981]">
                            <option value="MXN">MXN - Peso Mexicano</option>
                            <option value="USD">USD - Dólar Estadounidense</option>
                            <option value="EUR">EUR - Euro</option>
                         </select>
                      </div>
                   </div>
                </div>
             )}



             {/* SAT TAB */}
             {activeTab === 'sat' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 animate-in fade-in">
                   <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">Identidad Criptográfica Fiscal</h2>
                   
                   <p className="text-sm text-slate-600 mb-6">Administra tus archivos seguros emitidos por el SAT. FacturaPro divide estrictamente el uso de tus sellos para proteger tu seguridad.</p>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* CSD Panel */}
                      <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 relative">
                         <h3 className="font-bold text-slate-800 mb-2">CSD (Certificado de Sello Digital)</h3>
                         <p className="text-xs text-slate-500 mb-4 h-8">Exclusivo para la emisión y cancelación de CFDI 4.0 ante el PAC.</p>
                         
                         <div className="space-y-4">
                            <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                                 <span>Certificado (.CER)</span>
                                 {formData.cerBase64 && <span className="text-[10px] text-emerald-600 px-1.5 py-0.5 bg-emerald-100 rounded">Cargado</span>}
                               </label>
                               <div className={`border-2 border-dashed border-slate-300 p-3 rounded-md text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer relative ${formData.cerBase64 ? 'bg-emerald-50 border-emerald-300' : 'bg-white'}`}>
                                   <p className="text-[11px] font-medium text-slate-600">Haz clic para cambiar archivo .cer</p>
                                   <input type="file" onChange={(e) => handleFileAsBase64(e, 'cerBase64')} className="absolute inset-0 opacity-0 cursor-pointer" accept=".cer"/>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                                 <span>Llave Privada (.KEY)</span>
                                 {formData.keyBase64 && <span className="text-[10px] text-amber-600 px-1.5 py-0.5 bg-amber-100 rounded">Cargada</span>}
                               </label>
                               <div className={`border-2 border-dashed border-slate-300 p-3 rounded-md text-center hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer relative ${formData.keyBase64 ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
                                   <p className="text-[11px] font-medium text-slate-600">Haz clic para cambiar archivo .key</p>
                                   <input type="file" onChange={(e) => handleFileAsBase64(e, 'keyBase64')} className="absolute inset-0 opacity-0 cursor-pointer" accept=".key"/>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Contraseña CSD</label>
                               <input 
                                  type="password" 
                                  value={formData.keyPassword} 
                                  onChange={e => setFormData({...formData, keyPassword: e.target.value})} 
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-[#10b981]" 
                                  placeholder="••••••••••••"
                               />
                            </div>
                         </div>
                      </div>

                      {/* FIEL Panel */}
                      <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 relative">
                         <h3 className="font-bold text-slate-800 mb-2">FIEL (e.Firma Avanzada)</h3>
                         <p className="text-xs text-slate-500 mb-4 h-8">Exclusivo para la conexión directa y descarga desde la Bóveda SAT.</p>
                         
                         <div className="space-y-4">
                            <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                                 <span>Certificado (.CER)</span>
                                 {formData.fielCerBase64 && <span className="text-[10px] text-indigo-600 px-1.5 py-0.5 bg-indigo-100 rounded">Cargado</span>}
                               </label>
                               <div className={`border-2 border-dashed border-slate-300 p-3 rounded-md text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer relative ${formData.fielCerBase64 ? 'bg-indigo-50 border-indigo-300' : 'bg-white'}`}>
                                   <p className="text-[11px] font-medium text-slate-600">Haz clic para cambiar archivo .cer</p>
                                   <input type="file" onChange={(e) => handleFileAsBase64(e, 'fielCerBase64')} className="absolute inset-0 opacity-0 cursor-pointer" accept=".cer"/>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                                 <span>Llave Privada (.KEY)</span>
                                 {formData.fielKeyBase64 && <span className="text-[10px] text-indigo-600 px-1.5 py-0.5 bg-indigo-100 rounded">Cargada</span>}
                               </label>
                               <div className={`border-2 border-dashed border-slate-300 p-3 rounded-md text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer relative ${formData.fielKeyBase64 ? 'bg-indigo-50 border-indigo-300' : 'bg-white'}`}>
                                   <p className="text-[11px] font-medium text-slate-600">Haz clic para cambiar archivo .key</p>
                                   <input type="file" onChange={(e) => handleFileAsBase64(e, 'fielKeyBase64')} className="absolute inset-0 opacity-0 cursor-pointer" accept=".key"/>
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Contraseña FIEL</label>
                               <input 
                                  type="password" 
                                  value={formData.fielPassword} 
                                  onChange={e => setFormData({...formData, fielPassword: e.target.value})} 
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500" 
                                  placeholder="••••••••••••"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* SERIES TAB */}
             {activeTab === 'series' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 animate-in fade-in">
                   <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">Configuración de Series y Folios</h2>
                   
                   <p className="text-sm text-slate-600 mb-6">Configura prefijos o sufijos personalizados para tus documentos contables para llevar de manera separada tu control interno. (Por ejemplo, F- para facturas locales, y E- para extranjeras).</p>
                   
                   <div className="border border-slate-200 rounded-md overflow-hidden">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                             <tr>
                                <th className="py-3 px-4 font-bold">Tipo Documento</th>
                                <th className="py-3 px-4 font-bold">Nombre Referencia</th>
                                <th className="py-3 px-4 font-bold">Prefijo / Serie</th>
                                <th className="py-3 px-4 font-bold">Siguiente Folio</th>
                                <th className="py-3 px-4 font-bold">Master</th>
                                <th className="py-3 px-4 font-bold text-right">Acciones</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {series.map(s => (
                               <tr key={s.id} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 font-medium text-slate-800">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${s.type === 'QUOTE' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                         {s.type === 'QUOTE' ? 'COTIZACIÓN' : 'FACTURA'}
                                      </span>
                                  </td>
                                  <td className="py-3 px-4 font-medium text-slate-700">{s.name}</td>
                                  <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-mono font-bold">{s.prefix}</span></td>
                                  <td className="py-3 px-4 text-emerald-600 font-mono font-bold">{s.nextFolio}</td>
                                  <td className="py-3 px-4">
                                      {s.isDefault ? <span className="text-emerald-500 font-black">★ Default</span> : <span className="text-slate-300">-</span>}
                                  </td>
                                  <td className="py-3 px-4 text-right flex gap-3 justify-end">
                                      <button onClick={() => { setEditingSeriesId(s.id); setNewSeries(s); setIsSeriesModalOpen(true); }} className="text-indigo-600 hover:underline font-medium text-xs">Editar</button>
                                      <button onClick={() => handleDeleteSeries(s.id)} className="text-rose-600 hover:underline font-medium text-xs">Borrar</button>
                                  </td>
                               </tr>
                             ))}
                             {series.length === 0 && (
                                <tr>
                                   <td colSpan={6} className="py-6 text-center text-slate-500 text-sm">No hay series configuradas aún.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                   </div>
                   <button onClick={() => { setEditingSeriesId(null); setNewSeries({ name: '', prefix: '', nextFolio: 1, type: 'INVOICE', isDefault: false }); setIsSeriesModalOpen(true); }} className="mt-4 flex items-center px-4 py-2 bg-emerald-50 rounded-lg text-sm font-bold text-[#10b981] hover:text-[#059669] hover:bg-emerald-100 transition-colors"><Plus className="w-4 h-4 mr-1"/> Añadir Serie Personalizada</button>
                </div>
             )}

             {/* PDF TAB */}
             {activeTab === 'pdf' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 lg:p-8 animate-in fade-in">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                      <div>
                         <h2 className="text-lg font-bold text-slate-800">Motor Visual de Plantillas PDF</h2>
                         <p className="text-sm text-slate-500">Personaliza la tipografía, color corporativo y el layout maestro de tus documentos.</p>
                      </div>
                      <button onClick={handleSave} disabled={isSaving} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-bold shadow transition-all flex items-center gap-2 text-sm">
                         {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Guardar Diseño Global
                      </button>
                   </div>
                   
                   <div className="flex flex-col lg:flex-row gap-8">
                       {/* CONTROLES IZQUIERDA */}
                       <div className="w-full lg:w-1/3 space-y-8">
                           {/* Color de Marca */}
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Color Institucional</label>
                               <div className="flex gap-3 items-center">
                                  <input type="color" value={formData.brandColor} onChange={e=>setFormData({...formData, brandColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer border border-slate-300" />
                                  <input type="text" value={formData.brandColor} onChange={e=>setFormData({...formData, brandColor: e.target.value})} className="w-28 border border-slate-200 rounded p-2 text-sm font-mono uppercase bg-white" placeholder="#10b981" />
                               </div>
                               <div className="flex gap-2 mt-3">
                                   <button onClick={()=>setFormData({...formData, brandColor: '#10b981'})} className="w-6 h-6 rounded-full bg-[#10b981] border-2 border-white ring-1 ring-slate-200"></button>
                                   <button onClick={()=>setFormData({...formData, brandColor: '#2563eb'})} className="w-6 h-6 rounded-full bg-[#2563eb] border-2 border-white ring-1 ring-slate-200"></button>
                                   <button onClick={()=>setFormData({...formData, brandColor: '#e11d48'})} className="w-6 h-6 rounded-full bg-[#e11d48] border-2 border-white ring-1 ring-slate-200"></button>
                                   <button onClick={()=>setFormData({...formData, brandColor: '#0f172a'})} className="w-6 h-6 rounded-full bg-[#0f172a] border-2 border-white ring-1 ring-slate-200"></button>
                                   <button onClick={()=>setFormData({...formData, brandColor: '#7c3aed'})} className="w-6 h-6 rounded-full bg-[#7c3aed] border-2 border-white ring-1 ring-slate-200"></button>
                               </div>
                           </div>

                           {/* Tipografía */}
                           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Modo Tipográfico</label>
                               <div className="flex flex-col gap-2">
                                  <button onClick={()=>setFormData({...formData, brandFont: 'Helvetica'})} className={`px-4 py-3 text-left rounded-lg text-sm border transition-all flex items-center justify-between ${formData.brandFont === 'Helvetica' ? 'bg-white shadow border-[#10b981] text-slate-800 font-bold' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'}`} style={{fontFamily: 'Helvetica, Arial, sans-serif'}}>
                                      Sans-Serif (Moderno) <span className="text-[10px] uppercase bg-slate-100 px-1 py-0.5 rounded border">Ag</span>
                                  </button>
                                  <button onClick={()=>setFormData({...formData, brandFont: 'Times-Roman'})} className={`px-4 py-3 text-left rounded-lg text-sm border transition-all flex items-center justify-between ${formData.brandFont === 'Times-Roman' ? 'bg-white shadow border-[#10b981] text-slate-800 font-bold' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'}`} style={{fontFamily: 'Times New Roman, serif'}}>
                                      Serif (Clásico) <span className="text-[10px] uppercase bg-slate-100 px-1 py-0.5 rounded border">Ag</span>
                                  </button>
                                  <button onClick={()=>setFormData({...formData, brandFont: 'Courier'})} className={`px-4 py-3 text-left rounded-lg text-sm border transition-all flex items-center justify-between ${formData.brandFont === 'Courier' ? 'bg-white shadow border-[#10b981] text-slate-800 font-bold' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-100'}`} style={{fontFamily: 'Courier, monospace'}}>
                                      Mono (Código) <span className="text-[10px] uppercase bg-slate-100 px-1 py-0.5 rounded border">Ag</span>
                                  </button>
                               </div>
                           </div>

                           {/* Selector de Layout */}
                           <div>
                               <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Geometría de Plantilla</label>
                               <div className="grid grid-cols-2 gap-3">
                                   {[
                                       {id: 'Minimalista Notion', label: 'Minimalista'},
                                       {id: 'Corporativo Bancario', label: 'Corporativo'},
                                       {id: 'Avant-Garde Agencia', label: 'Agencia'},
                                       {id: 'Bold Accent', label: 'Cinturón Sólido'},
                                       {id: 'Elegante Dark Header', label: 'Fondo Noche'},
                                       {id: 'Ticket POS Termal', label: 'Ticket 80mm'}
                                   ].map(tpl => (
                                      <button 
                                         key={tpl.id} 
                                         onClick={() => setFormData({...formData, pdfTemplate: tpl.id})}
                                         className={`p-3 text-center rounded-lg text-xs font-bold border transition-all ${formData.pdfTemplate === tpl.id ? 'bg-[#10b981] text-white border-[#059669] shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-[#10b981] hover:text-[#10b981]'}`}
                                      >
                                         {tpl.label}
                                      </button>
                                   ))}
                               </div>
                           </div>

                           {/* Ajuste de Logo */}
                           <div className="border border-slate-200 p-5 rounded-xl bg-white shadow-sm">
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 flex justify-between">
                                  Escalado de Logotipo <span>{formData.logoWidth}px</span>
                              </label>
                              <input 
                                 type="range" min="50" max="300" 
                                 value={formData.logoWidth} 
                                 onChange={e => setFormData({...formData, logoWidth: Number(e.target.value)})}
                                 className="w-full accent-[#10b981]"
                              />
                           </div>
                       </div>

                       {/* PREVISUALIZADOR DERECHA */}
                       <div className="flex-1 bg-slate-200 rounded-xl p-6 lg:p-10 flex items-center justify-center overflow-auto border-4 border-slate-100 shadow-inner min-h-[600px] relative">
                           <div className="absolute top-4 right-4 bg-slate-800 text-white px-3 py-1 text-xs font-bold rounded shadow-lg uppercase tracking-wide opacity-50 pointer-events-none">
                              Pizarra de Previsualización: {formData.pdfTemplate}
                           </div>

                           {/* Lienzo del PDF Dinámico */}
                           <div 
                              className={`bg-white shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300`} 
                              style={{ 
                                  width: formData.pdfTemplate === 'Ticket POS Termal' ? '280px' : '595px', // Ticket POS is narrow, A4 is 595px wide proportionally
                                  height: formData.pdfTemplate === 'Ticket POS Termal' ? 'auto' : '842px', // A4 height
                                  minHeight: '400px',
                                  fontFamily: formData.brandFont === 'Courier' ? 'Courier, monospace' : (formData.brandFont === 'Times-Roman' ? 'Times New Roman, serif' : 'Helvetica, Arial, sans-serif')
                              }}
                           >
                               
                               {/* === HEADER MOCKS === */}
                               
                               {formData.pdfTemplate === 'Minimalista Notion' && (
                                   <div className="p-10 pb-6 flex flex-col">
                                       <div className="flex justify-between items-start mb-12">
                                           <div>
                                             {logoPreview ? (
                                                <img src={logoPreview} style={{ width: `${formData.logoWidth}px` }} className="object-contain mb-4" alt="Logo Previa" />
                                             ) : (
                                                <div className="text-3xl font-bold text-slate-900 mb-4 tracking-tight" style={{ width: `${Math.max(120, formData.logoWidth)}px` }}>{formData.legalName || 'SIN NOMBRE'}</div>
                                             )}
                                           </div>
                                           <div className="text-right">
                                              <h1 className="text-sm font-bold uppercase" style={{color: formData.brandColor}}>FACTURA COMERCIAL</h1>
                                              <p className="text-xs text-slate-500 font-medium"># F-00123</p>
                                              <p className="text-xs text-slate-500">10/04/2026</p>
                                           </div>
                                       </div>
                                       <div className="flex justify-between text-xs text-slate-800">
                                           <div><span className="font-bold">De:</span><br/>{formData.legalName || 'Empresa Local LLC'}<br/>RFC: {formData.rfc || 'XAXX01010'}</div>
                                           <div><span className="font-bold">Para:</span><br/>Cliente Importante S.A.<br/>RFC: ABCD000000</div>
                                       </div>
                                   </div>
                               )}

                               {formData.pdfTemplate === 'Corporativo Bancario' && (
                                   <div className="p-10 pb-6 flex flex-col">
                                       <div className="flex justify-between items-center bg-slate-50 border-t-8 p-6 mb-8 shadow-sm" style={{borderColor: formData.brandColor}}>
                                          {logoPreview ? (
                                             <img src={logoPreview} style={{ width: `${formData.logoWidth}px` }} className="object-contain" alt="Logo Previa" />
                                          ) : (
                                             <div className="text-2xl font-bold text-slate-900 tracking-tight" style={{ width: `${Math.max(120, formData.logoWidth)}px` }}>{formData.legalName || 'S.A.'}</div>
                                          )}
                                          <h1 className="text-lg font-bold uppercase text-slate-800">Factura Comercial</h1>
                                       </div>
                                       <div className="flex gap-4">
                                           <div className="flex-1 border border-slate-300 p-4 rounded-sm text-xs">
                                              <div className="font-bold mb-2 uppercase" style={{color: formData.brandColor}}>Datos de Emisión</div>
                                              <div>Folio: F-123<br/>Fecha: 10/04/2026</div>
                                           </div>
                                           <div className="flex-1 border border-slate-300 p-4 rounded-sm text-xs">
                                              <div className="font-bold mb-2 uppercase" style={{color: formData.brandColor}}>Receptor</div>
                                              <div>Cliente VIP Corp<br/>RFC: XAXX010101000</div>
                                           </div>
                                       </div>
                                   </div>
                               )}

                               {formData.pdfTemplate === 'Avant-Garde Agencia' && (
                                   <div className="p-0 pb-6 flex flex-col pt-12">
                                       <div className="px-10 flex justify-between items-start mb-8">
                                          <h1 className="text-4xl font-bold uppercase leading-none tracking-tighter" style={{color: formData.brandColor}}>FACTURA</h1>
                                          {logoPreview && <img src={logoPreview} style={{ width: `${formData.logoWidth}px` }} className="object-contain" alt="Logo Previa" />}
                                       </div>
                                       <div className="px-10 text-slate-600 text-sm mb-6">
                                          Folio: F-00123 <br/> Fecha: 10/04/2026
                                       </div>
                                       <div className="w-full h-1" style={{backgroundColor: formData.brandColor}}></div>
                                       <div className="px-10 flex justify-between text-xs text-slate-800 mt-6">
                                           <div><span className="font-bold uppercase tracking-wider">De:</span><br/>{formData.legalName || 'Agencia Creativa'}</div>
                                           <div><span className="font-bold uppercase tracking-wider">Para:</span><br/>Cliente Importante Inc</div>
                                       </div>
                                   </div>
                               )}

                               {formData.pdfTemplate === 'Bold Accent' && (
                                   <div className="p-0 flex flex-col">
                                       <div className="p-10 flex justify-between items-start text-white shadow-md relative overflow-hidden" style={{backgroundColor: formData.brandColor, minHeight:'140px'}}>
                                          <div className="relative z-10 w-1/2">
                                              {logoPreview ? (
                                                 <img src={logoPreview} style={{ width: `${formData.logoWidth}px` }} className="object-contain brightness-0 invert" alt="Logo Previa" />
                                              ) : (
                                                 <div className="text-3xl font-black text-white tracking-tight leading-none" style={{ width: `${Math.max(120, formData.logoWidth)}px` }}>{formData.legalName || 'EMPRESA'}</div>
                                              )}
                                          </div>
                                          <div className="relative z-10 text-right w-1/2">
                                             <h1 className="text-2xl font-bold uppercase">Factura</h1>
                                             <p className="text-sm opacity-90"># F-00123</p>
                                          </div>
                                       </div>
                                       <div className="px-10 flex justify-between text-xs text-slate-800 mt-8 mb-6">
                                           <div><span className="font-bold uppercase tracking-wider" style={{color: formData.brandColor}}>Emisor</span><br/>{formData.legalName || 'Compañía S.A.'}<br/>RFC: {formData.rfc || 'XAXX'}</div>
                                           <div><span className="font-bold uppercase tracking-wider" style={{color: formData.brandColor}}>Receptor</span><br/>Cliente Mayorista<br/>RFC: ABCD</div>
                                       </div>
                                   </div>
                               )}

                               {formData.pdfTemplate === 'Elegante Dark Header' && (
                                   <div className="p-0 flex flex-col">
                                       <div className="p-10 flex justify-between items-start text-white shadow-lg bg-slate-900" style={{minHeight:'180px'}}>
                                          <div className="w-1/2">
                                              {logoPreview ? (
                                                 <img src={logoPreview} style={{ width: `${formData.logoWidth}px` }} className="object-contain bg-white rounded-sm p-1" alt="Logo Previa" />
                                              ) : (
                                                 <div className="text-3xl font-bold text-white tracking-tight leading-none" style={{ width: `${Math.max(120, formData.logoWidth)}px` }}>{formData.legalName || 'EMPRESA RIGUROSA'}</div>
                                              )}
                                              <div className="mt-8">
                                                  <h1 className="text-xl font-bold uppercase tracking-widest" style={{color: formData.brandColor}}>Factura Comercial</h1>
                                                  <p className="text-sm text-slate-400"># F-00123</p>
                                              </div>
                                          </div>
                                          <div className="text-right w-1/2">
                                             <h2 className="text-xs font-bold uppercase mb-1">Preparado Para:</h2>
                                             <p className="text-xs text-slate-300 leading-relaxed">Grupo Constructor S.A.<br/>RFC: GCXXXXXXX<br/>Monterrey, N.L.</p>
                                          </div>
                                       </div>
                                       <div className="px-10 text-xs text-slate-800 mt-6 mb-2">
                                           <span className="font-bold uppercase tracking-wider">Info. Emisor:</span><br/>{formData.legalName || 'Corporativo'}<br/>RFC: {formData.rfc || 'XAXX'}
                                       </div>
                                   </div>
                               )}

                               {formData.pdfTemplate === 'Ticket POS Termal' && (
                                   <div className="p-4 flex flex-col items-center border-b border-dashed border-slate-300">
                                       {logoPreview ? (
                                            <img src={logoPreview} style={{ width: `${formData.logoWidth}px` }} className="object-contain mb-3" alt="Logo Previa" />
                                       ) : (
                                            <div className="text-xl font-black text-center mb-3 leading-none" style={{color: formData.brandColor}}>{formData.legalName || 'TIENDA'}</div>
                                       )}
                                       <h1 className="text-sm font-bold uppercase bg-black text-white px-3 py-1 rounded-sm w-full text-center">Ticket de Venta</h1>
                                       <p className="text-[10px] mt-2">Folio: T-0100</p>
                                       <p className="text-[10px]">10/04/2026 14:00</p>
                                       
                                       <div className="w-full mt-4 text-[10px] text-center">
                                          <span className="font-bold">E M I S O R</span><br/>
                                          {formData.legalName || 'Tienda'}, RFC: {formData.rfc || 'XAXX'}<br/>
                                          <br/>
                                          <span className="font-bold">R E C E P T O R</span><br/>
                                          Público General
                                       </div>
                                   </div>
                               )}

                               {/* === TABLE MOCKS === */}

                               <div className={`${formData.pdfTemplate === 'Ticket POS Termal' ? 'px-4 py-4' : 'px-10 py-6'} flex-1 flex flex-col`}>
                                  
                                  {/* Table Header */}
                                  <div 
                                      className={`flex text-[10px] font-bold py-2 ${formData.pdfTemplate === 'Ticket POS Termal' ? 'border-y border-slate-300' : 'px-4'}`}
                                      style={{
                                          backgroundColor: formData.pdfTemplate === 'Elegante Dark Header' ? '#1e293b' : (formData.pdfTemplate === 'Bold Accent' ? formData.brandColor : (formData.pdfTemplate === 'Corporativo Bancario' ? '#f8fafc' : 'transparent')),
                                          color: (formData.pdfTemplate === 'Elegante Dark Header' || formData.pdfTemplate === 'Bold Accent') ? '#ffffff' : '#334155',
                                          borderBottom: (formData.pdfTemplate === 'Minimalista Notion' || formData.pdfTemplate === 'Avant-Garde Agencia') ? `1px solid ${formData.pdfTemplate === 'Minimalista Notion' ? formData.brandColor : '#e2e8f0'}` : (formData.pdfTemplate === 'Corporativo Bancario' ? '1px solid #cbd5e1' : '')
                                      }}
                                  >
                                      <div className={`${formData.pdfTemplate === 'Ticket POS Termal' ? 'w-8' : 'w-12'}`}>CANT</div>
                                      <div className="flex-1">DESCRIPCIÓN</div>
                                      {formData.pdfTemplate !== 'Ticket POS Termal' && <div className="w-24 text-right">PRECIO U.</div>}
                                      <div className="w-24 text-right">IMPORTE</div>
                                  </div>

                                  {/* Table Body (1 Item) */}
                                  <div className={`flex text-[10px] py-4 ${formData.pdfTemplate === 'Ticket POS Termal' ? 'border-b border-slate-300' : 'px-4 border-b border-slate-100'} text-slate-600`}>
                                      <div className={`${formData.pdfTemplate === 'Ticket POS Termal' ? 'w-8' : 'w-12'}`}>2</div>
                                      <div className="flex-1 leading-tight">Servicios de Consultoría Tech Avanzada</div>
                                      {formData.pdfTemplate !== 'Ticket POS Termal' && <div className="w-24 text-right">$5,000.00</div>}
                                      <div className="w-24 text-right font-medium">$10,000.00</div>
                                  </div>

                                  {/* Totals */}
                                  <div className={`mt-6 flex flex-col items-end text-[10px] space-y-2 text-slate-600`}>
                                      <div className="flex w-48 justify-between"><span className="font-bold">Subtotal:</span> <span>$10,000.00</span></div>
                                      <div className="flex w-48 justify-between"><span className="font-bold">IVA (16%):</span> <span>$1,600.00</span></div>
                                      
                                      {formData.pdfTemplate === 'Avant-Garde Agencia' ? (
                                          <div className="flex w-64 justify-between mt-4 p-4 items-center" style={{backgroundColor: formData.brandColor}}>
                                             <span className="font-bold text-sm text-white">TOTAL</span>
                                             <span className="font-bold text-lg text-white tracking-tight">$11,600.00</span>
                                          </div>
                                      ) : (
                                          <div className="flex w-48 justify-between mt-2 pt-2 border-t border-slate-200">
                                              <span className="font-bold text-sm" style={{color: (formData.pdfTemplate === 'Minimalista Notion' || formData.pdfTemplate === 'Ticket POS Termal') ? '#0f172a' : formData.brandColor}}>TOTAL:</span> 
                                              <span className="font-bold text-sm text-slate-900">$11,600.00</span>
                                          </div>
                                      )}
                                  </div>

                                  {/* Footer Space Placeholder */}
                                  {formData.pdfTemplate !== 'Ticket POS Termal' && (
                                     <div className="mt-auto pt-8 flex gap-4 opacity-50">
                                         <div className="w-20 h-20 bg-slate-200 rounded shrink-0"></div>
                                         <div className="flex-1 space-y-2">
                                            <div className="h-2 w-1/4 bg-slate-200 rounded"></div>
                                            <div className="h-6 w-full bg-slate-100 rounded"></div>
                                            <div className="h-2 w-1/3 bg-slate-200 rounded mt-4"></div>
                                            <div className="h-6 w-full bg-slate-100 rounded"></div>
                                         </div>
                                     </div>
                                  )}
                                  {formData.pdfTemplate === 'Ticket POS Termal' && (
                                      <div className="mt-8 text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                          Gracias por su compra
                                      </div>
                                  )}

                               </div>
                           </div>

                       </div>
                   </div>

                </div>
             )}

             {/* USERS TAB */}
             {activeTab === 'users' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 animate-in fade-in">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                      <h2 className="text-lg font-bold text-slate-800">Gestión de Usuarios</h2>
                      <button onClick={() => setIsUserModalOpen(true)} className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm transition-colors flex items-center gap-2"><Plus className="w-4 h-4"/> Registrar Usuario</button>
                   </div>
                   
                   <div className="border border-slate-200 rounded-md overflow-hidden">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                             <tr>
                                <th className="py-3 px-4 font-bold">Nombre del Empleado</th>
                                <th className="py-3 px-4 font-bold">Correo Electrónico</th>
                                <th className="py-3 px-4 font-bold">Rol en Sistema</th>
                                <th className="py-3 px-4 font-bold text-right">Estado</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {employees.map(emp => (
                               <tr key={emp.id} className="hover:bg-slate-50">
                                  <td className="py-4 px-4 font-bold text-slate-800 flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                        {emp.name.substring(0,2).toUpperCase()}
                                     </div> 
                                     {emp.name}
                                  </td>
                                  <td className="py-4 px-4 text-slate-600">{emp.email}</td>
                                  <td className="py-4 px-4">
                                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${emp.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : emp.role === 'CASHIER' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                                       {emp.role === 'OWNER' ? 'Administrador' : emp.role === 'CASHIER' ? 'Cajero (POS)' : 'Operador'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                     {emp.role !== 'OWNER' && (
                                        <button onClick={() => handleDeleteUser(emp.id, emp.role)} className="text-red-500 hover:text-red-700 transition">Eliminar</button>
                                     )}
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                   </div>
                </div>
             )}

             {/* API TAB */}
             {activeTab === 'api' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 animate-in fade-in">
                   <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">Conexiones M2M e Integraciones</h2>
                   
                   <p className="text-sm text-slate-600 mb-6">Crea <strong>ApiKeys</strong> (Llaves de acceso) para enlazar aplicaciones externas (como RentControl u OmniChat) de forma que puedan comandar a FacturaPro detrás de escena sin intervención humana.</p>
                   
                   {newRawKey && (
                     <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-8">
                       <h3 className="text-emerald-800 font-bold mb-2 flex items-center gap-2"><Key className="w-5 h-5"/> ¡Llave Generada Exitosamente!</h3>
                       <p className="text-sm text-emerald-700 mb-4">Copia esta llave ahora. Por seguridad, <strong>no se volverá a mostrar</strong>. Pégala en el panel de integraciones de RentControl.</p>
                       <div className="bg-white border border-emerald-300 p-4 rounded font-mono text-emerald-900 break-all select-all font-bold">
                         {newRawKey}
                       </div>
                     </div>
                   )}

                   {apiKeys.length === 0 ? (
                     <div className="bg-slate-50 rounded-md border border-slate-200 p-6 mb-8 text-center flex flex-col items-center justify-center">
                        <Key className="w-8 h-8 text-slate-400 mb-2"/>
                        <h3 className="font-bold text-slate-700 text-sm mb-1">Aún no hay llaves generadas.</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">Genera una nueva credencial API para iniciar la comunicación bidireccional entre sistemas.</p>
                        <button onClick={handleGenerateApiKey} disabled={isGeneratingKey} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50">
                          {isGeneratingKey ? 'Generando...' : 'Generar Nueva ApiKey'}
                        </button>
                     </div>
                   ) : (
                     <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-slate-700 text-sm">Llaves Activas</h3>
                           <button onClick={handleGenerateApiKey} disabled={isGeneratingKey} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50">
                              {isGeneratingKey ? 'Generando...' : 'Generar Nueva Llave'}
                           </button>
                        </div>
                        <div className="border border-slate-200 rounded-md overflow-hidden">
                           <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                 <tr>
                                    <th className="py-3 px-4 font-bold">Nombre de la Llave</th>
                                    <th className="py-3 px-4 font-bold">SHA256 Hash</th>
                                    <th className="py-3 px-4 font-bold">Estado</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {apiKeys.map(k => (
                                    <tr key={k.id} className="hover:bg-slate-50">
                                       <td className="py-3 px-4 font-medium text-slate-800">{k.name}</td>
                                       <td className="py-3 px-4 text-slate-500 font-mono text-xs">{k.keyHash.substring(0, 16)}...</td>
                                       <td className="py-3 px-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">Activa</span></td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   )}
                   
                   <h3 className="font-bold text-slate-700 text-sm mb-2">Instrucciones de Uso (Desarrolladores)</h3>
                   <div className="bg-slate-900 rounded text-slate-300 p-4 font-mono text-xs overflow-x-auto">
                      <p><span className="text-pink-400">POST</span> /invoices <span className="text-green-400">HTTP/1.1</span></p>
                      <p>Host: facturapro.local:3005</p>
                      <p>Authorization: Bearer <span className="text-yellow-400">api_key_generada</span></p>
                      <p className="mt-2 text-slate-500">// Payload Body</p>
                      <p className="text-blue-300">{`{ "customerId": "..." , "total": 1500.00 }`}</p>
                   </div>
                </div>
             )}

          </div>
       </div>
     </div>

     {/* User Modal */}
     {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between">
                 <h3 className="font-bold text-lg text-slate-800">Nuevo Colaborador</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre</label>
                    <input type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="Ana Ayde" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                    <input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="ana@ejemplo.com" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                    <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="••••••••" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipo de Acceso (Rol)</label>
                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full border rounded p-2 text-sm">
                       <option value="CASHIER">Cajero de Mostrador (Solo POS)</option>
                       <option value="ADMIN">Administrador Global</option>
                    </select>
                 </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                 <button onClick={() => setIsUserModalOpen(false)} className="text-slate-600 font-medium px-4 py-2">Cancelar</button>
                 <button onClick={handleCreateUser} disabled={isSaving} className="bg-[#10b981] text-white px-4 py-2 rounded font-bold shadow">Guardar Empleado</button>
              </div>
           </div>
        </div>
     )}

     {/* Series Modal */}
     {isSeriesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between">
                 <h3 className="font-bold text-lg text-slate-800">{editingSeriesId ? 'Editar Folios' : 'Nueva Serie Pila'}</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Descriptivo</label>
                    <input type="text" value={newSeries.name} onChange={e=>setNewSeries({...newSeries, name: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="Ej. Tienda Física" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Prefijo</label>
                        <input type="text" value={newSeries.prefix} onChange={e=>setNewSeries({...newSeries, prefix: e.target.value.toUpperCase()})} className="w-full border rounded p-2 text-sm uppercase font-mono" placeholder="TF-" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Siguiente N°</label>
                        <input type="number" min="1" value={newSeries.nextFolio} onChange={e=>setNewSeries({...newSeries, nextFolio: parseInt(e.target.value) || 1})} className="w-full border rounded p-2 text-sm" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Aplicar sobre:</label>
                    <select value={newSeries.type} onChange={e=>setNewSeries({...newSeries, type: e.target.value})} className="w-full border rounded p-2 text-sm">
                       <option value="INVOICE">Facturas DRAFT / TIMBRADAS</option>
                       <option value="QUOTE">Cotizaciones Comerciales</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded">
                     <input type="checkbox" id="isDefault" checked={newSeries.isDefault} onChange={e=>setNewSeries({...newSeries, isDefault: e.target.checked})} className="w-4 h-4 text-emerald-600" />
                     <label htmlFor="isDefault" className="text-xs font-bold text-slate-700">✓ Hacer serie predeterminada</label>
                 </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                 <button onClick={() => setIsSeriesModalOpen(false)} className="text-slate-600 font-medium px-4 py-2 text-sm">Cancelar</button>
                 <button onClick={handleSaveSeries} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-bold shadow text-sm transition-colors flex gap-2"><Save className="w-4 h-4"/> Guardar Automático</button>
              </div>
           </div>
        </div>
     )}
    </>
  );
}
