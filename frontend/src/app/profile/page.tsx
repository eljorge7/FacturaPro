"use client";

import { Save, User as UserIcon, Loader2, KeyRound, Upload, ImageIcon, Calendar, Phone, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function UserProfilePage() {
  const { user, token } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [tier, setTier] = useState<string>("TRIAL");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) return;
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      
      try {
        // Fetch Profile Data
        const profileRes = await fetch(`${baseUrl}/auth/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const p = await profileRes.json();
          setProfileData(p);
          setName(p.name || "");
          setEmail(p.email || "");
          setAvatarPreview(p.avatar || "");
          setTradeName(p.tradeName || "");
          setPhone(p.phone || "");
          if (p.birthDate) {
            setBirthDate(new Date(p.birthDate).toISOString().split('T')[0]);
          }
        }
        
        // Fetch Tier
        const statsRes = await fetch(`${baseUrl}/invoices/stats`, {
           headers: { "Authorization": `Bearer ${token}` }
        });
        if (statsRes.ok) {
           const s = await statsRes.json();
           setTier(s.subscriptionTier || "TRIAL");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [token]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
         setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
       const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
       
       const payload: any = {};
       if (name) payload.name = name;
       if (email) payload.email = email;
       if (password) payload.password = password;
       if (birthDate) payload.birthDate = new Date(birthDate).toISOString();
       if (tradeName !== undefined) payload.tradeName = tradeName;
       if (phone !== undefined) payload.phone = phone;
       if (avatarPreview && avatarPreview.startsWith('data:image')) {
          payload.avatar = avatarPreview;
       }

       const res = await fetch(`${baseUrl}/auth/profile`, {
          method: "PATCH",
          headers: { 
             "Content-Type": "application/json",
             "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
       });

       if (!res.ok) {
           const err = await res.json();
           throw new Error(err.message || 'Error guardando');
       }

       const updatedUser = await res.json();
       if (typeof window !== 'undefined') {
          // Keep tenant fields alive in localStorage user
          const cached = JSON.parse(localStorage.getItem('facturapro_user') || '{}');
          const toCache = { ...cached, ...updatedUser };
          localStorage.setItem('facturapro_user', JSON.stringify(toCache));
          window.location.reload(); 
       }
    } catch (error) {
       console.error("Error al guardar", error);
       alert("Ocurrió un error al guardar tu perfil.");
    } finally {
       setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 p-8 pt-10 pb-20">
      
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mi Perfil y Agencia</h2>
        <p className="text-slate-500 font-medium mt-1">
          Configura tus datos de contacto y el branding global de tu sistema FacturaPro.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
         <div className="flex flex-col md:flex-row gap-10">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-6 shrink-0 md:w-56">
               <div className="w-48 h-48 rounded-full border-4 border-slate-50 flex items-center justify-center bg-slate-100 overflow-hidden relative group shadow-xl shadow-slate-200/50">
                  {avatarPreview ? (
                     <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <UserIcon className="w-20 h-20 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     <Upload className="w-8 h-8 text-white mb-2" />
                     <span className="text-white text-xs font-bold uppercase tracking-wider">Subir Foto</span>
                     <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
                  </div>
               </div>
               <div className="text-center">
                 <h3 className="text-xl font-black text-slate-800">{name || "Usuario Ejecutivo"}</h3>
                 <span className="inline-block mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full">{tier}</span>
               </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-8">
               
               {/* Contact Block */}
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Datos Personales</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">Mi Nombre</label>
                       <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Agrega tu nombre" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">Fecha de Nacimiento</label>
                       <div className="relative">
                         <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                         <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 transition-all shadow-sm" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">Correo Electrónico (Login)</label>
                       <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">WhatsApp Registrado</label>
                       <div className="relative">
                         <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                         <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 Dígitos" className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 transition-all shadow-sm" />
                       </div>
                    </div>
                 </div>
               </div>

               {/* Agency Block */}
               <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Personalización de Agencia</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">Nombre Comercial (Agencia)</label>
                       <input type="text" value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="Ej. Grupo Hurtado Inmobiliaria" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 transition-all shadow-sm" />
                       <p className="text-[11px] text-slate-400 font-medium mt-1">Este nombre identificará a tu ecosistema completo. (Independiente a tu Razón Social SAT).</p>
                    </div>
                 </div>
               </div>
               
               {/* Security Block */}
               <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-orange-400 mb-6 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Seguridad</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">Cambiar Contraseña</label>
                       <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="•••••••••••• (Dejar en blanco para conservar actual)" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800 transition-all shadow-sm" />
                    </div>
                 </div>
               </div>

               <div className="pt-2 flex justify-end">
                  <button onClick={handleSave} disabled={isSaving} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Actualizando...' : 'Guardar y Aplicar Cambios'}
                  </button>
               </div>
            </div>

         </div>
      </div>

      {/* Subscription Banner */}
      {tradeName && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-12 flex items-center border border-indigo-500/50">
          <div className="absolute right-0 top-0 opacity-10">
            <Sparkles className="w-64 h-64 text-white translate-x-1/4 -translate-y-1/4" />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="text-white font-black text-2xl tracking-tight mb-1">
              Ambiente FacturaPro Exclusivo para <span className="text-indigo-200">{tradeName}</span>
            </h3>
            <p className="text-indigo-100/80 font-medium text-sm">
              Tu agencia se encuentra operando bajo el licenciamiento <strong>{tier}</strong> de nuestra plataforma.
            </p>
          </div>
          <div className="relative z-10 shrink-0 hidden md:block">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20 shadow-inner text-white font-black text-3xl">
              {tradeName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
