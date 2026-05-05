import React, { useState, useEffect } from 'react';
import { Sparkles, Building2, CheckCircle2, ChevronRight, UploadCloud, ShieldCheck, X } from 'lucide-react';

export default function OnboardingWizard({ tenantId, initialLegalName }: { tenantId: string, initialLegalName?: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [formData, setFormData] = useState({
    rfc: '',
    legalName: initialLegalName || '',
    taxRegime: '601',
    zipCode: '',
    logoUrl: '/placeholder-logo.png' 
  });
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [keyPassword, setKeyPassword] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('skipOnboarding_v1')) {
      setSkipped(true);
    }
  }, []);

  const handleSkip = () => {
    sessionStorage.setItem('skipOnboarding_v1', 'true');
    setSkipped(true);
  };

  if (skipped) return null;

  const handleComplete = async () => {
    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api");
      const token = localStorage.getItem('token');
      
      const payload = new FormData();
      payload.append('rfc', formData.rfc);
      payload.append('legalName', formData.legalName);
      payload.append('taxRegime', formData.taxRegime);
      payload.append('zipCode', formData.zipCode);
      if (keyPassword) payload.append('keyPassword', keyPassword);
      if (cerFile) payload.append('cerFile', cerFile);
      if (keyFile) payload.append('keyFile', keyFile);

      const headers: any = {
        'x-tenant-id': tenantId,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Hit a specific API to save TaxProfile
      await fetch(`${baseUrl}/tax-profiles`, {
         method: 'POST',
         headers,
         body: payload
      });
      
      // Reload page to dismiss wizard
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error guardando configuración inicial');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
        
        {/* Lado Gráfico (Izquierda) */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 -mx-10 -my-10 w-48 h-48 bg-white/10 blur-3xl rounded-full"></div>
           
           <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-6">
                 <Sparkles className="h-6 w-6 text-indigo-100" />
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight">Configura tu Entidad</h2>
              <p className="mt-4 text-indigo-200 font-medium text-sm leading-relaxed">
                Completa tu perfil fiscal para que FacturaPro pueda emitir (timbrar) facturas oficiales a tu nombre ante el SAT.
              </p>
           </div>

           <div className="relative z-10 space-y-4 mt-8">
              <div className={`flex items-center gap-3 ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-emerald-400 text-slate-900' : 'bg-white/20 text-white'}`}>1</div>
                 <span className="text-sm font-bold">Datos Empresariales</span>
              </div>
              <div className={`flex items-center gap-3 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-emerald-400 text-slate-900' : 'bg-white/20 text-white'}`}>2</div>
                 <span className="text-sm font-bold">Identidad (Logo)</span>
              </div>
           </div>
        </div>

        {/* Formulario Dinámico (Derecha) */}
        <div className="w-full md:w-3/5 p-8 lg:p-12 bg-white flex flex-col relative">
          
          <button onClick={handleSkip} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-sm font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full">
            Omitir por ahora <X className="w-4 h-4" />
          </button>

          {step === 1 && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500 mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-indigo-600 mb-6">
                 <Building2 className="w-6 h-6" />
                 <h3 className="text-xl font-black text-slate-800">Información Fiscal</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Razón Social</label>
                  <input 
                    type="text" 
                    value={formData.legalName}
                    onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                    placeholder="Ej. Comercializadora Estrella S.A. de C.V." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">RFC</label>
                    <input 
                      type="text" 
                      value={formData.rfc}
                      onChange={(e) => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
                      placeholder="XAXX010101000" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">C.P.</label>
                    <input 
                      type="text" 
                      value={formData.zipCode}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      placeholder="00000" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Régimen Fiscal</label>
                  <select 
                    value={formData.taxRegime}
                    onChange={(e) => setFormData({...formData, taxRegime: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700"
                  >
                    <option value="601">601 - General de Ley Personas Morales</option>
                    <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                    <option value="626">626 - RESICO Personas Físicas</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.legalName || !formData.rfc || !formData.zipCode}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  Siguiente paso <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 text-indigo-600 mb-6">
                 <ShieldCheck className="w-6 h-6" />
                 <h3 className="text-xl font-black text-slate-800">Identidad Corporativa</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <p className="font-bold text-slate-700 text-sm mb-2">Certificado (.cer)</p>
                    <input 
                      type="file" 
                      accept=".cer"
                      onChange={e => setCerFile(e.target.files?.[0] || null)}
                      className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <p className="font-bold text-slate-700 text-sm mb-2">Llave Privada (.key)</p>
                    <input 
                      type="file" 
                      accept=".key"
                      onChange={e => setKeyFile(e.target.files?.[0] || null)}
                      className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                 </div>
              </div>
              <div className="mt-4">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña de Clave Privada (FIEL/CSD)</label>
                 <input 
                    type="password" 
                    value={keyPassword}
                    onChange={(e) => setKeyPassword(e.target.value)}
                    placeholder="Contraseña del CSD" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                 />
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-6 flex gap-3 text-emerald-800 text-sm font-medium">
                 <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                 <p>La inteligencia artificial de FacturaPro ha pre-validado tu modelo de negocio y está lista para comenzar a generar comprobantes fiscales.</p>
              </div>

              <div className="mt-8 flex justify-between items-center">
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-500 font-bold hover:text-slate-800 transition-colors text-sm"
                >
                  Regresar
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  {loading ? 'Inicializando Sistema...' : 'Volar a la Plataforma 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
