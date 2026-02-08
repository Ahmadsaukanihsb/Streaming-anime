import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Film, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { DEFAULT_SITE_NAME } from '../config/api';
import { StaticPageSEO } from '@/components/Seo';
import TurnstileWidget from '@/components/TurnstileWidget';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  // Site settings (logo dinamis)
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [siteLogo, setSiteLogo] = useState('');

  // Load site settings
  useEffect(() => {
    const storedName = localStorage.getItem('siteName');
    const storedLogo = localStorage.getItem('siteLogo');
    if (storedName) setSiteName(storedName);
    if (storedLogo) setSiteLogo(storedLogo);
    // Also set favicon
    const faviconUrl = localStorage.getItem('siteFavicon') || storedLogo;
    if (faviconUrl) {
      const faviconLink = document.getElementById('site-favicon') as HTMLLinkElement;
      if (faviconLink) faviconLink.href = `${faviconUrl}?v=${Date.now()}`;
    }
  }, []);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const interval = setInterval(() => {
      if (Date.now() >= lockoutUntil) {
        setLockoutUntil(null);
        setAttempts(0);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const validateEmail = useCallback((value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};
    
    if (!email) {
      errors.email = 'Email wajib diisi';
    } else if (!validateEmail(email)) {
      errors.email = 'Format email tidak valid';
    }
    
    if (!password) {
      errors.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password, validateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Terlalu banyak percobaan. Coba lagi dalam ${remaining} detik.`);
      return;
    }
    
    // Validate
    if (!validateForm()) return;
    
    // Verify Turnstile
    if (!turnstileToken) {
      setError('Silakan verifikasi bahwa Anda bukan robot.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Verify Turnstile token with backend
      const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-turnstile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken })
      });
      
      if (!verifyRes.ok) {
        setError('Verifikasi keamanan gagal. Silakan coba lagi.');
        setTurnstileToken('');
        return;
      }
      
      const success = await login(email, password);
      if (success) {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Reset attempts on success
        setAttempts(0);
        navigate('/');
      } else {
        handleLoginFailure();
      }
    } catch (err) {
      handleLoginFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginFailure = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    // Lockout after 5 failed attempts
    if (newAttempts >= 5) {
      const lockoutTime = Date.now() + 30000; // 30 seconds
      setLockoutUntil(lockoutTime);
      setError('Terlalu banyak percobaan gagal. Silakan tunggu 30 detik.');
    } else {
      setError('Email atau password salah');
    }
  };

  const getLockoutRemaining = () => {
    if (!lockoutUntil) return 0;
    return Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
  };

  // Clear validation error on input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setEmail(value);
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;

  return (
    <>
      <StaticPageSEO
        title="Login"
        description="Masuk ke akun Animeku untuk melanjutkan menonton anime favoritmu."
        canonical="/login"
      />
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C5DD3]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#00C2FF]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-[#1A1A2E]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${siteLogo ? 'bg-transparent' : 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF]'}`}>
                {siteLogo ? (
                  <img src={siteLogo} alt={siteName} className="w-full h-full object-contain" />
                ) : (
                  <Film className="w-6 h-6 text-white" />
                )}
              </div>
            </Link>
            <h1 className="text-2xl font-bold font-heading text-white mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-white/50">
              Masuk untuk melanjutkan menonton anime favoritmu
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-white/70 text-sm mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="nama@email.com"
                  autoFocus
                  autoComplete="email"
                  disabled={isLoading || !!isLockedOut}
                  aria-invalid={!!validationErrors.email}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.email 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-[#6C5DD3] focus:ring-[#6C5DD3]/20'
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p id="email-error" className="mt-1 text-red-400 text-xs">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-white/70 text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading || !!isLockedOut}
                  aria-invalid={!!validationErrors.password}
                  aria-describedby={validationErrors.password ? 'password-error' : undefined}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.password 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-[#6C5DD3] focus:ring-[#6C5DD3]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors disabled:opacity-50"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p id="password-error" className="mt-1 text-red-400 text-xs">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#6C5DD3] focus:ring-[#6C5DD3] disabled:opacity-50"
                />
                <span className="text-white/50 text-sm">Ingat saya</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-[#6C5DD3] hover:text-[#00C2FF] text-sm transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            {/* Turnstile Verification */}
            <div className="flex justify-center py-2">
              <TurnstileWidget 
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !!isLockedOut || !turnstileToken}
              className="w-full py-3 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLockedOut ? (
                `Tunggu ${getLockoutRemaining()} detik`
              ) : !turnstileToken ? (
                'Verifikasi terlebih dahulu'
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-white/50 mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[#6C5DD3] hover:text-[#00C2FF] font-medium transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
    </>
  );
}
