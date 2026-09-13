import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  UtensilsCrossed,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  User,
  CheckCircle2,
} from "lucide-react";

interface TestAccount {
  role: string;
  title: string;
  email: string;
  pass: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    role: "student",
    title: "Student Account",
    email: "student@campuseats.com",
    pass: "student123",
  },
  {
    role: "kitchen",
    title: "Kitchen KDS",
    email: "kitchen@campuseats.com",
    pass: "kitchen123",
  },
  {
    role: "counter",
    title: "Pickup Counter",
    email: "counter@campuseats.com",
    pass: "counter123",
  },
  {
    role: "admin",
    title: "Administrator",
    email: "admin@campuseats.com",
    pass: "admin123",
  },
];

export const LoginPage: React.FC = () => {
  const { loginUser, registerUser } = useApp();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const [activeAccountEmail, setActiveAccountEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSelectAccount = (account: TestAccount) => {
    setIsRegisterMode(false);
    setEmail(account.email);
    setPassword(account.pass);
    setActiveAccountEmail(account.email);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your campus email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    try {
      setLoading(true);

      if (isRegisterMode) {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        await registerUser(name.trim(), email.trim(), password, selectedRole);
        setSuccess("Account created successfully! Redirecting...");
      } else {
        await loginUser(email.trim(), password);
        setSuccess("Signed in successfully! Redirecting...");
      }

      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please check credentials.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] relative flex flex-col justify-center items-center px-4 py-8 sm:py-12 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Ambient warm gradient glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 mx-auto mb-3.5 transition-transform hover:scale-105 duration-300">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>

          <div className="inline-flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              CampusEats
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200">
              LIVE
            </span>
          </div>

          <p className="text-slate-500 text-sm mt-1 font-medium">
            Smart Canteen Pre-Order & Digital Token System
          </p>
        </div>

        {/* Floating Card */}
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              {isRegisterMode ? "Create your account" : "Sign In to your account"}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              {isRegisterMode
                ? "Join CampusEats to skip queues and pre-order food effortlessly."
                : "Enter your registered campus email and password to access the cafeteria menu and wallet."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name field (Register mode) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campus Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (activeAccountEmail && e.target.value !== activeAccountEmail) {
                      setActiveAccountEmail(null);
                    }
                  }}
                  placeholder="user@email.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selector (Register mode only) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "kitchen", "counter", "admin"] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition ${
                        selectedRole === r
                          ? "bg-orange-50 border-orange-500 text-orange-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error state message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success state message */}
            {success && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Sign In CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{isRegisterMode ? "Create CampusEats Account" : "Sign In to CampusEats"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Link */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
                setSuccess("");
              }}
              className="text-xs font-semibold text-slate-600 hover:text-orange-600 transition cursor-pointer"
            >
              {isRegisterMode
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>

          {/* Quick Test Accounts Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                Quick Test Accounts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TEST_ACCOUNTS.map((acc) => {
                const isSelected = activeAccountEmail === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`text-left p-2.5 rounded-xl border transition group cursor-pointer ${
                      isSelected
                        ? "border-orange-400 bg-orange-50/70 shadow-sm ring-1 ring-orange-400/30"
                        : "border-slate-200/80 bg-slate-50/60 hover:bg-orange-50/50 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold transition ${
                          isSelected
                            ? "text-orange-600"
                            : "text-slate-800 group-hover:text-orange-600"
                        }`}
                      >
                        {acc.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                      {acc.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-400 text-xs mt-6">
          CampusEats - Smart Canteen Pre-Order & Digital Token System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
