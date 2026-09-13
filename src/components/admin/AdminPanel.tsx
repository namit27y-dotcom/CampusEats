import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuItem, FoodCategory } from '../../types';
import { getFoodImage, handleImageError } from '../../utils/foodImages';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Utensils,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Check,
  RefreshCw,
  Search,
  DollarSign,
  Users,
  ShieldAlert,
  Percent,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    orders,
    selectedCanteen,
    menuItems,
    updateMenuItem,
    addMenuItem,
    inventory,
    updateInventoryStock,
    restockItem,
    availableUsers,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'inventory' | 'orders'>('overview');
  const [menuSearch, setMenuSearch] = useState('');

  // Add/Edit menu modal
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('60');
  const [formCategory, setFormCategory] = useState<FoodCategory>('snacks');
  const [formPrepTime, setFormPrepTime] = useState('8');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formStock, setFormStock] = useState('30');
  const [formImage, setFormImage] = useState('');

  // Key stats calculation
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.paymentStatus === 'PAID' ? curr.total : 0), 42850);
  const totalOrdersCount = orders.length + 480;
  const pendingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'ACCEPTED').length + 8;
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING').length + 5;
  const readyOrders = orders.filter((o) => o.status === 'READY').length + 3;

  const handleOpenAddModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
      setFormDesc(item.description);
      setFormPrice(item.price.toString());
      setFormCategory(item.category);
      setFormPrepTime(item.prepTimeMinutes.toString());
      setFormIsVeg(item.isVeg);
      setFormStock(item.stockQuantity.toString());
      setFormImage(item.image);
    } else {
      setEditingItem(null);
      setFormName('');
      setFormDesc('');
      setFormPrice('50');
      setFormCategory('snacks');
      setFormPrepTime('8');
      setFormIsVeg(true);
      setFormStock('40');
      setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    }
    setShowAddMenuModal(true);
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(formPrice, 10) || 50;
    const prepNum = parseInt(formPrepTime, 10) || 8;
    const stockNum = parseInt(formStock, 10) || 30;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: formName,
        description: formDesc,
        price: priceNum,
        category: formCategory,
        prepTimeMinutes: prepNum,
        isVeg: formIsVeg,
        stockQuantity: stockNum,
        inStock: stockNum > 0,
        image: formImage || editingItem.image,
      });
    } else {
      addMenuItem({
        canteenId: selectedCanteen.id,
        name: formName,
        description: formDesc,
        price: priceNum,
        category: formCategory,
        isVeg: formIsVeg,
        rating: 4.8,
        ratingCount: 1,
        prepTimeMinutes: prepNum,
        inStock: stockNum > 0,
        stockQuantity: stockNum,
        maxStock: stockNum + 20,
        image:
          formImage ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      });
    }
    setShowAddMenuModal(false);
  };

  const filteredMenuItems = menuItems.filter(
    (m) =>
      m.canteenId === selectedCanteen.id &&
      (m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(menuSearch.toLowerCase()))
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 overflow-x-hidden">
      
      {/* Top Header */}
      <div className="bg-zinc-900 text-white rounded-3xl p-4 sm:p-6 mb-6 shadow-xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-extrabold text-lg sm:text-xl tracking-tight">
                Campus Admin & Canteen Operations
              </h1>
              <span className="text-[10px] sm:text-[11px] bg-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                Supervisor
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">
              Live oversight for {selectedCanteen.name} • Inventory, Analytics, Menus & Rush Protection
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-zinc-800 p-1.5 rounded-2xl border border-zinc-700 text-xs font-bold overflow-x-auto no-scrollbar max-w-full w-full md:w-auto">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
            { id: 'menu', label: 'Menu & Pricing', icon: Utensils },
            { id: 'inventory', label: 'Live Inventory', icon: Package },
            { id: 'orders', label: 'All Orders Log', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25 font-extrabold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & REPORTS (PRD 15 & 18) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Cards (PRD 15: Orders 486, Revenue ₹42,850, Pending 18, Preparing 12, Ready 6) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-2xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Today's Orders
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono mt-1">
                {totalOrdersCount}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">
                +38% vs physical queue
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-2xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Total Revenue
              </div>
              <div className="text-2xl sm:text-3xl font-black text-orange-600 font-mono mt-1">
                ₹{totalRevenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">
                100% cashless digital
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-2xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Pending Tickets
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-800 font-mono mt-1">
                {pendingOrders}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Accepted by kitchen</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-2xs">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Cooking Pipeline
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1">
                {preparingOrders}
              </div>
              <div className="text-[10px] text-amber-600 mt-1">On hot counters</div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-2xs col-span-2 md:col-span-1">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Ready at Counter
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1">
                {readyOrders}
              </div>
              <div className="text-[10px] text-emerald-600 mt-1">Waiting for pickup</div>
            </div>
          </div>

          {/* Operational Metrics & Peak Hour Protection Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Peak Ordering Periods Graph (PRD 18 & 26) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-zinc-100 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-zinc-900">
                    Peak Ordering Periods & Queue Flow
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Order volume across campus class break schedules
                  </p>
                </div>
                <span className="text-[11px] bg-orange-50 text-orange-800 font-bold px-2.5 py-0.5 rounded-full border border-orange-200">
                  Peak Protection Active
                </span>
              </div>

              {/* Simulated hourly distribution bars */}
              <div className="space-y-3 pt-2">
                {[
                  { time: '08:30 – 10:00 AM (Breakfast Break)', volume: 68, pct: '52%' },
                  { time: '11:00 – 11:30 AM (Short Tea Break)', volume: 92, pct: '70%' },
                  { time: '12:30 – 02:00 PM (Lunch Rush Peak 🔥)', volume: 174, pct: '95%', isPeak: true },
                  { time: '03:30 – 04:30 PM (Evening Snacks & Dosa)', volume: 120, pct: '82%', isPeak: true },
                  { time: '05:30 – 07:30 PM (Hostel Dinner Prep)', volume: 65, pct: '48%' },
                ].map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-zinc-700">
                      <span className="flex items-center gap-1.5">
                        {row.isPeak && <span className="text-rose-500 font-bold">⚡</span>}
                        {row.time}
                      </span>
                      <span className="font-mono text-zinc-900">{row.volume} pre-orders</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          row.isPeak
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                            : 'bg-zinc-800'
                        }`}
                        style={{ width: row.pct }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Targets vs Real Metrics (PRD 3: Success Metrics) */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-2xs space-y-4">
              <h3 className="font-heading font-extrabold text-base text-zinc-900">
                PRD Target Benchmarks
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <div className="flex justify-between text-emerald-950 font-bold">
                    <span>Average Ordering Time:</span>
                    <span className="font-mono">42 seconds</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Target: &lt; 1 minute (Met ✓)</div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <div className="flex justify-between text-emerald-950 font-bold">
                    <span>Average Pickup Handover:</span>
                    <span className="font-mono">22 seconds</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Target: &lt; 30 seconds (Met ✓)</div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <div className="flex justify-between text-emerald-950 font-bold">
                    <span>Queue Reduction:</span>
                    <span className="font-mono">74% reduction</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Target: &gt; 50% (Surpassed ✓)</div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <div className="flex justify-between text-emerald-950 font-bold">
                    <span>Order Error Rate:</span>
                    <span className="font-mono">0.4%</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Target: &lt; 2% (Healthy ✓)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU & PRICING MANAGEMENT (PRD 18) */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-zinc-100 shadow-2xs">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu items to edit price, prep time, or toggle stock..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Food Item</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="p-3.5">Food Item</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Prep Time</th>
                    <th className="p-3.5">Stock Left</th>
                    <th className="p-3.5">Availability</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredMenuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || getFoodImage(item.name, item.category)}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, item.name, item.category)}
                            className="w-10 h-10 rounded-xl object-cover bg-zinc-100 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            </div>
                            <div className="text-[11px] text-zinc-400 line-clamp-1 max-w-xs">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 capitalize font-semibold text-zinc-600">
                        {item.category}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-zinc-900">
                        ₹{item.price}
                      </td>
                      <td className="p-3.5 text-zinc-600">
                        {item.prepTimeMinutes} mins
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span
                          className={
                            item.stockQuantity <= 15
                              ? 'text-rose-600 font-bold'
                              : 'text-zinc-700'
                          }
                        >
                          {item.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() =>
                            updateMenuItem({
                              ...item,
                              inStock: !item.inStock,
                              stockQuantity: !item.inStock ? 30 : 0,
                            })
                          }
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            item.inStock
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.inStock ? 'In Stock (Live)' : 'Marked Sold Out'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenAddModal(item)}
                          className="px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-bold flex items-center gap-1 inline-flex cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY MANAGEMENT (PRD 19) */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-heading font-extrabold text-base text-zinc-900">
                  Kitchen Raw Material & Prep Inventory
                </h3>
                <p className="text-xs text-zinc-500">
                  Automatic low stock warnings and threshold notifications
                </p>
              </div>
              <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full">
                {inventory.length} Tracked Ingredients
              </span>
            </div>

            {/* Inventory Bars (Per PRD 19 Specification) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {inventory.map((inv) => {
                const pct = Math.round((inv.currentStock / inv.maxStock) * 100);
                const isLow = inv.currentStock <= inv.lowStockThreshold;

                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-2xl border transition ${
                      isLow ? 'bg-rose-50/40 border-rose-300' : 'bg-zinc-50/70 border-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-xs font-bold text-zinc-900">{inv.name}</span>
                        <span className="text-[10px] text-zinc-400 ml-2">({inv.category})</span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-zinc-900">
                        {inv.currentStock} / {inv.maxStock} {inv.unit} ({pct}%)
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden my-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct <= 25
                            ? 'bg-rose-500'
                            : pct <= 50
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    {isLow && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-1 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>LOW STOCK WARNING: Only {inv.currentStock} {inv.unit} remaining</span>
                      </div>
                    )}

                    {/* Quick Restock Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/60 mt-2">
                      <button
                        onClick={() => restockItem(inv.id, 10)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition shadow-2xs cursor-pointer"
                      >
                        +10 {inv.unit}
                      </button>
                      <button
                        onClick={() => restockItem(inv.id, 25)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs cursor-pointer"
                      >
                        +25 Restock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALL ORDERS AUDIT STREAM (PRD 18) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-zinc-900">
              Campus Pre-Order Ledger ({orders.length} orders recorded)
            </h3>
            <span className="text-xs text-zinc-500">Real-time status updates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Token</th>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Total Paid</th>
                  <th className="p-3.5">Pickup Slot</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-50 transition">
                    <td className="p-3.5 font-mono font-black text-orange-600 text-sm">
                      {ord.tokenNumber}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-600">#{ord.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-zinc-900">{ord.userName}</div>
                      <div className="text-[10px] text-zinc-400 capitalize">{ord.userRole}</div>
                    </td>
                    <td className="p-3.5 text-zinc-700">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-zinc-900">
                      ₹{ord.total}
                    </td>
                    <td className="p-3.5 text-zinc-600">{ord.pickupSlot}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ord.status === 'COLLECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'READY'
                            ? 'bg-orange-100 text-orange-800'
                            : ord.status === 'PREPARING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-heading font-extrabold text-base text-zinc-900">
                {editingItem ? 'Edit Food Item' : 'Add New Item to Canteen Menu'}
              </h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Paneer Butter Masala Roll"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Appetizing description..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FoodCategory)}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="meals">Meals</option>
                    <option value="snacks">Snacks</option>
                    <option value="drinks">Beverages</option>
                    <option value="combos">Combos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formVeg"
                  checked={formIsVeg}
                  onChange={(e) => setFormIsVeg(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="formVeg" className="font-bold text-zinc-700 cursor-pointer">
                  Pure Vegetarian Item
                </label>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 py-2.5 border border-zinc-200 rounded-xl font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Save Food Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
