import type { Vendor } from '@/types';

export const vendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Frutas del Campo',
    ownerName: 'José Martínez',
    phone: '+57 310 123 4567',
    whatsapp: '+573101234567',
    email: 'jose@frutasdelcampo.com',
    avatar: '/admin-avatar.jpg',
    coverImage: '/category-fruits.jpg',
    description: 'Las mejores frutas frescas traídas directamente del campo. Calidad garantizada y precios justos para nuestros clientes.',
    address: 'Calle 45 #12-34, Plaza de Mercado Paloquemao, Bogotá',
    status: 'active',
    joinDate: '2024-03-15T00:00:00Z',
    rating: 4.8,
    totalSales: 1250,
    categories: ['fruit'],
  },
  {
    id: 'v2',
    name: 'Verduras Doña María',
    ownerName: 'María González',
    phone: '+57 315 987 6543',
    whatsapp: '+573159876543',
    email: 'maria@verdurasdonamaria.com',
    avatar: '/admin-avatar.jpg',
    coverImage: '/category-vegetables.jpg',
    description: 'Verduras orgánicas cultivadas con amor. Especialistas en hortalizas frescas para restaurantes y hogares.',
    address: 'Carrera 28 #56-89, Mercado de las Pulgas, Medellín',
    status: 'active',
    joinDate: '2024-06-20T00:00:00Z',
    rating: 4.9,
    totalSales: 890,
    categories: ['vegetable'],
  },
  {
    id: 'v3',
    name: 'Mercado Fresco La Villa',
    ownerName: 'Carlos y Ana López',
    phone: '+57 320 456 7890',
    whatsapp: '+573204567890',
    email: 'contacto@mercadofrescolavilla.com',
    avatar: '/admin-avatar.jpg',
    coverImage: '/hero-produce.jpg',
    description: 'Mercado familiar con 20 años de experiencia. Ofrecemos frutas y verduras seleccionadas diariamente.',
    address: 'Avenida 68 #25-40, Local 105, Cali',
    status: 'active',
    joinDate: '2024-01-10T00:00:00Z',
    rating: 4.7,
    totalSales: 2100,
    categories: ['fruit', 'vegetable'],
  },
];

export const getVendorById = (id: string): Vendor | undefined =>
  vendors.find((v) => v.id === id);

export const getActiveVendors = (): Vendor[] =>
  vendors.filter((v) => v.status === 'active');
