import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import {
  UtensilsCrossed,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { loginUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission when fields are empty
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginUser(email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to connect to the login server. Please ensure the backend is running at http://localhost:5000.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setErrorMessage(null);
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex flex-col justify-center items-center px-4 py-10 font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25 mb-4">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">CampusEats</h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-xs mx-auto">
            Smart Canteen Pre-Order & Digital Token System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl shadow-zinc-950/5 p-6 sm:p-8 backdrop-blur-xs">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-zinc-900">Sign In to your account</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your registered campus email and password to access the cafeteria menu and wallet.
            </p>
          </div>

          {/* Backend error alert */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in zoom-in-95 duration-150"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email-input" className="block text-xs font-bold text-zinc-700 mb-1.5">
                Campus Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  placeholder="user@email.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password-input" className="block text-xs font-bold text-zinc-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to CampusEats</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3 h-3 text-orange-500" />
              <span>Quick Test Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => fillQuickCredentials('user@email.com')}
                className="text-left p-2 rounded-xl bg-zinc-50 hover:bg-orange-50 border border-zinc-200/70 hover:border-orange-200 transition cursor-pointer text-[11px]"
              >
                <div className="font-bold text-zinc-800">Student Account</div>
                <div className="text-zinc-400 truncate">user@email.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('kitchen@campus.edu')}
                className="text-left p-2 rounded-xl bg-zinc-50 hover:bg-orange-50 border border-zinc-200/70 hover:border-orange-200 transition cursor-pointer text-[11px]"
              >
                <div className="font-bold text-zinc-800">Kitchen KDS</div>
                <div className="text-zinc-400 truncate">kitchen@campus.edu</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('counter@campus.edu')}
                className="text-left p-2 rounded-xl bg-zinc-50 hover:bg-orange-50 border border-zinc-200/70 hover:border-orange-200 transition cursor-pointer text-[11px]"
              >
                <div className="font-bold text-zinc-800">Pickup Counter</div>
                <div className="text-zinc-400 truncate">counter@campus.edu</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@campus.edu')}
                className="text-left p-2 rounded-xl bg-zinc-50 hover:bg-orange-50 border border-zinc-200/70 hover:border-orange-200 transition cursor-pointer text-[11px]"
              >
                <div className="font-bold text-zinc-800">Administrator</div>
                <div className="text-zinc-400 truncate">admin@campus.edu</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Campus Identity & Token-Based Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
