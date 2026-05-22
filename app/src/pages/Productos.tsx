import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  CheckCircle,
  EyeOff,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsApi, type ApiProduct } from '@/api/products';

const statusTabs = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'ACTIVE' },
  { label: 'Inactivos', value: 'INACTIVE' },
] as const;

export default function Productos() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    productsApi.list({ limit: 100 })
      .then((r) => setProducts(r.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.vendor?.businessName.toLowerCase().includes(q));
    }
    return list;
  }, [products, statusFilter, search]);

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await productsApi.update(id, { status: newStatus as 'ACTIVE' | 'INACTIVE' });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch { /* silently fail */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#2B3A29]">Gestion de Productos</h1>
        <p className="text-[#5C6F5A] mt-1">Administra todos los productos del marketplace</p>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto o vendedor..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                statusFilter === tab.value
                  ? 'bg-[#2D6A4F] text-white shadow-md'
                  : 'bg-white text-[#5C6F5A] hover:bg-[#F1F3F0] border border-[#D9E2D7]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#95A893] mb-4">{filtered.length} productos</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F1F3F0]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Producto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Vendedor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Categoria</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Precio</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Estado</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Accion</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-t border-[#F1F3F0] hover:bg-[#FAFAF5] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F1F3F0] shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[#D9E2D7]" /></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-[#2B3A29]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#5C6F5A]">{p.vendor?.businessName || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        p.category === 'FRUIT' ? 'bg-[#FFF3E0] text-[#E65100]' : 'bg-[#E8F5E9] text-[#2E7D32]'
                      )}>
                        {p.category === 'FRUIT' ? 'Fruta' : 'Verdura'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-[#E76F51]">
                      ${p.price.toLocaleString('es-CO')}/{p.unit}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#52B788]">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#95A893]">
                          <EyeOff className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          p.status === 'ACTIVE' ? 'bg-[#52B788]' : 'bg-[#D9E2D7]'
                        )}
                      >
                        <span className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm',
                          p.status === 'ACTIVE' ? 'translate-x-4.5' : 'translate-x-0.5'
                        )} />
                      </button>
                    </td>
                  </tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Ban className="w-12 h-12 mx-auto text-[#D9E2D7] mb-3" />
            <p className="text-sm text-[#95A893]">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
