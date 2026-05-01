"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter, usePathname } from "next/navigation";
import { 
   FileText, Store, Users, ShoppingCart, 
   Settings, Search, Calculator, Wallet, Server, LogOut 
} from "lucide-react";
import "./CommandPalette.css"; // Estilos de command palette (muy importante)

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  if (!open) return null;
  if (pathname.startsWith('/portal')) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-start justify-center pt-[15vh]">
       <div className="w-full max-w-xl mx-4 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
         <Command className="flex flex-col w-full h-full text-sm outline-none border border-slate-200 rounded-xl overflow-hidden ring-1 ring-slate-200">
           
           <div className="flex items-center border-b border-slate-100 px-4">
              <Search className="w-5 h-5 text-slate-400 mr-2" />
              <Command.Input 
                 autoFocus 
                 placeholder="¿Qué necesitas hacer? (Busca acciones, clientes o facturas...)" 
                 className="flex-1 py-4 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
              />
              <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 border border-slate-200 rounded bg-slate-50 uppercase shadow-sm">
                 ESC
              </div>
           </div>

           <div className="overflow-y-auto max-h-[350px] p-2 custom-scrollbar">
               <Command.List>
                 <Command.Empty className="py-12 text-center text-sm text-slate-500 font-medium">
                    No se encontraron resultados para esta búsqueda.
                 </Command.Empty>

                 <Command.Group heading="Flujos Principales" className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <Command.Item 
                      onSelect={() => handleSelect('/invoices')} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-blue-50 aria-selected:text-blue-700 font-medium transition-colors mb-1"
                   >
                     <FileText className="w-4 h-4 text-blue-500" />
                     Crear / Buscar Facturas CFDI
                   </Command.Item>
                   
                   <Command.Item 
                      onSelect={() => handleSelect('/quotes')} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-amber-50 aria-selected:text-amber-700 font-medium transition-colors mb-1"
                   >
                     <Calculator className="w-4 h-4 text-amber-500" />
                     Elaborar nueva Cotización
                   </Command.Item>
                   
                   <Command.Item 
                      onSelect={() => handleSelect('/pos')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-emerald-50 aria-selected:text-emerald-700 font-medium transition-colors"
                   >
                     <Store className="w-4 h-4 text-emerald-500" />
                     Abrir Mostrador POS Rápido
                   </Command.Item>
                 </Command.Group>

                 <div className="h-px bg-slate-100 my-2 mx-3"></div>

                 <Command.Group heading="Directorios" className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <Command.Item onSelect={() => handleSelect('/customers')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100 font-medium transition-colors mb-1">
                     <Users className="w-4 h-4 text-slate-400" />
                     Directorio de Clientes
                   </Command.Item>
                   <Command.Item onSelect={() => handleSelect('/products')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100 font-medium transition-colors mb-1">
                     <Server className="w-4 h-4 text-slate-400" />
                     Catálogo de Servicios y Productos
                   </Command.Item>
                   <Command.Item onSelect={() => handleSelect('/suppliers')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100 font-medium transition-colors mb-1">
                     <ShoppingCart className="w-4 h-4 text-slate-400" />
                     Directorio de Proveedores
                   </Command.Item>
                 </Command.Group>

                 <div className="h-px bg-slate-100 my-2 mx-3"></div>

                 <Command.Group heading="Finanzas" className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <Command.Item onSelect={() => handleSelect('/ar')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-emerald-50 aria-selected:text-emerald-700 font-medium transition-colors mb-1">
                     <Wallet className="w-4 h-4 text-emerald-500" />
                     Cobranza Acumulada (AR)
                   </Command.Item>
                   <Command.Item onSelect={() => handleSelect('/expenses')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-rose-50 aria-selected:text-rose-700 font-medium transition-colors">
                     <Wallet className="w-4 h-4 text-rose-500" />
                     Gastos Operativos (Egresos)
                   </Command.Item>
                 </Command.Group>

                 <div className="h-px bg-slate-100 my-2 mx-3"></div>

                 <Command.Group heading="Opciones de Cuenta" className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <Command.Item onSelect={() => handleSelect('/settings')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-800 aria-selected:text-white font-medium transition-colors mb-1">
                     <Settings className="w-4 h-4" />
                     Ajustes Globales y Bóveda SAT
                   </Command.Item>
                   <Command.Item onSelect={() => window.location.href='/login'} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 cursor-pointer hover:bg-rose-50 aria-selected:bg-rose-50 aria-selected:text-rose-700 font-medium transition-colors text-rose-600">
                     <LogOut className="w-4 h-4 text-rose-500" />
                     Cerrar Sesión Activa
                   </Command.Item>
                 </Command.Group>

               </Command.List>
           </div>
         </Command>
       </div>
       
       {/* Background dismiss */}
       <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)}></div>
    </div>
  );
}
