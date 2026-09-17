import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuItem, FoodCategory, DietaryPreference } from '../../types';
import { AiAssistantModal } from '../AiAssistantModal';
import { getFoodImage, handleImageError } from '../../utils/foodImages';
import {
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Plus,
  Minus,
  Check,
  Flame,
  Heart,
  Tag,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Wheat,
  Dumbbell,
  Filter,
  X,
} from 'lucide-react';

interface DietaryOptionItem {
  id: DietaryPreference;
  label: string;
  badge: string;
  desc: string;
  icon: string;
}

const DIETARY_OPTIONS: DietaryOptionItem[] = [
  { id: 'veg', label: 'Pure Veg', badge: 'Pure Veg', desc: '100% Vegetarian recipes', icon: '🟢' },
  { id: 'vegan', label: 'Vegan', badge: 'Vegan', desc: '100% plant-based, 0% dairy or animal products', icon: '🌱' },
  { id: 'gluten-free', label: 'Gluten-Free', badge: 'Gluten-Free', desc: 'Wheat & gluten-free recipes', icon: '🌾' },
  { id: 'dairy-free', label: 'Dairy-Free', badge: 'Dairy-Free', desc: 'Free of milk, butter, cheese, or paneer', icon: '🥛' },
  { id: 'high-protein', label: 'High-Protein', badge: 'High-Protein', desc: 'Rich in protein for campus energy (≥12g)', icon: '💪' },
];

