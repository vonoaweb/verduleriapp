import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'

// Rutas cargadas bajo demanda: el cliente no descarga el panel de
// admin/vendedor al entrar, así la primera carga es mucho más rápida.
const Catalogo = lazy(() => import('./pages/Catalogo'))
const Cotizar = lazy(() => import('./pages/Cotizar'))
const Pago = lazy(() => import('./pages/Pago'))
const Login = lazy(() => import('./pages/Login'))
const Admin = lazy(() => import('./pages/Admin'))
const Productos = lazy(() => import('./pages/Productos'))
const Cotizaciones = lazy(() => import('./pages/Cotizaciones'))
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'))
const VendorProductos = lazy(() => import('./pages/VendorProductos'))
const VendorProductoNuevo = lazy(() => import('./pages/VendorProductoNuevo'))
const VendorCotizaciones = lazy(() => import('./pages/VendorCotizaciones'))

// Spinner mientras carga un chunk
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Componente para proteger rutas
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/cotizar" element={<Cotizar />} />
          <Route path="/pago/:id" element={<Pago />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas de admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/admin/productos" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Productos />
            </ProtectedRoute>
          } />
          <Route path="/admin/productos/:id/editar" element={
            <ProtectedRoute roles={['ADMIN']}>
              <VendorProductoNuevo />
            </ProtectedRoute>
          } />
          <Route path="/admin/cotizaciones" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Cotizaciones />
            </ProtectedRoute>
          } />

          {/* Rutas de vendedor */}
          <Route path="/vendedor" element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <VendorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/vendedor/productos" element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <VendorProductos />
            </ProtectedRoute>
          } />
          <Route path="/vendedor/productos/nuevo" element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <VendorProductoNuevo />
            </ProtectedRoute>
          } />
          <Route path="/vendedor/productos/:id/editar" element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <VendorProductoNuevo />
            </ProtectedRoute>
          } />
          <Route path="/vendedor/cotizaciones" element={
            <ProtectedRoute roles={['VENDOR', 'ADMIN']}>
              <VendorCotizaciones />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Layout>
  )
}
