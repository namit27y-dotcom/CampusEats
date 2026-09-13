import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  UtensilsCrossed,
  MapPin,
  Wallet,
  ShoppingBag,
  Bell,
  ChefHat,
  MonitorPlay,
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  ChevronDown,
  X,
  PlusCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenActiveOrder?: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenActiveOrder, onOpenHistory }) => {
  const {
    currentRole,
    setRole,
    currentUser,
    availableUsers,
    setCurrentUser,
    logoutUser,
    selectedCanteen,
    canteens,
    selectCanteen,
    cartCount,
    activeOrder,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    topUpWallet,
    autoSimulateKitchen,
    setAutoSimulateKitchen,
  } = useApp();

  const [showCanteenDropdown, setShowCanteenDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('200');

  const unreadNotifs = notifications.filter((n) => !n.read);

  const rolesList: { role: UserRole; label: string; icon: React.ElementType }[] = [
    { role: 'student', label: 'Student / Faculty', icon: GraduationCap },
    { role: 'kitchen', label: 'Kitchen KDS', icon: ChefHat },
    { role: 'counter', label: 'Pickup Counter', icon: MonitorPlay },
    { role: 'admin', label: 'Campus Admin', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-xs w-full max-w-full overflow-hidden">
      {/* Top Banner / Ticker */}
      <div className="bg-zinc-900 text-white text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto whitespace-nowrap min-w-0 flex-1 no-scrollbar text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 font-semibold text-orange-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            CampusEats Live:
          </span>
          <span className="text-zinc-300 shrink-0">
            Serving: <strong className="text-white font-mono">{selectedCanteen.currentServingToken}</strong>
          </span>
          <span className="text-zinc-500 shrink-0">|</span>
          <span className="text-zinc-300 shrink-0">
            Wait: <span className="text-emerald-400 font-medium">~{selectedCanteen.waitTimeMinutes}m</span>
          </span>
          <span className="text-zinc-500 shrink-0 hidden sm:inline">|</span>
          <span className="text-orange-300 font-medium hidden sm:inline shrink-0">
            ⚡ Break Time Rush Protection Active
          </span>
        </div>

        {/* Demo Auto-progression toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSimulateKitchen}
              onChange={(e) => setAutoSimulateKitchen(e.target.checked)}
              className="rounded border-zinc-700 text-orange-500 focus:ring-0 w-3.5 h-3.5 accent-orange-500"
            />
            <span className="hidden md:inline">Auto-Demo</span>
          </label>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between min-h-14 sm:min-h-16 gap-1.5 sm:gap-4 w-full">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base sm:text-xl tracking-tight text-zinc-900 leading-none">
                    Campus<span className="text-orange-500">Eats</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 hidden sm:inline-block">
                    Smart Token
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 hidden lg:block font-medium">
                  Order. Token. Pickup. No Queue.
                </p>
              </div>
            </div>

            {/* Canteen Switcher Button */}
            <div className="relative shrink min-w-0">
              <button
                onClick={() => setShowCanteenDropdown(!showCanteenDropdown)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/80 transition max-w-[90px] xs:max-w-[125px] sm:max-w-[180px] min-w-0"
                title="Switch Canteen Location"
              >
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">{selectedCanteen.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 hidden xs:inline-block"></span>
                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
              </button>

              {/* Dropdown */}
              {showCanteenDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCanteenDropdown(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 z-50">
                    <div className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase tracking-wider">
                      Select Campus Canteen
                    </div>
                    <div className="space-y-1 mt-1 max-h-64 overflow-y-auto">
                      {canteens.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            selectCanteen(c.id);
                            setShowCanteenDropdown(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start justify-between transition cursor-pointer ${
                            c.id === selectedCanteen.id
                              ? 'bg-orange-50 border border-orange-200 text-orange-950 font-semibold'
                              : 'hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold truncate">{c.name}</div>
                            <div className="text-[11px] text-zinc-500 truncate">{c.location}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{c.openingHours}</div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              c.status === 'open'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {c.waitTimeMinutes}m wait
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Role Switcher Tabs (Desktop xl+) */}
          <div className="hidden xl:flex items-center p-1 bg-zinc-100 rounded-full border border-zinc-200/80 shrink-0">
            {rolesList.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                onClick={() => setRole(role)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  currentRole === role
                    ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${currentRole === role ? 'text-orange-500' : 'text-zinc-400'}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Active Order Live Banner if exists */}
            {activeOrder && (
              <button
                onClick={onOpenActiveOrder}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition animate-pulse shrink-0"
              >
                <span className="font-mono bg-white/20 px-1 py-0.5 rounded text-[10px]">
                  {activeOrder.tokenNumber}
                </span>
                <span>{activeOrder.status}</span>
                <span className="text-[9px] bg-white/25 px-1 rounded-full hidden lg:inline">
                  {activeOrder.pickupCounter}
                </span>
              </button>
            )}

            {/* Campus Wallet */}
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shrink-0"
              title="Campus Wallet Balance"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden md:inline font-medium">Wallet:</span>
              <span className="font-bold font-mono">₹{currentUser.walletBalance}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-1.5 sm:p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition relative flex items-center justify-center shrink-0"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-zinc-100 p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div className="font-semibold text-xs text-zinc-800 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-orange-500" />
                        Notifications & Alerts
                      </div>
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[11px] text-orange-600 hover:underline font-semibold cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-zinc-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`py-2.5 px-2 rounded-xl cursor-pointer transition ${
                              !n.read ? 'bg-orange-50/50' : 'opacity-80 hover:bg-zinc-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900">{n.title}</span>
                              <span className="text-[10px] text-zinc-400">{n.timestamp}</span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Pill / Switcher */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition cursor-pointer"
                title={`Logged in as ${currentUser.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold leading-none">{currentUser.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-zinc-500 font-normal leading-none mt-0.5">
                    {currentUser.studentId}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
              </button>

              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 z-50">
                    <div className="px-3 py-2 border-b border-zinc-100">
                      <div className="font-bold text-xs text-zinc-900">{currentUser.name}</div>
                      <div className="text-[11px] text-zinc-500">{currentUser.email}</div>
                      <div className="text-[10px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full mt-1 inline-block font-medium">
                        {currentUser.department} • {currentUser.year}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenHistory();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 rounded-xl flex items-center justify-between cursor-pointer"
                      >
                        <span>Past Orders & Reorder</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </button>
                    </div>

                    <div className="text-[10px] font-semibold text-zinc-400 px-3 py-1 uppercase border-t border-zinc-100">
                      Switch Campus Persona
                    </div>
                    <div className="space-y-1">
                      {availableUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition flex items-center justify-between cursor-pointer ${
                            u.id === currentUser.id ? 'bg-orange-50 font-bold text-orange-950' : 'hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[10px] text-zinc-400">{u.role === 'faculty' ? 'Faculty Member' : 'Student'}</div>
                          </div>
                          <span className="text-[11px] font-mono text-emerald-600 font-semibold">₹{u.walletBalance}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logoutUser();
                          window.location.reload();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-between cursor-pointer transition"
                      >
                        <span>Sign Out</span>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Button (for student role) */}
            {(currentRole === 'student' || currentRole === 'faculty') && (
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition active:scale-95 shrink-0 cursor-pointer min-h-[38px]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-zinc-950 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center -mr-0.5">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Role Navigation Sub-Bar for Mobile / Tablet (< xl) */}
      <div className="xl:hidden bg-zinc-100/90 border-t border-zinc-200/80 px-2 sm:px-4 py-1.5 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {rolesList.map(({ role, label, icon: Icon }) => (
            <button
              key={role}
              onClick={() => setRole(role)}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition shrink-0 cursor-pointer min-h-[36px] ${
                currentRole === role
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:text-zinc-900 border border-zinc-200/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${currentRole === role ? 'text-white' : 'text-zinc-500'}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Top-up Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Campus Wallet</h3>
                  <p className="text-[11px] text-zinc-500">Fast 1-tap cashless pre-orders</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="text-xs text-emerald-800 font-medium">Current Balance</div>
              <div className="text-3xl font-extrabold text-emerald-950 mt-1 font-mono">
                ₹{currentUser.walletBalance}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Linked to {currentUser.name} ({currentUser.studentId})
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-zinc-700">Quick Recharge Amount</label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {['100', '200', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      topUpAmount === amt
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  topUpWallet(parseInt(topUpAmount, 10));
                  setShowWalletModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Add ₹{topUpAmount} via Campus UPI
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
