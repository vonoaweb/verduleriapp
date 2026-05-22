import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  MessageSquare,
  TrendingUp,
  ShoppingBag,
  Eye,
  ArrowRight,
  CheckCircle,
  Clock,
  Ban,
} from 'lucide-react';
import { productsApi, type ApiProduct } from '@/api/products';
import { quotesApi, type ApiQuote } from '@/api/quotes';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pendiente', className: 'bg-[#F4A261]/20 text-[#E76F51]', icon: Clock },
  RESPONDED: { label: 'Respondida', className: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  COMPLETED: { label: 'Completada', className: 'bg-[#D8F3DC] text-[#2D6A4F]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-200 text-gray-600', icon: Ban },
};

export default function Admin() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.list({ limit: 100 }).then((r) => r.products),
      quotesApi.list({ limit: 20 }).then((r) => r.quotes),
    ])
      .then(([prods, qts]) => {
        setProducts(prods);
        setQuotes(qts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === 'ACTIVE').length,
    totalQuotes: quotes.length,
    pendingQuotes: quotes.filter((q) => q.status === 'PENDING').length,
    totalRevenue: quotes
      .filter((q) => q.status === 'COMPLETED')
      .reduce((sum, q) => sum + q.total, 0),
    vendors: new Set(products.map((p) => p.vendorId)).size,
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#2B3A29]">
          Panel de Administracion
        </h1>
        <p className="text-[#5C6F5A] mt-1">
          Supervision general del marketplace
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Productos', value: stats.totalProducts, sub: `${stats.activeProducts} activos`, icon: Package, color: 'bg-[#2D6A4F]' },
          { label: 'Cotizaciones', value: stats.totalQuotes, sub: `${stats.pendingQuotes} pendientes`, icon: MessageSquare, color: 'bg-[#F4A261]' },
          { label: 'Vendedores', value: stats.vendors, sub: 'registrados', icon: Users, color: 'bg-[#52B788]' },
          { label: 'Ingresos', value: `$${stats.totalRevenue.toLocaleString('es-CO')}`, sub: 'completados', icon: TrendingUp, color: 'bg-[#E76F51]' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 shadow-stats border border-[#D9E2D7]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2B3A29] font-display">{s.value}</p>
            <p className="text-xs text-[#95A893] mt-0.5">{s.label} &middot; {s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#2B3A29] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2D6A4F]" />
              Productos Recientes
            </h2>
            <Link
              to="/admin/productos"
              className="text-sm text-[#52B788] hover:text-[#2D6A4F] font-medium flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[#F1F3F0] last:border-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F1F3F0] shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#D9E2D7]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2B3A29] truncate">{p.name}</p>
                  <p className="text-xs text-[#95A893]">{p.vendor?.businessName}</p>
                </div>
                <span className="text-sm font-bold text-[#E76F51]">${p.price.toLocaleString('es-CO')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-gray-100 text-gray-500'}`}>
                  {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#2B3A29] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#F4A261]" />
              Cotizaciones Recientes
            </h2>
            <Link
              to="/admin/cotizaciones"
              className="text-sm text-[#52B788] hover:text-[#2D6A4F] font-medium flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {quotes.slice(0, 5).map((q) => {
              const st = statusConfig[q.status] || statusConfig.PENDING;
              return (
                <div key={q.id} className="flex items-center gap-3 py-2 border-b border-[#F1F3F0] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2B3A29] truncate">{q.customerName}</p>
                    <p className="text-xs text-[#95A893]">{formatDate(q.createdAt)} &middot; {q.items.length} producto{q.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-[#E76F51]">${q.total.toLocaleString('es-CO')}</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
            {quotes.length === 0 && (
              <p className="text-sm text-[#95A893] text-center py-6">No hay cotizaciones aun</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
