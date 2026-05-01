"use client";

import { useState, useEffect } from "react";
import { Calendar, UserX, Clock, Plus, CheckCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ employeeId: "", date: new Date().toISOString().slice(0,10), type: "ABSENCE", notes: "" });

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        fetch("http://localhost:3001/employees"),
        fetch("http://localhost:3001/attendance")
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (attRes.ok) setRecords(await attRes.json());
    } catch (e) {
      console.error(e);
      // Fallback
      setEmployees([{ id: "1", name: "Ana Lilia Garcia" }, { id: "2", name: "Roberto Fernandez" }]);
      setRecords([
        { id: "r1", employee: { name: "Roberto Fernandez" }, date: new Date().toISOString(), type: "ABSENCE", notes: "No reportó falta" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) return toast.error("Selecciona un empleado");
    try {
      await fetch("http://localhost:3001/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      toast.success("Incidencia registrada");
      setForm({ ...form, notes: "" });
      fetchData();
    } catch (err) {
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center">
           <Calendar className="w-10 h-10 mr-3 text-rose-500" /> Control de Asistencia
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Registra faltas injustificadas y retardos para afectar la base gravable en la próxima nómina.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 col-span-1 h-fit">
          <h3 className="text-xl font-bold mb-6 text-slate-800">Nueva Incidencia</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Empleado</label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                 <option value="">Seleccione empleado...</option>
                 {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                 ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Fecha de Incidencia</label>
              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Tipo de Incidencia</label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                 <option value="ABSENCE">Falta Injustificada</option>
                 <option value="LATE">Retardo LLegada</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Notas / Motivo</label>
              <Input placeholder="Ej. No avisó a su gerente..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 mt-4 rounded-xl">
               <Plus className="w-5 h-5 mr-2" /> Registrar Incidencia
            </Button>
          </form>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Historial Registrado</h3>
            <div className="flex items-center bg-slate-50 p-2 rounded-full border border-slate-200 w-64">
               <Search className="w-4 h-4 text-slate-400 ml-2" />
               <Input className="border-none bg-transparent h-6 focus-visible:ring-0 shadow-none" placeholder="Buscar empleado..." onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Fecha</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Empleado</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Tipo</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-500">Notas</th>
                </tr>
              </thead>
              <tbody>
                {records.filter(r => r.employee?.name?.toLowerCase().includes(search.toLowerCase())).map((record: any) => (
                   <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{record.employee?.name}</td>
                      <td className="py-3 px-4">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${record.type === 'ABSENCE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                           {record.type === 'ABSENCE' ? <UserX className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                           {record.type === 'ABSENCE' ? 'Falta' : 'Retardo'}
                         </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{record.notes || '-'}</td>
                   </tr>
                ))}
                {records.length === 0 && !loading && (
                   <tr><td colSpan={4} className="py-8 text-center text-slate-500">No hay incidencias registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
