import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  MessageCircle,
  SlidersHorizontal,
  ChevronDown,
  X,
  Leaf,
  Apple,
  Carrot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsApi, type ApiProduct } from '@/api/products';

/* ─── filter config ─── */
const categoryFilters = [
  { label: 'Todos', value: 'all', icon: Leaf },
  { label: 'Frutas', value: 'FRUIT', icon: Apple },
  { label: 'Verduras', value: 'VEGETABLE', icon: Carrot },
] as const;

const sortOptions = [
  { label: 'Mas recientes', value: 'newest' },
  { label: 'Precio: menor a mayor', value: 'price-asc' },
  { label: 'Precio: mayor a menor', value: 'price-desc' },
  { label: 'Nombre A-Z', value: 'name-asc' },
] as const;

/* ─── product card ─── */
function ProductCard({ product, index }: { product: ApiProduct; index: number }) {
  const [imgError, setImgError] = useState(false);

  const whatsappMsg = encodeURIComponent(
    `Hola! Me interesa "${product.name}" a $${product.price.toLocaleString('es-MX')}/${product.unit} que vi en Kampo. Me gustaria cotizar.`
  );
  const whatsappUrl = `https://wa.me/${(product.vendor?.whatsapp || '').replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      whileHover={{ y: -6 }}
      className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product hover:shadow-product-hover transition-all duration-300 overflow-hidden group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F1F3F0]">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#D9E2D7]" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            product.category === 'FRUIT'
              ? 'bg-[#FFF3E0] text-[#E65100]'
              : 'bg-[#E8F5E9] text-[#2E7D32]'
          )}>
            {product.category === 'FRUIT' ? 'Fruta' : 'Verdura'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#2B3A29] mb-0.5 truncate">{product.name}</h3>
        {product.vendor && (
          <p className="text-xs text-[#95A893] mb-2 truncate">{product.vendor.businessName}</p>
        )}
        {product.description && (
          <p className="text-xs text-[#5C6F5A] mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-bold text-[#E76F51] font-display">
            ${product.price.toLocaleString('es-CO')}
          </span>
          <span className="text-sm text-[#95A893]">/ {product.unit}</span>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Cotizar
        </a>
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function Catalogo() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    productsApi.list({ limit: 100 })
      .then((res) => setProducts(res.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status === 'ACTIVE');

    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.vendor?.businessName.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // newest
        list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [products, category, search, sort]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === 'ACTIVE');
    return {
      total: active.length,
      fruits: active.filter((p) => p.category === 'FRUIT').length,
      vegetables: active.filter((p) => p.category === 'VEGETABLE').length,
    };
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-display text-4xl font-bold text-[#2B3A29]">
          Catalogo de Productos
        </h1>
        <p className="text-[#5C6F5A] mt-2 text-lg">
          Encuentra las mejores frutas y verduras frescas. Cotiza directamente por WhatsApp.
        </p>
      </motion.div>

      {/* Search & Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos, vendedores..."
            className="w-full pl-11 pr-10 py-3 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#95A893] hover:text-[#5C6F5A]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#5C6F5A] hover:bg-[#F1F3F0] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {sortOptions.find((o) => o.value === sort)?.label}
            <ChevronDown className={cn('w-4 h-4 transition-transform', showSort && 'rotate-180')} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#D9E2D7] rounded-xl shadow-lg py-1 z-20">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setShowSort(false); }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-[#F1F3F0] transition-colors',
                    sort === opt.value ? 'text-[#2D6A4F] font-medium bg-[#D8F3DC]/30' : 'text-[#5C6F5A]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {categoryFilters.map((cat) => {
          const Icon = cat.icon;
          const count = cat.value === 'all'
            ? stats.total
            : cat.value === 'FRUIT'
            ? stats.fruits
            : stats.vegetables;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                category === cat.value
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-white text-[#5C6F5A] hover:bg-[#F1F3F0] border border-[#D9E2D7]'
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                category === cat.value
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F3F0] text-[#95A893]'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#95A893]">
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 mx-auto text-[#D9E2D7] mb-4" />
          <p className="text-[#5C6F5A] font-medium mb-2">No se encontraron productos</p>
          <p className="text-sm text-[#95A893]">
            {search ? 'Intenta con otra busqueda o cambia los filtros' : 'No hay productos disponibles en esta categoria'}
          </p>
          {(search || category !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2D6A4F] hover:bg-[#D8F3DC] rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
