import { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle,
  MessageCircle,
  Ban,
  Phone,
  Calendar,
  ShoppingBag,
  QrCode,
  Truck,
  MapPin,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { quotesApi, type ApiQuote } from '@/api/quotes';
import { coloniaColor } from '@/lib/coloniaColors';
import { apiBaseUrl } from '@/api/client';
import { nextDeliveryInfo } from '@/lib/nextDelivery';

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
  return new Date(d).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SIN_COLONIA = 'Sin colonia';
const money = (n: number) => `$${n.toLocaleString('es-MX')}`;

export default function Cotizaciones() {
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | QStatus>('all');
  const [search, setSearch] = useState('');
  const [coloniaFilter, setColoniaFilter] = useState('all');

  const delivery = useMemo(() => nextDeliveryInfo(), []);

  useEffect(() => {
    quotesApi.list({ limit: 100 })
      .then((r) => setQuotes(r.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Colonias/cotos/torres presentes en los pedidos (para el filtro)
  const colonias = useMemo(() => {
    const set = new Set<string>();
    quotes.forEach((q) => {
      if (q.deliveryColonia) set.add(q.deliveryColonia);
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [quotes]);

  const filtered = useMemo(() => {
    let list = quotes;
    if (activeFilter !== 'all') list = list.filter((q) => q.status === activeFilter);
    if (coloniaFilter !== 'all') list = list.filter((q) => q.deliveryColonia === coloniaFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (qt) =>
          qt.customerName.toLowerCase().includes(q) ||
          qt.customerPhone.includes(q)
      );
    }
    return list;
  }, [quotes, activeFilter, coloniaFilter, search]);

  // Pedidos agrupados por coto/torre/colonia (los sin colonia al final)
  const groups = useMemo(() => {
    const map = new Map<string, ApiQuote[]>();
    for (const q of filtered) {
      const key = q.deliveryColonia || SIN_COLONIA;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === SIN_COLONIA) return 1;
      if (b[0] === SIN_COLONIA) return -1;
      return a[0].localeCompare(b[0], 'es');
    });
  }, [filtered]);

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
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[#2B3A29]">
            Pedidos
          </h1>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#D8F3DC] text-[#2D6A4F] text-sm font-bold self-start">
            {quotes.length}
          </span>
        </div>
        <p className="text-[#5C6F5A] mt-1">Organizados por coto y torre para armar la ruta de entrega</p>
      </div>

      {/* Próxima entrega */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-[#1B4332] text-white rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-2.5">
          <Truck className="w-5 h-5 text-[#95D5B2]" />
          <span className="text-sm">
            Próxima entrega: <b className="font-semibold">{delivery.dateLabel}</b>, 9:00 a 13:00
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[#95D5B2]" />
          <span className="text-sm text-white/80">
            Corte de pedidos: {delivery.cutoffLabel}
          </span>
        </div>
      </div>

      {/* Buscador + filtro de colonia */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
        {colonias.length > 0 && (
          <select
            value={coloniaFilter}
            onChange={(e) => setColoniaFilter(e.target.value)}
            aria-label="Filtrar por coto, torre o colonia"
            className="px-4 py-2.5 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
          >
            <option value="all">Todos los cotos y torres</option>
            {colonias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs de estado */}
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

      {/* Resumen */}
      <p className="text-sm text-[#95A893] mb-4">
        {filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'}
        {groups.length > 0 && ` · ${groups.length} ${groups.length === 1 ? 'zona' : 'zonas'}`}
      </p>

      {/* Grupos por colonia */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product text-center py-16">
          <MessageSquare className="w-12 h-12 mx-auto text-[#D9E2D7] mb-3" />
          <p className="text-sm text-[#95A893]">
            {activeFilter === 'all' ? 'No hay pedidos aun' : `No hay pedidos en este filtro`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([colonia, list]) => {
            const isReal = colonia !== SIN_COLONIA;
            const color = isReal
              ? coloniaColor(colonia)
              : { bg: '#F1F3F0', text: '#5C6F5A', border: '#D9E2D7' };
            const subtotal = list.reduce((s, q) => s + q.total, 0);
            const pagados = list.filter((q) => q.paymentStatus === 'PAID').length;
            return (
              <section key={colonia}>
                {/* Encabezado del coto/torre */}
                <div className="flex flex-wrap items-center gap-3 mb-2 px-1">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border"
                    style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {colonia}
                  </span>
                  <span className="text-xs text-[#95A893]">
                    {list.length} {list.length === 1 ? 'pedido' : 'pedidos'} · {pagados} {pagados === 1 ? 'pagado' : 'pagados'}
                  </span>
                  <span className="ml-auto text-sm font-bold text-[#2B3A29]">{money(subtotal)}</span>
                </div>

                {/* Pedidos del grupo */}
                <div
                  className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product overflow-hidden"
                  style={{ borderLeft: `4px solid ${color.border}` }}
                >
                  {list.map((q, i) => {
                    const st = statusConfig[q.status] || statusConfig.PENDING;
                    const StatusIcon = st.icon;
                    const vendorWhatsapp = q.items?.[0]?.vendor?.whatsapp || '';
                    return (
                      <div
                        key={q.id}
                        className={cn(
                          'grid grid-cols-1 lg:grid-cols-[1.3fr_1.7fr_1fr_auto] gap-x-6 gap-y-3 px-5 py-4 hover:bg-[#FAFAF5] transition-colors',
                          i > 0 && 'border-t border-[#F1F3F0]'
                        )}
                      >
                        {/* Cliente */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#2B3A29] truncate">{q.customerName}</p>
                          <p className="flex items-center gap-1.5 text-xs text-[#95A893] mt-1">
                            <Phone className="w-3 h-3 shrink-0" /> {q.customerPhone}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-[#95A893] mt-0.5">
                            <Calendar className="w-3 h-3 shrink-0" /> Pedido: {formatDate(q.createdAt)}
                          </p>
                        </div>

                        {/* Entrega */}
                        <div className="min-w-0 text-xs space-y-1">
                          {q.deliveryAddress && (
                            <p className="flex items-start gap-1.5 text-[#5C6F5A]">
                              <Home className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{q.deliveryAddress}</span>
                            </p>
                          )}
                          {q.deliveryDate && (
                            <p className="flex items-center gap-1.5 font-medium text-[#2D6A4F]">
                              <Truck className="w-3 h-3 shrink-0" />
                              <span>{q.deliveryDate}{q.deliverySlot ? `, ${q.deliverySlot}` : ''}</span>
                            </p>
                          )}
                          {q.latitude && q.longitude && (
                            <a
                              href={`https://maps.google.com/?q=${q.latitude},${q.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#2D6A4F] hover:underline"
                            >
                              <MapPin className="w-3 h-3 shrink-0" /> Ver en mapa
                            </a>
                          )}
                        </div>

                        {/* Pedido: productos + total + pago */}
                        <div>
                          <p className="flex items-center gap-1.5 text-xs text-[#5C6F5A]">
                            <ShoppingBag className="w-3 h-3 shrink-0" />
                            {q.items.length} {q.items.length === 1 ? 'producto' : 'productos'}
                          </p>
                          <p className="text-base font-bold text-[#E76F51] mt-0.5">{money(q.total)}</p>
                          {q.paymentStatus === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#D8F3DC] text-[#2D6A4F] mt-1">
                              ✓ Pagado
                            </span>
                          ) : (
                            <a
                              href={`/pago/${q.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir página de pago"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4A261]/20 text-[#E76F51] hover:bg-[#F4A261]/30 transition-colors mt-1"
                            >
                              Cobrar →
                            </a>
                          )}
                        </div>

                        {/* Estado + acciones */}
                        <div className="flex flex-row lg:flex-col items-start lg:items-end gap-2">
                          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium', st.className)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {st.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`${apiBaseUrl}/quotes/${q.id}/qr.png`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="QR del pedido — imprímelo y pégalo en el paquete"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#D9E2D7] text-[#5C6F5A] hover:bg-[#F1F3F0] transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://wa.me/${vendorWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${q.customerName}, sobre tu pedido en Kampo...`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Contactar por WhatsApp"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            {q.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(q.id, 'RESPONDED')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-300 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                              >
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
