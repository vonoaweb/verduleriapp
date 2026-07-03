import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Lock,
  Check,
  ShoppingBag,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { quotesApi, type PayInfo } from '@/api/quotes';

/* Formatea el número de tarjeta en grupos de 4 */
function formatCard(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}
function formatExpiry(value: string) {
  const v = value.replace(/\D/g, '').slice(0, 4);
  return v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
}

export default function Pago() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Campos de la tarjeta (DEMO — no se procesan ni se envían a ningún lado)
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!id) return;
    const sessionId = searchParams.get('session_id');
    const load = async () => {
      // Si venimos de Stripe, confirmar el pago primero (respaldo del webhook)
      if (sessionId) {
        try {
          await quotesApi.verifyPayment(id, sessionId);
        } catch {
          // el webhook puede haberlo confirmado ya; pay-info dirá la verdad
        }
      }
      try {
        const d = await quotesApi.getPayInfo(id);
        setInfo(d);
        if (d.paymentStatus === 'PAID') setPaid(true);
      } catch {
        setError('No encontramos este pedido. El enlace puede ser inválido.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, searchParams]);

  // ─── Pago real con Stripe Checkout ───
  const handleStripeCheckout = async () => {
    if (!id || processing) return;
    setError('');
    setProcessing(true);
    try {
      const result = await quotesApi.checkout(id);
      if (result.mode === 'stripe' && result.url) {
        window.location.href = result.url; // redirigir a Stripe
        return;
      }
      if (result.mode === 'paid') {
        setPaid(true);
      }
    } catch {
      setError('No se pudo iniciar el pago. Intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || processing) return;
    // Validación básica de la tarjeta (demo)
    if (card.replace(/\s/g, '').length < 15 || exp.length < 5 || cvc.length < 3 || !name.trim()) {
      setError('Completa los datos de la tarjeta. (Demo: usa 4242 4242 4242 4242)');
      return;
    }
    setError('');
    setProcessing(true);
    try {
      // Simula el tiempo de procesamiento del banco
      await new Promise((r) => setTimeout(r, 1600));
      await quotesApi.pay(id, 'demo');
      setPaid(true);
    } catch {
      setError('No se pudo procesar el pago. Intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#2D6A4F] animate-spin" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-[#E63946] mb-3" />
        <p className="text-[#5C6F5A]">{error}</p>
      </div>
    );
  }

  /* ─── Pantalla de éxito ─── */
  if (paid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-[#52B788] flex items-center justify-center mx-auto mb-5"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-[#2B3A29] mb-2">¡Pago confirmado!</h1>
          <p className="text-[#5C6F5A] mb-4">
            Gracias{info?.customerName ? `, ${info.customerName}` : ''}. Tu pedido está pagado y en preparación. 🥬
          </p>
          {info && (
            <div className="bg-[#F1F3F0] rounded-xl py-3 px-4 inline-block">
              <span className="text-sm text-[#5C6F5A]">Total pagado: </span>
              <span className="text-lg font-bold text-[#2D6A4F]">${info.total.toLocaleString('es-CO')}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  /* ─── Checkout ─── */
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-[#2B3A29] mb-1">Pagar pedido</h1>
      <p className="text-[#5C6F5A] mb-6">Completa tu pago de forma segura</p>

      {/* Banner modo demo (solo si Stripe no está configurado) */}
      {!info?.stripeEnabled && (
        <div className="flex items-start gap-2 bg-[#FFF3E0] border border-[#F4A261]/40 rounded-xl px-4 py-3 mb-6">
          <ShieldCheck className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
          <p className="text-sm text-[#8a4b00]">
            <b>Modo demostración:</b> no se realiza ningún cobro real. Usa la tarjeta de prueba
            <b> 4242 4242 4242 4242</b>, cualquier fecha futura y cualquier CVC.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Resumen */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5">
            <h2 className="font-display text-lg font-bold text-[#2B3A29] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2D6A4F]" />
              Tu pedido
            </h2>
            <div className="space-y-2.5 mb-4">
              {info?.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[#5C6F5A]">
                    {it.product.name} <span className="text-[#95A893]">x{it.quantity} {it.unit}</span>
                  </span>
                  <span className="font-medium text-[#2B3A29]">
                    ${(it.price * it.quantity).toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[#F1F3F0]">
              <span className="font-medium text-[#5C6F5A]">Total</span>
              <span className="text-2xl font-bold text-[#E76F51] font-display">
                ${info?.total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Pago con Stripe (real) o formulario demo */}
        <div className="lg:col-span-3">
          {info?.stripeEnabled ? (
            <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#2B3A29] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#2D6A4F]" />
                Pago con tarjeta
              </h2>
              <p className="text-sm text-[#5C6F5A]">
                Te llevaremos a la página segura de <b>Stripe</b> para completar tu pago.
                Aceptamos tarjetas de crédito y débito.
              </p>
              {error && <p className="text-sm text-[#E63946]">{error}</p>}
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold bg-[#2D6A4F] hover:bg-[#1B4332] transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Conectando con Stripe...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pagar ${info?.total.toLocaleString('es-MX')} con tarjeta</>
                )}
              </button>
              <p className="text-xs text-[#95A893] text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Procesado por Stripe · cifrado de extremo a extremo
              </p>
            </div>
          ) : (
          <form onSubmit={handlePay} className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#2B3A29] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#2D6A4F]" />
              Datos de la tarjeta
            </h2>

            <div>
              <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">Nombre en la tarjeta</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como aparece en la tarjeta"
                className="w-full px-4 py-3 rounded-xl border border-[#D9E2D7] text-sm focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">Número de tarjeta</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A893]" />
                <input
                  value={card}
                  onChange={(e) => setCard(formatCard(e.target.value))}
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D9E2D7] text-sm focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">Vencimiento</label>
                <input
                  value={exp}
                  onChange={(e) => setExp(formatExpiry(e.target.value))}
                  inputMode="numeric"
                  placeholder="MM/AA"
                  className="w-full px-4 py-3 rounded-xl border border-[#D9E2D7] text-sm focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">CVC</label>
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  placeholder="123"
                  className="w-full px-4 py-3 rounded-xl border border-[#D9E2D7] text-sm focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#E63946]">{error}</p>}

            <button
              type="submit"
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold bg-[#2D6A4F] hover:bg-[#1B4332] transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando pago...</>
              ) : (
                <><Lock className="w-4 h-4" /> Pagar ${info?.total.toLocaleString('es-CO')}</>
              )}
            </button>
            <p className="text-xs text-[#95A893] text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Pago cifrado y seguro
            </p>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
