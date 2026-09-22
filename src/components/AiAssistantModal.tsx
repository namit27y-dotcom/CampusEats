import React, { useState } from 'react';
import { Sparkles, Bot, Send, X, Plus, Utensils, CheckCircle2, Check, ShoppingBag } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { MenuItem } from '../types';
import { getFoodImage } from '../utils/foodImages';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  recommendedItems?: MenuItem[];
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { menuItems, addToCart, selectedCanteen } = useApp();

  const [activeTab, setActiveTab] = useState<'recommend' | 'chat'>('recommend');
  const [budget, setBudget] = useState<number>(150);
  const [dietPreference, setDietPreference] = useState<'all' | 'veg'>('veg');
  const [timeSlot, setTimeSlot] = useState<string>('lunch');
  const [craving, setCraving] = useState<string>('');

  const [isLoadingRec, setIsLoadingRec] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<{
    recommendationTitle: string;
    items: MenuItem[];
    totalEstimatedPrice: number;
    rationale: string;
    quickTip?: string;
  } | null>(null);

  // Added item feedback tracking (itemId -> boolean)
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi there! I am your CampusEats AI Cafeteria Assistant. Ask me about quick meals, combo recommendations, or dietary options!',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  /**
   * Safely map backend AI recommendations to existing menu item objects
   */
  const resolveMenuItem = (rec: {
    menuItemId?: number | string;
    name?: string;
    price?: number;
    reason?: string;
    isVeg?: boolean;
    estimatedWaitMinutes?: number;
  }): MenuItem => {
    // 1. Direct ID match in loaded menu items
    if (rec.menuItemId !== undefined && rec.menuItemId !== null) {
      const recIdStr = String(rec.menuItemId).trim();
      const byId = menuItems.find(
        (m) =>
          String(m.id).trim() === recIdStr ||
          String(m.id).replace(/\D/g, '') === recIdStr.replace(/\D/g, '') ||
          String(m.id).toLowerCase() === `item-${recIdStr.toLowerCase()}`
      );
      if (byId) return byId;
    }

    // 2. Name match in loaded menu items
    if (rec.name) {
      const targetName = rec.name.trim().toLowerCase();
      const byName = menuItems.find((m) => {
        const mName = m.name.trim().toLowerCase();
        return mName === targetName || mName.includes(targetName) || targetName.includes(mName);
      });
      if (byName) return byName;
    }

    // 3. Fallback synthesis for seamless cart integration
    const itemName = rec.name || 'Cafeteria Item';
    const lowerName = itemName.toLowerCase();
    const fallbackCategory =
      lowerName.includes('tea') || lowerName.includes('coffee') || lowerName.includes('drink')
        ? 'drinks'
        : lowerName.includes('dosa') || lowerName.includes('idli')
        ? 'breakfast'
        : lowerName.includes('thali') || lowerName.includes('meal')
        ? 'meals'
        : 'snacks';

    return {
      id: rec.menuItemId ? String(rec.menuItemId) : `item-${Date.now()}`,
      canteenId: selectedCanteen?.id || 'canteen-main',
      name: itemName,
      description: rec.reason || 'Freshly prepared at the cafeteria',
      price: Number(rec.price) || 50,
      category: fallbackCategory as any,
      isVeg: Boolean(rec.isVeg ?? true),
      isVegan: false,
      isGlutenFree: false,
      isDairyFree: false,
      isHighProtein: false,
      dietaryTags: rec.isVeg ? ['veg'] : [],
      rating: 4.8,
      ratingCount: 150,
      prepTimeMinutes: rec.estimatedWaitMinutes || 8,
      inStock: true,
      stockQuantity: 100,
      maxStock: 100,
      image: getFoodImage(itemName, fallbackCategory),
    };
  };

  const handleAddToCart = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(item, 1);
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1800);
  };

  const handleAddAllToCart = () => {
    if (!recommendation?.items) return;
    recommendation.items.forEach((item) => {
      addToCart(item, 1);
      setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    });
    setTimeout(() => {
      setAddedItemIds({});
    }, 1800);
  };

  const handleGetRecommendation = async () => {
    setIsLoadingRec(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const prompt = craving
        ? `Suggest a ${craving} meal for ${timeSlot} under ₹${budget}`
        : `Suggest a ${dietPreference === 'veg' ? 'vegetarian' : ''} meal for ${timeSlot} under ₹${budget}`;

      const res = await fetch(`${apiBase}/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          budget,
          dietary: dietPreference,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'AI recommendation unavailable' }));
        throw new Error(err.message || 'Failed to fetch AI recommendations');
      }

      const json = await res.json();
      if (json.success && json.data) {
        const recList = json.data.recommendations || [];
        const resolvedItems = recList.map((it: any) => resolveMenuItem(it));
        const total = resolvedItems.reduce((acc: number, it: MenuItem) => acc + (Number(it.price) || 0), 0);

        setRecommendation({
          recommendationTitle: craving ? `Chef's Pick: ${craving}` : `Smart ${timeSlot.toUpperCase()} Recommendation`,
          items: resolvedItems,
          totalEstimatedPrice: total > 0 ? total : budget,
          rationale: json.data.summary || `Personalized selection within your ₹${budget} budget.`,
          quickTip: resolvedItems.length > 0 ? `Ready in ~${resolvedItems[0].prepTimeMinutes || 8} mins.` : 'Pre-order now to skip the queue!',
        });
      }
    } catch (err: any) {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        const matchingItems = menuItems.filter((item) => {
          if (!item.inStock) return false;
          if (dietPreference === 'veg' && !item.isVeg) return false;
          return item.price <= budget;
        });
        const selected = matchingItems.slice(0, 2);
        setRecommendation({
          recommendationTitle: `Mock Recommendation: ${timeSlot.toUpperCase()}`,
          items: selected,
          totalEstimatedPrice: selected.reduce((s, i) => s + i.price, 0),
          rationale: `Selected fresh items matching ₹${budget} budget in mock mode.`,
          quickTip: 'Mock mode recommendation generated.',
        });
      } else {
        setApiError(err.message || 'Unable to reach CampusEats AI service. Please verify you are logged in.');
      }
    } finally {
      setIsLoadingRec(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: userMsg,
          budget,
          dietary: dietPreference,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const summary = json.data?.summary;
        const recs = json.data?.recommendations || [];
        const resolvedRecItems = recs.map((r: any) => resolveMenuItem(r));
        const recsText = recs.map((r: any) => `• ${r.name} (₹${r.price}) - ${r.reason}`).join('\n');
        const reply = recsText ? `${summary}\n\n${recsText}` : summary || 'I found no matching dishes for your query right now.';

        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: reply,
            recommendedItems: resolvedRecItems.length > 0 ? resolvedRecItems : undefined,
          },
        ]);
      } else {
        const err = await res.json().catch(() => ({ message: 'AI response failed' }));
        throw new Error(err.message);
      }
    } catch (err: any) {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        const lower = userMsg.toLowerCase();
        let reply = `For "${userMsg}", try our fresh daily combos!`;
        if (lower.includes('budget') || lower.includes('cheap') || lower.includes('100')) {
          reply = 'Our budget friendly items include Vada Pav (₹20), Samosa (₹15), and Cold Coffee (₹50).';
        }
        setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `Sorry, I couldn't process your request: ${err.message || 'Please ensure you are logged in.'}` },
        ]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-orange-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with CampusEats Brand Orange */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 p-4 sm:p-5 text-white flex items-center justify-between shadow-md shadow-orange-500/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">CampusEats AI Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600/70 text-orange-100 border border-orange-300/30">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-orange-100/90 font-medium">Smart meal suggestions & instant canteen answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Assistant"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-orange-100/80 bg-orange-50/30 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('recommend')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'recommend'
                ? 'bg-white text-orange-600 shadow-xs border border-orange-200/80'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Meal Recommender
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-orange-600 shadow-xs border border-orange-200/80'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            Menu Q&A Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'recommend' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Diet Selection */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Diet Preference</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDietPreference('veg')}
                      className={`flex-1 py-2 px-2 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                        dietPreference === 'veg'
                          ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-2xs'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      🟢 Veg Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setDietPreference('all')}
                      className={`flex-1 py-2 px-2 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                        dietPreference === 'all'
                          ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-2xs'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      All Menus
                    </button>
                  </div>
                </div>

                {/* Time slot */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Meal Time</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="breakfast">Breakfast (8-11 AM)</option>
                    <option value="lunch">Lunch (12-3 PM)</option>
                    <option value="snacks">Quick Break / Snacks</option>
                    <option value="dinner">Evening Dinner</option>
                  </select>
                </div>
              </div>

              {/* Budget Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-zinc-700">Budget Limit</label>
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    ₹{budget}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="350"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Craving Prompt */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                  Craving or Specific Need (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spicy & healthy, light snack, high protein..."
                  value={craving}
                  onChange={(e) => setCraving(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {apiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                  <span>{apiError}</span>
                  <button onClick={() => handleGetRecommendation()} className="underline font-bold hover:text-rose-900 cursor-pointer">
                    Retry
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleGetRecommendation}
                disabled={isLoadingRec}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingRec ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Consulting Gemini Nutrition AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    Generate Ideal Meal Combo
                  </>
                )}
              </button>

              {/* Recommendation Result Card */}
              {recommendation && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-orange-50/50 border border-orange-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-orange-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                      {recommendation.recommendationTitle}
                    </h3>
                    <span className="text-xs font-bold text-orange-800 bg-white px-2.5 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                      Total: ₹{recommendation.totalEstimatedPrice}
                    </span>
                  </div>

                  <p className="text-xs text-orange-950/90 leading-relaxed">{recommendation.rationale}</p>

                  {recommendation.quickTip && (
                    <div className="text-[11px] text-amber-900 bg-amber-100/70 border border-amber-200/60 p-2.5 rounded-xl">
                      💡 <strong>Pro Tip:</strong> {recommendation.quickTip}
                    </div>
                  )}

                  {/* Suggested Items with functional Add to Cart */}
                  {recommendation.items && recommendation.items.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-orange-200/60">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Suggested Items:</p>
                        {recommendation.items.length > 1 && (
                          <button
                            type="button"
                            onClick={handleAddAllToCart}
                            className="text-[11px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Add All to Cart
                          </button>
                        )}
                      </div>
                      {recommendation.items.map((item) => {
                        const isAdded = Boolean(addedItemIds[item.id]);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-orange-100/90 hover:border-orange-300 shadow-2xs transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className="text-xs shrink-0">{item.isVeg ? '🟢' : '🔴'}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-900 truncate">{item.name}</p>
                                <p className="text-[10px] text-zinc-500">
                                  ₹{item.price} • ~{item.prepTimeMinutes || 8}m prep
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(item, e)}
                              disabled={isAdded}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  Add
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-[340px]">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-xs'
                          : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/80'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Interactive Recommended Items from Chat */}
                    {msg.recommendedItems && msg.recommendedItems.length > 0 && (
                      <div className="mt-2 w-full max-w-[85%] grid grid-cols-1 gap-1.5">
                        {msg.recommendedItems.map((item) => {
                          const isAdded = Boolean(addedItemIds[item.id]);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs shadow-2xs"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span>{item.isVeg ? '🟢' : '🔴'}</span>
                                <span className="font-bold text-zinc-900 truncate">{item.name}</span>
                                <span className="text-zinc-600 font-semibold shrink-0">₹{item.price}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleAddToCart(item, e)}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                                  isAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-2xs shadow-orange-500/20'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 rounded-2xl rounded-tl-none p-3 text-xs text-zinc-600 flex items-center gap-2 border border-zinc-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce delay-200" />
                      <span className="text-[11px]">Assistant is analyzing the cafeteria menu...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 pt-2 border-t border-zinc-100">
                <input
                  type="text"
                  placeholder="Ask: What can I eat under ₹100? Which items are veg?"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-xs shadow-orange-500/20 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
