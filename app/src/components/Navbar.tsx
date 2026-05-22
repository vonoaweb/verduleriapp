import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Menu, X, Store, LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const publicLinks = [
  { label: 'Inicio', path: '/' },
  { label: 'Catálogo', path: '/catalogo' },
  { label: 'Cotizar', path: '/cotizar' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isVendor, isAdmin, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Build nav links based on role
  const navLinks = [
    ...publicLinks,
    ...(isVendor || isAdmin ? [{ label: 'Vender', path: '/vendedor' }] : []),
    ...(isAdmin ? [{ label: 'Admin', path: '/admin' }] : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-[12px] shadow-product'
          : 'bg-white'
      }`}
    >
      <div className="max-w-[1280px] mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Leaf className="w-7 h-7 text-[#2D6A4F] transition-transform group-hover:rotate-[-12deg]" />
          <span className="font-display text-[22px] font-bold text-[#2D6A4F]">
            VerduleriApp
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative font-body text-[15px] font-medium transition-colors duration-200 ${
                location.pathname === link.path || location.pathname.startsWith(link.path + '/')
                  ? 'text-[#2D6A4F]'
                  : 'text-[#2B3A29] hover:text-[#2D6A4F]'
              }`}
            >
              {link.label === 'Vender' ? (
                <span className="flex items-center gap-1.5">
                  <Store className="w-4 h-4" />
                  {link.label}
                </span>
              ) : (
                link.label
              )}
              {(location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))) && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#2D6A4F] rounded-full"
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F1F3F0] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#2D6A4F]" />
                </div>
                <span className="text-sm font-medium text-[#2B3A29] max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-[#95A893]" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#D9E2D7] py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-[#F1F3F0]">
                      <p className="text-sm font-medium text-[#2B3A29]">{user?.name}</p>
                      <p className="text-xs text-[#95A893]">{user?.email}</p>
                      <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#D8F3DC] text-[#2D6A4F]">
                        {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'VENDOR' ? 'Vendedor' : 'Cliente'}
                      </span>
                    </div>
                    {isVendor && (
                      <Link
                        to="/vendedor"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#2B3A29] hover:bg-[#F1F3F0] transition-colors"
                      >
                        <Store className="w-4 h-4" />
                        Mi Tienda
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#E63946] hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#2D6A4F] hover:bg-[#D8F3DC] rounded-xl transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Ingresar
              </Link>
              <Link
                to="/cotizar"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-body text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-[1.03]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Cotizar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#2B3A29] hover:text-[#2D6A4F] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
            className="fixed inset-0 top-[72px] bg-white z-40 md:hidden"
          >
            <div className="flex flex-col p-6 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-body text-lg font-medium py-3 px-4 rounded-xl transition-colors ${
                    location.pathname === link.path
                      ? 'bg-[#D8F3DC] text-[#2D6A4F]'
                      : 'text-[#2B3A29] hover:bg-[#F1F3F0]'
                  }`}
                >
                  {link.label === 'Vender' ? (
                    <span className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      {link.label}
                    </span>
                  ) : (
                    link.label
                  )}
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-[#F1F3F0]">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#2D6A4F]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2B3A29]">{user?.name}</p>
                        <p className="text-xs text-[#95A893]">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3 text-[#E63946] font-medium rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center justify-center gap-2 py-3 text-[#2D6A4F] font-medium rounded-xl hover:bg-[#D8F3DC] transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Ingresar
                    </Link>
                    <Link
                      to="/cotizar"
                      className="mt-2 flex items-center justify-center gap-2 bg-[#25D366] text-white font-body font-semibold py-3 rounded-full"
                    >
                      Cotizar por WhatsApp
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
