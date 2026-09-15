import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { QRCodeView } from '../common/QRCodeView';
import {
  X,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  PartyPopper,
  Sparkles,
  RefreshCw,
  Ban,
  ChefHat,
  ShoppingBag,
} from 'lucide-react';

interface OrderTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: (order: Order) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenFeedback,
}) => {
  const { cancelOrder, verifyAndCollectOrder } = useApp();
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(order.tokenNumber);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'CONFIRMED', label: 'Order Placed & Paid', desc: 'Payment verified' },
    { status: 'ACCEPTED', label: 'Accepted by Canteen', desc: 'Kitchen acknowledged ticket' },
    { status: 'PREPARING', label: 'Cooking in Kitchen', desc: 'Chef preparing items' },
    { status: 'READY', label: 'Ready for Pickup', desc: `Waiting at ${order.pickupCounter}` },
    { status: 'COLLECTED', label: 'Food Collected', desc: 'Enjoy your meal!' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'CREATED':
      case 'CONFIRMED':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'COLLECTED':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isReady = order.status === 'READY';
  const isCollected = order.status === 'COLLECTED';
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = ['CREATED', 'CONFIRMED', 'ACCEPTED'].includes(order.status);

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              Smart Token Pass • Order #{order.id}
            </div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900">
              Live Preparation & Token Tracker
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* READY FOR PICKUP BIG DISPLAY (PRD 14) */}
          {isReady && (
            <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-3xl p-6 text-white text-center shadow-xl shadow-emerald-500/20 animate-pulse relative overflow-hidden">
              <div className="flex items-center justify-center gap-1 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
                <PartyPopper className="w-4 h-4" />
                <span>YOUR ORDER IS READY!</span>
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="text-[11px] text-emerald-100 font-medium">Digital Token Number</div>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight my-1 text-white">
                {order.tokenNumber}
              </div>

              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-4 py-1.5 rounded-full text-xs font-bold text-white mt-1 border border-white/20">
                <MapPin className="w-4 h-4 text-emerald-200" />
                <span>Proceed to: {order.pickupCounter}</span>
              </div>

              <p className="text-xs text-emerald-50 mt-3 font-medium">
                Show this digital token or QR code below to the counter staff to collect your food without waiting in line.
              </p>

              {/* Demo Action: Quick Collect for testing */}
              <div className="mt-4 pt-3 border-t border-white/20 flex justify-center">
                <button
                  onClick={() => verifyAndCollectOrder(order.tokenNumber)}
                  className="px-4 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-extrabold hover:bg-emerald-50 shadow-sm transition cursor-pointer"
                >
                  Simulate Food Collected ✓
                </button>
              </div>
            </div>
          )}

          {/* Standard Token Card if not yet ready or cancelled */}
          {!isReady && !isCancelled && !isCollected && (
            <div className="bg-zinc-900 text-white rounded-3xl p-5 sm:p-6 text-center shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-800">
                <span>Canteen: {order.canteenName}</span>
                <span className="font-mono text-orange-400 font-semibold">{order.pickupSlot}</span>
              </div>

              <div className="py-4">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Your Digital Token
                </div>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-orange-400 tracking-tight">
                    {order.tokenNumber}
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    title="Copy token"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-200">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>Pickup: <strong>{order.pickupCounter}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Est. Ready: <strong className="text-white">{order.estimatedReadyTime}</strong></span>
                </div>
                <span className="text-[11px] text-orange-400 font-semibold uppercase animate-pulse">
                  ● {order.status}
                </span>
              </div>
            </div>
          )}

          {/* Cancelled State Card */}
          {isCancelled && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-rose-900 text-sm">Order Cancelled</h3>
              <p className="text-xs text-rose-700 mt-1">
                Your payment of ₹{order.total} has been refunded to your {order.paymentMethod === 'wallet' ? 'Campus Wallet' : 'UPI account'}.
              </p>
            </div>
          )}

          {/* Collected State Card */}
          {isCollected && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-emerald-950 text-sm">Food Collected! Enjoy your meal 😋</h3>
              <p className="text-xs text-emerald-700 mt-1">
                Token {order.tokenNumber} was verified and fulfilled at {order.pickupCounter}.
              </p>
              {onOpenFeedback && (
                <button
                  onClick={() => onOpenFeedback(order)}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                >
                  Rate Food Quality & Speed ⭐
                </button>
              )}
            </div>
          )}

          {/* Step Progression Timeline (PRD 11 & 13) */}
          {!isCancelled && (
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
              <div className="text-xs font-bold text-zinc-700 mb-3 flex items-center justify-between">
                <span>Preparation Milestones</span>
                <span className="text-[10px] text-zinc-500">Live Kitchen Sync</span>
              </div>

              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isDone = currentStepIdx > idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                              : 'bg-zinc-200 text-zinc-500'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`w-0.5 h-7 mt-1 ${
                              isDone ? 'bg-emerald-500' : 'bg-zinc-200'
                            }`}
                          />
                        )}
                      </div>

                      <div className="pt-0.5 flex-1">
                        <div
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-orange-950 font-extrabold'
                              : isDone
                              ? 'text-zinc-800'
                              : 'text-zinc-400'
                          }`}
                        >
                          {step.label}
                        </div>
                        <div className="text-[11px] text-zinc-500">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Digital QR Code for Pickup Counter Verification */}
          {!isCancelled && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-4 text-center shadow-xs">
              <div className="text-xs font-bold text-zinc-700 mb-2">
                Pickup Verification QR Code
              </div>
              <p className="text-[11px] text-zinc-500 mb-3">
                Staff can scan this matrix at Counter {order.pickupCounter.slice(-1)} to confirm collection instantly.
              </p>
              <div className="flex justify-center">
                <QRCodeView value={`CAMPUS-TOKEN:${order.tokenNumber}:${order.id}`} size={140} />
              </div>
              <div className="font-mono text-xs font-bold text-zinc-700 mt-2">
                Token: {order.tokenNumber} • ID: #{order.id}
              </div>
            </div>
          )}

          {/* Ordered Items Summary */}
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <div className="text-xs font-bold text-zinc-700 mb-2">
              Order Items Summary
            </div>
            <div className="divide-y divide-zinc-200/80 text-xs">
              {order.items.map((item, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-800">
                      {item.quantity} × {item.name}
                    </div>
                    {item.customizationText && (
                      <div className="text-[10px] text-zinc-500">{item.customizationText}</div>
                    )}
                  </div>
                  <span className="font-mono text-zinc-700 font-semibold">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 mt-1 border-t border-zinc-200 flex justify-between text-xs font-bold text-zinc-900">
              <span>Total Paid ({order.paymentMethod.toUpperCase()})</span>
              <span className="font-mono text-orange-600 font-extrabold text-sm">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl flex gap-2">
          {canCancel && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  cancelOrder(order.id);
                }
              }}
              className="py-2 px-3 rounded-xl border border-rose-200 bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 transition"
            >
              Cancel Order
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition text-center"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
