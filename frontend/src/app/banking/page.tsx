"use client";

import { useState, useEffect } from "react";
import { Banknote, Plus, Building2, UploadCloud, CheckCircle2, Search, ArrowRightLeft, Hash, Filter, DollarSign, ExternalLink, Bot, X, Scan, Activity, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function BankingPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeAccount, setActiveAccount] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Split-Screen State
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [reconLoading, setReconLoading] = useState(false);

  // AI Vision State
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<any | null>(null);

  useEffect(() => {
    if (token) fetchAccounts();
  }, [token]);

  const fetchAccounts = async () => {
     try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-accounts`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           const data = await res.json();
           setAccounts(data);
           if (data.length > 0 && !activeAccount) {
              handleSelectAccount(data[0]);
           }
        }
     } catch (e) {
        console.error(e);
     } finally {
        setLoading(false);
     }
  };

  const handleSelectAccount = async (acc: any) => {
     setActiveAccount(acc);
     setSelectedTx(null);
     
     try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/account/${acc.id}`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           setTransactions(await res.json());
        }
     } catch (e) { console.error(e); }
  };

  const fetchAccountsAndSwitchTo = async (targetId: string) => {
      try {
         const res = await fetch(`http://${window.location.hostname}:3005/bank-accounts`, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.ok) {
            const data = await res.json();
            setAccounts(data);
            const targetAcc = data.find((a: any) => a.id === targetId);
            if (targetAcc) {
                handleSelectAccount(targetAcc);
            }
         }
      } catch (e) {
         console.error(e);
      }
  };

  const createAccount = async () => {
    const name = prompt("Nombre de la cuenta (Ej. BBVA Cheques):");
    if (!name) return;
    try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-accounts`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ name, currency: 'MXN' })
        });
        if (res.ok) fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const editAccount = async (e: React.MouseEvent, acc: any) => {
    e.stopPropagation();
    const newName = prompt("Editar nombre de la cuenta:", acc.name);
    if (!newName || newName === acc.name) return;
    try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-accounts/${acc.id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ name: newName })
        });
        if (res.ok) fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const deleteAccount = async (e: React.MouseEvent, acc: any) => {
    e.stopPropagation();
    if (!confirm(`¿Estás súper seguro de eliminar la bóveda "${acc.name}"?\nSe perderá su balance e historial.`)) return;
    try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-accounts/${acc.id}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           if (activeAccount?.id === acc.id) setActiveAccount(null);
           fetchAccounts();
        }
    } catch (e) { console.error(e); }
  };

  const handleTxSelect = async (tx: any) => {
     if (tx.reconciled) {
         setSelectedTx(tx);
         setSuggestions([]);
         return; // Ya está conciliada, solo mostrar info en el panel derecho.
     }

     setSelectedTx(tx);
     setReconLoading(true);
     // Buscar facturas match
     try {
         const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/${tx.id}/suggestions`, {
             headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.ok) {
             setSuggestions(await res.json());
         }
     } catch (e) { console.error(e); }
     finally { setReconLoading(false); }
  };

  const reconcile = async (invoiceId: string) => {
     if (!selectedTx) return;
     try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/${selectedTx.id}/reconcile/invoice/${invoiceId}`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           alert("Conciliación exitosa. La factura se marcó pagada y el saldo es oficial.");
           handleSelectAccount(activeAccount); // re-fetch tX
        } else {
           alert("Error al conciliar.");
         }
      } catch(e) { console.error(e); }
  };

  const moveTransaction = async (targetBankAccountId: string) => {
     if (!selectedTx) return;
     try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/${selectedTx.id}/move/${targetBankAccountId}`, {
           method: 'PUT',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           alert("El comprobante fue movido a su nueva bóveda correctamente.");
           handleSelectAccount(activeAccount); // Refresh current vault list
           setSelectedTx(null);
        } else {
           const errMap = await res.json().catch(() => null);
           alert("Error al mover el comprobante: " + (errMap?.message || res.status));
        }
     } catch (e) { console.error(e); }
  };

  const deleteTx = async (txId: string) => {
     if (!confirm('¿Estás seguro de eliminar este registro bancario?')) return;
     try {
        const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/${txId}`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
           setSelectedTx(null);
           handleSelectAccount(activeAccount);
        } else {
           const errMap = await res.json().catch(() => null);
           alert("Error al eliminar: " + (errMap?.message || res.status));
        }
     } catch (e) { console.error(e); }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length < 2) {
              alert("El archivo no parece tener datos (o falta el encabezado).");
              return;
          }
          
          // Plantilla: Date, Description, Amount, Reference
          const txsToSubmit = [];
          for (let i = 1; i < lines.length; i++) {
              // Dividir por coma respetando simple formato CSV
              const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
              if (cols.length >= 3) {
                  let date = cols[0];
                  // Convertir formato Mexicano DD/MM/YYYY a YYYY-MM-DD
                  if (date.includes('/')) {
                      const parts = date.split('/');
                      if (parts.length === 3) {
                          // Si es DD/MM/YYYY
                          if (parts[0].length <= 2 && parts[2].length === 4) {
                             date = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
                          }
                      }
                  }

                  const description = cols[1];
                  const amount = cols[2].replace(/[^0-9.-]+/g,""); // limpia símbolos raros
                  const reference = cols[3] || '';
                  
                  if (!isNaN(parseFloat(amount))) {
                      txsToSubmit.push({ date: date || new Date().toISOString(), description, amount, reference });
                  }
              }
          }
          
          if (txsToSubmit.length === 0) {
              alert("No se detectaron transacciones válidas en el CSV. Usa la plantilla: Date, Description, Amount, Reference");
              return;
          }
          
          if (!activeAccount) return;
          try {
             const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/account/${activeAccount.id}/batch`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify(txsToSubmit)
             });
             if (res.ok) {
                 alert(`¡Éxito! ${txsToSubmit.length} movimientos inyectados a tu Bóveda. Tus sugerencias inteligentes están listas.`);
                 handleSelectAccount(activeAccount);
             } else {
                 alert("Error interno insertando transacciones.");
             }
          } catch(err) {
              console.error(err);
          }
      };
      reader.readAsText(file);
      e.target.value = '';
   };

  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!activeAccount) return;

      setVisionLoading(true);
      setVisionResult(null);

      const formData = new FormData();
      formData.append('receipt', file);

      try {
          const res = await fetch(`http://${window.location.hostname}:3005/bank-transactions/account/${activeAccount.id}/process-receipt-vision`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });
          const data = await res.json();
          if (res.ok) {
              setVisionResult(data);
              
              // == AUTO-NAVEGACION IA ==
              if (data.rerouted && data.targetAccountId) {
                  await fetchAccountsAndSwitchTo(data.targetAccountId);
              } else {
                  handleSelectAccount(activeAccount); // Refresh tx list
              }
              
          } else {
              alert(data.message || 'Error procesando la imagen');
          }
      } catch (e) {
          console.error(e);
          alert('Error de conexión con el motor de IA.');
      } finally {
          setVisionLoading(false);
      }
  };

  if (loading) return <div className="p-8">Cargando Bóveda Bancaria...</div>;

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col font-sans gap-4">
       
       <div className="flex justify-between items-center px-2">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
               <Building2 className="w-6 h-6 text-emerald-500" />
               Tesorería y Bancos
            </h1>
            <p className="text-slate-500 text-sm font-medium">Control unificado de saldos y conciliación de flujo (Cashflow)</p>
          </div>
          <button onClick={createAccount} className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <Plus className="w-4 h-4" /> Nueva Cuenta
          </button>
       </div>

       {/* BANK ACCOUNTS STRIP */}
       <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
          {accounts.map(acc => (
             <div 
                key={acc.id}
                onClick={() => handleSelectAccount(acc)}
                className={`group cursor-pointer min-w-[280px] p-5 rounded-3xl border-2 transition-all flex flex-col items-start gap-4 shadow-sm relative overflow-hidden ${activeAccount?.id === acc.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
             >
                {activeAccount?.id === acc.id && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>}
                <div className="w-full flex justify-between items-center z-10">
                   <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shadow-sm">
                         <Building2 className="w-5 h-5"/>
                      </div>
                      <div className="flex flex-col gap-1 sm:flex-row items-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => editAccount(e, acc)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors" title="Editar Nombre">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button onClick={(e) => deleteAccount(e, acc)} className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-colors" title="Eliminar Bóveda">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                   <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded uppercase tracking-widest shadow-sm border border-slate-100">{acc.currency}</div>
                </div>
                <div className="z-10 text-left">
                   <h3 className="font-bold text-slate-700">{acc.name}</h3>
                   <div className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-slate-400">$</span>
                      {acc.balance.toLocaleString('en-US', {minimumFractionDigits:2})}
                   </div>
                </div>
             </div>
          ))}
          {accounts.length === 0 && (
             <div className="p-8 border border-dashed border-slate-300 rounded-3xl text-sm font-bold text-slate-400">
                Ninguna bóveda bancaria configurada.
             </div>
          )}
       </div>

       {/* RECONCILIATION SPLIT SCREEN */}
       {activeAccount && (
          <div className="flex-1 flex gap-4 overflow-hidden rounded-3xl">
             
             {/* LEFT PANE: BANK TRANSACTIONS */}
             <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <ArrowRightLeft className="w-4 h-4 text-slate-400" /> Movimientos en Banco
                   </div>
                   <div className="flex gap-2">
                       <button onClick={() => setVisionModalOpen(true)} className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 border border-indigo-700 rounded-lg text-xs font-bold text-white flex items-center gap-2 shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer">
                          <Bot className="w-4 h-4" /> Auto-Conciliar (IA)
                       </button>
                       <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                          <Filter className="w-4 h-4" /> Filtrar
                       </button>
                       <input type="file" id="csvUploader" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                       <button onClick={() => document.getElementById('csvUploader')?.click()} className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white flex items-center gap-2 shadow-md hover:bg-slate-800 transition-colors">
                          <UploadCloud className="w-4 h-4 text-emerald-400" /> Importar CXC
                       </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2 relative bg-slate-50/30">
                   {transactions.map(tx => (
                      <button 
                         key={tx.id}
                         onClick={() => handleTxSelect(tx)}
                         className={`w-full flex items-center p-4 rounded-2xl border transition-all text-left group ${selectedTx?.id === tx.id ? 'border-emerald-500 shadow-md bg-white' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                      >
                         <div className={`w-2 h-10 rounded-full mr-4 shrink-0 transition-colors ${tx.reconciled ? 'bg-emerald-400' : 'bg-slate-200 group-hover:bg-amber-300'}`}></div>
                         <div className="flex-[2] min-w-0 pr-4">
                            <p className="text-xs font-bold text-slate-400 mb-1">{new Date(tx.date).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'})}</p>
                            <p className={`text-sm font-bold truncate ${tx.reconciled ? 'text-slate-500' : 'text-slate-800'}`}>{tx.description}</p>
                            {tx.reference && <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">{tx.reference}</p>}
                         </div>
                         <div className="shrink-0 text-right w-28">
                             <p className={`text-base font-black tracking-tight ${tx.type === 'IN' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {tx.type === 'IN' ? '+' : '-'}${tx.amount.toLocaleString('en-US', {minimumFractionDigits:2})}
                             </p>
                             <div className="mt-1">
                                {tx.reconciled ? (
                                   <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      <CheckCircle2 className="w-3 h-3" /> CONCILIADA
                                   </span>
                                ) : (
                                   <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                      <Search className="w-3 h-3" /> POR CLASIFICAR
                                   </span>
                                )}
                             </div>
                         </div>
                      </button>
                   ))}
                   {transactions.length === 0 && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                           <UploadCloud className="w-12 h-12 mb-4 opacity-20" />
                           <p className="font-medium">No hay movimientos bancarios registrados.</p>
                           <p className="text-xs mt-2">Sube tu estado de cuenta arrastrando el CSV aquí.</p>
                       </div>
                   )}
                </div>
             </div>

             {/* RIGHT PANE: SUGGESTIONS / ENGINE */}
             <div className="w-[450px] bg-[#1e293b] border border-slate-700 rounded-3xl shadow-xl overflow-hidden flex flex-col shrink-0 text-slate-200">
                 {!selectedTx ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                       <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                           <Hash className="w-8 h-8 text-emerald-400" />
                       </div>
                       <h2 className="text-xl font-bold text-white mb-2">Motor de Match Automático</h2>
                       <p className="text-slate-400 text-sm font-medium leading-relaxed">
                          Selecciona una transacción bancaria a la izquierda. Nuestro algoritmo buscará facturas o cuentas por pagar que encajen matemáticamente.
                       </p>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col custom-scrollbar overflow-y-auto">
                       
                       {/* Contexto del TX */}
                       <div className="p-6 border-b border-slate-700/50 bg-slate-800 shrink-0">
                           <div className="flex justify-between items-start mb-4">
                              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded">
                                 Transacción de Origen
                              </span>
                              <div className="flex items-center gap-3">
                                  {accounts.length > 1 && (
                                     <select 
                                         onChange={(e) => {
                                             if(e.target.value) moveTransaction(e.target.value);
                                         }}
                                         value="" 
                                         className="text-[10px] font-bold uppercase tracking-wide bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg px-2 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 transition-colors"
                                     >
                                         <option value="" disabled>Mover a otra Bóveda...</option>
                                         {accounts.filter(a => a.id !== activeAccount.id).map(a => (
                                             <option key={a.id} value={a.id}>{a.name}</option>
                                         ))}
                                     </select>
                                  )}
                                  {!selectedTx.reconciled && (
                                     <button onClick={() => deleteTx(selectedTx.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 rounded-lg transition-colors" title="Eliminar Registro">
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                  )}
                                  <span className="text-2xl font-black text-white">${selectedTx.amount.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                              </div>
                           </div>
                           <h3 className="text-lg font-bold text-white mb-1">{selectedTx.description}</h3>
                           <p className="text-sm font-medium text-slate-400">{new Date(selectedTx.date).toLocaleDateString()} • Ref: {selectedTx.reference || 'N/A'}</p>
                       </div>

                       <div className="p-6 flex-1">
                          {selectedTx.reconciled ? (
                             <div className="h-full flex flex-col items-center justify-center text-center">
                                 <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                                 <h3 className="text-lg font-bold text-white mb-2">Dinero Identificado</h3>
                                 <p className="text-slate-400 text-sm mb-6">Esta entrada está contabilizada.</p>
                                 {selectedTx.payment?.invoice && (
                                     <div className="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700 text-left">
                                        <div className="flex justify-between items-center mb-2">
                                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Factura Pagada</span>
                                           <span className="text-white font-bold">{selectedTx.payment.invoice.invoiceNumber}</span>
                                        </div>
                                        <p className="font-bold text-emerald-400 truncate">{selectedTx.payment.invoice.customer?.legalName}</p>
                                        <Link href={`/invoices/${selectedTx.payment.invoice.id}`} className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition-colors text-sm">
                                            Ver Factura Original <ExternalLink className="w-3 h-3"/>
                                        </Link>
                                     </div>
                                 )}
                             </div>
                          ) : (
                             <>
                               {reconLoading ? (
                                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                     <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                                     Buscando coincidencias matemáticas...
                                  </div>
                               ) : (
                                  <>
                                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sugerencias Inteligentes</h4>
                                     {suggestions.length === 0 ? (
                                        <div className="p-6 bg-slate-800/50 rounded-2xl text-center border border-slate-700/50 border-dashed">
                                           <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                                           <p className="text-slate-300 font-bold mb-2">Sin Coincidencia Automática</p>
                                           <p className="text-slate-500 text-sm leading-relaxed mb-4">No encontramos facturas no pagadas con ese monto exacto (${selectedTx.amount}).</p>
                                           <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg">
                                              Buscar Manualmente
                                           </button>
                                        </div>
                                     ) : (
                                        <div className="space-y-3">
                                           {suggestions.map((s: any) => (
                                              <div key={s.id} className="bg-slate-800 p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-400 transition-colors group">
                                                 <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                       <div className="flex items-center gap-2">
                                                           <p className="font-bold text-white">{s.customer?.legalName}</p>
                                                           {s.matchScore > 50 && <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">Prioridad Alta</span>}
                                                           {s.matchScore > 10 && s.matchScore <= 50 && <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-indigo-500/40 bg-indigo-500/20 text-indigo-400">Match Parcial</span>}
                                                       </div>
                                                       <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Factura: {s.invoiceNumber}</p>
                                                    </div>
                                                    <span className="text-emerald-400 font-bold">${s.total.toLocaleString()}</span>
                                                 </div>
                                                 <button 
                                                    onClick={() => reconcile(s.id)}
                                                    className="w-full py-3 bg-emerald-600/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                                                 >
                                                    <CheckCircle2 className="w-4 h-4" /> Hacer Match y Conciliar
                                                 </button>
                                              </div>
                                           ))}
                                        </div>
                                     )}
                                  </>
                               )}
                             </>
                          )}
                       </div>
                    </div>
                 )}
             </div>

          </div>
       )}

        {/* AI VISION MODAL OVERLAY */}
        {visionModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 relative">
                   <button onClick={() => {setVisionModalOpen(false); setVisionResult(null);}} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                       <X className="w-5 h-5"/>
                   </button>
                   <div className="p-8 pb-6 border-b border-slate-100 flex flex-col items-center text-center">
                       <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                           <Scan className="w-8 h-8 text-white" />
                       </div>
                       <h2 className="text-2xl font-black text-slate-800 tracking-tight">Julio IA Vision</h2>
                       <p className="text-slate-500 text-sm font-medium mt-1">Sube una captura del comprobante bancario.<br/> Extraeré los datos y conciliaré automáticamente la factura.</p>
                   </div>
                   
                   <div className="p-8 bg-slate-50">
                       {!visionLoading && !visionResult && (
                           <div className="relative">
                               <input type="file" accept="image/png, image/jpeg, application/pdf" onChange={handleVisionUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                               <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-indigo-50 hover:border-indigo-400 transition-colors">
                                   <UploadCloud className="w-10 h-10 text-indigo-500 mb-3" />
                                   <p className="text-sm font-bold text-indigo-900">Arrastra tu Comprobante Aquí</p>
                                   <p className="text-xs text-indigo-500 mt-1">PNG, JPG o PDF hasta 5MB</p>
                               </div>
                           </div>
                       )}

                       {visionLoading && (
                           <div className="flex flex-col items-center justify-center py-10">
                               <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                               <p className="text-sm font-bold text-slate-700 animate-pulse">Julio está analizando el comprobante...</p>
                               <p className="text-xs text-slate-500 mt-1">Extrayendo banco, monto y cruce de facturas.</p>
                           </div>
                       )}

                       {visionResult && (
                           <div className="space-y-4">
                               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Datos Extraídos por IA</h4>
                                   <div className="grid grid-cols-2 gap-3 mb-3">
                                       <div className="bg-slate-50 p-2 rounded-lg">
                                           <span className="text-[10px] text-slate-400 uppercase font-bold">Monto Exacto</span>
                                           <p className="text-sm font-bold text-slate-800">${visionResult.extracted?.amount}</p>
                                       </div>
                                       <div className="bg-slate-50 p-2 rounded-lg">
                                           <span className="text-[10px] text-slate-400 uppercase font-bold">Concepto</span>
                                           <p className="text-sm font-bold text-slate-800 truncate">{visionResult.extracted?.reference || 'N/A'}</p>
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-2 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                                       <Activity className="w-3.5 h-3.5" />
                                       Detectado: {visionResult.extracted?.senderName} ({visionResult.extracted?.bankName})
                                   </div>
                               </div>

                               {visionResult.reconciliationStatus === 'AUTO_RECONCILED' && (
                                   <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
                                       <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                                       <div>
                                           <h4 className="text-sm font-bold text-emerald-900">¡Conciliación Automática Exitosa!</h4>
                                           <p className="text-xs text-emerald-700 mt-0.5">Se matcheó el monto contra la factura <b>{visionResult.matchedInvoice?.invoiceNumber}</b> de {visionResult.matchedInvoice?.customer}. Pago registrado.</p>
                                       </div>
                                   </div>
                               )}
                               
                               {visionResult.reconciliationStatus === 'MULTIPLE_MATCHES' && (
                                   <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                                       <Search className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                       <div>
                                           <h4 className="text-sm font-bold text-amber-900">Múltiples Coincidencias</h4>
                                           <p className="text-xs text-amber-700 mt-0.5">Julio detectó la entrada, pero existen {visionResult.candidates} facturas con el mismo monto. Ciérrame y usa la selección manual a la derecha.</p>
                                       </div>
                                   </div>
                               )}

                                {visionResult.rerouted && (
                                    <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
                                        <ArrowRightLeft className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Enrutamiento Inteligente</h4>
                                            <p className="text-xs text-indigo-700 mt-0.5">Julio detectó que este recibo era de <b>{visionResult.targetAccountName}</b> y lo colocó allí automáticamente desvinculándolo de tu bóveda actual.</p>
                                        </div>
                                    </div>
                                )}

                               {visionResult.reconciliationStatus === 'NO_MATCH_FOUND' && (
                                   <div className="bg-slate-100 border border-slate-300 p-4 rounded-xl flex items-start gap-3">
                                       <Hash className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                       <div>
                                           <h4 className="text-sm font-bold text-slate-800">No se encontraron facturas</h4>
                                           <p className="text-xs text-slate-600 mt-0.5">La entrada se registró exitosamente, pero no tienes ninguna factura pendiente por este monto exacto.</p>
                                       </div>
                                   </div>
                               )}
                               
                               <button onClick={() => {setVisionModalOpen(false); setVisionResult(null);}} className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors">
                                  Entendido
                               </button>
                           </div>
                       )}
                   </div>
               </div>
           </div>
        )}
    </div>
  );
}
