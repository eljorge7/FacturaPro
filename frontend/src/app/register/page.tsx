"use client";

import { useState } from "react";
import { UserPlus, ArrowRight, Mail, Lock, Building, FileText, Phone, MessageSquareText, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", legalName: "", tradeName: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al solicitar OTP");

      setStep(2); // Go to OTP verification step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, code: otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Código inválido / Error al verificar");

      login(data.token, data.tenantId, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 absolute inset-0 z-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30">
             {step === 1 ? <UserPlus className="w-8 h-8 text-white" /> : <MessageSquareText className="w-8 h-8 text-white" />}
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
          {step === 1 ? "Crea tu cuenta institucional" : "Verifica tu Identidad"}
        </h2>
        {step === 1 ? (
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            O <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-bold transition">inicia sesión si ya tienes una</Link>
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            Hemos enviado un código a tu WhatsApp <br className="hidden sm:block"/> <b className="text-slate-800">{form.phone}</b>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-3xl border border-slate-100 sm:px-12 relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
          
          {step === 1 ? (
            <form className="space-y-6 relative z-10" onSubmit={handleRequestOtp}>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold shadow-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">Tu Nombre de Usuario</label>
                    <div className="mt-2 relative">
                      <input
                        type="text" required
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                        placeholder="Juan Pérez"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700">Celular (WhatsApp)</label>
                    <div className="mt-2 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="tel" required minLength={10} maxLength={10}
                        value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})}
                        className="appearance-none block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                        placeholder="10 dígitos"
                      />
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Razón Social Legal (SAT)</label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text" required
                      value={form.legalName} onChange={e => setForm({...form, legalName: e.target.value})}
                      className="appearance-none block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                      placeholder="Tech Solutions S.A. de C.V."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Nombre Comercial (Agencia)</label>
                  <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text" required
                      value={form.tradeName} onChange={e => setForm({...form, tradeName: e.target.value})}
                      className="appearance-none block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                      placeholder="Agencia Tech (Público)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">Correo Electrónico</label>
                    <div className="mt-2 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email" required
                        value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        className="appearance-none block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700">Contraseña Segura</label>
                    <div className="mt-2 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="password" required minLength={6}
                        value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                        className="appearance-none block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Validando datos...</> : 'Continuar al Paso 2'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6 relative z-10 py-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold shadow-sm">
                  {error}
                </div>
              )}
              <div className="text-center">
                 <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-slate-800">Pin de Seguridad</h3>
                 <p className="text-slate-500 text-sm mt-1">Ingresa el código de 6 dígitos enviado por WhatsApp a tu línea.</p>
              </div>

              <div>
                <div className="mt-6 relative flex justify-center">
                  <input
                    type="text" required minLength={6} maxLength={6}
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                    className="block w-full max-w-[240px] text-center px-4 py-4 text-3xl tracking-[1em] border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow font-black text-slate-900 bg-slate-50 focus:bg-white"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Verificando Infraestructura...</> : 'Completar Registro'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="w-full mt-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Regresar para editar mis datos
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
