"use client";

import { X, Lock, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function PaywallModal({ isOpen, onClose, featureName = "este módulo" }: PaywallModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Decorativo */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 shadow-xl">
            <Lock className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Módulo Premium
          </h2>
          <p className="text-blue-100 font-medium text-sm">
            Para acceder a {featureName} necesitas FacturaPro Premium.
          </p>
        </div>

        {/* Beneficios */}
        <div className="p-8">
          <p className="text-slate-600 font-medium mb-6 text-center">
            Sube de nivel tu negocio y desbloquea el verdadero poder de tu ERP con FacturaPro Premium:
          </p>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-slate-700 font-medium text-sm">Facturación Electrónica CFDI 4.0 ilimitada</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-slate-700 font-medium text-sm">Módulo de Nóminas y Recursos Humanos</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-slate-700 font-medium text-sm">Descargas Masivas Bóveda SAT y Contabilidad</span>
            </li>
          </ul>

          <Link 
            href="/plans"
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-row items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            Ver Planes Premium
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <button 
            onClick={onClose}
            className="w-full mt-4 py-3 rounded-xl text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
          >
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
