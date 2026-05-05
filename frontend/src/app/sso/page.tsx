"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, MailWarning } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function SsoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const processSso = async () => {
       const token = searchParams.get("token");
       if (!token) {
          setErrorMsg("No se proporcionó un token de acceso seguro.");
          return;
       }

       try {
           const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
           const res = await fetch(`${baseUrl}/auth/profile`, {
               headers: { 'Authorization': `Bearer ${token}` }
           });

           if (!res.ok) {
               const errData = await res.json().catch(() => ({}));
               throw new Error(errData.message || `HTTP ${res.status} al solicitar perfil`);
           }

           const user = await res.json();
           
           // Extraer TenantId del usuario o del token manual. 
           // Normalmente el endpoint /profile devuelve { id, name, email, ... } pero la sesión depende del tenant que nos dio `auth.service.ts sso()`
           // Inyectamos todo en AuthProvider.
           let payloadTenantId = "";
           try {
              const payloadStr = atob(token.split('.')[1]);
              payloadTenantId = JSON.parse(payloadStr).tenantId;
           } catch(e) {}

           login(token, payloadTenantId, user); // Esto hace el push a /dashboard
       } catch (err: any) {
           setErrorMsg(`Fallo de conexión: ${err.message}. Intentaremos forzar la sesión básica...`);
           console.error("SSO Profile Fetch Error:", err);
           
           // Fallback: Si falló obtener el profile, intentamos inyectarlo forzosamente para que pueda entrar al Dashboard
           setTimeout(() => {
              let payloadTenantId = "";
              let payloadUserId = "admin";
              let payloadEmail = "auto";
              try {
                 const payloadStr = atob(token.split('.')[1]);
                 const payload = JSON.parse(payloadStr);
                 payloadTenantId = payload.tenantId;
                 payloadUserId = payload.userId;
                 payloadEmail = payload.email;
              } catch(e) {}
              
              if (payloadTenantId) {
                  login(token, payloadTenantId, { id: payloadUserId, email: payloadEmail, name: payloadEmail.split('@')[0], role: 'OWNER' });
              }
           }, 3000);
       }
    };

    processSso();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("token")]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 flex flex-col items-center justify-center text-white p-4 text-center">
       <div className="bg-white/10 p-6 rounded-full mb-6 relative shadow-2xl backdrop-blur-sm border border-indigo-500/30">
          {errorMsg ? (
              <MailWarning className="w-12 h-12 text-red-400" />
          ) : (
              <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
          )}
          {!errorMsg && <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin-slow"></div>}
       </div>
       <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-2">
           <ShieldCheck className="w-8 h-8 text-indigo-400" /> FacturaPro SSO
       </h1>
       {errorMsg ? (
           <p className="text-red-300 font-medium max-w-md">{errorMsg}</p>
       ) : (
           <p className="text-indigo-200 font-medium">Autenticando de forma segura... Preparando tu ecosistema.</p>
       )}
    </div>
  );
}

export default function SsoPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-indigo-900 flex items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
       </div>
    }>
      <SsoContent />
    </Suspense>
  );
}
