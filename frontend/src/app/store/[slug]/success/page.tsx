"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '../StoreContext';
import { CheckCircle } from 'lucide-react';

export default function StoreSuccessPage() {
  const params = useParams();
  const slug = params?.slug as string || "default";
  const { clearCart } = useStore();

  useEffect(() => {
    // Clear cart upon successful payment
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-slate-100">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-4">¡Pago Exitoso!</h1>
        <p className="text-slate-600 mb-8 text-lg">
          Tu compra ha sido procesada correctamente. Hemos recibido tu pedido y pronto nos pondremos en contacto contigo para los detalles de entrega.
        </p>
        <Link href={`/store/${slug}`} className="inline-flex items-center justify-center w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 text-lg">
          Volver a la Tienda
        </Link>
      </div>
    </div>
  );
}
