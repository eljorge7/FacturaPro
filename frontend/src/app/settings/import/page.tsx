"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, ArrowRight, ServerCrash } from "lucide-react";

export default function ImportPage() {
  const [tenantId] = useState('demo-tenant');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<null | 'success' | 'error'>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setColumns(results.meta.fields || []);
        setData(results.data);
      },
    });
  };

  const handleImport = async () => {
    setIsUploading(true);
    setStatus(null);
    try {
      // Map columns if needed, here we assume CSV has 'legalName', 'rfc', 'email', 'phone'
      const mappedData = data.map(row => ({
        legalName: row['legalName'] || row['Nombre'] || row['Razón Social'],
        rfc: row['rfc'] || row['RFC'],
        email: row['email'] || row['Correo'] || null,
        phone: row['phone'] || row['Teléfono'] || null
      })).filter(x => x.legalName && x.rfc); // Basic validation

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";
      const res = await fetch(`${baseUrl}/customers/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          customers: mappedData
        })
      });

      if (!res.ok) throw new Error('Failed to import');
      setStatus('success');
      setData([]); // clear payload
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Migrador de Clientes</h1>
        <p className="text-slate-500 mt-1 font-medium">Importa de forma inteligente tus clientes desde otro sistema o Excel.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-8">
        {!data.length ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
              <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Sube tu archivo .CSV aquí</h3>
              <p className="text-slate-500 text-sm mt-2 mb-6 max-w-sm mx-auto">
                El archivo debe contener columnas como Nombre (o legalName) y RFC. 
              </p>
              <label className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl cursor-pointer hover:bg-indigo-700 transition inline-block">
                Examinar Archivo
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            
            {/* Visual Guide for CSV */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
               <h4 className="font-bold text-indigo-900 mb-2">Estructura Recomendada del Archivo</h4>
               <p className="text-sm text-indigo-700 mb-4">Asegúrate de que tu Excel/CSV (separado por comas) tenga nombres de columna similares a estos en su primera fila:</p>
               <div className="overflow-hidden rounded-lg border border-indigo-200 bg-white shadow-sm">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-indigo-100/50 text-indigo-900 font-bold">
                     <tr>
                       <th className="p-3 border-b border-indigo-100">Nombre o Razón Social</th>
                       <th className="p-3 border-b border-indigo-100">RFC</th>
                       <th className="p-3 border-b border-indigo-100 text-slate-400 font-normal">Correo (Opcional)</th>
                       <th className="p-3 border-b border-indigo-100 text-slate-400 font-normal">Teléfono (Opcional)</th>
                     </tr>
                   </thead>
                   <tbody className="text-slate-600">
                     <tr>
                       <td className="p-3 border-b border-slate-50">Global Tech SA de CV</td>
                       <td className="p-3 border-b border-slate-50 font-mono text-xs">GTE123456XYZ</td>
                       <td className="p-3 border-b border-slate-50">contacto@gtech.com</td>
                       <td className="p-3 border-b border-slate-50">555-1234-567</td>
                     </tr>
                     <tr>
                       <td className="p-3">Juan Pérez López</td>
                       <td className="p-3 font-mono text-xs">PELJ800101QW1</td>
                       <td className="p-3">juan@gmail.com</td>
                       <td className="p-3">-</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div>
                <h3 className="font-bold text-indigo-900">CSV Listo para Importación</h3>
                <p className="text-sm text-indigo-700">{data.length} clientes detectados en el archivo.</p>
              </div>
              <button 
                onClick={handleImport}
                disabled={isUploading}
                className="bg-indigo-600 font-bold text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-md flex items-center gap-2"
              >
                {isUploading ? 'Importando...' : <><CheckCircle2 className="w-5 h-5"/> Procesar Importación</>}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-xs font-bold">
                    {columns.slice(0, 5).map(col => <th key={col} className="p-4">{col}</th>)}
                    {columns.length > 5 && <th className="p-4">...</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {columns.slice(0, 5).map(col => <td key={col} className="p-4 font-medium text-slate-800">{row[col]}</td>)}
                      {columns.length > 5 && <td className="p-4">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 5 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-slate-500 font-medium text-xs">
                  Mostrando 5 de {data.length} filas
                </div>
              )}
            </div>
            
            <div className="flex justify-start">
              <button onClick={() => setData([])} className="text-slate-500 text-sm font-bold hover:text-slate-800 transition">
                ← Cancelar y subir otro archivo
              </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 font-medium">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ¡Importación de clientes exitosa! Los datos ya están en el sistema.
          </div>
        )}
        {status === 'error' && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 font-medium">
            <ServerCrash className="w-6 h-6 text-red-600" />
            Ocurrió un error en el servidor. Asegúrate de tener las columnas requeridas (Nombre/Razón Social y RFC).
          </div>
        )}
      </div>
    </div>
  );
}
