const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || "https://facturapro.radiotecpro.com/api");
const getHeaders = (tenantId?: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (tenantId) headers['x-tenant-id'] = tenantId;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const ExpensesAPI = {
  getSummary: async (tenantId: string) => {
    const res = await fetch(`${BASE_URL}/diot/summary`, {
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Error fetching DIOT summary');
    return res.json();
  },

  getExpenses: async (tenantId: string) => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Error fetching expenses');
    return res.json();
  },

  getCategories: async (tenantId: string) => {
    const res = await fetch(`${BASE_URL}/expense-categories`, {
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Error fetching categories');
    return res.json();
  },

  getSuppliers: async (tenantId: string) => {
    const res = await fetch(`${BASE_URL}/suppliers`, {
      headers: getHeaders(tenantId),
    });
    if (!res.ok) throw new Error('Error fetching suppliers');
    return res.json();
  },

  createManual: async (tenantId: string, data: any) => {
    const res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 
        ...getHeaders(tenantId),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Error creating expense');
    }
    return res.json();
  },

  previewXml: async (tenantId: string, xmlContent: string) => {
    const res = await fetch(`${BASE_URL}/expenses/preview-xml`, {
      method: 'POST',
      headers: {
        ...getHeaders(tenantId),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xmlContent })
    });
    if (!res.ok) throw new Error('Error parsing XML');
    return res.json();
  },

  confirmXml: async (tenantId: string, xmlContent: string) => {
    const res = await fetch(`${BASE_URL}/expenses/upload-xml`, {
      method: 'POST',
      headers: {
        ...getHeaders(tenantId),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xmlContent })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error confirmando el XML en el backend');
    }
    return res.json();
  },

  deleteExpense: async (id: string) => {
    const res = await fetch(`${BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error deleting expense');
    return res.json();
  }
};
