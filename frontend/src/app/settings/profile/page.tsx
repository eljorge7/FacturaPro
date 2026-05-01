"use client";

import { Upload, Save, Building, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProfileSettingsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rfc, setRfc] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar el primer tenant y su tax profile (Simulando un multi-tenant environment para GH)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
        const res = await fetch(`${baseUrl}/tenants`);
        const tenants = await res.json();
        
        if (tenants && tenants.length > 0) {
          const mainTenant = tenants[0];
          setTenantId(mainTenant.id);
          setName(mainTenant.name);
          
          if (mainTenant.taxProfiles && mainTenant.taxProfiles.length > 0) {
             const tp = mainTenant.taxProfiles[0];
             setRfc(tp.rfc);
             setLegalName(tp.legalName);
             setTaxRegime(tp.taxRegime);
          }
        }
      } catch (error) {
        console.error("No se pudo cargar el perfil", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
       const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
       // Primero actualizamos o creamos el Tenant
       let currentTenantId = tenantId;
       if (!currentTenantId) {
          const tRes = await fetch(`${baseUrl}/tenants`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ name: name || "Nueva Empresa" })
          });
          const newTenant = await tRes.json();
          currentTenantId = newTenant.id;
          setTenantId(newTenant.id);
       } else {
          await fetch(`${baseUrl}/tenants/${currentTenantId}`, {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ name })
          });
       }

       // Obtenemos el ID del TaxProfile existente (si lo hay) para actualizarlo
       const taxProfilesRes = await fetch(`${baseUrl}/tax-profiles`);
       const taxProfiles = await taxProfilesRes.json();
       const existingProfile = taxProfiles.find((tp: any) => tp.tenantId === currentTenantId);

       const taxData = {
          tenantId: currentTenantId,
          legalName: legalName || undefined,
          rfc: rfc || undefined,
          taxRegime: taxRegime || undefined
       };

       if (existingProfile) {
          await fetch(`${baseUrl}/tax-profiles/${existingProfile.id}`, {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(taxData)
          });
       } else {
          await fetch(`${baseUrl}/tax-profiles`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ ...taxData, zipCode: '00000' }) // zipCode is required in DB schema probably
          });
       }

       alert("Perfil guardado exitosamente en Postgres.");
    } catch (error) {
       console.error("Error al guardar", error);
       alert("Ocurrió un error al guardar");
    } finally {
       setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Perfil de Empresa</h2>
        <p className="text-slate-500 font-medium mt-1">
          Información general de tu organización.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
         <div className="flex flex-col md:flex-row gap-10">
            
            <div className="flex flex-col items-center gap-4 shrink-0">
               <div className="w-40 h-40 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 group hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden">
                  <Building className="w-10 h-10 mb-2 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs font-bold px-4 text-center group-hover:text-blue-600">Subir Logotipo</span>
               </div>
            </div>

            <div className="flex-1 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Nombre Público</label>
                     <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Grupo Hurtado" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Razón Social Exacta (SAT)</label>
                     <input type="text" value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="HURTADO ADMINISTRADORES SA DE CV" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800" />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">R.F.C.</label>
                     <input type="text" value={rfc} onChange={e => setRfc(e.target.value.toUpperCase())} placeholder="HUAJ9203102Q1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 uppercase" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700">Régimen Fiscal</label>
                     <select value={taxRegime} onChange={e => setTaxRegime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 appearance-none">
                        <option value="">Selecciona un Régimen...</option>
                        <option value="601">601 - General de Ley Personas Morales</option>
                        <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                        <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                     </select>
                  </div>

               </div>

               <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
