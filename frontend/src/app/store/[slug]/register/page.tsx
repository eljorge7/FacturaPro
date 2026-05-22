"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Building2, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

export default function StoreRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string || "default";
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/public-store/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Ocurrió un error al enviar la solicitud.");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">¡Solicitud Enviada!</h2>
          <p className="text-slate-600 mb-8">
            Hemos recibido tus datos. Para mantener la exclusividad y los mejores precios, un administrador revisará tu cuenta en breve. Te notificaremos cuando esté activa.
          </p>
          <Link href={`/store/${slug}`} className="inline-flex h-12 items-center justify-center bg-blue-600 text-white font-bold rounded-xl w-full hover:bg-blue-700 transition-colors">
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Lado Izquierdo - Branding */}
      <div className="hidden md:flex md:w-5/12 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-indigo-900 to-slate-900"></div>
        <div className="relative z-10">
          <Link href={`/store/${slug}`} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xl font-bold tracking-tight">Tienda en Línea</span>
          </Link>
          <div className="mt-32">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Acceso Exclusivo para Instaladores.</h1>
            <p className="text-slate-400 text-lg max-w-md mb-8">
              Regístrate para obtener precios especiales, visualizar tu historial de pedidos y automatizar tus facturas CFDI 4.0 con un solo clic.
            </p>
            <div className="flex items-center gap-3 text-sm font-semibold text-emerald-400 bg-emerald-400/10 w-fit px-4 py-2 rounded-full">
              <ShieldCheck className="w-4 h-4" /> Aprobación manual requerida
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative bg-white">
        <div className="w-full max-w-md">
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Solicitar Acceso</h2>
            <p className="text-slate-500 mt-2">Llena el formulario para crear tu cuenta de distribuidor.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Empresa o Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all sm:text-sm font-medium" placeholder="Ej. Soluciones WiFi S.A." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all sm:text-sm font-medium" placeholder="tu@empresa.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Teléfono (WhatsApp)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all sm:text-sm font-medium" placeholder="10 dígitos" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all sm:text-sm font-medium" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-8 disabled:opacity-70 group">
              {loading ? "Enviando Solicitud..." : "Enviar Solicitud"}
              {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ¿Ya tienes una cuenta aprobada?{" "}
            <Link href={`/store/${slug}/login`} className="font-bold text-blue-600 hover:text-blue-500">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
