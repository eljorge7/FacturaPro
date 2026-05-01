'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, TrendingDown, DollarSign, Activity, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function InventoryDashboard() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId') || 'demo-tenant';
        
        // Fetch products and recent movements
        Promise.all([
            fetch('http://localhost:3005/products', { headers: { 'x-tenant-id': tenantId } }).then(r => r.json())
            // Para simplificar el Dashboard en esta etapa y evitar N+1, asumiremos un endpoint agregado a futuro para slowmovers
            // Por ahora estimaremos la regla 80/20 y capitalización.
        ])
        .then(([productsData]) => {
            const tangible = productsData.filter((p: any) => p.type === 'PRODUCT' || p.type === 'CONSUMABLE');
            setProducts(tangible);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-10 font-bold text-center text-slate-500">Calculando Valuación y Métricas de Desempeño...</div>;

    // --- CALCULAR METRICAS FINANCIERAS ---
    let totalCapital = 0;
    const valuationList = products.map(p => {
        const val = Math.max(0, p.stock) * (p.costPrice || (p.price * 0.7)); // fallback to 70% of price if cost not set
        totalCapital += val;
        return { ...p, valuation: val };
    }).sort((a, b) => b.valuation - a.valuation);

    // Pareto (80/20)
    let cumulative = 0;
    const pareto80Threshold = totalCapital * 0.80;
    const paretoItems = [];
    const restItems = [];
    
    for (const p of valuationList) {
        if (cumulative < pareto80Threshold) {
            paretoItems.push(p);
            cumulative += p.valuation;
        } else {
            restItems.push(p);
        }
    }

    // Slow Movers (Artificial simulation for demo since we didn't fetch movements per item)
    // Mostramos los de mayor valor retenido
    const slowMovers = valuationList
        .filter(p => p.stock > 0 && p.valuation > 500)
        .slice(0, 5); // Los top 5 más caros atascados

    // JIT Alerts (Low Stock)
    const jitAlerts = valuationList.filter(p => p.trackInventory !== false && p.stock <= p.minStock && p.minStock > 0);

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto w-full bg-slate-50/50 min-h-screen">
            <button onClick={() => router.push('/products')} className="flex items-center text-slate-500 hover:text-blue-600 font-bold mb-6 transition-colors">
                 <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Catálogo
            </button>
            
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                         <PieChart className="w-8 h-8 text-blue-600" />
                         Tablero Maestro de Inventario
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">Valuación patrimonial y análisis de rentabilidad (Regla 80/20).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-emerald-500 overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-32 h-32" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Capital Inmovilizado</h3>
                    <div className="text-4xl font-black text-slate-800">${totalCapital.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-sm text-slate-400 font-bold">MXN</span></div>
                    <p className="text-emerald-600 font-bold text-sm mt-4.5 bg-emerald-50 inline-block px-3 py-1 rounded-full">Dinero físico en Bodega</p>
                </div>
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-blue-500">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Artículos Críticos (Pareto)</h3>
                    <div className="text-4xl font-black text-slate-800">{paretoItems.length} <span className="text-sm text-slate-400 font-bold">SKUs</span></div>
                    <p className="text-blue-600 font-bold text-sm mt-4.5 bg-blue-50 inline-block px-3 py-1 rounded-full">Retienen el 80% del valor</p>
                </div>
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Catálogo Inactivo</h3>
                    <div className="text-4xl font-black text-slate-800">{(valuationList.length > 0 ? (restItems.length / valuationList.length) * 100 : 0).toFixed(0)}% <span className="text-sm text-slate-400 font-bold">Volumen</span></div>
                    <p className="text-rose-600 font-bold text-sm mt-4.5 bg-rose-50 inline-block px-3 py-1 rounded-full">Basura o Lento Movimiento</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Zona VIP 80/20 */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-blue-50/50 p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Activity className="text-blue-600 w-5 h-5"/> Tu 20% Supremo</h3>
                            <p className="text-slate-500 text-sm mt-1">Estos {paretoItems.length} artículos valen el 80% de tu dinero. Cuídalos.</p>
                        </div>
                    </div>
                    <div className="p-0">
                        {paretoItems.slice(0, 8).map((p, i) => (
                            <div key={p.id} className="flex justify-between items-center p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 font-black text-slate-300 text-lg text-right">#{i+1}</div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku || 'S/N'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-blue-600">${p.valuation.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{p.stock} {p.satUnitCode==='H87'?'PZS':p.satUnitCode||'UND'} en Stock</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Slow Movers */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-rose-50/50 p-6 border-b border-rose-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-rose-800 flex items-center gap-2"><TrendingDown className="text-rose-600 w-5 h-5"/> Lento Movimiento (Slow Movers)</h3>
                            <p className="text-rose-600/70 text-sm mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Dinero bloqueado sugiriendo promoción urgente.</p>
                        </div>
                    </div>
                    <div className="p-0">
                        {slowMovers.map((p, i) => (
                            <div key={p.id} className="flex justify-between items-center p-4 border-b border-slate-100 hover:bg-rose-50/30 transition-colors">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku || 'S/N'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-800">${p.valuation.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                                    <div className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded mt-1 inline-block">Atascado: {p.stock} unidades</div>
                                </div>
                            </div>
                        ))}
                        {slowMovers.length === 0 && (
                            <div className="p-10 text-center text-slate-400 font-bold">
                                ¡Felicidades! Todo tu inventario caro está en rotación.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* JIT Alerts Section */}
            <div className="mt-8 bg-amber-50 rounded-3xl border border-amber-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-amber-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-amber-800 flex items-center gap-2"><AlertTriangle className="text-amber-600 w-5 h-5"/> Alertas Críticas (Desabasto Inminente)</h3>
                        <p className="text-amber-700/70 text-sm mt-1">Artículos que alcanzaron el stock mínimo y urge gestionar su compra.</p>
                    </div>
                    {jitAlerts.length > 0 && (
                        <button onClick={() => router.push('/purchases/alerts')} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm">
                            Ir a Requisiciones JIT
                        </button>
                    )}
                </div>
                <div className="p-0">
                    {jitAlerts.slice(0, 5).map((p, i) => (
                        <div key={p.id} className="flex justify-between items-center p-4 border-b border-amber-100 hover:bg-amber-100/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center font-black text-amber-600">{p.stock}</div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku || 'S/N'}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-amber-600">Alerta: {p.minStock} min</div>
                                <div className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded mt-1 inline-block">Faltan {(p.maxStock || (p.minStock*2)) - p.stock} pzs para lleno</div>
                            </div>
                        </div>
                    ))}
                    {jitAlerts.length === 0 && (
                        <div className="p-10 text-center text-amber-600 font-bold">
                            Tu inventario está sano. Nada bajo los mínimos por ahora.
                        </div>
                    )}
                    {jitAlerts.length > 5 && (
                        <div className="p-4 text-center bg-white border-t border-amber-100">
                            <button onClick={() => router.push('/purchases/alerts')} className="font-bold text-amber-600 hover:text-amber-700 text-sm">Ver las {jitAlerts.length - 5} alertas restantes...</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
