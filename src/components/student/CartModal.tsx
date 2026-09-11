import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Clock,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Wallet,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOrderPlaced }) => {
  const {
    cart,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    pickupSlots,
    placeOrder,
    currentUser,
    selectedCanteen,
  } = useApp();

  const [pickupType, setPickupType] = useState<'asap' | 'scheduled'>('asap');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(pickupSlots[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'wallet' | 'card' | 'cash'>('upi');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartTotal;
  const discount = subtotal >= 100 ? 15 : 0;
  const taxes = 0; // zero tax campus policy
  const total = Math.max(0, subtotal - discount + taxes);

  const selectedSlot = pickupSlots.find((s) => s.id === selectedSlotId);
  const effectivePickupTime =
    pickupType === 'asap'
      ? `ASAP (~${selectedCanteen.waitTimeMinutes} mins)`
      : selectedSlot?.timeRange || 'Next Available';

  const handleCheckout = async () => {
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (pickupType === 'scheduled' && selectedSlot?.status === 'full') {
      setErrorMsg('Selected pickup slot is currently full. Please choose another available slot.');
      return;
    }

    if (paymentMethod === 'wallet' && currentUser.walletBalance < total) {
      setErrorMsg(
        `Insufficient campus wallet balance (₹${currentUser.walletBalance}). Please select UPI or top-up your wallet.`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate realistic network / payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newOrder = await placeOrder(effectivePickupTime, paymentMethod);

      // Trigger celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setIsProcessing(false);
      onClose();
      onOrderPlaced();
    } catch (err: unknown) {
      setIsProcessing(false);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred during payment.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              {selectedCanteen.name}
            </div>
            <h2 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">
              Review Pre-Order & Pickup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-semibold">Your cart is empty.</p>
              <p className="text-xs mt-1">Browse the canteen menu to add delicious items!</p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Selected Items ({cart.length})
                  </span>
                  <button
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                  {cart.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="py-2.5 px-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                          <span className="text-xs font-bold text-slate-900">
                            {item.menuItem.name}
                          </span>
                        </div>

                        {/* Customizations label */}
                        {Object.keys(item.selectedCustomizations).length > 0 && (
                          <div className="text-[11px] text-slate-500 ml-4 mt-0.5">
                            {Object.entries(item.selectedCustomizations)
                              .map(([k, v]) => `${v}`)
                              .join(' • ')}
                          </div>
                        )}

                        <div className="text-xs font-mono text-slate-700 ml-4 mt-0.5">
                          ₹{item.unitPrice} × {item.quantity} ={' '}
                          <strong className="text-slate-900">₹{item.totalPrice}</strong>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, -1)}
                          className="w-5 h-5 rounded-md text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.cartItemId, 1)}
                          className="w-5 h-5 rounded-md bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pickup Time & Slot Booking Section (Per PRD 9) */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Choose Pickup Timing
                  </span>
                  <span className="text-[10px] text-slate-500">Zero-Wait Canteen Counter</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPickupType('asap')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between ${
                      pickupType === 'asap'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>⚡ ASAP (Rush Pickup)</span>
                    <span className="text-[10px] opacity-85">~{selectedCanteen.waitTimeMinutes}m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickupType('scheduled')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between ${
                      pickupType === 'scheduled'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📅 Schedule Time Slot</span>
                    <span className="text-[10px] opacity-85">Break time</span>
                  </button>
                </div>

                {pickupType === 'scheduled' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/70">
                    <div className="text-[11px] text-slate-600 font-medium">
                      Select 10-Minute Pickup Window:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pickupSlots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        const isFull = slot.status === 'full';
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between border transition text-left ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : isSelected
                                ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-1 ring-orange-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">{slot.timeRange}</div>
                              <div className="text-[10px] text-slate-500">
                                {slot.bookedCount}/{slot.maxCapacity} orders
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                slot.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : slot.status === 'busy'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {slot.status === 'available'
                                ? '🟢 Available'
                                : slot.status === 'busy'
                                ? '🟡 Busy'
                                : '🔴 Full'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods (PRD 10) */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Payment Method
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* UPI */}
                  <label
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === 'upi'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-orange-600" />
                      <div>
                        <div className="text-xs font-bold">UPI (Instant)</div>
                        <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</div>
                      </div>
                    </div>
                    {paymentMethod === 'upi' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                  </label>

                  {/* Campus Wallet */}
                  <label
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === 'wallet'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold">Campus Wallet</div>
                        <div className="text-[10px] text-slate-500">Bal: ₹{currentUser.walletBalance}</div>
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </label>

                  {/* Card */}
                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === 'card'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-bold">Debit / Card</div>
                        <div className="text-[10px] text-slate-500">Campus Bank & RuPay</div>
                      </div>
                    </div>
                    {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                  </label>

                  {/* Cash at Pickup */}
                  <label
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      paymentMethod === 'cash'
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold">Cash at Counter</div>
                        <div className="text-[10px] text-slate-500">Exact change advised</div>
                      </div>
                    </div>
                    {paymentMethod === 'cash' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                  </label>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="mt-2.5 p-2 bg-slate-50 rounded-xl flex items-center gap-2 text-xs text-slate-600 border border-slate-200">
                    <span className="text-[11px] font-semibold">Simulated App:</span>
                    {(['gpay', 'phonepe', 'paytm'] as const).map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiApp(app)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                          upiApp === app ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 border'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Campus Student Discount
                    </span>
                    <span className="font-mono">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Taxes (Campus Subsidized)</span>
                  <span className="font-mono">₹0</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Total Amount</span>
                  <span className="font-mono text-base text-orange-600">₹{total}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
            <button
              disabled={isProcessing}
              onClick={handleCheckout}
              className="w-full py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating Digital Token & Processing Payment...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay ₹{total} & Receive Token</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Instant digital token generation with zero queue waiting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
