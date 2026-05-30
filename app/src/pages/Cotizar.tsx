import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Package,
  Search,
  X,
  Send,
  User,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsApi, type ApiProduct } from '@/api/products';
import { quotesApi } from '@/api/quotes';

interface CartItem {
  product: ApiProduct;
  quantity: number;
}

/* ─── product selector card ─── */
function ProductSelector({
  product,
  onAdd,
  inCart,
}: {
  product: ApiProduct;
  onAdd: (p: ApiProduct) => void;
  inCart: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm',
        inCart
          ? 'border-[#52B788] bg-[#D8F3DC]/20'
          : 'border-[#D9E2D7] bg-white hover:border-[#52B788]'
      )}
      onClick={() => onAdd(product)}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F1F3F0] shrink-0">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-[#D9E2D7]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2B3A29] truncate">{product.name}</p>
        <p className="text-xs text-[#95A893]">
          ${product.price.toLocaleString('es-CO')} / {product.unit}
        </p>
      </div>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
        inCart ? 'bg-[#52B788] text-white' : 'bg-[#F1F3F0] text-[#95A893]'
      )}>
        <Plus className="w-4 h-4" />
      </div>
    </div>
  );
}

/* ─── cart item row ─── */
function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: CartItem;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#D9E2D7]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2B3A29] truncate">{item.product.name}</p>
        <p className="text-xs text-[#95A893]">
          ${item.product.price.toLocaleString('es-CO')} / {item.product.unit}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}
          className="w-7 h-7 rounded-lg bg-[#F1F3F0] flex items-center justify-center hover:bg-[#D9E2D7] transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-[#5C6F5A]" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-[#2B3A29]">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-[#F1F3F0] flex items-center justify-center hover:bg-[#D9E2D7] transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#5C6F5A]" />
        </button>
      </div>
      <div className="text-right min-w-[70px]">
        <p className="text-sm font-bold text-[#E76F51]">
          ${(item.product.price * item.quantity).toLocaleString('es-CO')}
        </p>
      </div>
      <button
        onClick={() => onRemove(item.product.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#95A893] hover:text-[#E63946] hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ─── main component ─── */
export default function Cotizar() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    productsApi.list({ limit: 100 })
      .then((res) => setProducts(res.products.filter((p) => p.status === 'ACTIVE')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartIds = useMemo(() => new Set(cart.map((c) => c.product.id)), [cart]);

  const handleAddProduct = (product: ApiProduct) => {
    if (cartIds.has(product.id)) {
      setCart((prev) =>
        prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart((prev) => [...prev, { product, quantity: 1 }]);
    }
  };

  const handleUpdateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.id !== id));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.product.id === id ? { ...c, quantity: qty } : c))
      );
    }
  };

  const handleRemove = (id: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  };

  const handleSendWhatsapp = async () => {
    if (cart.length === 0 || submitting) return;
    setErrorMsg('');

    // Validaciones (el backend exige nombre y teléfono)
    if (customerName.trim().length < 2) {
      setErrorMsg('Por favor ingresa tu nombre.');
      return;
    }
    if (customerPhone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMsg('Por favor ingresa un teléfono válido (mínimo 8 dígitos).');
      return;
    }

    // Abrir la ventana ANTES del await para evitar el bloqueo de popups
    const waWindow = window.open('', '_blank');

    setSubmitting(true);
    try {
      // Guardar la cotización en la base de datos.
      // El backend agrupa por vendedor y devuelve un link de WhatsApp por cada uno.
      const result = await quotesApi.create({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          vendorId: item.product.vendorId,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.unit,
        })),
      });

      const links = result.whatsappLinks ?? [];

      if (links.length > 0 && waWindow) {
        // Abrir el primer vendedor en la ventana ya abierta
        waWindow.location.href = links[0].link;
        // Si hay más vendedores, abrir el resto en pestañas adicionales
        for (let i = 1; i < links.length; i++) {
          window.open(links[i].link, '_blank');
        }
      } else if (waWindow) {
        waWindow.close();
      }

      // Limpiar el carrito tras enviar
      setCart([]);
      setNotes('');
    } catch (err) {
      if (waWindow) waWindow.close();
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo enviar la cotización. Intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-[#2B3A29]">
          Cotizar por WhatsApp
        </h1>
        <p className="text-[#5C6F5A] mt-2 text-lg">
          Selecciona los productos que necesitas y envia tu cotizacion directamente por WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Product selector */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5">
            <h2 className="font-display text-lg font-bold text-[#2B3A29] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2D6A4F]" />
              Selecciona productos
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A893]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-9 py-2.5 bg-[#FAFAF5] border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#95A893] hover:text-[#5C6F5A]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Product grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <ProductSelector
                    key={product.id}
                    product={product}
                    onAdd={handleAddProduct}
                    inCart={cartIds.has(product.id)}
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-[#95A893] text-center py-8 col-span-2">
                    No se encontraron productos
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Send */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product p-5 sticky top-24">
            <h2 className="font-display text-lg font-bold text-[#2B3A29] mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              Tu cotizacion
              {cart.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#D8F3DC] text-[#2D6A4F] font-bold">
                  {cart.length}
                </span>
              )}
            </h2>

            {/* Customer info */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A893]" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FAFAF5] border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A893]" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Tu telefono"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FAFAF5] border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all"
                />
              </div>
            </div>

            {/* Cart items */}
            <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                  <div
                    key="empty"
                    className="text-center py-8"
                  >
                    <ShoppingBag className="w-10 h-10 mx-auto text-[#D9E2D7] mb-2" />
                    <p className="text-sm text-[#95A893]">
                      Agrega productos a tu cotizacion
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      onUpdateQty={handleUpdateQty}
                      onRemove={handleRemove}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Notes */}
            {cart.length > 0 && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales (opcional)"
                rows={2}
                className="w-full px-3 py-2.5 bg-[#FAFAF5] border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all resize-none mb-4"
              />
            )}

            {/* Total */}
            {cart.length > 0 && (
              <div className="flex items-center justify-between py-3 border-t border-[#F1F3F0] mb-4">
                <span className="text-sm font-medium text-[#5C6F5A]">Total estimado:</span>
                <span className="text-2xl font-bold text-[#E76F51] font-display">
                  ${cartTotal.toLocaleString('es-CO')}
                </span>
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <p className="text-sm text-[#E63946] bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                {errorMsg}
              </p>
            )}

            {/* Send button */}
            <button
              onClick={handleSendWhatsapp}
              disabled={cart.length === 0 || submitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-md',
                cart.length > 0 && !submitting
                  ? 'bg-[#25D366] hover:bg-[#128C7E] hover:-translate-y-0.5'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar cotizacion por WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
