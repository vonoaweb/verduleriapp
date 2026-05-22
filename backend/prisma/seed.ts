import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales...');

  // ─── CREAR ADMIN ─────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@verduleriapp.com' },
    update: {},
    create: {
      email: 'admin@verduleriapp.com',
      passwordHash: adminPassword,
      name: 'Administrador',
      phone: '+56912345678',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // ─── CREAR VENDEDORES ────────────────────────────
  const vendorPassword = await bcrypt.hash('vendor123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'maria@frutasmaria.cl' },
    update: {},
    create: {
      email: 'maria@frutasmaria.cl',
      passwordHash: vendorPassword,
      name: 'María González',
      phone: '+56987654321',
      role: 'VENDOR',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'pedro@hortalizaspedro.cl' },
    update: {},
    create: {
      email: 'pedro@hortalizaspedro.cl',
      passwordHash: vendorPassword,
      name: 'Pedro Sánchez',
      phone: '+56976543210',
      role: 'VENDOR',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'carmen@frescosdelcampo.cl' },
    update: {},
    create: {
      email: 'carmen@frescosdelcampo.cl',
      passwordHash: vendorPassword,
      name: 'Carmen Rojas',
      phone: '+56965432109',
      role: 'VENDOR',
    },
  });

  // ─── CREAR PERFILES DE VENDEDOR ──────────────────
  const vendor1 = await prisma.vendor.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      businessName: 'Frutas María',
      description: 'Las mejores frutas frescas directo del campo a tu mesa. Más de 15 años de experiencia.',
      address: 'Feria Lo Valledor, Local 45',
      whatsapp: '+56987654321',
      status: 'ACTIVE',
      rating: 4.8,
      totalSales: 234,
      categories: ['Frutas'],
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      businessName: 'Hortalizas Pedro',
      description: 'Verduras orgánicas cultivadas con amor. Producción sustentable y precios justos.',
      address: 'Mercado Central, Pasillo 3',
      whatsapp: '+56976543210',
      status: 'ACTIVE',
      rating: 4.6,
      totalSales: 189,
      categories: ['Verduras'],
    },
  });

  const vendor3 = await prisma.vendor.upsert({
    where: { userId: user3.id },
    update: {},
    create: {
      userId: user3.id,
      businessName: 'Frescos del Campo',
      description: 'Frutas y verduras de temporada, siempre frescas. Delivery a domicilio disponible.',
      address: 'Av. La Florida 1234',
      whatsapp: '+56965432109',
      status: 'ACTIVE',
      rating: 4.9,
      totalSales: 312,
      categories: ['Frutas', 'Verduras'],
    },
  });

  console.log('✅ Vendedores creados:', vendor1.businessName, vendor2.businessName, vendor3.businessName);

  // ─── CREAR PRODUCTOS ─────────────────────────────
  const products = await Promise.all([
    // Frutas - María
    prisma.product.create({
      data: { vendorId: vendor1.id, name: 'Manzana Royal Gala', category: 'FRUIT', price: 1490, unit: 'kg', description: 'Manzanas dulces y crujientes, perfectas para snacks y ensaladas.', imageUrl: '/apple.jpg', status: 'ACTIVE', featured: true },
    }),
    prisma.product.create({
      data: { vendorId: vendor1.id, name: 'Plátano', category: 'FRUIT', price: 890, unit: 'kg', description: 'Plátanos maduros y dulces, ideales para batidos y postres.', imageUrl: '/banana.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor1.id, name: 'Naranja de Jugo', category: 'FRUIT', price: 990, unit: 'kg', description: 'Naranjas jugosas, perfectas para jugo fresco natural.', imageUrl: '/orange.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor1.id, name: 'Frutilla', category: 'FRUIT', price: 2490, unit: 'kg', description: 'Frutillas rojas y dulces de temporada.', imageUrl: '/strawberry.jpg', status: 'ACTIVE', featured: true },
    }),
    prisma.product.create({
      data: { vendorId: vendor1.id, name: 'Uva Negra', category: 'FRUIT', price: 1990, unit: 'kg', description: 'Uvas negras sin semilla, dulces y jugosas.', imageUrl: '/grape.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor1.id, name: 'Sandía', category: 'FRUIT', price: 690, unit: 'kg', description: 'Sandía refrescante para los días calurosos.', imageUrl: '/watermelon.jpg', status: 'ACTIVE' },
    }),
    // Verduras - Pedro
    prisma.product.create({
      data: { vendorId: vendor2.id, name: 'Tomate', category: 'VEGETABLE', price: 1290, unit: 'kg', description: 'Tomates maduros en su punto justo para ensaladas y salsas.', imageUrl: '/tomato.jpg', status: 'ACTIVE', featured: true },
    }),
    prisma.product.create({
      data: { vendorId: vendor2.id, name: 'Lechuga Costina', category: 'VEGETABLE', price: 590, unit: 'unidad', description: 'Lechuga fresca y crocante, base perfecta para ensaladas.', imageUrl: '/lettuce.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor2.id, name: 'Zanahoria', category: 'VEGETABLE', price: 690, unit: 'kg', description: 'Zanahorias frescas, ideales para jugos y guisos.', imageUrl: '/carrot.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor2.id, name: 'Cebolla', category: 'VEGETABLE', price: 790, unit: 'kg', description: 'Cebollas de primera calidad para todas tus recetas.', imageUrl: '/onion.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor2.id, name: 'Papa', category: 'VEGETABLE', price: 890, unit: 'kg', description: 'Papas de excelente calidad, versátiles para cualquier preparación.', imageUrl: '/potato.jpg', status: 'ACTIVE' },
    }),
    // Mixto - Carmen
    prisma.product.create({
      data: { vendorId: vendor3.id, name: 'Piña Golden', category: 'FRUIT', price: 1990, unit: 'unidad', description: 'Piña dulce y aromática, perfecta para postres tropicales.', imageUrl: '/pineapple.jpg', status: 'ACTIVE', featured: true },
    }),
    prisma.product.create({
      data: { vendorId: vendor3.id, name: 'Pepino', category: 'VEGETABLE', price: 490, unit: 'unidad', description: 'Pepinos frescos y crujientes para ensaladas.', imageUrl: '/cucumber.jpg', status: 'ACTIVE' },
    }),
    prisma.product.create({
      data: { vendorId: vendor3.id, name: 'Pimentón Rojo', category: 'VEGETABLE', price: 1890, unit: 'kg', description: 'Pimentones rojos dulces, ideales para parrilladas.', imageUrl: '/pepper.jpg', status: 'ACTIVE' },
    }),
  ]);

  console.log(`✅ ${products.length} productos creados`);

  // ─── CREAR CLIENTE DE EJEMPLO ────────────────────
  const customerPassword = await bcrypt.hash('cliente123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@ejemplo.com' },
    update: {},
    create: {
      email: 'cliente@ejemplo.com',
      passwordHash: customerPassword,
      name: 'Juan Cliente',
      phone: '+56911111111',
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Cliente de ejemplo creado:', customer.email);

  // ─── CREAR COTIZACIONES DE EJEMPLO ───────────────
  const quote1 = await prisma.quote.create({
    data: {
      userId: customer.id,
      customerName: 'Juan Cliente',
      customerPhone: '+56911111111',
      customerEmail: 'cliente@ejemplo.com',
      status: 'PENDING',
      total: 7360,
      notes: 'Necesito para el viernes por favor',
      items: {
        create: [
          { productId: products[0].id, vendorId: vendor1.id, quantity: 2, price: 1490, unit: 'kg' },
          { productId: products[3].id, vendorId: vendor1.id, quantity: 1, price: 2490, unit: 'kg' },
          { productId: products[6].id, vendorId: vendor2.id, quantity: 1.5, price: 1290, unit: 'kg' },
        ],
      },
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      customerName: 'Ana Pérez',
      customerPhone: '+56922222222',
      status: 'RESPONDED',
      total: 4870,
      items: {
        create: [
          { productId: products[11].id, vendorId: vendor3.id, quantity: 2, price: 1990, unit: 'unidad' },
          { productId: products[1].id, vendorId: vendor1.id, quantity: 1, price: 890, unit: 'kg' },
        ],
      },
    },
  });

  console.log('✅ Cotizaciones de ejemplo creadas');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba:');
  console.log('   Admin:    admin@verduleriapp.com / admin123');
  console.log('   Vendedor: maria@frutasmaria.cl / vendor123');
  console.log('   Vendedor: pedro@hortalizaspedro.cl / vendor123');
  console.log('   Vendedor: carmen@frescosdelcampo.cl / vendor123');
  console.log('   Cliente:  cliente@ejemplo.com / cliente123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
