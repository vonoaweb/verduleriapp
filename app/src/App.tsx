import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import Cotizar from './pages/Cotizar'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Productos from './pages/Productos'
import Cotizaciones from './pages/Cotizaciones'
import VendorDashboard from './pages/VendorDashboard'
import VendorProductos from './pages/VendorProductos'
import VendorProductoNuevo from './pages/VendorProductoNuevo'
import VendorCotizaciones from './pages/VendorCotizaciones'

// Componente para proteger rutas
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/cotizar" element={<Cotizar />} />
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
    </Layout>
  )
}
