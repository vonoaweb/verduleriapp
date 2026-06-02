import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsApi, type ApiProduct } from '@/api/products';

const categoryTabs = ['Todas', 'Frutas', 'Verduras'] as const;

function categoryToTab(p: ApiProduct): string {
  if (p.category === 'FRUIT') return 'Frutas';
  if (p.category === 'VEGETABLE') return 'Verduras';
  return 'Todas';
}

function CategoryBadge({ category }: { category: string }) {
  if (category === 'FRUIT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF3E0] text-[#E65100]">
        Fruta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#2E7D32]">
      Verdura
    </span>
  );
}

/* ─── product card ─── */
function ProductCard({
  product,
  index,
  onToggleStatus,
  onDelete,
  onEdit,
}: {
  product: ApiProduct;
  index: number;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
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
          <CategoryBadge category={product.category} />
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={() => onEdit(product.id)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100 duration-200"
            title="Editar"
          >
            <Pencil className="w-4 h-4 text-[#5C6F5A]" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100 duration-200"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-[#E63946]" />
          </button>
        </div>
        {product.status === 'INACTIVE' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-[#E63946]" />
              <span className="text-sm font-medium text-[#E63946]">Inactivo</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#2B3A29] mb-1 truncate">{product.name}</h3>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-bold text-[#E76F51] font-display">
            ${product.price.toLocaleString()}
          </span>
          <span className="text-sm text-[#95A893]">/ {product.unit}</span>
        </div>

        {/* Status toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F1F3F0]">
          <div className="flex items-center gap-1.5">
            {product.status === 'ACTIVE' ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#52B788]" />
                <span className="text-xs font-medium text-[#52B788]">Activo</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-[#95A893]" />
                <span className="text-xs font-medium text-[#95A893]">Inactivo</span>
              </>
            )}
          </div>
          <button
            onClick={() => onToggleStatus(product.id, product.status)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              product.status === 'ACTIVE' ? 'bg-[#52B788]' : 'bg-[#D9E2D7]'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm',
                product.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function VendorProductos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof categoryTabs)[number]>('Todas');
  const [vendorProds, setVendorProds] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getMyProducts()
      .then(setVendorProds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = vendorProds;
    if (activeTab !== 'Todas') {
      list = list.filter((p) => categoryToTab(p) === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [vendorProds, activeTab, search]);

  const stats = useMemo(() => {
    const total = vendorProds.length;
    const active = vendorProds.filter((p) => p.status === 'ACTIVE').length;
    const inactive = vendorProds.filter((p) => p.status === 'INACTIVE').length;
    return { total, active, inactive };
  }, [vendorProds]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await productsApi.update(id, { status: newStatus as 'ACTIVE' | 'INACTIVE' });
      setVendorProds((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch {
      // Revertir optimísticamente si falla
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await productsApi.delete(id);
      setVendorProds((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#2B3A29]">
              Mis Productos
            </h1>
            <p className="text-[#5C6F5A] mt-1">
              Gestiona los productos de tu catálogo
            </p>
          </div>
          <button
            onClick={() => navigate('/vendedor/productos/nuevo')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white font-semibold rounded-xl hover:bg-[#1B4332] transition-all duration-200 hover:-translate-y-0.5 shadow-md self-start"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        {[
          { label: 'Total productos', value: stats.total, icon: Package, color: 'bg-[#2D6A4F]' },
          { label: 'Activos', value: stats.active, icon: CheckCircle, color: 'bg-[#52B788]' },
          { label: 'Inactivos', value: stats.inactive, icon: EyeOff, color: 'bg-[#F4A261]' },
          { label: 'Vistas hoy', value: 124, icon: Eye, color: 'bg-[#E76F51]' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
            className="bg-white rounded-xl p-4 shadow-stats flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#2B3A29] font-display">{s.value}</p>
              <p className="text-xs text-[#95A893]">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-4"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
          />
        </div>
      </motion.div>

      {/* Category tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex gap-2 mb-6"
      >
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeTab === tab
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'bg-white text-[#5C6F5A] hover:bg-[#F1F3F0] border border-[#D9E2D7]'
            )}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 mx-auto text-[#D9E2D7] mb-4" />
          <p className="text-[#5C6F5A] font-medium mb-2">No se encontraron productos</p>
          <p className="text-sm text-[#95A893]">
            {search ? 'Intenta con otra búsqueda' : 'Agrega tu primer producto'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onEdit={(pid) => navigate(`/vendedor/productos/${pid}/editar`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
