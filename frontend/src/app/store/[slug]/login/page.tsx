"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Building2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

export default function StoreLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string || "default";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Credenciales incorrectas');
      }

      login(data.token, data.tenantId, data.user);
      
      if (data.user.role === 'CUSTOMER') {
        router.push(`/store/${slug}`);
      } else {
        router.push(`/store/${slug}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative bg-white">
        <div className="w-full max-w-md">
          
          <div className="mb-10 text-center md:text-left">
            <Link href={`/store/${slug}`} className="inline-flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700 font-bold">
              <Building2 className="w-6 h-6" />
              <span>Tienda en Línea</span>
            </Link>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenido de vuelta</h2>
            <p className="text-slate-500 mt-2">Inicia sesión en tu cuenta de cliente exclusivo.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all sm:text-sm font-medium" placeholder="tu@empresa.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all sm:text-sm font-medium" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-8 disabled:opacity-70 group">
              {loading ? "Entrando..." : "Iniciar Sesión"}
              {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ¿Aún no tienes cuenta?{" "}
            <Link href={`/store/${slug}/register`} className="font-bold text-blue-600 hover:text-blue-500">
              Solicita acceso aquí
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden md:flex md:w-5/12 bg-slate-900 text-white p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400 via-indigo-900 to-slate-900"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-8">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Acceso Seguro.</h1>
          <p className="text-slate-400 text-lg max-w-md mb-8">
            Todas tus compras y datos de facturación están protegidos bajo los más altos estándares de seguridad.
          </p>
        </div>
      </div>
    </div>
  );
}
