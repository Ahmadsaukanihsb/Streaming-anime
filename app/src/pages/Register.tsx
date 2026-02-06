import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Film, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { DEFAULT_SITE_NAME } from '../config/api';
import { StaticPageSEO } from '@/components/Seo';

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Site settings (logo dinamis)
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [siteLogo, setSiteLogo] = useState('');

  // Load site settings
  useEffect(() => {
    const storedName = localStorage.getItem('siteName');
    const storedLogo = localStorage.getItem('siteLogo');
    if (storedName) setSiteName(storedName);
    if (storedLogo) setSiteLogo(storedLogo);
  }, []);

  const validateEmail = useCallback((value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};
    
    if (!name.trim()) {
      errors.name = 'Nama wajib diisi';
    } else if (name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter';
    }
    
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
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Password tidak cocok';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, email, password, confirmPassword, validateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const success = await register(name.trim(), email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Gagal mendaftar. Email mungkin sudah terdaftar.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength();
  const strengthLabels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  // Clear validation error on input
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (validationErrors.name) {
      setValidationErrors(prev => ({ ...prev, name: undefined }));
    }
  };

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

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <>
      <StaticPageSEO
        title="Daftar"
        description="Buat akun Animeku gratis dan bergabung dengan komunitas penggemar anime terbesar."
        canonical="/register"
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center overflow-hidden">
                {siteLogo ? (
                  <img src={siteLogo} alt={siteName} className="w-full h-full object-cover" />
                ) : (
                  <Film className="w-6 h-6 text-white" />
                )}
              </div>
            </Link>
            <h1 className="text-2xl font-bold font-heading text-white mb-2">
              Buat Akun Baru
            </h1>
            <p className="text-white/50">
              Bergabung dengan komunitas penggemar anime terbesar
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
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-white/70 text-sm mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="John Doe"
                  autoFocus
                  autoComplete="name"
                  disabled={isLoading}
                  aria-invalid={!!validationErrors.name}
                  aria-describedby={validationErrors.name ? 'name-error' : undefined}
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.name 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-[#6C5DD3] focus:ring-[#6C5DD3]/20'
                  }`}
                />
              </div>
              {validationErrors.name && (
                <p id="name-error" className="mt-1 text-red-400 text-xs">
                  {validationErrors.name}
                </p>
              )}
            </div>

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
                  autoComplete="email"
                  disabled={isLoading}
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
                  autoComplete="new-password"
                  disabled={isLoading}
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

              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength - 1] : 'bg-white/10'
                          }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength > 2 ? 'text-green-400' : 'text-white/40'}`}>
                    Kekuatan: {strengthLabels[strength - 1] || 'Sangat Lemah'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-white/70 text-sm mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!validationErrors.confirmPassword}
                  aria-describedby={validationErrors.confirmPassword ? 'confirm-error' : undefined}
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.confirmPassword 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/10 focus:border-[#6C5DD3] focus:ring-[#6C5DD3]/20'
                  }`}
                />
              </div>
              {validationErrors.confirmPassword && (
                <p id="confirm-error" className="mt-1 text-red-400 text-xs">
                  {validationErrors.confirmPassword}
                </p>
              )}
              {confirmPassword && password === confirmPassword && !validationErrors.confirmPassword && (
                <p className="mt-1 text-green-400 text-xs">Password cocok ✓</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#6C5DD3] focus:ring-[#6C5DD3] disabled:opacity-50"
              />
              <span className="text-white/50 text-sm">
                Saya menyetujui{' '}
                <Link to="/terms" className="text-[#6C5DD3] hover:text-[#00C2FF]">
                  Syarat dan Ketentuan
                </Link>{' '}
                serta{' '}
                <Link to="/privacy" className="text-[#6C5DD3] hover:text-[#00C2FF]">
                  Kebijakan Privasi
                </Link>
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Daftar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-white/50 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#6C5DD3] hover:text-[#00C2FF] font-medium transition-colors">
              Masuk sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
    </>
  );
}
