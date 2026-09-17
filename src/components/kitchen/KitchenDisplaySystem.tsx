import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Volume2,
  Filter,
  Check,
} from 'lucide-react';

const isSameCanteen = (
  orderCanteenId?: string | number,
  orderCanteenName?: string,
  currentCanteen?: { id: string | number; name?: string } | null
) => {
  if (!currentCanteen) return true;
  const ocId = String(orderCanteenId ?? '').trim().toLowerCase();
  const scId = String(currentCanteen.id ?? '').trim().toLowerCase();

  if (ocId && scId && ocId === scId) return true;

  // Cross-mapping string slugs to numeric database IDs
  if ((ocId === '1' || ocId === 'canteen-main') && (scId === '1' || scId === 'canteen-main')) return true;
  if ((ocId === '2' || ocId === 'canteen-mech') && (scId === '2' || scId === 'canteen-mech')) return true;
  if ((ocId === '3' || ocId === 'canteen-mba') && (scId === '3' || scId === 'canteen-mba')) return true;
  if ((ocId === '4' || ocId === 'canteen-night') && (scId === '4' || scId === 'canteen-night')) return true;

  if (orderCanteenName && currentCanteen.name) {
    const ocName = orderCanteenName.trim().toLowerCase();
    const scName = currentCanteen.name.trim().toLowerCase();
    if (ocName === scName || ocName.includes(scName) || scName.includes(ocName)) {
      return true;
    }
  }

  return false;
};

export const KitchenDisplaySystem: React.FC = () => {
  const {
    orders,
    selectedCanteen,
    updateOrderStatus,
    callToken,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');
  const [kitchenMode, setKitchenMode] = useState<'normal' | 'rush'>('normal');

  // Filter orders relevant to this canteen that are currently active in kitchen
  const kitchenOrders = orders.filter(
    (o) =>
      isSameCanteen(o.canteenId, o.canteenName, selectedCanteen) &&
      ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
  );

  const displayedOrders = kitchenOrders.filter((ord) => {
    if (activeFilter === 'new') return ord.status === 'CONFIRMED' || ord.status === 'ACCEPTED';
    if (activeFilter === 'preparing') return ord.status === 'PREPARING';
    if (activeFilter === 'ready') return ord.status === 'READY';
    return true;
  });

  // Calculate elapsed time in minutes for ticket
  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  const newOrdersCount = kitchenOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'ACCEPTED').length;
  const preparingCount = kitchenOrders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = kitchenOrders.filter((o) => o.status === 'READY').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 overflow-x-hidden">
      
      {/* Top KDS Control Bar */}
      <div className="bg-zinc-900 text-white rounded-3xl p-4 sm:p-6 mb-6 shadow-xl border border-zinc-800 w-full overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-lg sm:text-xl tracking-tight">
                  Kitchen Display System (KDS)
                </h1>
                <span className="text-[10px] sm:text-[11px] bg-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Station 1 & 2
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                📍 {selectedCanteen.name} • Live Ticket Stream & Cooking Pipeline
              </p>
            </div>
          </div>

          {/* Quick Metrics & Rush Protection Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 bg-zinc-800/90 px-3 sm:px-4 py-2 rounded-2xl border border-zinc-700 text-xs">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">In Queue</div>
                <div className="text-base font-extrabold font-mono text-orange-400">{newOrdersCount}</div>
              </div>
              <div className="w-px h-6 bg-zinc-700"></div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Cooking</div>
                <div className="text-base font-extrabold font-mono text-amber-400">{preparingCount}</div>
              </div>
              <div className="w-px h-6 bg-zinc-700"></div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">At Counter</div>
                <div className="text-base font-extrabold font-mono text-emerald-400">{readyCount}</div>
              </div>
            </div>

            <button
              onClick={() => setKitchenMode(kitchenMode === 'normal' ? 'rush' : 'normal')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                kitchenMode === 'rush'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{kitchenMode === 'rush' ? 'Rush Hour: ON' : 'Standard Pace'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-800 overflow-x-auto no-scrollbar w-full max-w-full min-w-0">
          <span className="text-xs text-zinc-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Tickets:
          </span>
          {[
            { id: 'all', label: `All Active (${kitchenOrders.length})` },
            { id: 'new', label: `New / Queue (${newOrdersCount})` },
            { id: 'preparing', label: `Currently Cooking (${preparingCount})` },
            { id: 'ready', label: `Ready for Pickup (${readyCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Grid */}
      {displayedOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-xs">
          <ChefHat className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-zinc-800">No active tickets right now</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            All orders are fulfilled or collected! New student pre-orders will appear here automatically in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrders.map((order) => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isLate = elapsedMins >= 10;

            const isPlaced = order.status === 'CONFIRMED';
            const isAccepted = order.status === 'ACCEPTED';
            const isPreparing = order.status === 'PREPARING';
            const isReady = order.status === 'READY';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border shadow-xs transition flex flex-col justify-between overflow-hidden relative ${
                  isReady
                    ? 'border-emerald-300 ring-2 ring-emerald-100'
                    : isPreparing
                    ? 'border-amber-300 ring-2 ring-amber-50'
                    : isAccepted
                    ? 'border-blue-300 ring-2 ring-blue-50'
                    : 'border-orange-300 ring-2 ring-orange-50'
                }`}
              >
                {/* Ticket Top Header Bar */}
                <div
                  className={`p-4 text-white flex items-center justify-between ${
                    isReady
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                      : isPreparing
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                      : isAccepted
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      Order #{order.id} • {order.pickupSlot}
                    </span>
                    <div className="text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                      {order.tokenNumber}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3" />
                      <span>{elapsedMins}m ago</span>
                    </div>
                    <div className="text-[10px] text-white/90 font-medium mt-1">
                      {order.pickupCounter}
                    </div>
                  </div>
                </div>

                {/* Ticket Body: Items & Customizations */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100">
                    <span className="font-semibold text-zinc-700">{order.userName}</span>
                    <span className="capitalize text-[11px] bg-zinc-100 px-2 py-0.5 rounded-full font-bold text-zinc-600">
                      {order.status === 'CONFIRMED' ? 'New Order' : order.status.toLowerCase()}
                    </span>
                  </div>

                  {/* List of food items */}
                  <div className="space-y-2">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-extrabold text-zinc-900 text-sm">
                            <span className="text-orange-600 mr-1.5 font-mono text-base font-black">
                              {it.quantity}×
                            </span>
                            {it.name}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        </div>

                        {it.customizationText && (
                          <div className="text-[11px] font-bold text-orange-800 bg-orange-100/70 px-2 py-0.5 rounded-md mt-1 inline-block">
                            ✦ {it.customizationText}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isLate && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 text-rose-800 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Elapsed time &gt; 10 mins. Prioritize preparing!</span>
                    </div>
                  )}
                </div>

                {/* Ticket Action Buttons (Strict State Machine: Placed -> Accepted -> Preparing -> Ready -> Completed) */}
                <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-2">
                  {isPlaced && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {isAccepted && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Cooking (Move to Preparing)</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Ready & Notify Student</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => callToken(order.id)}
                        className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Announce token over canteen speakers"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Call Token</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COLLECTED')}
                        className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-extrabold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Collected</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplaySystem;
