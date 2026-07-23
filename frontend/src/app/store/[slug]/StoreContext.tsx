"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api";

export interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  brand: string;
  category: string;
  imageUrl?: string;
  model?: string;
  exchangeRate?: number;
  source: "syscom" | "local";
  hidePrice?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  isAddedPanelOpen: boolean;
  setIsAddedPanelOpen: (open: boolean) => void;
  addedProduct: Product | null;
  complementaryProducts: Product[];
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  currency: 'MXN' | 'USD';
  setCurrency: (curr: 'MXN' | 'USD') => void;
  includeIva: boolean;
  setIncludeIva: (inc: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = params?.slug as string || "default";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isAddedPanelOpen, setIsAddedPanelOpen] = useState(false);
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);
  const [complementaryProducts, setComplementaryProducts] = useState<Product[]>([]);

  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [currency, setCurrency] = useState<'MXN' | 'USD'>('MXN');
  const [includeIva, setIncludeIva] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('radiotecpro_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch(e){}
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('radiotecpro_cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      alert(`Lo sentimos, el producto ${product.model || product.brand} no tiene existencias por el momento.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { product, quantity }];
    });
    
    setAddedProduct(product);
    
    try {
       // Fetch complementary products based on category or search
       const catQuery = product.category || product.brand || 'kit';
       const res = await axios.get(`${API_URL}/public-store/${slug}/products?search=${catQuery}`);
       if (res.data && res.data.products) {
          const comp = res.data.products.filter((p:Product) => p.id !== product.id).slice(0, 4);
          setComplementaryProducts(comp);
       }
    } catch(e) {
       console.error(e);
       setComplementaryProducts([]);
    }
    
    setIsCartOpen(false);
    setIsAddedPanelOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        if (newQuantity > item.product.stock && item.product.stock > 0) return item; 
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <StoreContext.Provider value={{
      cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateQuantity, clearCart,
      isAddedPanelOpen, setIsAddedPanelOpen, addedProduct, complementaryProducts,
      globalSearchTerm, setGlobalSearchTerm, currency, setCurrency, includeIva, setIncludeIva
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
