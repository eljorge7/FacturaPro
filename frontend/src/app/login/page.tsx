"use client";

import { useState } from "react";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3005` : 'http://localhost:3005';
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");

      login(data.token, data.tenantId, data.user);
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
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
             <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 mt-2">
          FacturaPro
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 font-medium">
          Módulo Contable de MAJIA OS
        </p>
        <p className="mt-4 text-center text-sm text-slate-500 font-medium">
          O <Link href="/register" className="text-indigo-600 hover:text-indigo-500 font-bold transition">crea una cuenta nueva gratis</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-3xl border border-slate-100 sm:px-12 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
          
          <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold shadow-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700">Correo Electrónico</label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Contraseña</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium">Recordarme</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500">¿Olvidaste tu contraseña?</a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Accediendo...' : 'Entrar a mi Cuenta'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
