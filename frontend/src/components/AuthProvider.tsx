"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  token: string | null;
  tenantId: string | null;
  user: any | null;
  login: (token: string, tenantId: string, user: any) => void;
  logout: () => void;
  switchActiveTenant: (token: string, tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  tenantId: null,
  user: null,
  login: () => {},
  logout: () => {},
  switchActiveTenant: () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('facturapro_token') : null);
  const [tenantId, setTenantId] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('facturapro_tenantId') : null);
  const [user, setUser] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('facturapro_user');
      if (u) {
        try { return JSON.parse(u); } catch(e) {}
      }
    }
    return null;
  });

  useEffect(() => {
    // Interceptar Fetch Global
    if (typeof window !== 'undefined' && !(window as any).__fetchIntercepted) {
      const originalFetch = window.fetch;
      (window as any).__fetchIntercepted = true;
      window.fetch = async function (resource, config = {}) {
        const headers = new Headers(config.headers || {});
      
      const urlString = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
      const isExternal = urlString.startsWith('http') && !urlString.includes('localhost') && !urlString.includes(window.location.hostname);

      if (!isExternal) {
        const savedToken = localStorage.getItem('facturapro_token');
        const savedTenantId = localStorage.getItem('facturapro_tenantId');

        if (savedToken) headers.set('Authorization', `Bearer ${savedToken}`);
        if (savedTenantId) headers.set('x-tenant-id', savedTenantId);

        // Only force JSON if not sending FormData
        if (!(config.body instanceof FormData) && !headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      }

      config.headers = headers;
      return originalFetch(resource, config);
      };
    }

    // Check localStorage
    const savedToken = localStorage.getItem('facturapro_token');
    const savedTenantId = localStorage.getItem('facturapro_tenantId');
    const savedUser = localStorage.getItem('facturapro_user');

    if (savedToken && savedTenantId && savedUser) {
      setToken(savedToken);
      setTenantId(savedTenantId);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'CASHIER' && pathname !== '/pos') {
        router.push('/pos');
      }
    } else {
      // Not authenticated
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/sso') && !pathname.startsWith('/portal')) {
        router.push('/login');
      }
    }
    setLoading(false);
  }, [pathname]);

  const login = useCallback((jwt: string, tId: string, usr: any) => {
    localStorage.setItem('facturapro_token', jwt);
    localStorage.setItem('facturapro_tenantId', tId);
    localStorage.setItem('facturapro_user', JSON.stringify(usr));
    setToken(jwt);
    setTenantId(tId);
    setUser(usr);
    if (usr.role === 'CASHIER') {
      window.location.href = '/pos';
    } else {
      // Si estamos en FacturaPro, root es '/'
      window.location.href = '/';
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('facturapro_token');
    localStorage.removeItem('facturapro_tenantId');
    localStorage.removeItem('facturapro_user');
    setToken(null);
    setTenantId(null);
    setUser(null);
    window.location.href = '/login';
  }, [router]);

  const switchActiveTenant = useCallback((newToken: string, newTenantId: string) => {
    localStorage.setItem('facturapro_token', newToken);
    localStorage.setItem('facturapro_tenantId', newTenantId);
    setToken(newToken);
    setTenantId(newTenantId);
    // Hard reload the page to flush React state fully to the new tenant context
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  // Prevent rendering protected routes until fully checked
  if (!token && !pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/sso') && !pathname.startsWith('/portal')) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ token, tenantId, user, login, logout, switchActiveTenant }}>
      {children}
    </AuthContext.Provider>
  );
}
