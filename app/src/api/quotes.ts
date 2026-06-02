import api from './client';

export interface ApiQuote {
  id: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  status: 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PAID' | 'UNPAID';
  total: number;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    vendorId: string;
    quantity: number;
    price: number;
    unit: string;
    product: { name: string; imageUrl: string | null };
    vendor: { businessName: string; whatsapp: string };
  }>;
}

interface QuoteListResponse {
  quotes: ApiQuote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuoteStats {
  total: number;
  pending: number;
  responded: number;
  completed: number;
  monthlyRevenue: number;
}

export interface CreateQuoteResponse extends ApiQuote {
  whatsappLinks: Array<{ vendorName: string; link: string }>;
}

export const quotesApi = {
  create(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
    items: Array<{
      productId: string;
      vendorId: string;
      quantity: number;
      price: number;
      unit: string;
    }>;
  }): Promise<CreateQuoteResponse> {
    return api.post('/quotes', data);
  },

  list(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<QuoteListResponse> {
    return api.get('/quotes', params as any);
  },

  getById(id: string): Promise<ApiQuote> {
    return api.get(`/quotes/${id}`);
  },

  getStats(): Promise<QuoteStats> {
    return api.get('/quotes/stats');
  },

  updateStatus(id: string, status: 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED'): Promise<ApiQuote> {
    return api.patch(`/quotes/${id}/status`, { status });
  },

  // ─── Pagos (pasarela) ───────────────────────────
  getPayInfo(id: string): Promise<PayInfo> {
    return api.get(`/quotes/${id}/pay-info`);
  },

  pay(id: string, method = 'demo'): Promise<{ success: boolean; paymentStatus: 'PAID' | 'UNPAID'; quoteId: string }> {
    return api.post(`/quotes/${id}/pay`, { method });
  },
};

export interface PayInfo {
  id: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: 'PAID' | 'UNPAID';
  items: Array<{
    quantity: number;
    price: number;
    unit: string;
    product: { name: string };
  }>;
}
