import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  User,
  Phone,
  Calendar,
  ShoppingBag,
  CheckCircle,
  Clock,
  MessageCircle,
  Ban,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { quotesApi, type ApiQuote } from '@/api/quotes';

/* ─── status config ─── */
type QStatus = 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED';
const statusConfig: Record<QStatus, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: { label: 'Nueva', className: 'bg-[#F4A261]/20 text-[#E76F51]', icon: Clock },
  RESPONDED: { label: 'Respondida', className: 'bg-blue-100 text-blue-700', icon: MessageCircle },
  COMPLETED: { label: 'Completada', className: 'bg-[#D8F3DC] text-[#2D6A4F]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-200 text-gray-600', icon: Ban },
};

const filterChips: { label: string; value: 'all' | QStatus }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Nuevas', value: 'PENDING' },
  { label: 'Respondidas', value: 'RESPONDED' },
  { label: 'Completadas', value: 'COMPLETED' },
];

/* ─── format helpers ─── */
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

/* ─── quote card ─── */
function QuoteCard({
  quote,
  index,
  onUpdateStatus,
}: {
  quote: ApiQuote;
  index: number;
  onUpdateStatus: (id: string, status: QStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[quote.status];
  const StatusIcon = status.icon;

  // Use first vendor's whatsapp for the reply link
  const vendorWhatsapp = quote.items?.[0]?.vendor?.whatsapp || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#2D6A4F]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2B3A29] text-base">{quote.customerName}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#95A893]" />
                <span className="text-xs text-[#95A893]">{quote.customerPhone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium', status.className)}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 text-xs text-[#95A893]">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(quote.createdAt)}
          </div>
          <div className="flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            {quote.items.length} producto{quote.items.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Items preview */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quote.items.slice(0, expanded ? 99 : 3).map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F1F3F0] text-xs text-[#5C6F5A]"
            >
              {item.product.name} x {item.quantity} {item.unit}
            </span>
          ))}
          {!expanded && quote.items.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F1F3F0] text-xs text-[#95A893]">
              +{quote.items.length - 3} mas
            </span>
          )}
        </div>

        {quote.notes && (
          <div className="mt-3 p-2.5 bg-[#FEFAE0] rounded-xl text-xs text-[#5C6F5A]">
            <span className="font-medium text-[#2B3A29]">Nota:</span> {quote.notes}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F1F3F0]">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-[#95A893]">Total:</span>
            <span className="text-xl font-bold text-[#E76F51] font-display">
              {formatCurrency(quote.total)}
            </span>
          </div>
          {quote.items.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-medium text-[#52B788] hover:text-[#2D6A4F] transition-colors"
            >
              {expanded ? (
                <>
                  Ver menos <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Ver mas <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <a
            href={`https://wa.me/${vendorWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hola ${quote.customerName}, vi tu solicitud de cotizacion en VerduleriApp. ¿En que puedo ayudarte?`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Responder por WhatsApp
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          {quote.status !== 'COMPLETED' && (
            <button
              onClick={() => onUpdateStatus(quote.id, 'COMPLETED')}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#2D6A4F] text-[#2D6A4F] text-sm font-medium hover:bg-[#D8F3DC] transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Completada
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function VendorCotizaciones() {
  const [activeFilter, setActiveFilter] = useState<'all' | QStatus>('all');
  const [quoteList, setQuoteList] = useState<ApiQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotesApi.list({ limit: 50 })
      .then(res => setQuoteList(res.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return quoteList;
    return quoteList.filter((q) => q.status === activeFilter);
  }, [quoteList, activeFilter]);

  const handleUpdateStatus = async (id: string, status: QStatus) => {
    try {
      const updated = await quotesApi.updateStatus(id, status);
      setQuoteList((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: updated.status } : q))
      );
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-[#2B3A29]">
            Mis Cotizaciones
          </h1>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#D8F3DC] text-[#2D6A4F] text-sm font-bold self-start">
            {quoteList.length}
          </span>
        </div>
        <p className="text-[#5C6F5A] mt-1">
          Gestiona las solicitudes de cotizacion de tus clientes
        </p>
      </motion.div>

      {/* Filter chips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {filterChips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setActiveFilter(chip.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeFilter === chip.value
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'bg-white text-[#5C6F5A] hover:bg-[#F1F3F0] border border-[#D9E2D7]'
            )}
          >
            {chip.label}
            {chip.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {quoteList.filter((q) => q.status === chip.value).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Quote cards */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <MessageSquare className="w-16 h-16 mx-auto text-[#D9E2D7] mb-4" />
            <p className="text-[#5C6F5A] font-medium mb-2">
              {activeFilter === 'all'
                ? 'No tienes cotizaciones aun'
                : `No hay cotizaciones ${statusConfig[activeFilter as QStatus].label.toLowerCase()}s`}
            </p>
            <p className="text-sm text-[#95A893]">
              Las cotizaciones de tus clientes apareceran aqui
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filtered.map((quote, idx) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                index={idx}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
