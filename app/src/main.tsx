import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'
import { api } from './api/client'

// Despierta el backend en cuanto se abre la página (Render free se duerme),
// así ya está caliente cuando el usuario entra al catálogo o cotiza.
api.warmup()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
)