interface StudentViewProps {
  onOpenCart: () => void;
  onOpenActiveOrder?: () => void;
  onOpenTracker?: (order: any) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ onOpenCart, onOpenActiveOrder, onOpenTracker }) => {
  const {
    currentUser,
    selectedCanteen,
    menuItems,
    cart,
    addToCart,
    updateCartQuantity,
    activeOrder,
    queueStatus,
    toggleFavorite,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('all');
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<DietaryPreference[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [maxPrepTime, setMaxPrepTime] = useState<number>(30);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const toggleDietaryFilter = (pref: DietaryPreference) => {
    setSelectedDietary((prev) => {
      const next = prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref];
      if (pref === 'veg') {
        setFilterVegOnly(next.includes('veg'));
      }
      return next;
    });
  };

  const handleToggleVegOnly = () => {
    const nextVal = !filterVegOnly;
    setFilterVegOnly(nextVal);
    setSelectedDietary((prev) =>
      nextVal ? (prev.includes('veg') ? prev : [...prev, 'veg']) : prev.filter((p) => p !== 'veg')
    );
  };

  const activeFiltersCount =
    (maxPrice < 200 ? 1 : 0) +
    (maxPrepTime < 30 ? 1 : 0) +
    selectedDietary.length;

  const categories: { id: FoodCategory; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'meals', label: 'Meals & Bowls' },
    { id: 'snacks', label: 'Snacks' },
    { id: 'drinks', label: 'Beverages' },
    { id: 'combos', label: '🔥 Combos' },
  ];

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Canteen match
      if (item.canteenId !== selectedCanteen.id) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Veg filter
      if (filterVegOnly && !item.isVeg) {
        return false;
      }

      // Dietary preferences filter
      if (selectedDietary.length > 0) {
        const matchesAllDietary = selectedDietary.every((pref) => {
          if (pref === 'veg') return item.isVeg || item.dietaryTags?.includes('veg');
          if (pref === 'vegan') return item.isVegan || item.dietaryTags?.includes('vegan');
          if (pref === 'gluten-free') return item.isGlutenFree || item.dietaryTags?.includes('gluten-free');
          if (pref === 'dairy-free') return item.isDairyFree || item.dietaryTags?.includes('dairy-free');
          if (pref === 'high-protein') return item.isHighProtein || item.dietaryTags?.includes('high-protein');
          return false;
        });
        if (!matchesAllDietary) return false;
      }

      // Price filter
      if (item.price > maxPrice) {
        return false;
      }

      // Prep time filter
      if (item.prepTimeMinutes > maxPrepTime) {
        return false;
      }

      // Search query filter (matches name, description, tags, price, dietary)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesPrice = q.startsWith('₹')
          ? item.price <= parseInt(q.replace('₹', ''), 10)
          : item.price.toString() === q;
        const matchesVeg = (q === 'veg' || q === 'vegetarian') && item.isVeg;
        const matchesVegan = q.includes('vegan') && (item.isVegan || item.dietaryTags?.includes('vegan'));
        const matchesGF = (q.includes('gluten') || q === 'gf') && (item.isGlutenFree || item.dietaryTags?.includes('gluten-free'));
        const matchesDairy = q.includes('dairy') && (item.isDairyFree || item.dietaryTags?.includes('dairy-free'));
        const matchesProtein = q.includes('protein') && (item.isHighProtein || item.dietaryTags?.includes('high-protein'));
        const matchesTags = item.dietaryTags?.some((t) => t.toLowerCase().includes(q));

        return (
          matchesName ||
          matchesDesc ||
          matchesCat ||
          matchesPrice ||
          matchesVeg ||
          matchesVegan ||
          matchesGF ||
          matchesDairy ||
          matchesProtein ||
          matchesTags
        );
      }

      return true;
    });
  }, [menuItems, selectedCanteen.id, selectedCategory, filterVegOnly, selectedDietary, maxPrice, maxPrepTime, searchQuery]);

  const popularItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (item.canteenId !== selectedCanteen.id || !item.isPopular || !item.inStock) return false;
      if (selectedDietary.length > 0) {
        return selectedDietary.every((pref) => {
          if (pref === 'veg') return item.isVeg || item.dietaryTags?.includes('veg');
          if (pref === 'vegan') return item.isVegan || item.dietaryTags?.includes('vegan');
          if (pref === 'gluten-free') return item.isGlutenFree || item.dietaryTags?.includes('gluten-free');
          if (pref === 'dairy-free') return item.isDairyFree || item.dietaryTags?.includes('dairy-free');
          if (pref === 'high-protein') return item.isHighProtein || item.dietaryTags?.includes('high-protein');
          return false;
        });
      }
      return true;
    });
  }, [menuItems, selectedCanteen.id, selectedDietary]);

  // Check how many of this item is in the cart
  const getItemQuantityInCart = (itemId: string) => {
    return cart
      .filter((c) => c.menuItem.id === itemId)
      .reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const handleAddClick = (item: MenuItem) => {
    if (item.customizations && item.customizations.length > 0) {
      // Open customization modal
      const defaults: Record<string, string> = {};
      item.customizations.forEach((g) => {
        if (g.choices.length > 0) {
          defaults[g.name] = g.choices[0].label;
        }
      });
      setSelectedOptions(defaults);
      setCustomizingItem(item);
    } else {
      addToCart(item, 1);
    }
  };

  const confirmCustomization = () => {
    if (customizingItem) {
      addToCart(customizingItem, 1, selectedOptions);
      setCustomizingItem(null);
    }
  };

  // Greeting based on campus time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 overflow-x-hidden">
      {/* Hero Welcome & Live Token Status Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        
        {/* User Greeting & Canteen Banner */}
        <div className="lg:col-span-2 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-2 text-orange-100 text-xs font-semibold uppercase tracking-wider">
              <span>📍 {selectedCanteen.name}</span>
              <span>•</span>
              <span>{selectedCanteen.location}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
              {greeting}, {currentUser.name.split(' ')[0]} 👋
            </h1>

            <p className="text-orange-100 text-sm mt-1 max-w-xl">
              Skip the canteen line! Choose your items, lock a pickup slot, and pick up your hot food with a digital token.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-white/20 text-xs">
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-orange-200" />
              <span>Current Prep Time: ~{queueStatus.estimatedWaitMinutes} mins</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cashless & 100% Queue-Free</span>
            </div>
          </div>
        </div>

        {/* Live Token Status Widget (Per PRD Specification) */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Live Counter Ticker
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            {/* Sleek meter accent line */}
            <div className="h-1 bg-orange-100 rounded-full overflow-hidden mt-3 mb-1">
              <div className="h-full bg-orange-500 w-3/4 rounded-full"></div>
            </div>

            <div className="mt-3 p-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] text-zinc-400 font-medium">Current Token Serving</div>
                <div className="text-3xl font-extrabold font-mono text-orange-400 tracking-tight mt-0.5">
                  #{queueStatus.currentServingToken}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-400 font-medium">Active Queue</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {queueStatus.pendingCount + queueStatus.preparingCount} orders
                </div>
              </div>
            </div>

            {/* Active User Order Status */}
            {activeOrder ? (
              <div
                onClick={() => {
                  if (onOpenActiveOrder) onOpenActiveOrder();
                  else if (onOpenTracker && activeOrder) onOpenTracker(activeOrder);
                }}
                className="mt-4 p-3 rounded-2xl bg-orange-50 border border-orange-200 cursor-pointer hover:bg-orange-100/80 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-950">Your Token:</span>
                    <span className="text-sm font-black font-mono bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                      {activeOrder.tokenNumber}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-orange-800 uppercase px-2 py-0.5 rounded-full bg-white border border-orange-200">
                    {activeOrder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-orange-950 font-medium">
                  <span>Pickup: {activeOrder.pickupCounter}</span>
                  <span className="flex items-center gap-1 text-orange-700 font-bold">
                    View Tracker <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                <p className="text-xs text-zinc-500">
                  No active orders right now. Order below to receive your digital token!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Avg. Pickup: &lt; 30 seconds</span>
            <span className="font-semibold text-emerald-600">Counter 1 & 2 Open</span>
          </div>
        </div>
      </div>

      {/* Special Offer Break Time Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border border-orange-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
                🔥 Break Time Special
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded-sm">
                Save ₹31
              </span>
            </div>
            <p className="text-xs text-zinc-700 font-medium mt-0.5">
              <strong>Masala Dosa + Campus Cold Coffee</strong> combo at just <span className="font-bold text-emerald-700 font-mono">₹99</span> (Valid 4:00–6:00 PM)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const combo = menuItems.find((m) => m.id === 'item-combo1');
            if (combo) addToCart(combo);
          }}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm shadow-orange-500/20 whitespace-nowrap"
        >
          Add Combo to Cart (+₹99)
        </button>
      </div>

      {/* Search Bar & Smart Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center mb-6">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder='Search food ("dosa", "coffee", "veg", "burger", "₹50")...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-100 border border-transparent text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-500 transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Gemini AI Assistant Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Suggest</span>
          </button>

          {/* Quick Veg Toggle */}
          <button
            onClick={handleToggleVegOnly}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer shrink-0 ${
              filterVegOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Pure Veg
          </button>

          {/* More Filters Dialog Trigger */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition shadow-xs cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dietary Preferences Filter Chips Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-0.5">
            <Filter className="w-3 h-3 text-orange-500" />
            <span>Diet:</span>
          </div>

          {DIETARY_OPTIONS.map((opt) => {
            const isActive = selectedDietary.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleDietaryFilter(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
                title={opt.desc}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {isActive && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}

          {selectedDietary.length > 0 && (
            <button
              onClick={() => {
                setSelectedDietary([]);
                setFilterVegOnly(false);
              }}
              className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-bold px-2 py-1 whitespace-nowrap cursor-pointer hover:underline shrink-0"
            >
              <X className="w-3 h-3" />
              Reset ({selectedDietary.length})
            </button>
          )}
        </div>
      </div>

      {/* Category Horizontal Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-6 w-full max-w-full min-w-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
              selectedCategory === cat.id
                ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Popular Today Row (Only when on 'all' or no search query) */}
      {!searchQuery && selectedCategory === 'all' && popularItems.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              🔥 Popular Today
            </h2>
            <span className="text-xs text-zinc-500">Top ordered by students</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {popularItems.slice(0, 3).map((item) => {
              const qtyInCart = getItemQuantityInCart(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-zinc-100 p-3 shadow-xs hover:shadow-md hover:border-orange-200 transition flex flex-col justify-between relative group"
                >
                  {/* Top image & tag */}
                  <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-zinc-100">
                    <img
                      src={item.image || getFoodImage(item.name, item.category)}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, item.name, item.category)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap max-w-[85%]">
                      {item.isVeg && (
                        <span className="bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs flex items-center justify-center border border-emerald-300" title="Pure Veg">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        </span>
                      )}
                      {item.isVegan && (
                        <span className="bg-emerald-700/90 text-white backdrop-blur-xs text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                          <Leaf className="w-2.5 h-2.5" /> Vegan
                        </span>
                      )}
                      {item.isGlutenFree && (
                        <span className="bg-amber-600/90 text-white backdrop-blur-xs text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                          <Wheat className="w-2.5 h-2.5" /> GF
                        </span>
                      )}
                      {item.isHighProtein && (
                        <span className="bg-purple-700/90 text-white backdrop-blur-xs text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                          <Dumbbell className="w-2.5 h-2.5" /> Protein
                        </span>
                      )}
                      {item.offerTag && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {item.offerTag}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-zinc-400 hover:text-rose-500 transition shadow-xs"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          currentUser.favoriteItemIds.includes(item.id)
                            ? 'fill-rose-500 text-rose-500'
                            : ''
                        }`}
                      />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-300" />
                      {item.prepTimeMinutes} min
                    </div>
                  </div>

                  {/* Title & info */}
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-heading font-bold text-sm text-zinc-900 leading-tight">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-800 bg-orange-50 px-1.5 py-0.5 rounded-md">
                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                        {item.rating}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-zinc-900 font-mono">
                        ₹{item.price}
                      </span>
                      {item.originalPrice && (
                        <span className="text-xs text-zinc-400 line-through ml-1.5 font-mono">
                          ₹{item.originalPrice}
                        </span>
                      )}
                    </div>

                    {qtyInCart > 0 ? (
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-2 py-1">
                        <button
                          onClick={() => {
                            const cartItem = cart.find((c) => c.menuItem.id === item.id);
                            if (cartItem) updateCartQuantity(cartItem.cartItemId, -1);
                          }}
                          className="w-5 h-5 rounded-md bg-white text-zinc-700 flex items-center justify-center hover:bg-orange-100 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-orange-950 font-mono w-4 text-center">
                          {qtyInCart}
                        </span>
                        <button
                          onClick={() => handleAddClick(item)}
                          className="w-5 h-5 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddClick(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Menu Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-bold text-zinc-900">
            {selectedCategory === 'all' ? 'Full Canteen Menu' : `${selectedCategory.toUpperCase()} Menu`}
            <span className="text-xs font-normal text-zinc-500 ml-2">
              ({filteredItems.length} items available)
            </span>
          </h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-100 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-800 text-sm">No items found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              {selectedDietary.length > 0
                ? `No dishes match your active dietary preferences (${selectedDietary.join(', ')}). Try clearing them to see more items.`
                : 'Try adjusting your search query, clearing filters, or switching to another campus canteen.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterVegOnly(false);
                setSelectedDietary([]);
                setMaxPrice(200);
                setMaxPrepTime(30);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition shadow-sm shadow-orange-500/20 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredItems.map((item) => {
              const qtyInCart = getItemQuantityInCart(item.id);
              const isLowStock = item.stockQuantity <= 15 && item.stockQuantity > 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-3 sm:p-4 shadow-xs transition flex gap-3 sm:gap-4 ${
                    !item.inStock ? 'opacity-60 border-zinc-100 bg-zinc-50/50' : 'border-zinc-100 hover:border-orange-200 hover:shadow-md'
                  }`}
                >
                  {/* Left Column: Info & Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Top meta tags */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {item.isVeg && (
                          <span className="p-0.5 border border-emerald-300 rounded-xs flex items-center justify-center shrink-0" title="Pure Veg">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Leaf className="w-2.5 h-2.5 text-emerald-600" />
                            Vegan
                          </span>
                        )}
                        {item.isGlutenFree && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Wheat className="w-2.5 h-2.5 text-amber-600" />
                            Gluten-Free
                          </span>
                        )}
                        {item.isDairyFree && !item.isVegan && (
                          <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded-md">
                            🥛 Dairy-Free
                          </span>
                        )}
                        {item.isHighProtein && (
                          <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Dumbbell className="w-2.5 h-2.5 text-purple-600" />
                            High-Protein
                          </span>
                        )}
                        {item.isOffer && (
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md">
                            {item.offerTag || 'Special'}
                          </span>
                        )}
                        {isLowStock && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Only {item.stockQuantity} left
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-sm text-zinc-900 leading-snug">
                        {item.name}
                      </h3>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 sm:gap-3 text-xs mt-1 text-zinc-600">
                        <span className="font-mono font-extrabold text-zinc-900 text-sm">
                          ₹{item.price}
                        </span>
                        {item.originalPrice && (
                          <span className="line-through text-zinc-400 font-mono text-xs">
                            ₹{item.originalPrice}
                          </span>
                        )}
                        <span className="text-zinc-300 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 font-semibold text-zinc-800">
                          <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                          {item.rating} <span className="text-[10px] text-zinc-400">({item.ratingCount})</span>
                        </span>
                        <span className="text-zinc-300 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Clock className="w-3 h-3 text-orange-400" />
                          {item.prepTimeMinutes}m
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Customization label if present */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="mt-2 text-[10px] text-orange-600 font-medium truncate">
                        ✦ Customizable (Spice, Style & Add-ons)
                      </div>
                    )}
                  </div>

                  {/* Right Column: Image and Add Button */}
                  <div className="w-24 sm:w-32 flex flex-col items-center justify-between shrink-0">
                    <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden bg-zinc-100 mb-2">
                      <img
                        src={item.image || getFoodImage(item.name, item.category)}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, item.name, item.category)}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                      >
                        <Heart
                          className={`w-3 h-3 ${
                            currentUser.favoriteItemIds.includes(item.id)
                              ? 'fill-rose-500 text-rose-500'
                              : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Button */}
                    {!item.inStock ? (
                      <span className="text-xs text-zinc-400 font-semibold py-1">
                        Sold Out
                      </span>
                    ) : qtyInCart > 0 ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-orange-50 border border-orange-300 rounded-xl px-2 py-1 shadow-2xs">
                        <button
                          onClick={() => {
                            const cartItem = cart.find((c) => c.menuItem.id === item.id);
                            if (cartItem) updateCartQuantity(cartItem.cartItemId, -1);
                          }}
                          className="w-6 h-6 rounded-md bg-white text-zinc-700 flex items-center justify-center hover:bg-orange-100 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-orange-950 font-mono w-4 text-center">
                          {qtyInCart}
                        </span>
                        <button
                          onClick={() => handleAddClick(item)}
                          className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddClick(item)}
                        className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm shadow-orange-500/20 cursor-pointer min-h-[36px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar for Quick Checkout */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-lg z-40">
          <div
            onClick={onOpenCart}
            className="bg-zinc-900 text-white p-3.5 rounded-2xl shadow-xl shadow-zinc-900/30 border border-zinc-700 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition transform hover:-translate-y-0.5 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div>
                <div className="text-xs font-bold">
                  {cart.length} item{cart.length > 1 ? 's' : ''} in cart
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Total: <strong className="text-orange-400">₹{cart.reduce((a, b) => a + b.totalPrice, 0)}</strong> (incl. discounts)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
              <span>Choose Pickup Slot</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  Customize your order
                </span>
                <h3 className="font-heading font-extrabold text-base text-zinc-900 mt-0.5">
                  {customizingItem.name}
                </h3>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  Base Price: ₹{customizingItem.price}
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {customizingItem.isVeg && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      Veg
                    </span>
                  )}
                  {customizingItem.isVegan && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Leaf className="w-2.5 h-2.5 text-emerald-600" />
                      Vegan
                    </span>
                  )}
                  {customizingItem.isGlutenFree && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Wheat className="w-2.5 h-2.5 text-amber-600" />
                      Gluten-Free
                    </span>
                  )}
                  {customizingItem.isDairyFree && !customizingItem.isVegan && (
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md">
                      🥛 Dairy-Free
                    </span>
                  )}
                  {customizingItem.isHighProtein && (
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Dumbbell className="w-2.5 h-2.5 text-purple-600" />
                      High-Protein
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-72 overflow-y-auto pr-1">
              {customizingItem.customizations?.map((group) => (
                <div key={group.name} className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                  <div className="text-xs font-bold text-zinc-800 mb-2">
                    {group.name}
                  </div>
                  <div className="space-y-1.5">
                    {group.choices.map((choice) => {
                      const isSelected = selectedOptions[group.name] === choice.label;
                      return (
                        <label
                          key={choice.label}
                          onClick={() =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [group.name]: choice.label,
                            }))
                          }
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition ${
                            isSelected
                              ? 'bg-orange-50 border-orange-400 font-bold text-orange-950'
                              : 'bg-white border-zinc-200/70 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-zinc-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                            <span>{choice.label}</span>
                          </div>
                          {choice.extraPrice > 0 && (
                            <span className="font-mono text-[11px] text-orange-700">
                              +₹{choice.extraPrice}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmCustomization}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition"
              >
                Add with Customizations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-zinc-100 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                Filter Canteen Menu
              </h3>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Dietary Preferences Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-orange-500" />
                    Dietary Preferences
                  </span>
                  {selectedDietary.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedDietary([]);
                        setFilterVegOnly(false);
                      }}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                    >
                      Clear ({selectedDietary.length})
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mb-2">
                  Toggle items based on dietary and nutritional preferences:
                </p>

                <div className="space-y-1.5">
                  {DIETARY_OPTIONS.map((opt) => {
                    const isChecked = selectedDietary.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleDietaryFilter(opt.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-zinc-50/70 border-zinc-200/80 text-zinc-700 hover:bg-zinc-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span>{opt.icon}</span>
                              <span className="font-bold">{opt.label}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-normal truncate mt-0.5">
                              {opt.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span>Max Price</span>
                  <span className="font-mono text-orange-600 font-bold">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                  className="w-full mt-2 accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span>Max Prep Time</span>
                  <span className="font-mono text-orange-600 font-bold">{maxPrepTime} mins</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="2"
                  value={maxPrepTime}
                  onChange={(e) => setMaxPrepTime(parseInt(e.target.value, 10))}
                  className="w-full mt-2 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setMaxPrice(200);
                  setMaxPrepTime(30);
                  setFilterVegOnly(false);
                  setSelectedDietary([]);
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Gemini AI Assistant Modal */}
      <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </div>
  );
};
