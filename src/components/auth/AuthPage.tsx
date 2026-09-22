import React, { useState } from 'react';
import { 
  Shield, 
  Eye, 
  Mail, 
  ArrowRight, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email format validation: standard RFC 5322 compatible regex
  const isValidEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = email.trim();

    // Check email format
    if (!isValidEmail(trimmed)) {
      setErrorMessage('Enter a valid email address');
      return;
    }

    // Valid email: immediately create SANJAYA session and open Dashboard
    setIsLoading(true);
    try {
      await login(trimmed);
      // login synchronously sets user session in AuthContext & localStorage,
      // which triggers App.tsx to immediately render the Dashboard.
    } catch (err: unknown) {
      console.error('Login error:', err);
      setErrorMessage('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login('bhaskar@gmail.com', 'Bhaskar');
    } catch (err: unknown) {
      console.error('Demo login error:', err);
      setErrorMessage('Failed to sign in as demo user.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 text-zinc-900">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/40 overflow-hidden">
        
        {/* Left Hero Card - Consistent with SANJAYA Identity */}
        <div className="md:col-span-6 bg-[#121316] p-8 sm:p-10 flex flex-col justify-between text-white relative">
          <div className="space-y-6 z-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-sm">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block">SANJAYA</span>
                <span className="text-[11px] font-medium text-zinc-400">Know who's there. Stay in control.</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                Calm, intelligent home awareness.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Autonomous perimeter monitoring, facial recognition, and instant verification designed for total homeowner peace of mind.
              </p>
            </div>

            {/* Entrance Camera Preview Card */}
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 group">
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
                alt="Main Entrance Preview"
                className="h-44 sm:h-52 w-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-transparent to-black/30" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Stream Ready</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-xs text-zinc-300 font-medium">
                Front Entrance · AI Telemetry Active
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400 z-10">
            <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Zero false panic · End-to-end encrypted home security</span>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="md:col-span-6 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto space-y-6">

            {/* Error Message Alert */}
            {errorMessage && (
              <div 
                id="auth-error-alert" 
                className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium flex items-start gap-2 animate-in fade-in"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Email Input Form */}
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Sign in to SANJAYA
                </h1>
                <p className="mt-1 text-xs text-zinc-500">
                  Enter your email to sign in or create your home security account.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="auth-email-input" 
                    className="block text-xs font-semibold text-zinc-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      id="auth-email-input"
                      type="text"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="e.g. name@example.com"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition"
                    />
                  </div>
                </div>

                <button
                  id="auth-continue-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition shadow-xs cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center pt-2">
                <div className="border-t border-zinc-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold absolute">
                  or
                </span>
              </div>

              {/* Quick Demo Access Button */}
              <button
                id="auth-demo-btn"
                type="button"
                onClick={handleDemoAccess}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Instant Access (Bhaskar - Homeowner)</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
