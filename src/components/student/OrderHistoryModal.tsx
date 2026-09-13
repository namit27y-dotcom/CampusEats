import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderFeedback } from '../../types';
import { getFoodImage, handleImageError } from '../../utils/foodImages';
import {
  X,
  History,
  RotateCcw,
  Star,
  Clock,
  Heart,
  Plus,
  MessageSquare,
  Check,
} from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrderTracker: (order: Order) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenOrderTracker,
}) => {
  const {
    orders,
    currentUser,
    menuItems,
    addToCart,
    oneClickReorder,
    submitOrderFeedback,
    toggleFavorite,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites'>('orders');
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);

  // Feedback form state
  const [overallRating, setOverallRating] = useState(5);
  const [foodQuality, setFoodQuality] = useState(5);
  const [prepSpeed, setPrepSpeed] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [issueType, setIssueType] = useState<string>('');

  if (!isOpen) return null;

  // Filter orders for current student
  const userOrders = orders.filter((o) => o.userId === currentUser.id);

  // Favorite items
  const favoriteItems = menuItems.filter((item) =>
    currentUser.favoriteItemIds.includes(item.id)
  );

  const handleFeedbackSubmit = () => {
    if (!feedbackOrder) return;
    const feedback: OrderFeedback = {
      rating: overallRating,
      foodQuality,
      prepSpeed,
      service: serviceRating,
      comment: feedbackComment || undefined,
      issueReported: issueType || undefined,
      submittedAt: new Date().toISOString(),
    };
    submitOrderFeedback(feedbackOrder.id, feedback);
    setFeedbackOrder(null);
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-zinc-900">
                Order History & Favorites
              </h2>
              <p className="text-[11px] text-zinc-500">
                One-click reorder and past token verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3 flex gap-2 border-b border-zinc-100">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Past Orders ({userOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Saved Favorites ({favoriteItems.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {userOrders.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <p className="text-xs">No orders placed yet.</p>
                </div>
              ) : (
                userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="border border-zinc-200 rounded-2xl p-4 bg-white hover:border-zinc-300 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {ord.tokenNumber}
                          </span>
                          <span className="text-xs font-bold text-zinc-800">
                            #{ord.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {ord.canteenName} • {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ord.status === 'COLLECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'READY'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="py-2.5 space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-zinc-700">
                          <span>
                            {it.quantity} × {it.name}
                          </span>
                          <span className="font-mono text-zinc-600">
                            ₹{it.price * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom row actions */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <div className="text-xs font-bold text-zinc-900">
                        Total: <span className="font-mono text-amber-600">₹{ord.total}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.status === 'COLLECTED' && (
                          <button
                            onClick={() => {
                              setFeedbackOrder(ord);
                              if (ord.feedback) {
                                setOverallRating(ord.feedback.rating);
                                setFoodQuality(ord.feedback.foodQuality);
                                setPrepSpeed(ord.feedback.prepSpeed);
                                setServiceRating(ord.feedback.service);
                                setFeedbackComment(ord.feedback.comment || '');
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{ord.feedback ? 'Rated' : 'Rate Food'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onClose();
                            onOpenOrderTracker(ord);
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition"
                        >
                          View Token
                        </button>

                        <button
                          onClick={() => {
                            oneClickReorder(ord);
                            onClose();
                          }}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 shadow-2xs transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-3">
              {favoriteItems.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-30 text-rose-500" />
                  <p className="text-xs">No favorite items saved yet.</p>
                  <p className="text-[11px] mt-1">Tap the heart icon on any menu item to quickly reorder it here.</p>
                </div>
              ) : (
                favoriteItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-zinc-200 rounded-2xl p-3 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || getFoodImage(item.name, item.category)}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, item.name, item.category)}
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-100"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">{item.name}</div>
                        <div className="text-[11px] font-mono font-bold text-amber-600">
                          ₹{item.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>

                      <button
                        onClick={() => addToCart(item, 1)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Feedback Sub-Modal (PRD 24) */}
        {feedbackOrder && (
          <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="font-bold text-sm text-zinc-900">
                  Rate Order #{feedbackOrder.id} (Token {feedbackOrder.tokenNumber})
                </h3>
                <button
                  onClick={() => setFeedbackOrder(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {/* Food Quality */}
                <div>
                  <div className="font-bold text-zinc-700 mb-1 flex items-center justify-between">
                    <span>Food Quality</span>
                    <span className="text-amber-500 font-bold">{foodQuality} / 5</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFoodQuality(st)}
                        className="p-1 text-amber-500"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            foodQuality >= st ? 'fill-amber-500' : 'text-zinc-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prep Speed */}
                <div>
                  <div className="font-bold text-zinc-700 mb-1 flex items-center justify-between">
                    <span>Preparation Speed</span>
                    <span className="text-amber-500 font-bold">{prepSpeed} / 5</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPrepSpeed(st)}
                        className="p-1 text-amber-500"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            prepSpeed >= st ? 'fill-amber-500' : 'text-zinc-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service */}
                <div>
                  <div className="font-bold text-zinc-700 mb-1 flex items-center justify-between">
                    <span>Counter Staff Service</span>
                    <span className="text-amber-500 font-bold">{serviceRating} / 5</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setServiceRating(st)}
                        className="p-1 text-amber-500"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            serviceRating >= st ? 'fill-amber-500' : 'text-zinc-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Tags */}
                <div>
                  <div className="font-bold text-zinc-700 mb-1">Feedback Tag</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Super fast', 'Fresh & hot', 'Clean packaging', 'Wrong item', 'Cold food'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setIssueType(issueType === tag ? '' : tag)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                            issueType === tag
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <textarea
                    rows={2}
                    placeholder="Any notes for the canteen chef or management? (Optional)"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full p-2 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFeedbackOrder(null)}
                  className="flex-1 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
