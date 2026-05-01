"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

const employeeSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo inválido"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  baseSalary: z.number().min(0),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankClabe: z.string().optional(),
  nss: z.string().optional(),
  curp: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export function EditEmployeeDialog({ employee, onEmployeeEdited }: { employee: any, onEmployeeEdited: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (open && employee) {
      reset({
        name: employee.name,
        email: employee.email,
        jobTitle: employee.employeeProfile?.jobTitle || "",
        department: employee.employeeProfile?.department || "",
        baseSalary: employee.employeeProfile?.baseSalary || 0,
        bankName: employee.employeeProfile?.bankName || "",
        bankAccount: employee.employeeProfile?.bankAccount || "",
        bankClabe: employee.employeeProfile?.bankClabe || "",
        nss: employee.employeeProfile?.nss || "",
        curp: employee.employeeProfile?.curp || "",
      });
    }
  }, [open, employee, reset]);

  async function onSubmit(data: EmployeeFormValues) {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("API Error");
      toast.success("Empleado actualizado");
      setOpen(false);
      onEmployeeEdited();
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 transition" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empleado</DialogTitle>
          <DialogDescription>
            Actualiza los datos del empleado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input placeholder="Ej. Ana Lilia Garcia" {...register("name")} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input type="email" placeholder="ana@empresa.com" {...register("email")} />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Puesto</Label>
              <Input placeholder="Ej. Recepcionista" {...register("jobTitle")} />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input placeholder="Ej. Operaciones" {...register("department")} />
            </div>
            <div className="space-y-2">
              <Label>Salario Base (Neto/Mes)</Label>
              <Input type="number" step="0.01" {...register("baseSalary", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold mb-3">Datos Legales y Bancarios</h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>NSS (Seguro Social)</Label>
                <Input {...register("nss")} />
              </div>
              <div className="space-y-2">
                <Label>CURP</Label>
                <Input className="uppercase" {...register("curp")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
               <div className="space-y-2">
                <Label>Banco</Label>
                <Input placeholder="Ej. BBVA" {...register("bankName")} />
               </div>
               <div className="space-y-2">
                <Label>Número de Cuenta</Label>
                <Input {...register("bankAccount")} />
               </div>
               <div className="space-y-2">
                <Label>CLABE</Label>
                <Input {...register("bankClabe")} />
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
