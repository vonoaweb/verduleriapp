export interface Vendor {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  avatar: string;
  coverImage?: string;
  description: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  rating: number;
  totalSales: number;
  categories: string[];
}

export interface Product {
  id: string;
  name: string;
  category: 'fruit' | 'vegetable';
  price: number;
  unit: string;
  image: string;
  description: string;
  status: 'active' | 'inactive';
  featured?: boolean;
  vendorId: string;
  vendorName: string;
}

export interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  vendorId: string;
  vendorName: string;
  vendorWhatsApp: string;
}

export type QuoteStatus = 'pending' | 'responded' | 'completed' | 'cancelled';

export interface Quote {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: QuoteItem[];
  date: string;
  status: QuoteStatus;
  total: number;
  notes?: string;
  vendorId?: string;
}

export type Category = 'fruit' | 'vegetable';

export interface CategoryInfo {
  id: Category;
  name: string;
  image: string;
  count: number;
}
