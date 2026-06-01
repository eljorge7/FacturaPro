'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Box, Search, PackagePlus, ArrowRight, Save, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickReceivePage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    
    const [receivingList, setReceivingList] = useState<any[]>([]);
    const [reference, setReference] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const searchInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

    useEffect(() => {
        if (token) fetchProducts();
    }, [token]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${baseUrl}/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setProducts(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!searchTerm) {
            setFilteredProducts([]);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const matches = products.filter(p => 
            p.name.toLowerCase().includes(lower) || 
            (p.barcode && p.barcode.includes(lower))
        );
        setFilteredProducts(matches);
    }, [searchTerm, products]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredProducts.length === 1) {
                addToReceiving(filteredProducts[0]);
            } else {
                const exact = products.find(p => p.barcode === searchTerm);
                if (exact) addToReceiving(exact);
            }
        }
    };

    const addToReceiving = (product: any) => {
        if (!product.trackInventory) {
            alert('Este producto no tiene seguimiento de inventario activado.');
            setSearchTerm('');
            return;
        }
        const existing = receivingList.find(i => i.productId === product.id);
        if (existing) {
            setReceivingList(receivingList.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setReceivingList([{ 
                productId: product.id, 
                name: product.name, 
                barcode: product.barcode, 
                quantity: 1, 
                currentStock: product.stock,
                hasBatches: product.hasBatches || false,
                batchNumber: '',
                expiryDate: ''
            }, ...receivingList]);
        }
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const updateQuantity = (productId: string, val: number) => {
        setReceivingList(receivingList.map(i => i.productId === productId ? { ...i, quantity: val } : i));
    };

    const updateBatch = (productId: string, field: string, val: string) => {
        setReceivingList(receivingList.map(i => i.productId === productId ? { ...i, [field]: val } : i));
    };

    const removeItem = (productId: string) => {
        setReceivingList(receivingList.filter(i => i.productId !== productId));
    };

    const handleSave = async () => {
        if (receivingList.length === 0) return;
        setIsSaving(true);
        try {
            const payload = receivingList.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                reference: reference || 'Recepción Rápida Mostrador',
                batchNumber: i.batchNumber || null,
                expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString() : null
            }));
            
            const res = await fetch(`${baseUrl}/inventory/quick-receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Mercancía ingresada correctamente.');
                setReceivingList([]);
                setReference('');
                fetchProducts(); // refresh current stocks
            } else {
                alert('Error al ingresar mercancía.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <PackagePlus className="h-8 w-8 text-indigo-600" /> Recepción Rápida (Entrada a Almacén)
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Escanea los productos conforme bajan del camión para agregarlos inmediatamente al stock.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel Izquierdo: Escáner y Búsqueda */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                            Escáner de Código de Barras
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                autoFocus
                                placeholder="Pistolea el código aquí..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 font-bold text-lg text-slate-800 transition-all"
                            />
                        </div>
                        
                        {filteredProducts.length > 0 && searchTerm && (
                            <div className="mt-2 border border-slate-200 rounded-xl max-h-60 overflow-y-auto bg-white shadow-lg absolute z-10 w-[calc(100%-3rem)] lg:w-[calc(33.333%-2rem)]">
                                {filteredProducts.map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => addToReceiving(p)}
                                        className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 flex flex-col last:border-0"
                                    >
                                        <span className="font-bold text-sm text-slate-800">{p.name}</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-slate-500 flex items-center gap-1"><Tag className="w-3 h-3"/> {p.barcode || 'Sin código'}</span>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Stock actual: {p.stock}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200">
                        <h3 className="font-bold text-amber-800 mb-2">Instrucciones:</h3>
                        <ol className="list-decimal list-inside text-sm text-amber-700 space-y-2">
                            <li>Apunta el cursor al cuadro de búsqueda.</li>
                            <li>Usa tu lector de código de barras.</li>
                            <li>Edita las cantidades en la tabla de la derecha.</li>
                            <li>Carga la mercancía al sistema dándole a <b>Procesar Entrada</b>.</li>
                        </ol>
                    </div>
                </div>

                {/* Panel Derecho: Lista de Recepción */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0 rounded-t-3xl">
                        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Box className="w-5 h-5" /> Lista de Mercancía
                        </h2>
                        <span className="bg-indigo-100 text-indigo-700 font-black px-3 py-1 rounded-lg text-sm">
                            {receivingList.reduce((acc, i) => acc + i.quantity, 0)} Pzas en total
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                        {receivingList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <PackagePlus className="w-16 h-16 mb-4 opacity-20" />
                                <p className="font-medium">No hay artículos listos para ingresar.</p>
                                <p className="text-sm">Empieza a escanear productos a la izquierda.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {receivingList.map(item => (
                                    <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm hover:border-indigo-200 transition-colors">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800">{item.name}</h3>
                                            <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                                <span>Cód: {item.barcode || 'N/A'}</span>
                                                <span className="text-slate-400">|</span>
                                                <span>Stock previo: {item.currentStock}</span>
                                            </div>
                                            {item.hasBatches && (
                                                <div className="mt-3 flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="N° de Lote" 
                                                        value={item.batchNumber}
                                                        onChange={e => updateBatch(item.productId, 'batchNumber', e.target.value)}
                                                        className="text-sm bg-slate-50 border border-slate-200 rounded-md px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                    <input 
                                                        type="date" 
                                                        value={item.expiryDate}
                                                        onChange={e => updateBatch(item.productId, 'expiryDate', e.target.value)}
                                                        className="text-sm bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad Recibida</span>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                                    className="w-20 text-center font-black text-xl bg-slate-100 border border-slate-200 rounded-xl py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <button onClick={() => removeItem(item.productId)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 bg-white shrink-0 rounded-b-3xl">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Referencia / Nota (Opcional)</label>
                            <input 
                                type="text" 
                                placeholder="Ej. Factura F-1029, Proveedor Sabritas..." 
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <Button 
                            onClick={handleSave}
                            disabled={receivingList.length === 0 || isSaving}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-indigo-600/20 gap-2"
                        >
                            {isSaving ? 'Guardando...' : (
                                <>Procesar Entrada a Almacén <ArrowRight className="w-5 h-5" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
