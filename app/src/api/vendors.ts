import api from './client';

export interface ApiVendor {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  address: string | null;
  whatsapp: string;
  coverImageUrl: string | null;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  accessCode?: string | null; // codigo del bot (solo en /me/profile)
  rating: number;
  totalSales: number;
  categories: string[];
  createdAt: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  _count?: {
    products: number;
    quoteItems?: number;
  };
}

interface VendorListResponse {
  vendors: ApiVendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const vendorsApi = {
  list(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<VendorListResponse> {
    return api.get('/vendors', params as any);
  },

  getById(id: string): Promise<ApiVendor> {
    return api.get(`/vendors/${id}`);
  },

  getMyProfile(): Promise<ApiVendor> {
    return api.get('/vendors/me/profile');
  },

  register(data: {
    businessName: string;
    description?: string;
    address?: string;
    whatsapp: string;
    categories?: string[];
  }): Promise<ApiVendor> {
    return api.post('/vendors/register', data);
  },

  update(id: string, data: Partial<{
    businessName: string;
    description: string;
    address: string;
    whatsapp: string;
    categories: string[];
  }>): Promise<ApiVendor> {
    return api.put(`/vendors/${id}`, data);
  },

  // Admin
  listAll(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<VendorListResponse> {
    return api.get('/vendors/admin/all', params as any);
  },

  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<ApiVendor> {
    return api.patch(`/vendors/${id}/status`, { status });
  },
};
