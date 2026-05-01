"use client";

import { UploadCloud, Key, ShieldCheck, FileKey, AlertCircle, Plus, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function TaxesSettingsPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [keyPassword, setKeyPassword] = useState("");
  
  const [cerBase64, setCerBase64] = useState<string>("");
  const [keyBase64, setKeyBase64] = useState<string>("");

  const [fielCerFile, setFielCerFile] = useState<File | null>(null);
  const [fielKeyFile, setFielKeyFile] = useState<File | null>(null);
  const [fielPassword, setFielPassword] = useState("");
  const [fielCerBase64, setFielCerBase64] = useState<string>("");
  const [fielKeyBase64, setFielKeyBase64] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/tenants`);
        const tenants = await res.json();
        
        if (tenants && tenants.length > 0) {
          const mainTenant = tenants[0];
          setTenantId(mainTenant.id);
          
          if (mainTenant.taxProfiles && mainTenant.taxProfiles.length > 0) {
             const tp = mainTenant.taxProfiles[0];
             setProfileId(tp.id);
             setCerBase64(tp.cerBase64 || "");
             setKeyBase64(tp.keyBase64 || "");
             setFielCerBase64(tp.fielCerBase64 || "");
             setFielKeyBase64(tp.fielKeyBase64 || "");
             // Password is usually empty for security
          }
        }
      } catch (error) {
        console.error("Error al cargar tenant", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnv();
  }, []);

  const handleCerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCerFile(file);
      const reader = new FileReader();
      reader.onload = () => {
         const base64String = (reader.result as string).replace(/^data:(.*,)?/, '');
         setCerBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setKeyFile(file);
      const reader = new FileReader();
      reader.onload = () => {
         const base64String = (reader.result as string).replace(/^data:(.*,)?/, '');
         setKeyBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFielCerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFielCerFile(file);
      const reader = new FileReader();
      reader.onload = () => {
         const base64String = (reader.result as string).replace(/^data:(.*,)?/, '');
         setFielCerBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFielKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFielKeyFile(file);
      const reader = new FileReader();
      reader.onload = () => {
         const base64String = (reader.result as string).replace(/^data:(.*,)?/, '');
         setFielKeyBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
     if (!tenantId) {
        alert("Primero debes crear un Perfil de Empresa en la pestaña anterior.");
        return;
     }

     setIsSaving(true);
     try {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const payload = {
           tenantId,
           cerBase64,
           keyBase64,
           keyPassword,
           fielCerBase64,
           fielKeyBase64,
           fielPassword,
           // Default values if no profile existed yet
           rfc: "PENDIENTE",
           legalName: "PENDIENTE", 
           taxRegime: "601",
           zipCode: "00000"
        };

        if (!profileId) {
           const res = await fetch(`${baseUrl}/tax-profiles`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
           });
           const newProfile = await res.json();
           setProfileId(newProfile.id);
        } else {
           await fetch(`${baseUrl}/tax-profiles/${profileId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cerBase64, keyBase64, keyPassword, fielCerBase64, fielKeyBase64, fielPassword })
           });
        }
        alert("Bóveda fiscal actualizada con éxito.");
        setKeyPassword("");
     } catch (err) {
        console.error(err);
        alert("Error al intentar guardar los sellos.");
     } finally {
        setIsSaving(false);
     }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div className="flex pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identidad Criptográfica Fiscal</h2>
          <p className="text-slate-500 font-medium mt-1">
            Sube tus Archivos Seguros (.cer y .key) para dotar de legalidad al sistema ante el SAT.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Panel CSD */}
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            {!cerBase64 && !keyBase64 ? (
               <>
                 <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">CSD (Facturación)</h3>
                 <p className="text-slate-500 text-sm font-medium max-w-sm mb-6 leading-relaxed">
                    Sube tu Certificado de Sello Digital (CSD). Exclusivo para timbrar CFDI 4.0.
                 </p>
               </>
            ) : (
               <>
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">CSD Almacenado</h3>
                 <p className="text-slate-500 text-sm font-medium max-w-sm mb-6 leading-relaxed">
                    Sellos cargados exitosamente de forma encriptada.
                 </p>
               </>
            )}

            <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CSD File Upload */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileKey className="w-3.5 h-3.5 text-emerald-500" />
                        CSD (.cer)
                     </label>
                     <div className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-colors ${cerFile || cerBase64 ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-emerald-500'}`}>
                        <div className="flex items-center gap-2 p-3">
                           <UploadCloud className={`w-4 h-4 transition-colors ${cerFile || cerBase64 ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                           <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate text-slate-600">
                                 {cerFile ? cerFile.name : (cerBase64 ? "CSD Subido" : "Haz clic para subir .cer")}
                              </span>
                           </div>
                        </div>
                        <input type="file" accept=".cer" onChange={handleCerChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>

                  {/* Private Key File Upload */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        Llave CSD (.key)
                     </label>
                     <div className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-colors ${keyFile || keyBase64 ? 'border-amber-500 bg-amber-50/30' : 'border-slate-200 bg-white hover:border-amber-500'}`}>
                        <div className="flex items-center gap-2 p-3">
                           <UploadCloud className={`w-4 h-4 transition-colors ${keyFile || keyBase64 ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500'}`} />
                           <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate text-slate-600">
                                 {keyFile ? keyFile.name : (keyBase64 ? "Llave Subida" : "Haz clic para subir .key")}
                              </span>
                           </div>
                        </div>
                        <input type="file" accept=".key" onChange={handleKeyChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
               </div>

               <div className="space-y-2 relative pb-1">
                  <label className="text-xs font-bold text-slate-700">Contraseña de Clave CSD</label>
                  <input type="password" value={keyPassword} onChange={e => setKeyPassword(e.target.value)} placeholder="••••••••••••••" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800" />
               </div>

               <div className="pt-2 flex justify-end">
                  <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                    Guardar y Validar CSD
                  </button>
               </div>
            </div>
        </div>

        {/* Panel FIEL */}
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            {!fielCerBase64 && !fielKeyBase64 ? (
               <>
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">FIEL (Bóveda SAT)</h3>
                 <p className="text-slate-500 text-sm font-medium max-w-sm mb-6 leading-relaxed">
                    Sube tu Firma Electrónica Avanzada (FIEL). Exclusiva para conectarse y descargar XMLs masivamente ("Bóveda SAT").
                 </p>
               </>
            ) : (
               <>
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800 mb-2">FIEL Almacenada</h3>
                 <p className="text-slate-500 text-sm font-medium max-w-sm mb-6 leading-relaxed">
                    Tu eFirma está configurada y lista para descargar XMLs autómaticamente en la Bóveda SAT.
                 </p>
               </>
            )}

            <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIEL File Upload */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileKey className="w-3.5 h-3.5 text-indigo-500" />
                        FIEL (.cer)
                     </label>
                     <div className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-colors ${fielCerFile || fielCerBase64 ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-indigo-500'}`}>
                        <div className="flex items-center gap-2 p-3">
                           <UploadCloud className={`w-4 h-4 transition-colors ${fielCerFile || fielCerBase64 ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                           <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate text-slate-600">
                                 {fielCerFile ? fielCerFile.name : (fielCerBase64 ? "FIEL Subida" : "Haz clic para subir .cer")}
                              </span>
                           </div>
                        </div>
                        <input type="file" accept=".cer" onChange={handleFielCerChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>

                  {/* Private Key File Upload */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                        Llave FIEL (.key)
                     </label>
                     <div className={`relative group cursor-pointer overflow-hidden rounded-xl border transition-colors ${fielKeyFile || fielKeyBase64 ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-indigo-500'}`}>
                        <div className="flex items-center gap-2 p-3">
                           <UploadCloud className={`w-4 h-4 transition-colors ${fielKeyFile || fielKeyBase64 ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                           <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate text-slate-600">
                                 {fielKeyFile ? fielKeyFile.name : (fielKeyBase64 ? "Llave Subida" : "Haz clic para subir .key")}
                              </span>
                           </div>
                        </div>
                        <input type="file" accept=".key" onChange={handleFielKeyChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
               </div>

               <div className="space-y-2 relative pb-1">
                  <label className="text-xs font-bold text-slate-700">Contraseña de Clave FIEL</label>
                  <input type="password" value={fielPassword} onChange={e => setFielPassword(e.target.value)} placeholder="••••••••••••••" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800" />
               </div>

               <div className="bg-amber-50/50 p-3 border border-amber-100 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                     Esta e.Firma tiene permisos amplios ante el SAT. FacturaPro solo la utiliza temporalmente para recuperar tus comprobantes hacia la BD y nunca la usa para timbrar.
                  </p>
               </div>

               <div className="pt-2 flex justify-end">
                  <button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                    Guardar y Validar FIEL
                  </button>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
}
