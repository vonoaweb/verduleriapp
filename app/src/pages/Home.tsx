import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  Leaf,
  Clock,
  ShieldCheck,
  Search,
  MessageCircle,
  Package,
  Tag,
  Truck,
} from 'lucide-react'
import { productsApi } from '@/api/products'

/* ─────────────────── easing helper ─────────────────── */
const easeExpoOut = [0.19, 1, 0.22, 1] as [number, number, number, number]

/* ─────────────────── Animated Counter ─────────────────── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration: 1.2,
        ease: easeExpoOut,
      })
      return controls.stop
    }
  }, [isInView, value, motionVal])

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

/* ═══════════════════ SECTION 1: HERO ═══════════════════ */
function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: 'calc(100dvh - 72px)',
        backgroundColor: 'var(--off-white)',
      }}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'url(/hero-pattern.svg)' }}
      />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0 min-h-[calc(100dvh-72px)] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-8 items-center w-full">
          {/* Text Column */}
          <div className="order-1 lg:order-1">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easeExpoOut }}
              className="font-display text-[40px] sm:text-[56px] lg:text-[72px] font-extrabold leading-[1.1] text-[#1B4332] max-w-[600px]"
            >
              Frutas y Verduras{' '}
              <span className="text-[#E76F51]">Frescas</span> al Mejor Precio
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: easeExpoOut }}
              className="font-body text-base sm:text-lg text-[#5C6F5A] leading-relaxed max-w-[480px] mt-6"
            >
              Solicita tu cotización por WhatsApp y recibe los mejores precios de frutas y verduras
              frescas directamente en tu teléfono. ¡Es rápido, fácil y sin compromiso!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: easeExpoOut }}
              className="flex flex-col sm:flex-row gap-4 mt-10"
            >
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white font-body font-semibold text-base px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                Ver Catálogo
              </Link>
              <Link
                to="/cotizar"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-body font-semibold text-base px-6 py-3 rounded-full transition-all duration-200 hover:scale-[1.03]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Cotizar por WhatsApp
              </Link>
            </motion.div>
          </div>

          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ duration: 1, delay: 0.3, ease: easeExpoOut }}
            className="order-2 lg:order-2 flex justify-center lg:justify-end"
          >
            <div className="relative group cursor-pointer">
              <img
                src="/hero-produce.jpg"
                alt="Frutas y verduras frescas"
                className="w-full max-w-[520px] h-auto rounded-3xl shadow-hero transition-all duration-400 group-hover:rotate-0 group-hover:scale-[1.02]"
                loading="eager"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: easeExpoOut }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 w-[calc(100%-32px)] max-w-[720px]"
      >
        <div className="bg-white rounded-2xl shadow-stats px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-[#2D6A4F]" />
            <div>
              <p className="font-display text-xl sm:text-[28px] font-bold text-[#1B4332]">
                +<AnimatedCounter value={50} />
              </p>
              <p className="font-body text-sm text-[#95A893]">Productos</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-[#D9E2D7]" />
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#2D6A4F]" />
            <div>
              <p className="font-display text-xl sm:text-[28px] font-bold text-[#1B4332]">
                Mismo Día
              </p>
              <p className="font-body text-sm text-[#95A893]">Entrega rápida</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-[#D9E2D7]" />
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#2D6A4F]" />
            <div>
              <p className="font-display text-xl sm:text-[28px] font-bold text-[#1B4332]">
                100% Frescos
              </p>
              <p className="font-body text-sm text-[#95A893]">Calidad garantizada</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════ SECTION 2: HOW IT WORKS ═══════════════════ */
const steps = [
  {
    number: '01',
    icon: Search,
    iconColor: 'text-[#2D6A4F]',
    title: 'Explora nuestro catálogo',
    description:
      'Navega por nuestro catálogo de frutas y verduras frescas. Tenemos más de 50 productos disponibles.',
  },
  {
    number: '02',
    icon: MessageCircle,
    iconColor: 'text-[#25D366]',
    title: 'Envía tu cotización por WhatsApp',
    description:
      'Selecciona los productos que necesitas y envíanos tu lista por WhatsApp. Te responderemos en minutos.',
  },
  {
    number: '03',
    icon: Package,
    iconColor: 'text-[#E76F51]',
    title: 'Recibe tu cotización',
    description:
      'Te enviaremos los precios actualizados y coordinamos la entrega. ¡Así de fácil!',
  },
]

function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="bg-white pt-[140px] sm:pt-[160px] pb-20 lg:pb-[120px]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: easeExpoOut }}
          className="font-display text-2xl sm:text-[32px] font-bold text-[#2B3A29] text-center"
        >
          ¿Cómo Funciona?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: easeExpoOut }}
          className="font-body text-base sm:text-lg text-[#95A893] text-center mt-3 mb-12 lg:mb-16"
        >
          Tres simples pasos para recibir tu cotización
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i, ease: easeExpoOut }}
              className="relative bg-[#F8FAF7] rounded-2xl px-6 sm:px-8 py-10 text-center"
            >
              <span className="absolute top-4 right-5 font-display text-[48px] font-extrabold text-[#D8F3DC] leading-none select-none">
                {step.number}
              </span>
              <step.icon className={`w-12 h-12 ${step.iconColor} mx-auto`} />
              <h3 className="font-body text-lg sm:text-xl font-semibold text-[#2B3A29] mt-6">
                {step.title}
              </h3>
              <p className="font-body text-base text-[#5C6F5A] mt-3 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════ SECTION 3: FEATURED PRODUCTS ═══════════════════ */
function FeaturedProductsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.15 })
  const [featuredProducts, setFeaturedProducts] = useState<Array<{id: string; name: string; category: string; price: number; unit: string; imageUrl?: string | null}>>([])

  useEffect(() => {
    productsApi.list({ featured: true, limit: 8 }).then(res => {
      setFeaturedProducts(res.products)
    }).catch(() => {})
  }, [])

  return (
    <section className="bg-[#F8FAF7] py-20 lg:py-[100px]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: easeExpoOut }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-12"
        >
          <div>
            <h2 className="font-display text-2xl sm:text-[32px] font-bold text-[#2B3A29]">
              Productos Destacados
            </h2>
            <p className="font-body text-base text-[#95A893] mt-2">
              Los favoritos de nuestros clientes
            </p>
          </div>
          <Link
            to="/catalogo"
            className="font-body text-base text-[#2D6A4F] hover:underline transition-all inline-flex items-center gap-1"
          >
            Ver catálogo completo
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.08 * i, ease: easeExpoOut }}
              className="group bg-white rounded-2xl border border-[#D9E2D7] shadow-product overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-product-hover"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-[#F1F3F0]">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.08]"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-[#D9E2D7]" />
                  </div>
                )}
                <span
                  className={`absolute top-3 left-3 text-xs font-body font-medium px-3 py-1 rounded-full ${
                    product.category === 'FRUIT'
                      ? 'bg-[#FFF3E0] text-[#E65100]'
                      : 'bg-[#E8F5E9] text-[#2E7D32]'
                  }`}
                >
                  {product.category === 'FRUIT' ? 'Fruta' : 'Verdura'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-body text-lg font-semibold text-[#2B3A29]">
                  {product.name}
                </h3>
                <p className="font-display text-[22px] font-bold text-[#E76F51] mt-1">
                  ${product.price.toLocaleString()}
                  <span className="font-body text-sm font-normal text-[#95A893] ml-1">
                    /{product.unit}
                  </span>
                </p>
                <Link
                  to="/cotizar"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-body text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Cotizar
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════ SECTION 4: CATEGORIES ═══════════════════ */
const staticCategories = [
  { id: 'FRUIT', name: 'Frutas', image: '/category-fruits.jpg' },
  { id: 'VEGETABLE', name: 'Verduras', image: '/category-vegetables.jpg' },
]

function CategoriesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="bg-white py-20 lg:py-[100px]">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: easeExpoOut }}
          className="font-display text-2xl sm:text-[32px] font-bold text-[#2B3A29] text-center mb-10 lg:mb-12"
        >
          Explora por Categoría
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {staticCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i, ease: easeExpoOut }}
            >
              <Link to={`/catalogo?categoria=${cat.id}`} className="group block relative overflow-hidden rounded-[20px] h-[300px] sm:h-[360px]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.05]"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(27,67,50,0.85)] via-[rgba(27,67,50,0.3)] at-50% to-transparent transition-opacity duration-400 group-hover:from-[rgba(27,67,50,0.75)]" />
                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="font-display text-3xl sm:text-[36px] font-bold text-white">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════ SECTION 5: WHY CHOOSE US ═══════════════════ */
const features = [
  {
    icon: Leaf,
    iconColor: 'text-[#52B788]',
    title: 'Productos Frescos',
    description: 'Seleccionamos cada fruta y verdura a mano para garantizar la mejor calidad.',
  },
  {
    icon: Tag,
    iconColor: 'text-[#E9C46A]',
    title: 'Precios Justos',
    description: 'Precios directos del mercado, sin intermediarios. Más fresco, más económico.',
  },
  {
    icon: MessageCircle,
    iconColor: 'text-[#25D366]',
    title: 'Cotización Rápida',
    description: 'Responde por WhatsApp en minutos. Sin esperas, sin complicaciones.',
  },
  {
    icon: Truck,
    iconColor: 'text-[#E76F51]',
    title: 'Entrega Puntual',
    description: 'Coordinamos la entrega según tu conveniencia. Llegamos a tiempo.',
  },
]

function WhyChooseUsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="bg-[#1B4332] py-20 lg:py-[100px]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: easeExpoOut }}
          className="font-display text-2xl sm:text-[36px] font-bold text-white text-center mb-12 lg:mb-16"
        >
          ¿Por Qué Elegirnos?
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.12 * i, ease: easeExpoOut }}
              className="bg-white/[0.06] border border-white/10 rounded-2xl px-6 py-10 text-center"
            >
              <feat.icon className={`w-12 h-12 ${feat.iconColor} mx-auto`} />
              <h3 className="font-body text-lg sm:text-xl font-semibold text-white mt-5">
                {feat.title}
              </h3>
              <p className="font-body text-base text-white/65 mt-3 leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════ SECTION 6: WHATSAPP CTA ═══════════════════ */
function WhatsAppCTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section className="bg-[#D8F3DC] py-16 lg:py-20">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: easeExpoOut }}
          className="font-display text-3xl sm:text-[40px] font-bold text-[#1B4332]"
        >
          ¿Listo para Cotizar?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: easeExpoOut }}
          className="font-body text-base sm:text-lg text-[#5C6F5A] mt-4"
        >
          Escríbenos por WhatsApp y te enviaremos una cotización personalizada con los mejores
          precios.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: easeExpoOut }}
          className="mt-8"
        >
          <Link
            to="/cotizar"
            className="animate-pulse-wa hover:animation-none inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-display text-lg sm:text-xl font-semibold px-10 sm:px-12 py-5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-wa"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Iniciar Cotización
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: easeExpoOut }}
          className="font-body text-base text-[#95A893] mt-5"
        >
          O escríbenos al <span className="font-medium">+57 300 123 4567</span>
        </motion.p>
      </div>
    </section>
  )
}

/* ═══════════════════ HOME PAGE ═══════════════════ */
export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturedProductsSection />
      <CategoriesSection />
      <WhyChooseUsSection />
      <WhatsAppCTASection />
    </>
  )
}
