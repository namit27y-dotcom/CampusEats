import React, { useState } from 'react';
import { Sparkles, Bot, Send, X, Plus, Utensils, CheckCircle2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { menuItems, addToCart } = useApp();

  const [activeTab, setActiveTab] = useState<'recommend' | 'chat'>('recommend');
  const [budget, setBudget] = useState<number>(150);
  const [dietPreference, setDietPreference] = useState<'all' | 'veg'>('veg');
  const [timeSlot, setTimeSlot] = useState<string>('lunch');
  const [craving, setCraving] = useState<string>('');

  const [isLoadingRec, setIsLoadingRec] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<{
    recommendationTitle: string;
    recommendedItemIds: string[];
    totalEstimatedPrice: number;
    rationale: string;
    quickTip?: string;
  } | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hi there! I am your CampusEats AI Cafeteria Assistant. Ask me about quick meals, combo recommendations, or dietary options!',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGetRecommendation = async () => {
    setIsLoadingRec(true);
    setApiError(null);
    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const prompt = craving 
        ? `Suggest a ${craving} meal for ${timeSlot} under ₹${budget}` 
        : `Suggest a ${dietPreference === 'veg' ? 'vegetarian' : ''} meal for ${timeSlot} under ₹${budget}`;

      const res = await fetch(`${apiBase}/ai/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt,
          budget,
          dietary: dietPreference,
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "AI recommendation unavailable" }));
        throw new Error(err.message || "Failed to fetch AI recommendations");
      }

      const json = await res.json();
      if (json.success && json.data) {
        const recList = json.data.recommendations || [];
        const itemIds = recList.map((it: any) => {
          const directMatch = menuItems.find(m => String(m.id).replace(/\D/g, '') === String(it.menuItemId));
          return directMatch ? directMatch.id : `item-${it.menuItemId}`;
        });
        const total = recList.reduce((acc: number, it: any) => acc + (Number(it.price) || 0), 0);

        setRecommendation({
          recommendationTitle: craving ? `Chef's Pick: ${craving}` : `Smart ${timeSlot.toUpperCase()} Recommendation`,
          recommendedItemIds: itemIds,
          totalEstimatedPrice: total > 0 ? total : budget,
          rationale: json.data.summary || `Personalized selection within your ₹${budget} budget.`,
          quickTip: recList.length > 0 ? `Ready in ~${recList[0].estimatedWaitMinutes || 8} mins.` : 'Pre-order now to skip the queue!',
        });
      }
    } catch (err: any) {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        // Safe dev fallback in explicit mock mode only
        const matchingItems = menuItems.filter((item) => {
          if (!item.inStock) return false;
          if (dietPreference === 'veg' && !item.isVeg) return false;
          return item.price <= budget;
        });
        const selected = matchingItems.slice(0, 2);
        setRecommendation({
          recommendationTitle: `Mock Recommendation: ${timeSlot.toUpperCase()}`,
          recommendedItemIds: selected.map(i => i.id),
          totalEstimatedPrice: selected.reduce((s, i) => s + i.price, 0),
          rationale: `Selected fresh items matching ₹${budget} budget in mock mode.`,
          quickTip: 'Mock mode recommendation generated.'
        });
      } else {
        setApiError(err.message || "Unable to reach CampusEats AI service. Please verify you are logged in.");
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
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const res = await fetch(`${apiBase}/ai/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt: userMsg,
          budget,
          dietary: dietPreference
        })
      });

      if (res.ok) {
        const json = await res.json();
        const summary = json.data?.summary;
        const recs = (json.data?.recommendations || []).map((r: any) => `• ${r.name} (₹${r.price}) - ${r.reason}`).join('\n');
        const reply = recs ? `${summary}\n\n${recs}` : summary || "I found no matching dishes for your query right now.";
        setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      } else {
        const err = await res.json().catch(() => ({ message: "AI response failed" }));
        throw new Error(err.message);
      }
    } catch (err: any) {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        const lower = userMsg.toLowerCase();
        let reply = `For "${userMsg}", try our fresh daily combos!`;
        if (lower.includes('budget') || lower.includes('cheap')) {
          reply = 'Our budget friendly items include Vada Pav (₹40), Idli Sambar (₹45), and Filter Coffee (₹25).';
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

  const recommendedItems = recommendation
    ? menuItems.filter((m) => recommendation.recommendedItemIds.includes(m.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">CampusEats AI Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-800/60 text-emerald-200 border border-emerald-500/30">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100">Smart meal suggestions & instant canteen answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'recommend'
                ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Meal Recommender
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            Menu Q&A Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'recommend' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Diet Selection */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Diet Preference</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDietPreference('veg')}
                      className={`flex-1 py-1.5 px-2 text-xs rounded-lg border font-medium transition-all ${
                        dietPreference === 'veg'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      🟢 Veg Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setDietPreference('all')}
                      className={`flex-1 py-1.5 px-2 text-xs rounded-lg border font-medium transition-all ${
                        dietPreference === 'all'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Menus
                    </button>
                  </div>
                </div>

                {/* Time slot */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">Meal Time</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="text-xs font-bold text-gray-700">Budget Limit</label>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ₹{budget}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Craving Prompt */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Craving or Specific Need (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spicy & crispy, light study snack, high protein..."
                  value={craving}
                  onChange={(e) => setCraving(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingRec ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Consulting Gemini Nutrition AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Generate Ideal Meal Combo
                  </>
                )}
              </button>

              {/* Recommendation Result Card */}
              {recommendation && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {recommendation.recommendationTitle}
                    </h3>
                    <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      Total: ₹{recommendation.totalEstimatedPrice}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-800/90 leading-relaxed">{recommendation.rationale}</p>

                  {recommendation.quickTip && (
                    <div className="text-[11px] text-teal-800 bg-teal-100/60 p-2 rounded-lg">
                      💡 <strong>Pro Tip:</strong> {recommendation.quickTip}
                    </div>
                  )}

                  {/* Item List */}
                  {recommendedItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-emerald-200/50">
                      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Suggested Items:</p>
                      {recommendedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-100 shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{item.isVeg ? '🟢' : '🔴'}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{item.name}</p>
                              <p className="text-[10px] text-gray-500">₹{item.price} • {item.prepTimeMinutes}m prep</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(item, 1)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-[320px]">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-xl rounded-tl-none p-3 text-xs text-gray-500 flex items-center gap-1.5 border border-gray-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce delay-200" />
                      <span className="text-[11px] ml-1">Assistant is checking the menu...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 pt-2 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="Ask about breakfast, calories, fast prep items..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"
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
