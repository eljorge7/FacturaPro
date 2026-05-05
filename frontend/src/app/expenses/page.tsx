"use client";

import { useEffect, useState, useRef } from "react";
import { Lock, ArrowRight, ShieldCheck, FileText, CheckCircle2, UploadCloud, PieChart, Plus, Eye, Download, Trash } from "lucide-react";
import * as XLSX from "xlsx";
import { ExpensesAPI } from "../../lib/ExpensesAPI";
import ExpenseDialog from "../../components/ExpenseDialog";
import ExpensePreviewDialog from "../../components/ExpensePreviewDialog";
import DocumentViewerDialog from "../../components/DocumentViewerDialog";

import { useAuth } from "@/components/AuthProvider";

export default function ExpensesPage() {
  const { tenantId: activeTenantId } = useAuth();
  const tenantId = activeTenantId || 'demo-tenant';
  const [stats, setStats] = useState<any>(null);
  const [diot, setDiot] = useState<any>({ ivaCobrado: 0, ivaPagado: 0, totalAPagar: 0, saldoAFavor: 0 });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewedDocument, setViewedDocument] = useState<any>(null);
  const [xmlParsedData, setXmlParsedData] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      // Usamos el endpoint de stats solo para obtener el hasExpenseControl 
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const resStats = await fetch(`${baseUrl}/invoices/stats`);
      const dataStats = await resStats.json();
      
      // Override for demo purposes
      dataStats.hasExpenseControl = true;
      setStats(dataStats);

      const [diotData, expensesData] = await Promise.all([
        ExpensesAPI.getSummary(tenantId),
        ExpensesAPI.getExpenses(tenantId)
      ]);
      setDiot(diotData);
      setExpenses(expensesData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.name.endsWith('.xml')) {
      alert("Por favor sube un archivo XML");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = await ExpensesAPI.previewXml(tenantId, text);
        setXmlParsedData(parsed);
        setIsPreviewOpen(true);
      } catch (err) {
        console.error(err);
        alert('Error leyendo el XML');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleExportExcel = () => {
    const data = expenses.map(e => ({
      Fecha: new Date(e.date).toLocaleDateString(),
      Concepto: e.description,
      UUID: e.satUuid || 'Manual',
      Deducible: e.isDeductible ? 'Sí' : 'No',
      Subtotal: e.isDeductible ? (e.total - e.taxTotal) : e.total,
      IVA: e.taxTotal,
      Total: e.total
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Egresos DIOT");
    XLSX.writeFile(wb, `DIOT_Egresos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      try {
        await ExpensesAPI.deleteExpense(id);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-indigo-500 animate-pulse font-bold">Cargando Módulo de Gastos...</div>;

  const hasAccess = stats?.hasExpenseControl;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-white p-10 md:p-14 rounded-[2rem] shadow-xl border border-slate-100 max-w-2xl text-center relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 group-hover:bg-purple-50 transition-all pointer-events-none" />
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm relative z-10">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight relative z-10">Módulo Web de Gastos</h2>
          <p className="text-slate-500 font-medium mt-3 mb-8 relative z-10 max-w-lg mx-auto">
            Este módulo requiere el paquete <span className="font-bold text-indigo-600">PyME</span> o superior. 
          </p>
          <button className="bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto relative z-10">
            Mejorar mi Plan <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Calculate percentages for basic circular DIOT representation
  const maxIva = Math.max(diot.ivaCobrado, diot.ivaPagado, 1);
  const pctCobrado = Math.round((diot.ivaCobrado / maxIva) * 100);
  const pctPagado = Math.round((diot.ivaPagado / maxIva) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Buzón Inteligente y DIOT</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestiona facturas del SAT y calcula tus impuestos del mes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar DIOT
          </button>
          <button 
            onClick={() => setIsExpenseOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Gasto Manual
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Subir XML
          </button>
          <input 
            type="file" 
            accept=".xml" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} 
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel DIOT */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 w-full h-full pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-50 group-hover:bg-indigo-50 transition-colors" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6 relative z-10">
            <PieChart className="w-5 h-5 text-indigo-500" />
            Resumen DIOT (Mensual)
          </h2>

          <div className="space-y-5 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-bold text-slate-600">IVA Trasladado (Cobrado)</span>
                <span className="font-bold text-slate-900">${diot.ivaCobrado.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${pctCobrado}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-bold text-slate-600">IVA Acreditable (Pagado)</span>
                <span className="font-bold text-slate-900">${diot.ivaPagado.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${pctPagado}%` }}></div>
              </div>
            </div>
            
            <div className={`mt-6 p-4 rounded-xl border ${diot.totalAPagar > 0 ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <span className={`block text-xs font-bold uppercase tracking-wider ${diot.totalAPagar > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {diot.totalAPagar > 0 ? 'IVA a Pagar al SAT' : 'Saldo a Favor'}
              </span>
              <span className={`block text-2xl font-black mt-1 ${diot.totalAPagar > 0 ? 'text-orange-900' : 'text-emerald-900'}`}>
                ${diot.totalAPagar > 0 ? diot.totalAPagar.toFixed(2) : diot.saldoAFavor.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Dropzone & List */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Arrastra tus XMLs del SAT aquí</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              FacturaPro leerá automáticamente el UUID, Proveedor y desglosará el IVA para tu reporte mensual.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-800">Historial de Egresos</h3>
            </div>
            
            {expenses.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">No hay gastos en este periodo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4 pl-6">Descripción</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-right">IVA Pagado</th>
                      <th className="p-4 pr-6 text-right">Total</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{e.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{e.satUuid ? `SAT: ${e.satUuid.substring(0,8)}...` : 'Gasto Manual'} • {new Date(e.date).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4">
                          {e.category ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: `${e.category.color}15`, color: e.category.color }}>
                              {e.category.name}
                            </span>
                          ) : <span className="text-slate-400 text-xs">Sin clasificar</span>}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-slate-500">
                          {e.isDeductible ? `$${e.taxTotal.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4 pr-6 text-right font-bold text-slate-800">
                          ${e.total.toFixed(2)}
                        </td>
                        <td className="p-4 flex gap-1 justify-end">
                          <button 
                            onClick={() => { setViewedDocument(e); setIsViewerOpen(true); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver Factura"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Gasto"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <ExpenseDialog 
        tenantId={tenantId}
        isOpen={isExpenseOpen} 
        onClose={() => setIsExpenseOpen(false)} 
        onSuccess={fetchData} 
      />

      <ExpensePreviewDialog 
        tenantId={tenantId}
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        onSuccess={fetchData} 
        xmlData={xmlParsedData}
      />

      <DocumentViewerDialog 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        documentData={viewedDocument}
      />
    </div>
  );
}
