import React, { useState } from 'react';
import { X, Smartphone, Zap, Monitor, Phone, Wifi } from 'lucide-react';

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}

const CARRIERS = [
  { id: 'TELCEL', name: 'Telcel', color: 'bg-blue-600', hover: 'hover:bg-blue-700' },
  { id: 'MOVISTAR', name: 'Movistar', color: 'bg-green-500', hover: 'hover:bg-green-600' },
  { id: 'ATT', name: 'AT&T', color: 'bg-slate-800', hover: 'hover:bg-slate-900' },
  { id: 'UNEFON', name: 'Unefon', color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' }
];

const AMOUNTS = [10, 20, 30, 50, 100, 150, 200, 300, 500];

const SERVICES = [
  { id: 'CFE', name: 'CFE', icon: Zap, color: 'text-green-600' },
  { id: 'TELMEX', name: 'Telmex', icon: Phone, color: 'text-blue-500' },
  { id: 'SKY', name: 'SKY', icon: Monitor, color: 'text-blue-800' },
  { id: 'MEGACABLE', name: 'Megacable', icon: Wifi, color: 'text-slate-600' }
];

export default function TopupModal({ isOpen, onClose, onAdd }: TopupModalProps) {
  const [tab, setTab] = useState<'RECARGA' | 'SERVICIO'>('RECARGA');
  
  // Recarga State
  const [carrier, setCarrier] = useState(CARRIERS[0].id);
  const [amount, setAmount] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');

  // Servicio State
  const [service, setService] = useState(SERVICES[0].id);
  const [reference, setReference] = useState('');
  const [serviceAmount, setServiceAmount] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (tab === 'RECARGA') {
      if (!amount) return alert('Selecciona un monto.');
      if (phone.length !== 10) return alert('El número debe tener 10 dígitos.');
      if (phone !== phoneConfirm) return alert('Los números no coinciden.');
      
      onAdd({
        productId: `TOPUP-${carrier}-${amount}`,
        name: `Recarga ${carrier} $${amount}`,
        price: amount,
        taxRate: 0, // Recargas suelen ser exentas o tasa 0 dependiendo de la ley, asumimos 0 extra al cajero.
        customFields: {
           isTopup: true,
           type: 'RECARGA',
           carrier,
           reference: phone
        }
      });
    } else {
      if (!serviceAmount) return alert('Ingresa el monto a pagar.');
      if (!reference) return alert('Ingresa la referencia del recibo.');
      
      onAdd({
        productId: `SRV-${service}-${serviceAmount}`,
        name: `Pago Servicio ${service}`,
        price: serviceAmount,
        taxRate: 0,
        customFields: {
           isTopup: true,
           type: 'SERVICIO',
           carrier: service,
           reference
        }
      });
    }
    
    // Reset and close
    setPhone('');
    setPhoneConfirm('');
    setAmount('');
    setReference('');
    setServiceAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Recargas y Servicios
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setTab('RECARGA')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'RECARGA' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Recarga Telefónica
          </button>
          <button 
            onClick={() => setTab('SERVICIO')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'SERVICIO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Pago de Servicios
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {tab === 'RECARGA' ? (
            <div className="space-y-6">
              {/* Carriers */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">1. Compañía</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CARRIERS.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setCarrier(c.id)}
                      className={`py-2 px-1 text-center rounded-lg font-bold text-sm transition-all ${carrier === c.id ? `${c.color} text-white shadow-md transform scale-105` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amounts */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">2. Monto</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {AMOUNTS.map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setAmount(amt)}
                      className={`py-2 rounded-lg font-bold text-sm transition-colors border ${amount === amt ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'}`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Numbers */}
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">3. Número Celular (10 dígitos)</label>
                 <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Ej. 55 1234 5678"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Confirmar Número"
                      value={phoneConfirm}
                      onChange={e => setPhoneConfirm(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-lg font-bold tracking-widest text-center outline-none ${phone === phoneConfirm && phone.length === 10 ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Services */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">1. Servicio a Pagar</label>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICES.map(s => {
                    const Icon = s.icon;
                    return (
                      <button 
                        key={s.id}
                        onClick={() => setService(s.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${service === s.id ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                      >
                        <div className={`p-2 rounded-lg bg-white shadow-sm ${s.color}`}>
                           <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700">{s.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">2. Referencia / Número de Cuenta</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Escanea el código o teclea la referencia"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">3. Monto a Pagar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-slate-500 font-bold text-lg">$</span>
                  </div>
                  <input 
                    type="number" 
                    value={serviceAmount}
                    onChange={e => setServiceAmount(parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleAdd} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
            Agregar a la Cuenta
          </button>
        </div>

      </div>
    </div>
  );
}
