import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  MessageSquare,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsApi, type ApiProduct } from '@/api/products';
import { quotesApi, type QuoteStats } from '@/api/quotes';
import { vendorsApi, type ApiVendor } from '@/api/vendors';

/* ─── counter hook ─── */
function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ─── status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-[#F4A261]/20 text-[#E76F51]',
    RESPONDED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-[#D8F3DC] text-[#2D6A4F]',
    CANCELLED: 'bg-gray-200 text-gray-600',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    RESPONDED: 'Respondida',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[status] ?? styles.PENDING}`}>
      {labels[status] ?? status}
    </span>
  );
}

/* ─── bar chart (SVG) ─── */
function WeeklyChart() {
  const data = [
    { label: 'Sem 1', value: 2 },
    { label: 'Sem 2', value: 4 },
    { label: 'Sem 3', value: 3 },
    { label: 'Sem 4', value: 6 },
  ];
  const max = Math.max(...data.map((d) => d.value));
  const barWidth = 48;
  const gap = 24;
  const chartHeight = 160;
  const totalWidth = data.length * (barWidth + gap) + gap;

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-[#2B3A29] mb-4">
        Cotizaciones por Semana
      </h3>
      <svg viewBox={`0 0 ${totalWidth} ${chartHeight + 40}`} className="w-full max-w-sm">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * chartHeight;
          const x = gap + i * (barWidth + gap);
          const y = chartHeight - barHeight;
          return (
            <g key={d.label}>
              <motion.rect
                x={x}
                initial={{ y: chartHeight, height: 0 }}
                animate={{ y, height: barHeight }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                width={barWidth}
                rx={8}
                fill="#52B788"
                opacity={0.85 + i * 0.04}
              />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="text-xs font-semibold fill-[#2B3A29]"
              >
                {d.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-[#5C6F5A]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── stat card ─── */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  color: string;
  delay?: number;
}) {
  const displayValue = useCounter(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="bg-white rounded-2xl p-5 shadow-stats hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#5C6F5A] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#2B3A29] font-display">
            {label.includes('Ingresos') ? `$${displayValue.toLocaleString()}` : displayValue.toLocaleString()}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function VendorDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [vendor, setVendor] = useState<ApiVendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodsRes, statsRes, quotesRes, vendorRes] = await Promise.all([
          productsApi.getMyProducts(),
          quotesApi.getStats(),
          quotesApi.list({ limit: 5 }),
          vendorsApi.getMyProfile().catch(() => null),
        ]);
        setProducts(prodsRes);
        setStats(statsRes);
        setQuotes(quotesRes.quotes || []);
        setVendor(vendorRes);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeProducts = products.filter((p) => p.status === 'ACTIVE');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

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
        className="mb-8"
      >
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[#2B3A29]">
          Mi Tienda
        </h1>
        <p className="text-[#5C6F5A] mt-1">
          Panel de vendedor
        </p>
      </motion.div>

      {/* Código del bot de WhatsApp */}
      {vendor?.accessCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8 bg-[#D8F3DC]/60 border border-[#52B788]/40 rounded-2xl p-5"
        >
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-[#1B4332] flex items-center gap-2">
                🤖 Gestiona tu inventario por WhatsApp
              </h2>
              <p className="text-sm text-[#2D6A4F] mt-1">
                Escríbele al bot <b>clave {vendor.accessCode}</b> para entrar al modo productor:
                cambia precios, pausa productos y pide tu reporte de ventas en PDF.
              </p>
            </div>
            <div className="bg-white rounded-xl px-5 py-3 border border-[#52B788]/40 text-center">
              <p className="text-xs text-[#5C6F5A] uppercase font-semibold">Tu código</p>
              <p className="text-2xl font-bold font-mono text-[#2D6A4F] tracking-wider">
                {vendor.accessCode}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Productos Activos"
          value={activeProducts.length}
          icon={Package}
          color="bg-[#2D6A4F]"
          delay={0}
        />
        <StatCard
          label="Cotizaciones Recibidas"
          value={stats?.total ?? 0}
          icon={MessageSquare}
          color="bg-[#52B788]"
          delay={0.1}
        />
        <StatCard
          label="Cotizaciones Pendientes"
          value={stats?.pending ?? 0}
          icon={Clock}
          color="bg-[#F4A261]"
          delay={0.2}
        />
        <StatCard
          label="Ingresos Estimados"
          value={stats?.monthlyRevenue ?? 0}
          icon={DollarSign}
          color="bg-[#E76F51]"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-stats"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#52B788]" />
            <h2 className="font-display font-bold text-lg text-[#2B3A29]">
              Actividad
            </h2>
          </div>
          <WeeklyChart />
          <button
            onClick={() => navigate('/vendedor/cotizaciones')}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-[#52B788] hover:text-[#2D6A4F] transition-colors"
          >
            Ver todas las cotizaciones <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Recent Quotes Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-stats"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#52B788]" />
              <h2 className="font-display font-bold text-lg text-[#2B3A29]">
                Cotizaciones Recientes
              </h2>
            </div>
            <button
              onClick={() => navigate('/vendedor/cotizaciones')}
              className="text-sm font-medium text-[#52B788] hover:text-[#2D6A4F] transition-colors"
            >
              Ver todas
            </button>
          </div>

          {quotes.length === 0 ? (
            <div className="text-center py-10 text-[#95A893]">
              No hay cotizaciones recientes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#D8F3DC]/50">
                    <th className="px-4 py-3 rounded-l-lg text-xs font-semibold text-[#1B4332] uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#1B4332] uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#1B4332] uppercase">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#1B4332] uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 rounded-r-lg text-xs font-semibold text-[#1B4332] uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q: any, idx: number) => (
                    <motion.tr
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + idx * 0.08 }}
                      className="border-b border-[#F1F3F0] hover:bg-[#D8F3DC]/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                            <User className="w-4 h-4 text-[#2D6A4F]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#2B3A29]">
                              {q.customerName}
                            </p>
                            <p className="text-xs text-[#95A893]">{q.customerPhone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5C6F5A]">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5C6F5A]">
                        {q.items?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#2B3A29]">
                        ${q.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={q.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
