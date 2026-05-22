import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 72;

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/vendedor' },
  { label: 'Mis Productos', icon: Package, path: '/vendedor/productos' },
  { label: 'Subir Producto', icon: PlusCircle, path: '/vendedor/productos/nuevo' },
  { label: 'Mis Cotizaciones', icon: MessageSquare, path: '/vendedor/cotizaciones' },
];

interface VendorLayoutProps {
  children: ReactNode;
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/vendedor') {
      return location.pathname === '/vendedor';
    }
    return location.pathname.startsWith(path);
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-[100dvh] flex bg-[#F8FAF7]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#1B4332] flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white p-1"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-white">
          <Store className="w-5 h-5" />
          <span className="font-display font-bold text-sm">Mi Tienda</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="hidden lg:flex flex-col bg-[#1B4332] fixed top-0 left-0 bottom-0 z-30"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#52B788] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span className="font-display font-bold text-white text-base">
                    Mi Tienda
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl transition-all duration-200 relative',
                  active
                    ? 'bg-[#52B788] text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                  collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
                )}
                title={collapsed ? item.label : undefined}
              >
                {active && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full"
                    transition={{ duration: 0.25 }}
                  />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200',
              collapsed ? 'justify-center p-3' : 'px-4 py-3'
            )}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Colapsar</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-[#1B4332] z-50 flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#52B788] flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-white text-base">
                  Mi Tienda
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 py-6 px-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                      active
                        ? 'bg-[#52B788] text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 w-[3px] h-6 bg-white rounded-r-full" />
                    )}
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex-1 min-h-[100dvh] pt-14 lg:pt-0"
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
