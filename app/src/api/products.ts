import api from './client';

export interface ApiProduct {
  id: string;
  vendorId: string;
  name: string;
  category: 'FRUIT' | 'VEGETABLE';
  price: number;
  unit: string;
  description: string | null;
  imageUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    businessName: string;
    whatsapp: string;
    rating?: number;
  };
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
}

interface ProductListResponse {
  products: ApiProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productsApi = {
  list(params?: {
    category?: string;
    vendorId?: string;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ProductListResponse> {
    return api.get('/products', params as any);
  },

  getById(id: string): Promise<ApiProduct> {
    return api.get(`/products/${id}`);
  },

  getMyProducts(): Promise<ApiProduct[]> {
    return api.get('/products/vendor/mine');
  },

  create(data: {
    name: string;
    category: 'FRUIT' | 'VEGETABLE';
    price: number;
    unit: string;
    description?: string;
    imageUrl?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    featured?: boolean;
  }): Promise<ApiProduct> {
    return api.post('/products', data);
  },

  update(id: string, data: Partial<{
    name: string;
    category: 'FRUIT' | 'VEGETABLE';
    price: number;
    unit: string;
    description: string;
    imageUrl: string;
    status: 'ACTIVE' | 'INACTIVE';
    featured: boolean;
  }>): Promise<ApiProduct> {
    return api.put(`/products/${id}`, data);
  },

  delete(id: string): Promise<{ message: string }> {
    return api.delete(`/products/${id}`);
  },
};
