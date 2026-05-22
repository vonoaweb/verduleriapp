# Plan: Feature de Vendedores - Marketplace

## Objetivo
Permitir que multiples vendedores/regional publiciten sus frutas y verduras con fotos, precios y descripciones. Los clientes ven productos de todos los vendedores y cotizan directamente por WhatsApp al vendedor correspondiente.

## Cambios en Tipos de Datos

### Nuevo: Vendor (Vendedor)
```typescript
interface Vendor {
  id: string;
  name: string;           // Nombre del negocio
  ownerName: string;      // Nombre del dueño
  phone: string;          // Teléfono de contacto
  whatsapp: string;       // Número de WhatsApp para cotizaciones
  email: string;
  avatar: string;         // Foto de perfil
  coverImage?: string;    // Imagen de portada
  description: string;    // Descripción del negocio
  address: string;        // Dirección
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  rating: number;         // 0-5
  totalSales: number;
  categories: string[];   // Categorías que vende
}
```

### Producto actualizado
- Agregar `vendorId: string` - referencia al vendedor
- Agregar `vendorName: string` - nombre para mostrar rápido

### Cotización actualizada  
- Agregar `vendorId?: string` - para cotizaciones dirigidas a un vendedor
- O manejar por items (cada item con su vendorId)

## Nuevos Datos Mock
- 3 vendedores de ejemplo con datos realistas
- Distribuir los 16 productos entre los 3 vendedores
- Agregar más productos para tener variedad

## Nuevas Páginas

### `/vendedor` - Dashboard del Vendedor
- Estadísticas: productos activos, cotizaciones recibidas, ingresos estimados
- Gráfico de cotizaciones recientes
- Productos más cotizados
- Cotizaciones pendientes (tabla resumen)

### `/vendedor/productos` - Mis Productos
- Grid/card de productos del vendedor logueado
- Cada card: imagen, nombre, precio, stock/estado
- Botón "+ Nuevo Producto" → redirige a /vendedor/productos/nuevo
- Botón editar/eliminar en cada card
- Filtros por categoría y estado

### `/vendedor/productos/nuevo` - Subir Nuevo Producto (IMPORTANTE - esta es la página principal que pidió el usuario)
- Formulario completo:
  - Nombre del producto (input)
  - Categoría: Fruta / Verdura (select/tabs)
  - Precio (input numérico con formato de moneda)
  - Unidad: kg, unidad, libra, bandeja (select)
  - Descripción (textarea)
  - Foto del producto (drag & drop / click para subir, con preview)
  - Estado: Activo / Inactivo (toggle)
- Preview del producto en tiempo real (cómo se vería en el catálogo)
- Botón "Publicar Producto"
- Animaciones de éxito al publicar

### `/vendedor/cotizaciones` - Mis Cotizaciones
- Cotizaciones recibidas SOLO para productos de este vendedor
- Filtros por estado, fecha
- Cards con info del cliente y productos cotizados
- Botón para responder por WhatsApp
- Marcar como respondida/completada

## Actualizaciones a Páginas Existentes

### Catálogo (`/#/catalogo`)
- Mostrar nombre del vendedor en cada product card
- Agregar filtro por vendedor
- Badge del vendedor en las cards

### Cotizador WhatsApp (`/#/cotizar`)
- Los productos deben agruparse/enviarse al vendedor correspondiente
- El mensaje de WhatsApp debe ir al número del vendedor
- Si hay productos de múltiples vendedores, enviar mensajes separados

### Navbar
- Agregar link "Vender" que lleva a /vendedor

### Admin
- Agregar gestión de vendedores (aprobar, desactivar)

## Flujo de Cotización Actualizado
1. Cliente ve catálogo con productos de todos los vendedores
2. Selecciona productos (pueden ser de diferentes vendedores)
3. Al cotizar, se agrupan por vendedor
4. Se genera mensaje de WhatsApp para cada vendedor con sus productos
5. Cada vendedor recibe solo las cotizaciones de sus productos

## Ejecución
- Crear branch desde master
- 2 subagentes paralelos:
  - Agente A: Tipos + Datos + Actualizar páginas existentes
  - Agente B: Nuevas páginas del vendedor
- Merge + Build + Deploy
