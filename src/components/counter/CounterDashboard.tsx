import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  MonitorPlay,
  Volume2,
  CheckCircle2,
  QrCode,
  Search,
  Check,
  AlertCircle,
  Clock,
  UserCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CounterDashboard: React.FC = () => {
  const {
    orders,
    selectedCanteen,
    callToken,
    verifyAndCollectOrder,
  } = useApp();

  const [searchToken, setSearchToken] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    order?: Order;
  } | null>(null);
  const [selectedCounter, setSelectedCounter] = useState<string>('all');
  const [showQrSimModal, setShowQrSimModal] = useState(false);

  // Ready orders waiting for student pickup
  const readyOrders = orders.filter(
    (o) =>
      o.canteenId === selectedCanteen.id &&
      o.status === 'READY' &&
      (selectedCounter === 'all' || o.pickupCounter.includes(selectedCounter))
  );

  // Recently collected orders for audit
  const recentCollected = orders
    .filter((o) => o.canteenId === selectedCanteen.id && o.status === 'COLLECTED')
    .slice(0, 6);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchToken.trim()) return;

    const result = await verifyAndCollectOrder(searchToken.trim());
    setVerificationResult(result);
    if (result.success) {
      setSearchToken('');
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }
  };

  const handleSimulateQrScan = async (ord: Order) => {
    const result = await verifyAndCollectOrder(ord.tokenNumber);
    setVerificationResult(result);
    setShowQrSimModal(false);
    if (result.success) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 overflow-x-hidden">
      
      {/* Top Bar */}
      <div className="bg-zinc-900 text-white rounded-3xl p-4 sm:p-6 mb-6 shadow-xl border border-zinc-800 w-full overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 shrink-0">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-lg sm:text-xl tracking-tight">
                  Pickup Counter Terminal
                </h1>
                <span className="text-[10px] sm:text-[11px] bg-emerald-400 text-zinc-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Zero-Queue Calling
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                📍 {selectedCanteen.name} • Live Dispatch & QR Token Verification Station
              </p>
            </div>
          </div>

          {/* Quick Counter Selector */}
          <div className="flex items-center gap-1 sm:gap-2 bg-zinc-800/80 p-1 rounded-2xl border border-zinc-700 text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
            <span className="text-zinc-400 px-1.5 sm:px-2 whitespace-nowrap">Terminal:</span>
            {['all', 'Counter 1', 'Counter 2'].map((cntr) => (
              <button
                key={cntr}
                onClick={() => setSelectedCounter(cntr)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  selectedCounter === cntr
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {cntr === 'all' ? 'All Counters' : cntr}
              </button>
            ))}
          </div>
        </div>

        {/* Verification & Scanner Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800">
          <form
            onSubmit={handleManualVerify}
            className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter or scan Student Token (e.g., A135, CE10482)..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 text-white placeholder:text-zinc-500 border border-zinc-700 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Verify & Collect</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrSimModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>QR Scanner</span>
            </button>
          </form>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              className={`mt-3 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                verificationResult.success
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-200'
                  : 'bg-rose-500/20 border border-rose-500 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {verificationResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{verificationResult.message}</span>
              </div>
              <button
                onClick={() => setVerificationResult(null)}
                className="text-xs text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Board: READY ORDERS (PRD 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Waiting Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-lg text-zinc-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              Ready Orders at Counter ({readyOrders.length})
            </h2>
            <span className="text-xs text-zinc-500">
              Students have received "Order Ready" notifications
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-50" />
              <h3 className="font-bold text-zinc-800 text-base">No orders waiting for pickup</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                When kitchen finishes cooking, orders appear here for pickup calling and QR verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {readyOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border-2 border-emerald-400 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                        Ready at {ord.pickupCounter}
                      </span>
                      <span className="text-xs font-mono font-semibold text-zinc-400">
                        #{ord.id}
                      </span>
                    </div>

                    <div className="py-3 text-center">
                      <div className="text-[11px] text-zinc-400 font-medium">Digital Token</div>
                      <div className="text-5xl font-black font-mono text-zinc-900 tracking-tight my-1">
                        {ord.tokenNumber}
                      </div>
                      <div className="text-xs font-bold text-zinc-700">
                        {ord.userName} <span className="font-normal text-zinc-400">({ord.userRole})</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-zinc-50 rounded-2xl p-3 text-xs space-y-1 my-2">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-zinc-800 font-medium">
                          <span>
                            <strong className="text-orange-600 font-mono">{it.quantity}×</strong> {it.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions (PRD 17: CALL TOKEN & MARK COLLECTED) */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
                    <button
                      onClick={() => callToken(ord.id)}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>CALL {ord.tokenNumber} (Audio Announcement)</span>
                    </button>

                    <button
                      onClick={async () => {
                        const res = await verifyAndCollectOrder(ord.tokenNumber);
                        setVerificationResult(res);
                        if (res.success) {
                          try {
                            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                          } catch {
                            // ignore
                          }
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Mark Collected</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Recently Completed Pickups & Terminal Quick Stats */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-xs">
            <h3 className="font-heading font-bold text-sm text-zinc-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Counter Operational Health
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-600">Average Pickup Handover:</span>
                <strong className="text-emerald-700 font-mono font-bold">18 seconds</strong>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-600">Physical Queue Reduction:</span>
                <strong className="text-emerald-700 font-mono font-bold">84% reduction</strong>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-600">Tokens Called via Audio:</span>
                <strong className="text-zinc-900 font-mono font-bold">Web Speech API Active</strong>
              </div>
            </div>
          </div>

          {/* Recent Handover Log */}
          <div className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-sm text-zinc-900">
                Recent Handover Log
              </h3>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Audit Stream</span>
            </div>

            <div className="divide-y divide-zinc-100 text-xs">
              {recentCollected.length === 0 ? (
                <div className="py-6 text-center text-zinc-400">No recent handovers.</div>
              ) : (
                recentCollected.map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-xs text-zinc-900">
                          {ord.tokenNumber}
                        </span>
                        <span className="text-zinc-500">• {ord.userName}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {ord.items.length} items • ₹{ord.total} ({ord.paymentMethod})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Collected ✓
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Simulation Modal */}
      {showQrSimModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-zinc-900">Simulate Counter QR Code Scanner</h3>
              </div>
              <button
                onClick={() => setShowQrSimModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500 mt-3">
              In campus deployment, counter staff uses an optical barcode/camera scanner. Select an active order below to simulate a live student QR scan:
            </p>

            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {readyOrders.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No orders currently in READY state to scan.
                </div>
              ) : (
                readyOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleSimulateQrScan(ord)}
                    className="p-3 border border-zinc-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-emerald-700">
                          {ord.tokenNumber}
                        </span>
                        <span className="text-xs font-bold text-zinc-800">
                          {ord.userName}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs">
                      Scan QR
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setShowQrSimModal(false)}
                className="w-full py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
