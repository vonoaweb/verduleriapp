import type { Quote } from '@/types';

export const quotes: Quote[] = [
  {
    id: 'QT-001',
    customerName: 'María García',
    customerPhone: '+57 300 111 2233',
    customerEmail: 'maria@example.com',
    items: [
      { productId: '1', productName: 'Manzana Roja', quantity: 5, price: 3500, unit: 'kg', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
      { productId: '3', productName: 'Tomate', quantity: 3, price: 4200, unit: 'kg', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
      { productId: '4', productName: 'Lechuga', quantity: 2, price: 3000, unit: 'unidad', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
    ],
    date: '2025-01-15T10:30:00Z',
    status: 'completed',
    total: 34600,
    notes: 'Cliente recurrente, entregar antes de mediodía',
  },
  {
    id: 'QT-002',
    customerName: 'Carlos Rodríguez',
    customerPhone: '+57 301 222 3344',
    items: [
      { productId: '2', productName: 'Banana', quantity: 4, price: 2800, unit: 'kg', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
      { productId: '5', productName: 'Naranja', quantity: 6, price: 3200, unit: 'kg', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
      { productId: '7', productName: 'Uva', quantity: 2, price: 8500, unit: 'kg', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
    ],
    date: '2025-01-18T14:15:00Z',
    status: 'responded',
    total: 45800,
  },
  {
    id: 'QT-003',
    customerName: 'Ana Martínez',
    customerPhone: '+57 302 333 4455',
    customerEmail: 'ana@restaurante.com',
    items: [
      { productId: '3', productName: 'Tomate', quantity: 10, price: 4200, unit: 'kg', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
      { productId: '4', productName: 'Lechuga', quantity: 8, price: 3000, unit: 'unidad', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
      { productId: '6', productName: 'Zanahoria', quantity: 5, price: 2500, unit: 'kg', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
      { productId: '12', productName: 'Pimentón', quantity: 4, price: 4500, unit: 'kg', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
    ],
    date: '2025-01-20T09:00:00Z',
    status: 'pending',
    total: 99500,
    notes: 'Pedido semanal para restaurante',
  },
  {
    id: 'QT-004',
    customerName: 'Luis Hernández',
    customerPhone: '+57 303 444 5566',
    items: [
      { productId: '8', productName: 'Piña', quantity: 3, price: 5500, unit: 'unidad', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
      { productId: '14', productName: 'Sandía', quantity: 2, price: 4800, unit: 'unidad', vendorId: 'v3', vendorName: 'Mercado Fresco La Villa', vendorWhatsApp: '+573204567890' },
    ],
    date: '2025-01-21T16:45:00Z',
    status: 'pending',
    total: 26100,
  },
  {
    id: 'QT-005',
    customerName: 'Sofia López',
    customerPhone: '+57 304 555 6677',
    customerEmail: 'sofia@example.com',
    items: [
      { productId: '1', productName: 'Manzana Roja', quantity: 2, price: 3500, unit: 'kg', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
      { productId: '11', productName: 'Fresa', quantity: 1, price: 12000, unit: 'kg', vendorId: 'v1', vendorName: 'Frutas del Campo', vendorWhatsApp: '+573101234567' },
      { productId: '13', productName: 'Pepino', quantity: 3, price: 2800, unit: 'kg', vendorId: 'v2', vendorName: 'Verduras Doña María', vendorWhatsApp: '+573159876543' },
    ],
    date: '2025-01-22T11:20:00Z',
    status: 'completed',
    total: 29900,
  },
];

export const getQuoteById = (id: string): Quote | undefined =>
  quotes.find((q) => q.id === id);

export const getQuotesByStatus = (status: Quote['status']): Quote[] =>
  quotes.filter((q) => q.status === status);
