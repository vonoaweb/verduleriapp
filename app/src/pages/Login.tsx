import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, User, Phone, Eye, EyeOff, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name, phone: phone || undefined, role });
      }
      navigate(role === 'VENDOR' ? '/vendedor' : '/');
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full pl-11 pr-4 py-3 bg-white border border-[#D9E2D7] rounded-xl text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all';

  return (
    <div className="min-h-[calc(100dvh-72px)] flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--off-white, #FAFAF5)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Leaf className="w-8 h-8 text-[#2D6A4F]" />
            <span className="font-display text-2xl font-bold text-[#2D6A4F]">VerduleriApp</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-[#2B3A29] mt-4">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </h1>
          <p className="text-sm text-[#5C6F5A] mt-1">
            {mode === 'login'
              ? 'Accede a tu cuenta de VerduleriApp'
              : 'Regístrate para comprar o vender'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-product p-6 border border-[#D9E2D7]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo"
                    className={inputClass}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    className={inputClass}
                  />
                </div>

                {/* Role */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      role === 'CUSTOMER'
                        ? 'border-[#2D6A4F] bg-[#D8F3DC] text-[#2D6A4F]'
                        : 'border-[#D9E2D7] text-[#5C6F5A] hover:bg-[#F1F3F0]'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Comprador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('VENDOR')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      role === 'VENDOR'
                        ? 'border-[#2D6A4F] bg-[#D8F3DC] text-[#2D6A4F]'
                        : 'border-[#D9E2D7] text-[#5C6F5A] hover:bg-[#F1F3F0]'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Vendedor
                  </button>
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#95A893]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className={`${inputClass} pr-11`}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#95A893] hover:text-[#5C6F5A]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#2D6A4F] text-white font-semibold rounded-xl hover:bg-[#1B4332] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading
                ? 'Cargando...'
                : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center mt-5 text-sm text-[#5C6F5A]">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="font-semibold text-[#2D6A4F] hover:underline"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="font-semibold text-[#2D6A4F] hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>

          {/* Demo credentials */}
          <div className="mt-4 pt-4 border-t border-[#F1F3F0]">
            <p className="text-xs text-[#95A893] text-center mb-2">Credenciales de prueba:</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-[#5C6F5A]">
              <button
                onClick={() => { setEmail('admin@verduleriapp.com'); setPassword('admin123'); setMode('login'); }}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-[#F1F3F0] transition-colors"
              >
                <span className="font-medium">Admin:</span> admin@verduleriapp.com
              </button>
              <button
                onClick={() => { setEmail('maria@frutasmaria.cl'); setPassword('vendor123'); setMode('login'); }}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-[#F1F3F0] transition-colors"
              >
                <span className="font-medium">Vendedor:</span> maria@frutasmaria.cl
              </button>
              <button
                onClick={() => { setEmail('cliente@ejemplo.com'); setPassword('cliente123'); setMode('login'); }}
                className="text-left px-3 py-1.5 rounded-lg hover:bg-[#F1F3F0] transition-colors"
              >
                <span className="font-medium">Cliente:</span> cliente@ejemplo.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
