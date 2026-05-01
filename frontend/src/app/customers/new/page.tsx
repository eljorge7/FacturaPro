"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Info, Check, ChevronsUpDown, Phone, Mail, Building2, MessageCircle, FileText, ChevronDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function NewCustomerPage() {
  const router = useRouter();
  const { tenantId: activeTenantId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [customerType, setCustomerType] = useState('empresarial');
  const [activeTab, setActiveTab] = useState('otros');

  // Form State
  const [formData, setFormData] = useState({
    saludo: '',
    firstName: '',
    lastName: '',
    companyName: '',
    displayName: '',
    email: '',
    phonePrefixWork: '+52',
    phoneWork: '',
    phonePrefixMobile: '+52',
    phoneMobile: '',
    language: 'español',
    communicationEmail: true,
    communicationWhatsapp: false,
    
    // TAB: Otros detalles
    tratamientoIva: '',
    rfc: '',
    regimenFiscal: '',
    tdsEnabled: false,
    currency: 'MXN',
    terms: 'reception',
    portalEnabled: false,
    zipCode: '',
    street: '',
    city: '',
    state: '',
  });

  // Autocompletado de Código Postal
  useEffect(() => {
     const zip = formData.zipCode.trim();
     if (zip.length === 5) {
        fetch(`https://api.zippopotam.us/mx/${zip}`)
          .then(res => res.json())
          .then(data => {
             if (data && data.places && data.places.length > 0) {
                 const place = data.places[0];
                 setFormData(prev => ({
                     ...prev,
                     city: place['place name'],
                     state: place['state']
                 }));
             }
          })
          .catch(() => {}); // Si falla o no existe, ignorar silenciosamente
     }
  }, [formData.zipCode]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';

      // Unir nombres para crear legalName en la BD actual
      const legalName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();
      const finalDisplayName = formData.displayName || legalName || 'Cliente Sin Nombre';

      let finalPhone = '';
      if (formData.phoneMobile) finalPhone = `${formData.phonePrefixMobile} ${formData.phoneMobile}`.trim();
      else if (formData.phoneWork) finalPhone = `${formData.phonePrefixWork} ${formData.phoneWork}`.trim();

      const payload: any = {
        tenantId: activeTenantId,
        legalName: legalName || 'Cliente Sin Nombre',
        rfc: formData.rfc || 'XAXX010101000',
        phone: finalPhone,
        taxRegime: formData.regimenFiscal || '601',
        zipCode: formData.zipCode || '00000',
        street: formData.street,
        city: formData.city,
        state: formData.state,
        tdsEnabled: formData.tdsEnabled,
        portalEnabled: formData.portalEnabled,
      };

      if (formData.email && formData.email.trim() !== '') {
         payload.email = formData.email.trim();
      }

      // Limpiar propiedades vacías para no chocar con NestJS schema
      Object.keys(payload).forEach(key => {
         if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
             delete payload[key];
         }
      });

      const response = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
         router.push('/customers');
      } else {
         const errText = await response.text();
         alert(`Error del backend:\n${errText}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error catch principal:\n${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const computedLegalName = formData.companyName || `${formData.firstName} ${formData.lastName}`.trim();

  return (
    <div className="font-sans min-h-screen bg-[#f9fafb] flex flex-col pb-24">
      
      {/* Header Fijo */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Nuevo Cliente</h1>
            <p className="text-xs text-slate-500">Añada los datos fiscales y de contacto principales.</p>
          </div>
        </div>
        <div className="flex gap-3">
           <Link href="/customers" className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm">
             Cancelar
           </Link>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
           >
             {isSaving ? <span className="animate-pulse">Guardando...</span> : <><Save className="w-4 h-4"/> Guardar</>}
           </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full mt-8 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
         
         <div className="p-8 border-b border-slate-100 space-y-8">
            
            {/* Fila 1: Tipo de Cliente */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-1 group cursor-pointer w-max">
                 Tipo de cliente <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
               </label>
               <div className="flex items-center gap-6">
                 <label className="flex items-center gap-2 cursor-pointer group">
                   <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${customerType === 'empresarial' ? 'border-[#2563eb] bg-[#2563eb]' : 'border-slate-300 group-hover:border-blue-400'}`}>
                     {customerType === 'empresarial' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                   </div>
                   <span className="text-sm font-medium text-slate-700">Empresarial</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                   <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${customerType === 'individuo' ? 'border-[#2563eb] bg-[#2563eb]' : 'border-slate-300 group-hover:border-blue-400'}`}>
                     {customerType === 'individuo' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                   </div>
                   <span className="text-sm font-medium text-slate-700">Individuo</span>
                 </label>
               </div>
            </div>

            {/* Fila 2: Contacto Principal */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-1 mt-3">
                 Contacto principal <Info className="w-3.5 h-3.5 text-slate-400" />
               </label>
               <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                     <select value={formData.saludo} onChange={e=>setFormData({...formData, saludo: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer">
                        <option value="">Saludo</option>
                        <option value="Sr.">Sr.</option>
                        <option value="Sra.">Sra.</option>
                        <option value="Srita.">Srita.</option>
                        <option value="Dr.">Dr.</option>
                     </select>
                     <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                  <input type="text" placeholder="Nombre de pila" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                  <input type="text" placeholder="Apellido" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
               </div>
            </div>

            {/* Fila 3: Empresa */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
               <label className="text-sm font-semibold text-slate-700">Nombre de la empresa</label>
               <input type="text" value={formData.companyName} onChange={e=>setFormData({...formData, companyName: e.target.value})} className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
            </div>

            {/* Fila 4: Visualización */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
               <label className="text-sm font-semibold text-slate-700">Nombre de visualización <span className="text-red-500">*</span></label>
               <div className="relative max-w-md w-full">
                  <select value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className={`w-full appearance-none bg-white border ${formData.displayName ? 'border-slate-200' : 'border-red-300'} rounded-lg px-4 py-2.5 text-sm focus:outline-none ${formData.displayName ? 'focus:border-blue-500' : 'focus:border-red-500'} font-medium text-slate-700 shadow-sm cursor-pointer`}>
                     <option value="">Seleccione o escriba para agregar</option>
                     {computedLegalName && <option value={computedLegalName}>{computedLegalName}</option>}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
               </div>
            </div>

            {/* Fila 5: Correo */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                 Dirección de correo <Info className="w-3.5 h-3.5 text-slate-400" />
               </label>
               <div className="relative max-w-md w-full">
                 <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
                 <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
               </div>
            </div>

            {/* Fila 6: Teléfono */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                 Teléfono <Info className="w-3.5 h-3.5 text-slate-400" />
               </label>
               <div className="flex gap-4 max-w-md w-full">
                  <div className="flex w-1/2">
                     <select value={formData.phonePrefixWork} onChange={e=>setFormData({...formData, phonePrefixWork: e.target.value})} className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-lg px-2 py-2.5 text-sm font-medium text-slate-600 focus:outline-none cursor-pointer">
                        <option value="+52">+52(MX)</option>
                        <option value="+1">+1(US)</option>
                        <option value="+34">+34</option>
                        <option value="+54">+54</option>
                        <option value="+57">+57</option>
                     </select>
                     <input type="text" placeholder="Teléfono laboral" value={formData.phoneWork} onChange={e=>setFormData({...formData, phoneWork: e.target.value})} className="w-full bg-white border border-slate-200 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                  </div>
                  <div className="flex w-1/2">
                     <select value={formData.phonePrefixMobile} onChange={e=>setFormData({...formData, phonePrefixMobile: e.target.value})} className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-lg px-2 py-2.5 text-sm font-medium text-slate-600 focus:outline-none cursor-pointer">
                        <option value="+52">+52(MX)</option>
                        <option value="+1">+1(US)</option>
                        <option value="+34">+34</option>
                        <option value="+54">+54</option>
                        <option value="+57">+57</option>
                     </select>
                     <input type="text" placeholder="Móvil" value={formData.phoneMobile} onChange={e=>setFormData({...formData, phoneMobile: e.target.value})} className="w-full bg-white border border-slate-200 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                  </div>
               </div>
            </div>

            {/* Fila 7: Canales de comunicación */}
            <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
               <label className="text-sm font-semibold text-slate-700 pt-1">
                 Canales de comunicación
               </label>
               <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${formData.communicationEmail ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                        {formData.communicationEmail && <Check className="w-3 h-3 text-white stroke-[3]"/>}
                     </div>
                     <span className="text-sm font-medium text-slate-700">Correo electrónico</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${formData.communicationWhatsapp ? 'bg-[#10b981] border-[#10b981]' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}>
                        {formData.communicationWhatsapp && <Check className="w-3 h-3 text-white stroke-[3]"/>}
                     </div>
                     <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><MessageCircle className="w-4 h-4 text-emerald-500"/> WhatsApp</span>
                  </label>
               </div>
            </div>
         </div>

         {/* Pestañas Inferiores */}
         <div className="bg-white">
            <div className="flex border-b border-slate-200 px-8 pt-2">
               <button onClick={()=>setActiveTab('otros')} className={`pb-3 px-2 mr-8 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'otros' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Otros detalles
               </button>
               <button onClick={()=>setActiveTab('direccion')} className={`pb-3 px-2 mr-8 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'direccion' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Dirección <span className="text-red-500">*</span>
               </button>
               <button onClick={()=>setActiveTab('contacto')} className={`pb-3 px-2 mr-8 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacto' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Personas de contacto
               </button>
               <button onClick={()=>setActiveTab('campos')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'campos' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Campos personalizados
               </button>
            </div>

            <div className="p-8">
               {activeTab === 'otros' && (
                  <div className="space-y-6 max-w-2xl">
                     <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
                        <label className="text-sm font-semibold text-slate-700">Tratamiento del IVA <span className="text-red-500">*</span></label>
                        <div className="relative">
                           <select value={formData.tratamientoIva} onChange={e=>setFormData({...formData, tratamientoIva: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer">
                              <option value="">Seleccionar</option>
                              <option value="Nacional">Nacional (Dentro de México)</option>
                              <option value="Extranjero">Extranjero</option>
                           </select>
                           <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
                        <label className="text-sm font-semibold text-slate-700 mt-2">RFC (Registro Federal de Contribuyentes) <span className="text-red-500">*</span></label>
                        <div>
                           <input type="text" value={formData.rfc} onChange={e=>setFormData({...formData, rfc: e.target.value})} placeholder="Escriba el número de registro" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium uppercase font-mono" />
                           <button type="button" onClick={() => setFormData({...formData, rfc: 'XAXX010101000'})} className="text-[#2563eb] text-xs font-medium mt-1.5 hover:underline">Pre-rellenar el RFC genérico</button>
                        </div>
                     </div>

                     <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
                        <label className="text-sm font-semibold text-slate-700">Régimen fiscal <span className="text-red-500">*</span></label>
                        <div className="relative">
                           <select value={formData.regimenFiscal} onChange={e=>setFormData({...formData, regimenFiscal: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer">
                              <option value="">Seleccionar</option>
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
                              <option value="626">626 - Régimen Simplificado de Confianza</option>
                           </select>
                           <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     <div className="border-t border-slate-100 my-4 pt-6 grid grid-cols-[200px_1fr] gap-6 items-center">
                        <label className="text-sm font-semibold text-slate-700">Impuesto retenido en origen</label>
                        <div className="flex items-center gap-2 cursor-pointer group w-max" onClick={() => setFormData({...formData, tdsEnabled: !formData.tdsEnabled})}>
                           <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${formData.tdsEnabled ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                              {formData.tdsEnabled && <Check className="w-3 h-3 text-white stroke-[3]"/>}
                           </div>
                           <span className="text-sm font-medium text-slate-700 select-none">Habilitar TDS para este cliente</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
                        <label className="text-sm font-semibold text-slate-700">Moneda</label>
                        <div className="relative">
                           <select value={formData.currency} onChange={e=>setFormData({...formData, currency: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 cursor-pointer">
                              <option value="MXN">MXN - Mexican Peso</option>
                              <option value="USD">USD - US Dollar</option>
                              <option value="EUR">EUR - Euro</option>
                           </select>
                           <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                     </div>

                     <div className="grid grid-cols-[200px_1fr] gap-6 items-center">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">Habilitar el portal? <Info className="w-3.5 h-3.5 text-slate-400"/></label>
                        <div className="flex items-center gap-2 cursor-pointer group w-max" onClick={() => setFormData({...formData, portalEnabled: !formData.portalEnabled})}>
                           <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${formData.portalEnabled ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                              {formData.portalEnabled && <Check className="w-3 h-3 text-white stroke-[3]"/>}
                           </div>
                           <span className="text-sm font-medium text-slate-700 select-none">Permitir que el cliente acceda al portal</span>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'direccion' && (
                  <div className="space-y-6 max-w-2xl animate-in fade-in">
                     
                     <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-6">
                        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Dirección de facturación</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2 space-y-2">
                              <label className="text-sm font-bold text-slate-700">Calle y número</label>
                              <input type="text" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} placeholder="Ej. Av. Reforma 222 Int 3" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Código postal <span className="text-red-500">*</span></label>
                              <input type="text" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} placeholder="Código Postal (Ej. 06600)" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                              <p className="text-xs text-slate-500">Crucial para la emisión del CFDI 4.0</p>
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Ciudad</label>
                              <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Ej. Navojoa" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Estado / Provincia</label>
                              <input type="text" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Ej. Sonora" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-medium" />
                           </div>
                        </div>

                     </div>

                  </div>
               )}

               {activeTab !== 'otros' && activeTab !== 'direccion' && (
                  <div className="py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                     <FileText className="w-10 h-10 mb-2 opacity-50" />
                     <p className="font-medium text-sm">Contenido en construcción para la pestaña: {activeTab}</p>
                  </div>
               )}

            </div>
         </div>
      </div>
    </div>
  );
}
