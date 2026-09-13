import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserRole,
  UserProfile,
  Canteen,
  MenuItem,
  CartItem,
  Order,
  OrderStatus,
  InventoryItem,
  PickupSlot,
  AppNotification,
  OrderFeedback,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CANTEENS,
  INITIAL_MENU_ITEMS,
  INITIAL_PICKUP_SLOTS,
  INITIAL_ORDERS,
  INITIAL_INVENTORY,
} from '../data/mockData';
import { playOrderPlacedSound, playOrderReadyChime, announceTokenVoice } from '../utils/soundEffects';
import { apiRequest } from '../utils/api';

interface AppContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  loginUser: (email: string, password: string) => Promise<UserProfile>;
  logoutUser: () => void;
  availableUsers: UserProfile[];
  
  // Canteen
  selectedCanteen: Canteen;
  canteens: Canteen[];
  selectCanteen: (canteenId: string) => void;
  updateCanteen: (canteen: Canteen) => void;

  // Menu & Inventory
  menuItems: MenuItem[];
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  inventory: InventoryItem[];
  updateInventoryStock: (itemId: string, newStock: number) => void;
  restockItem: (itemId: string, addAmount: number) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (menuItem: MenuItem, quantity?: number, customizations?: Record<string, string>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;

  // Slots & Orders
  pickupSlots: PickupSlot[];
  orders: Order[];
  activeOrders: Order[];
  activeOrder: Order | null; // latest active order for current student
  placeOrder: (pickupSlot: string, paymentMethod: 'upi' | 'wallet' | 'card' | 'cash') => Promise<Order>;
  cancelOrder: (orderId: string) => boolean;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  callToken: (orderId: string) => void;
  verifyAndCollectOrder: (tokenOrId: string) => { success: boolean; message: string; order?: Order };
  submitOrderFeedback: (orderId: string, feedback: OrderFeedback) => void;
  oneClickReorder: (order: Order) => void;

  // Wallet & Favorites
  topUpWallet: (amount: number) => void;
  toggleFavorite: (itemId: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Simulation & Queue Info
  autoSimulateKitchen: boolean;
  setAutoSimulateKitchen: (enabled: boolean) => void;
  queueStatus: {
    pendingCount: number;
    preparingCount: number;
    readyCount: number;
    estimatedWaitMinutes: number;
    currentServingToken: string;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ORDERS: 'campuseats_orders_v1',
  MENU: 'campuseats_menu_v1',
  INVENTORY: 'campuseats_inventory_v1',
  USER_WALLET: 'campuseats_wallet_v1',
  CANTEENS: 'campuseats_canteens_v1',
  FAVORITES: 'campuseats_favorites_v1',
  AUTO_SIM: 'campuseats_autosim_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Roles & Users
  const [currentRole, setRoleState] = useState<UserRole>('student');
  const [availableUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    return INITIAL_USERS[0];
  });

  // Canteens
  const [canteens, setCanteens] = useState<Canteen[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CANTEENS);
    return saved ? JSON.parse(saved) : INITIAL_CANTEENS;
  });
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('canteen-main');

  // Menu & Inventory
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU);
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  // Slots
  const [pickupSlots] = useState<PickupSlot[]>(INITIAL_PICKUP_SLOTS);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-welcome',
      title: 'Welcome to CampusEats! 🚀',
      message: 'Skip canteen queues! Pre-order now and collect with your live digital token.',
      type: 'info',
      timestamp: 'Just now',
      read: false,
    },
  ]);

  // Demo auto-simulation switch
  const [autoSimulateKitchen, setAutoSimulateKitchenState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SIM);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Persist key states
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CANTEENS, JSON.stringify(canteens));
  }, [canteens]);

  const setAutoSimulateKitchen = (val: boolean) => {
    setAutoSimulateKitchenState(val);
    localStorage.setItem(STORAGE_KEYS.AUTO_SIM, JSON.stringify(val));
  };

  const selectedCanteen = useMemo(() => {
    return canteens.find((c) => c.id === selectedCanteenId) || canteens[0];
  }, [canteens, selectedCanteenId]);

  const selectCanteen = (id: string) => {
    setSelectedCanteenId(id);
  };

  const updateCanteen = (canteen: Canteen) => {
    setCanteens((prev) => prev.map((c) => (c.id === canteen.id ? canteen : c)));
  };

  const setRole = (role: UserRole) => {
    setRoleState(role);
    if (role === 'faculty') {
      setCurrentUserState(availableUsers[1] || availableUsers[0]);
    } else if (role === 'student') {
      setCurrentUserState(availableUsers[0]);
    }
  };

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
  };

  const loginUser = async (email: string, password: string): Promise<UserProfile> => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    localStorage.setItem("token", data.token);

    const backendUser = data.user;

    const user: UserProfile = {
      ...backendUser,
      walletBalance: Number(backendUser.wallet_balance ?? 0),
      favoriteItemIds: backendUser.favoriteItemIds ?? [],
    };

    setCurrentUserState(user);
    setRoleState(user.role);

    return user;
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setCurrentUserState(INITIAL_USERS[0]);
    setRoleState("student");
  };

  // Add Notification helper
  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Cart Operations
  const addToCart = (menuItem: MenuItem, quantity = 1, customizations: Record<string, string> = {}) => {
    // Check stock
    if (!menuItem.inStock || menuItem.stockQuantity <= 0) {
      alert('Sorry, this item is currently out of stock!');
      return;
    }

    setCart((prev) => {
      // Create unique key based on item id and customizations
      const customKey = Object.entries(customizations)
        .sort()
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      const cartItemId = `${menuItem.id}-${customKey}`;

      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);

      // Compute customization extra price
      let extraPrice = 0;
      if (menuItem.customizations) {
        menuItem.customizations.forEach((group) => {
          const selectedChoice = customizations[group.name];
          if (selectedChoice) {
            const found = group.choices.find((c) => c.label === selectedChoice);
            if (found) extraPrice += found.extraPrice;
          }
        });
      }

      const unitPrice = menuItem.price + extraPrice;

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return next;
      }

      return [
        ...prev,
        {
          cartItemId,
          menuItem,
          quantity,
          selectedCustomizations: customizations,
          unitPrice,
          totalPrice: unitPrice * quantity,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [cart]);

  // Orders and Smart Token Generator
  const generateSmartToken = (canteen: Canteen): string => {
    // Generate sequential or smart prefix like A138 or M-0903-138
    const existingTokens = orders
      .filter((o) => o.canteenId === canteen.id)
      .map((o) => {
        const num = parseInt(o.tokenNumber.replace(/\D/g, ''), 10);
        return isNaN(num) ? 100 : num;
      });

    const maxNum = existingTokens.length > 0 ? Math.max(...existingTokens) : 130;
    const nextNum = maxNum + 1;
    return `A${nextNum}`;
  };

  const placeOrder = async (
    pickupSlot: string,
    paymentMethod: 'upi' | 'wallet' | 'card' | 'cash'
  ): Promise<Order> => {
    // 1. Validate cart is not empty
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // 2. Convert selected cart items into backend format
    const rawCanteenId = Number(selectedCanteenId);
    const canteenId = isNaN(rawCanteenId)
      ? (parseInt(String(selectedCanteenId).replace(/\D/g, ''), 10) || 1)
      : rawCanteenId;

    const backendPayload = {
      canteenId,
      items: cart.map((item) => {
        const rawItemId = Number(item.menuItem.id);
        const menuItemId = isNaN(rawItemId)
          ? (parseInt(String(item.menuItem.id).replace(/\D/g, ''), 10) || 1)
          : rawItemId;
        return {
          menuItemId,
          quantity: item.quantity,
        };
      }),
    };

    // Helper to map backend status values to frontend OrderStatus
    const mapBackendStatus = (backendStatus?: string): OrderStatus => {
      if (!backendStatus) return 'CONFIRMED';
      const s = String(backendStatus).toLowerCase().trim();
      switch (s) {
        case 'placed':
          return 'CONFIRMED';
        case 'accepted':
          return 'ACCEPTED';
        case 'preparing':
          return 'PREPARING';
        case 'ready':
          return 'READY';
        case 'completed':
        case 'collected':
          return 'COLLECTED';
        case 'cancelled':
        case 'canceled':
          return 'CANCELLED';
        default: {
          const upper = backendStatus.toUpperCase() as OrderStatus;
          if (['CREATED', 'CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED'].includes(upper)) {
            return upper;
          }
          return 'CONFIRMED';
        }
      }
    };

    try {
      // 3. Call POST /api/orders using existing apiRequest() helper
      const data = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(backendPayload),
      });

      const backendOrder = data?.order || data;
      if (!backendOrder) {
        throw new Error('Invalid order response received from backend.');
      }

      // 4. Extract backend generated ID, token number, and status (no manual generation)
      const orderId = String(backendOrder.id ?? backendOrder.order_id ?? backendOrder.orderId ?? '');
      const tokenNumber = String(
        backendOrder.token_number ??
        backendOrder.tokenNumber ??
        backendOrder.token ??
        ''
      );
      const orderStatus: OrderStatus = mapBackendStatus(backendOrder.status);

      // 5. Convert backend wallet_balance to frontend walletBalance if returned
      const returnedWalletBalance =
        data?.wallet_balance ??
        data?.walletBalance ??
        backendOrder?.wallet_balance ??
        backendOrder?.walletBalance ??
        data?.user?.wallet_balance ??
        data?.user?.walletBalance;

      if (returnedWalletBalance !== undefined && returnedWalletBalance !== null) {
        const parsedBalance = Number(returnedWalletBalance);
        if (!isNaN(parsedBalance)) {
          setCurrentUserState((prev) => ({
            ...prev,
            walletBalance: parsedBalance,
          }));
        }
      }

      // 6. Construct frontend Order object preserving existing structure
      const subtotal = cartTotal;
      const discount = subtotal >= 100 ? 15 : 0;
      const taxes = 0;
      const total =
        backendOrder.total_amount !== undefined
          ? Number(backendOrder.total_amount)
          : backendOrder.total !== undefined
          ? Number(backendOrder.total)
          : Math.max(0, subtotal - discount + taxes);

      const maxItemPrep = Math.max(...cart.map((c) => c.menuItem.prepTimeMinutes || 5));
      const estimatedPrepMinutes =
        Number(backendOrder.estimated_prep_minutes || backendOrder.estimatedPrepMinutes) || maxItemPrep;
      const readyDate = new Date(Date.now() + estimatedPrepMinutes * 60 * 1000);
      const estimatedReadyTime =
        backendOrder.estimated_ready_time ||
        backendOrder.estimatedReadyTime ||
        readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const pickupCounter =
        backendOrder.pickup_counter ||
        backendOrder.pickupCounter ||
        selectedCanteen.counters[0] ||
        'Pickup Counter 1';

      const newOrder: Order = {
        id: orderId,
        tokenNumber,
        userId: String(backendOrder.user_id || backendOrder.userId || currentUser.id),
        userName: backendOrder.user_name || backendOrder.userName || currentUser.name,
        userRole: (currentUser.role as 'student' | 'faculty') || 'student',
        canteenId: String(backendOrder.canteen_id || backendOrder.canteenId || selectedCanteen.id),
        canteenName: backendOrder.canteen_name || backendOrder.canteenName || selectedCanteen.name,
        items: cart.map((item) => ({
          id: String(item.menuItem.id),
          name: item.menuItem.name,
          price: item.unitPrice,
          quantity: item.quantity,
          isVeg: item.menuItem.isVeg,
          customizationText:
            Object.entries(item.selectedCustomizations)
              .map(([k, v]) => `${v}`)
              .join(', ') || undefined,
        })),
        subtotal: Number(backendOrder.subtotal ?? subtotal),
        discount: Number(backendOrder.discount ?? discount),
        taxes: Number(backendOrder.taxes ?? taxes),
        total,
        paymentMethod,
        paymentTransactionId:
          backendOrder.payment_transaction_id ||
          backendOrder.paymentTransactionId ||
          (paymentMethod === 'upi'
            ? `UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`
            : paymentMethod === 'wallet'
            ? `CW-WALLET-${Math.floor(10000 + Math.random() * 90000)}`
            : `TXN-${Math.floor(100000 + Math.random() * 900000)}`),
        paymentStatus: 'PAID',
        status: orderStatus,
        pickupSlot: backendOrder.pickup_slot || backendOrder.pickupSlot || pickupSlot,
        pickupCounter,
        estimatedReadyTime,
        estimatedPrepMinutes,
        createdAt: backendOrder.created_at || backendOrder.createdAt || new Date().toISOString(),
        updatedAt: backendOrder.updated_at || backendOrder.updatedAt || new Date().toISOString(),
      };

      // Deduct stock in menu and inventory locally
      cart.forEach((c) => {
        setMenuItems((prev) =>
          prev.map((m) =>
            m.id === c.menuItem.id
              ? {
                  ...m,
                  stockQuantity: Math.max(0, m.stockQuantity - c.quantity),
                  inStock: m.stockQuantity - c.quantity > 0,
                }
              : m
          )
        );
      });

      // 7. Add order to existing orders state, clear cart, sound & notification
      setOrders((prev) => [newOrder, ...prev]);
      clearCart();

      // Play chime sound
      playOrderPlacedSound();

      addNotification({
        title: `Order Placed: Token ${tokenNumber || orderId} 🎉`,
        message: `Your order #${orderId} is confirmed at ${selectedCanteen.name}. Estimated Ready: ${estimatedReadyTime}`,
        tokenNumber,
        type: 'order_confirmed',
      });

      return newOrder;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      throw new Error(errorMsg);
    }
  };

  const cancelOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    // Students can cancel before PREPARING
    if (['PREPARING', 'READY', 'COLLECTED'].includes(order.status)) {
      alert('Order is already in the kitchen and cannot be cancelled directly.');
      return false;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED', updatedAt: new Date().toISOString() } : o))
    );

    // Refund if wallet
    if (order.paymentMethod === 'wallet' && order.userId === currentUser.id) {
      setCurrentUserState((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance + order.total,
      }));
    }

    addNotification({
      title: `Order #${order.id} Cancelled`,
      message: `Your order #${order.id} (Token ${order.tokenNumber}) has been cancelled. Payment of ₹${order.total} is refunded.`,
      tokenNumber: order.tokenNumber,
      type: 'cancelled',
    });

    return true;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (newStatus === 'PREPARING') {
      addNotification({
        title: `Kitchen Preparing: Token ${order.tokenNumber} 👨‍🍳`,
        message: `Your food is now on the stove/counter at ${order.canteenName}.`,
        tokenNumber: order.tokenNumber,
        type: 'preparing',
      });
    } else if (newStatus === 'READY') {
      playOrderReadyChime();
      addNotification({
        title: `🎉 Order Ready for Pickup! Token ${order.tokenNumber}`,
        message: `Your order is hot & ready! Please collect at ${order.pickupCounter}.`,
        tokenNumber: order.tokenNumber,
        type: 'ready',
      });
      // Update canteen's current serving token
      setCanteens((prev) =>
        prev.map((c) =>
          c.id === order.canteenId
            ? { ...c, currentServingToken: order.tokenNumber }
            : c
        )
      );
    } else if (newStatus === 'COLLECTED') {
      addNotification({
        title: `Order Collected: Token ${order.tokenNumber} ✅`,
        message: `Enjoy your meal! How was your experience? Leave quick feedback.`,
        tokenNumber: order.tokenNumber,
        type: 'collected',
      });
    }
  };

  // Call token from pickup counter with voice announcement!
  const callToken = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    announceTokenVoice(order.tokenNumber, order.pickupCounter);

    addNotification({
      title: `🔊 Calling Token ${order.tokenNumber}`,
      message: `Announcement made for ${order.pickupCounter}!`,
      tokenNumber: order.tokenNumber,
      type: 'reminder',
    });
  };

  // Counter staff verifies QR or Token
  const verifyAndCollectOrder = (tokenOrId: string) => {
    const cleanQuery = tokenOrId.trim().toUpperCase();
    const order = orders.find(
      (o) =>
        o.tokenNumber.toUpperCase() === cleanQuery ||
        o.id.toUpperCase() === cleanQuery ||
        o.id.toUpperCase() === `CE${cleanQuery}`
    );

    if (!order) {
      return { success: false, message: `Token or Order "${tokenOrId}" not found in current canteen queue.` };
    }

    if (order.status === 'COLLECTED') {
      return { success: false, message: `Token ${order.tokenNumber} has already been collected!`, order };
    }

    // Mark as collected
    updateOrderStatus(order.id, 'COLLECTED');
    return { success: true, message: `Success! Token ${order.tokenNumber} verified & food collected.`, order };
  };

  const submitOrderFeedback = (orderId: string, feedback: OrderFeedback) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, feedback } : o))
    );
    addNotification({
      title: 'Thank you for your rating! ⭐',
      message: 'Your feedback helps improve canteen quality and prep speed.',
      type: 'info',
    });
  };

  const oneClickReorder = (pastOrder: Order) => {
    clearCart();
    let addedCount = 0;
    pastOrder.items.forEach((item) => {
      const menuItem = menuItems.find((m) => m.id === item.id);
      if (menuItem && menuItem.inStock) {
        addToCart(menuItem, item.quantity);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      addNotification({
        title: 'Items Added to Cart! 🛒',
        message: `Reordered ${addedCount} items from Order #${pastOrder.id}. Review and choose pickup slot.`,
        type: 'info',
      });
    } else {
      alert('Items from this order are currently unavailable or out of stock.');
    }
  };

  const topUpWallet = (amount: number) => {
    setCurrentUserState((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance + amount,
    }));
    addNotification({
      title: `Wallet Credited: +₹${amount}`,
      message: `Your Campus Wallet balance is now ₹${currentUser.walletBalance + amount}.`,
      type: 'info',
    });
  };

  const toggleFavorite = (itemId: string) => {
    setCurrentUserState((prev) => {
      const isFav = prev.favoriteItemIds.includes(itemId);
      const nextFavs = isFav
        ? prev.favoriteItemIds.filter((id) => id !== itemId)
        : [...prev.favoriteItemIds, itemId];
      return { ...prev, favoriteItemIds: nextFavs };
    });
  };

  const updateMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.id === item.id ? item : m)));
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const updateInventoryStock = (itemId: string, newStock: number) => {
    setInventory((prev) =>
      prev.map((inv) => (inv.id === itemId ? { ...inv, currentStock: newStock } : inv))
    );
  };

  const restockItem = (itemId: string, addAmount: number) => {
    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.id === itemId) {
          const updated = Math.min(inv.maxStock, inv.currentStock + addAmount);
          return { ...inv, currentStock: updated };
        }
        return inv;
      })
    );
    addNotification({
      title: 'Inventory Restocked 📦',
      message: `Added +${addAmount} units to stock.`,
      type: 'info',
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Active student orders (orders in active status for current student)
  const activeOrders = useMemo(() => {
    if (!orders || !currentUser) return [];
    return orders.filter(
      (o) =>
        o.userId === currentUser.id &&
        ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
    );
  }, [orders, currentUser]);

  // Active student order (most recent active order for current student)
  const activeOrder = useMemo(() => {
    return activeOrders[0] || null;
  }, [activeOrders]);

  // Real-time Queue Status metrics
  const queueStatus = useMemo(() => {
    const canteenOrders = orders.filter((o) => o.canteenId === selectedCanteen.id);
    const pending = canteenOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'ACCEPTED').length;
    const preparing = canteenOrders.filter((o) => o.status === 'PREPARING').length;
    const ready = canteenOrders.filter((o) => o.status === 'READY').length;
    const estimatedWaitMinutes = selectedCanteen.waitTimeMinutes + Math.round((pending + preparing) * 1.5);

    return {
      pendingCount: pending,
      preparingCount: preparing,
      readyCount: ready,
      estimatedWaitMinutes,
      currentServingToken: selectedCanteen.currentServingToken,
    };
  }, [orders, selectedCanteen]);

  // Demo auto-simulation: Automatically advance orders for interactive demonstration
  useEffect(() => {
    if (!autoSimulateKitchen) return;

    const interval = setInterval(() => {
      // Find orders that need progression
      setOrders((currentOrders) => {
        let changed = false;
        const updated = currentOrders.map((ord) => {
          if (ord.status === 'CONFIRMED') {
            changed = true;
            return { ...ord, status: 'ACCEPTED' as OrderStatus, updatedAt: new Date().toISOString() };
          }
          return ord;
        });

        if (changed) return updated;
        return currentOrders;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [autoSimulateKitchen]);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole,
        currentUser,
        setCurrentUser,
        availableUsers,
        loginUser,
        logoutUser,
        selectedCanteen,
        canteens,
        selectCanteen,
        updateCanteen,
        menuItems,
        updateMenuItem,
        addMenuItem,
        inventory,
        updateInventoryStock,
        restockItem,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        pickupSlots,
        orders,
        activeOrders,
        activeOrder,
        placeOrder,
        cancelOrder,
        updateOrderStatus,
        callToken,
        verifyAndCollectOrder,
        submitOrderFeedback,
        oneClickReorder,
        topUpWallet,
        toggleFavorite,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        autoSimulateKitchen,
        setAutoSimulateKitchen,
        queueStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
