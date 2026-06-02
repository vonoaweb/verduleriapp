import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle,
  MessageCircle,
  Ban,
  User,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { quotesApi, type ApiQuote } from '@/api/quotes';

type QStatus = 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED';

const statusConfig: Record<QStatus, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pendiente', className: 'bg-[#F4A261]/20 text-[#E76F51]', icon: Clock },
  RESPONDED: { label: 'Respondida', className: 'bg-blue-100 text-blue-700', icon: MessageCircle },
  COMPLETED: { label: 'Completada', className: 'bg-[#D8F3DC] text-[#2D6A4F]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-200 text-gray-600', icon: Ban },
};

const filterTabs: { label: string; value: 'all' | QStatus }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Respondidas', value: 'RESPONDED' },
  { label: 'Completadas', value: 'COMPLETED' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Cotizaciones() {
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | QStatus>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    quotesApi.list({ limit: 100 })
      .then((r) => setQuotes(r.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = quotes;
    if (activeFilter !== 'all') list = list.filter((q) => q.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (qt) =>
          qt.customerName.toLowerCase().includes(q) ||
          qt.customerPhone.includes(q)
      );
    }
    return list;
  }, [quotes, activeFilter, search]);

  const handleUpdateStatus = async (id: string, status: QStatus) => {
    try {
      const updated = await quotesApi.updateStatus(id, status);
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: updated.status } : q)));
    } catch {
      alert('Error al actualizar estado');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[#2B3A29]">
            Gestion de Cotizaciones
          </h1>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#D8F3DC] text-[#2D6A4F] text-sm font-bold self-start">
            {quotes.length}
          </span>
        </div>
        <p className="text-[#5C6F5A] mt-1">Administra todas las cotizaciones del marketplace</p>
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o telefono..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeFilter === tab.value
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'bg-white text-[#5C6F5A] hover:bg-[#F1F3F0] border border-[#D9E2D7]'
            )}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {quotes.filter((q) => q.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-[#95A893] mb-4">{filtered.length} cotizaciones</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F1F3F0]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Fecha</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Productos</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Total</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Estado</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#5C6F5A] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((q, i) => {
                  const st = statusConfig[q.status] || statusConfig.PENDING;
                  const StatusIcon = st.icon;
                  const vendorWhatsapp = q.items?.[0]?.vendor?.whatsapp || '';
                  return (
                    <tr
                      key={q.id}
                      className="border-t border-[#F1F3F0] hover:bg-[#FAFAF5] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-[#2D6A4F]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#2B3A29]">{q.customerName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-[#95A893]" />
                              <span className="text-xs text-[#95A893]">{q.customerPhone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 text-xs text-[#5C6F5A]">
                          <Calendar className="w-3.5 h-3.5 text-[#95A893]" />
                          {formatDate(q.createdAt)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-[#5C6F5A]">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#95A893]" />
                          {q.items.length}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold text-[#E76F51]">
                          ${q.total.toLocaleString('es-CO')}
                        </span>
                        <div className="mt-1">
                          {q.paymentStatus === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#D8F3DC] text-[#2D6A4F]">
                              ✓ Pagado
                            </span>
                          ) : (
                            <a
                              href={`/pago/${q.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir página de pago"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4A261]/20 text-[#E76F51] hover:bg-[#F4A261]/30 transition-colors"
                            >
                              Cobrar →
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium', st.className)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`https://wa.me/${vendorWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${q.customerName}, sobre tu cotizacion en VerduleriApp...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:bg-[#128C7E] transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp
                          </a>
                          {q.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'RESPONDED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-300 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Responder
                            </button>
                          )}
                          {q.status !== 'COMPLETED' && q.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, 'COMPLETED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#2D6A4F] text-[#2D6A4F] text-xs font-medium hover:bg-[#D8F3DC] transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Completar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto text-[#D9E2D7] mb-3" />
            <p className="text-sm text-[#95A893]">
              {activeFilter === 'all' ? 'No hay cotizaciones aun' : `No hay cotizaciones ${statusConfig[activeFilter as QStatus].label.toLowerCase()}s`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
