/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import { Header } from './components/Header';
import { StudentPage, KitchenPage, CounterPage, AdminPage } from './pages';
import { CartModal } from './components/student/CartModal';
import { OrderTrackingModal } from './components/student/OrderTrackingModal';
import { OrderHistoryModal } from './components/student/OrderHistoryModal';
import { Order } from './types';
import { Clock, QrCode, Sparkles, Volume2, ShieldCheck, ChevronRight } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentRole, orders, activeOrders, activeOrder, currentUser, selectedCanteen } = useApp();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Active order for student floating bar
  const latestActiveOrder =
    activeOrder ||
    (Array.isArray(activeOrders) ? activeOrders[0] : null) ||
    (Array.isArray(orders)
      ? orders.find(
          (o) => o.userId === currentUser?.id && ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
        )
      : null) ||
    null;

  const handleOpenOrderTracker = (order?: Order | null) => {
    const target = order || latestActiveOrder;
    if (target) {
      setTrackingOrder(target);
      setIsTrackingOpen(true);
    }
  };

  const handleOrderPlaced = () => {
    const target =
      (Array.isArray(activeOrders) && activeOrders.length > 0 ? activeOrders[0] : null) || latestActiveOrder;
    if (target) {
      setTrackingOrder(target);
      setIsTrackingOpen(true);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Header with Role switcher, Canteen selector, Wallet, and Notifications */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenActiveOrder={() => handleOpenOrderTracker(latestActiveOrder)}
      />

      {/* Main Role-Based Screen */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {currentRole === 'student' && (
          <StudentPage
            onOpenCart={() => setIsCartOpen(true)}
            onOpenActiveOrder={() => handleOpenOrderTracker(latestActiveOrder)}
            onOpenTracker={handleOpenOrderTracker}
          />
        )}

        {currentRole === 'kitchen' && <KitchenPage />}

        {currentRole === 'counter' && <CounterPage />}

        {currentRole === 'admin' && <AdminPage />}
      </main>

      {/* Floating Active Order Quick Bar for Student */}
      {currentRole === 'student' && latestActiveOrder && !isTrackingOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div
            onClick={() => handleOpenOrderTracker(latestActiveOrder)}
            className={`p-3 sm:p-3.5 rounded-2xl shadow-xl border cursor-pointer transition flex items-center justify-between gap-2 backdrop-blur-md ${
              latestActiveOrder.status === 'READY'
                ? 'bg-emerald-600/95 border-emerald-400 text-white shadow-emerald-600/30 animate-pulse'
                : 'bg-zinc-900/95 border-zinc-700 text-white shadow-zinc-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm sm:text-base shrink-0 shadow-sm ${
                  latestActiveOrder.status === 'READY'
                    ? 'bg-white text-emerald-800'
                    : 'bg-orange-500 text-white'
                }`}
              >
                {latestActiveOrder.tokenNumber}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  {latestActiveOrder.status === 'READY' ? (
                    <span className="flex items-center gap-1 text-emerald-100 truncate">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      ORDER READY AT {latestActiveOrder.pickupCounter.toUpperCase()}!
                    </span>
                  ) : (
                    <span className="truncate">Pre-Order in Progress • {latestActiveOrder.status}</span>
                  )}
                </div>
                <div className="text-[10px] sm:text-[11px] opacity-80 flex items-center gap-1 truncate mt-0.5">
                  <Clock className="w-3 h-3 text-orange-300 shrink-0" />
                  <span className="truncate">Est: {latestActiveOrder.estimatedReadyTime} • Tap to view QR</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/15 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold shrink-0">
              <span>View</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      <OrderTrackingModal
        order={trackingOrder || latestActiveOrder || null}
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onOpenOrderTracker={handleOpenOrderTracker}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/80 py-4 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-zinc-800">CampusEats</span>
            <span>• Smart Pre-Order & Token System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Fast • Cashless • Zero Queue</span>
            <span>Audio Calling & Web Speech API Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    !!localStorage.getItem("token")
  );
  React.useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);
  return (
    <AppProvider>
      {isAuthenticated ? <MainAppContent /> : <LoginPage />}
    </AppProvider>
  );
}
