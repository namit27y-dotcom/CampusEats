import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { getFoodImage, DEFAULT_FOOD_IMAGES } from '../utils/foodImages';
import { io } from 'socket.io-client';

interface AppContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  loginUser: (email: string, password: string) => Promise<UserProfile>;
  registerUser: (name: string, email: string, password: string, role?: string) => Promise<UserProfile>;
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
  USER: 'campuseats_user_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Roles & Users
  const [currentRole, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('campuseats_user_v1');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role) return u.role;
      } catch (e) {}
    }
    return 'student';
  });
  const [availableUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('campuseats_user_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
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
      title: 'Welcome to CampusEats! ðŸš€',
      message: 'Skip canteen queues! Pre-order now and collect with your live digital token.',
      type: 'info',
      timestamp: 'Just now',
      read: false,
    },
  ]);

  // Demo auto-simulation switch
  const [autoSimulateKitchen, setAutoSimulateKitchenState] = useState<boolean>(false);

  // Load real canteen and menu data from backend
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const canteenData = await apiRequest("/canteens");

        if (canteenData.canteens?.length > 0) {
          setCanteens((prev) =>
            canteenData.canteens.map((backendCanteen: any, index: number) => {
              const existing = prev[index] || prev[0];

              return {
                ...existing,
                id: String(backendCanteen.id),
                name: backendCanteen.name,
                location: backendCanteen.location || existing?.location || "",
                isActive: Boolean(backendCanteen.is_active),
              };
            })
          );

          setSelectedCanteenId(String(canteenData.canteens[0].id));
        }

        const firstCanteenId = canteenData.canteens?.[0]?.id;

        if (firstCanteenId) {
          const menuData = await apiRequest(`/menu/${firstCanteenId}`);

          if (menuData.items?.length > 0) {
            setMenuItems((prev) =>
              menuData.items.map((backendItem: any) => {
                const cleanBackendName = String(backendItem.name || '').trim().toLowerCase();
                const existing = prev.find((item) => {
                  const cleanItemName = item.name.trim().toLowerCase();
                  return (
                    cleanItemName === cleanBackendName ||
                    cleanItemName.includes(cleanBackendName) ||
                    cleanBackendName.includes(cleanItemName)
                  );
                });

                const categoryMap: Record<string, MenuItem["category"]> = {
                  breakfast: "breakfast",
                  meals: "meals",
                  "meals & bowls": "meals",
                  snacks: "snacks",
                  beverages: "drinks",
                  drinks: "drinks",
                  combos: "combos",
                };

                const backendCategory = String(
                  backendItem.category || "snacks"
                ).toLowerCase();

                const resolvedCategory =
                  categoryMap[backendCategory] ||
                  existing?.category ||
                  "snacks";

                const resolvedImage = getFoodImage(
                  backendItem.name,
                  resolvedCategory,
                  backendItem.image_url || existing?.image
                );

                return {
                  ...existing,
                  id: String(backendItem.id),
                  canteenId: String(backendItem.canteen_id),
                  name: backendItem.name,
                  description:
                    backendItem.description ||
                    existing?.description ||
                    "",
                  price: Number(backendItem.price),
                  category: resolvedCategory,
                  isVeg: existing?.isVeg ?? true,
                  rating: existing?.rating ?? 4.5,
                  ratingCount: existing?.ratingCount ?? 0,
                  prepTimeMinutes:
                    existing?.prepTimeMinutes ?? 10,
                  inStock: Boolean(backendItem.is_available),
                  stockQuantity: existing?.stockQuantity ?? 100,
                  maxStock: existing?.maxStock ?? 100,
                  image: resolvedImage,
                  isPopular: existing?.isPopular ?? false,
                  isOffer: existing?.isOffer ?? false,
                  offerTag: existing?.offerTag,
                  calories: existing?.calories,
                  customizations: existing?.customizations,
                };
              })
            );
          }
        }
      } catch (error) {
        console.warn("Backend canteen/menu API unreachable, using local data fallback:", error);
      }
    };

    loadBackendData();
  }, []);
  // Fetch /auth/me on mount if token exists to ensure currentUser and role match MySQL
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const syncUserProfile = async () => {
      try {
        const data = await apiRequest("/auth/me");
        if (data.success && data.user) {
          const u = data.user;
          const userProfile: UserProfile = {
            id: String(u.id),
            name: u.name,
            studentId: `STU-${u.id}`,
            department: "Campus",
            year: "Member",
            phone: "",
            email: u.email,
            walletBalance: Number(u.wallet_balance ?? 0),
            role: u.role,
            favoriteItemIds: [],
          };
          setCurrentUserState(userProfile);
          setRoleState(u.role);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
        }
      } catch (err) {
        console.warn("Failed to sync /auth/me:", err);
      }
    };

    syncUserProfile();
  }, []);

  // Load authenticated user's real orders from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !currentUser?.id) return;

    // Student orders should not overwrite Kitchen/Admin/Counter orders
    const isRestrictedRole =
      ["kitchen", "counter", "admin"].includes(String(currentUser.role).toLowerCase()) ||
      ["kitchen", "counter", "admin"].includes(String(currentRole).toLowerCase());

    if (isRestrictedRole) {
      return;
    }

    const loadMyOrders = async () => {
      try {
        const data = await apiRequest("/orders/my-orders");

        if (!data.success || !Array.isArray(data.orders)) {
          return;
        }

        const statusMap: Record<string, OrderStatus> = {
          placed: "CONFIRMED",
          accepted: "ACCEPTED",
          preparing: "PREPARING",
          ready: "READY",
          completed: "COLLECTED",
          cancelled: "CANCELLED",
        };

        setOrders((prev) => {
          const previousOrders = new Map<string, Order>(
            prev.map((order) => [String(order.id), order])
          );

          const backendOrders: Order[] = data.orders.map((backendOrder: any) => {
            const existing = previousOrders.get(String(backendOrder.id));

            return {
              id: String(backendOrder.id),
              tokenNumber: String(backendOrder.token_number),
              userId: String(currentUser.id),
              userName: currentUser.name,
              userRole: currentUser.role as any,

              canteenId: String(backendOrder.canteen_id),
              canteenName: backendOrder.canteen_name,

              items: existing?.items || [],

              subtotal: Number(backendOrder.total_amount),
              discount: 0,
              taxes: 0,
              total: Number(backendOrder.total_amount),

              paymentMethod: backendOrder.payment_method,
              paymentTransactionId:
                backendOrder.payment_transaction_id || undefined,
              paymentStatus:
                String(
                  backendOrder.payment_status || "pending"
                ).toUpperCase() as any,

              status:
                statusMap[String(backendOrder.status).toLowerCase()] ||
                "CONFIRMED",

              pickupSlot: existing?.pickupSlot || "",
              pickupCounter:
                existing?.pickupCounter || "Pickup Counter 1",
              estimatedReadyTime:
                existing?.estimatedReadyTime || "",
              estimatedPrepMinutes:
                existing?.estimatedPrepMinutes || 10,

              createdAt:
                backendOrder.created_at || existing?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),

              feedback: existing?.feedback,
            };
          });

          return backendOrders;
        });

        console.log(
          `Loaded ${data.orders.length} real orders from backend`
        );
      } catch (error) {
        console.error("Failed to load real orders:", error);
      }
    };

    loadMyOrders();
  }, [currentUser?.id, currentUser?.role, currentRole]);

  // Load real kitchen orders from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !currentUser?.id) return;

    const isKitchenOrAdmin =
      ["kitchen", "admin"].includes(String(currentUser.role).toLowerCase()) ||
      ["kitchen", "admin"].includes(String(currentRole).toLowerCase());
    const isCounter =
      String(currentUser.role).toLowerCase() === "counter" ||
      String(currentRole).toLowerCase() === "counter";

    if (!isKitchenOrAdmin && !isCounter) {
      return;
    }

    const loadStaffOrders = async () => {
      try {
        const endpoint = isCounter ? "/counter/orders" : "/kitchen/orders";
        const data = await apiRequest(endpoint);

        if (!data.success || !Array.isArray(data.orders)) {
          console.error("Invalid kitchen orders response:", data);
          return;
        }

        const statusMap: Record<string, OrderStatus> = {
          placed: "CONFIRMED",
          accepted: "ACCEPTED",
          preparing: "PREPARING",
          ready: "READY",
          completed: "COLLECTED",
          cancelled: "CANCELLED",
        };

        setOrders((prev) => {
          const previousOrders = new Map<string, Order>(
            prev.map((order) => [String(order.id), order])
          );

          return data.orders.map((backendOrder: any) => {
            const existing = previousOrders.get(String(backendOrder.id));

            return {
              id: String(backendOrder.id),
              tokenNumber: String(backendOrder.token_number),
              userId: String(backendOrder.user_id),
              userName: backendOrder.student_name || "Student",
              userRole: "student",

              canteenId: String(backendOrder.canteen_id),
              canteenName: backendOrder.canteen_name,

              items: (backendOrder.items && backendOrder.items.length > 0)
                ? backendOrder.items.map((it: any) => ({
                    id: String(it.menu_item_id || it.id),
                    name: it.name,
                    price: Number(it.price),
                    quantity: Number(it.quantity),
                    isVeg: Boolean(it.is_veg ?? true),
                    customizationText: it.customization || undefined,
                  }))
                : (existing?.items || []),

              subtotal: Number(backendOrder.total_amount),
              discount: 0,
              taxes: 0,
              total: Number(backendOrder.total_amount),

              paymentMethod: backendOrder.payment_method || existing?.paymentMethod || "wallet",
              paymentTransactionId:
                backendOrder.payment_transaction_id || existing?.paymentTransactionId,

              paymentStatus:
                String(backendOrder.payment_status || existing?.paymentStatus || "PAID").toUpperCase() as any,

              status:
                statusMap[String(backendOrder.status).toLowerCase()] ||
                "CONFIRMED",

              pickupSlot: existing?.pickupSlot || "Immediate",
              pickupCounter:
                existing?.pickupCounter || "Pickup Counter 1",

              estimatedReadyTime:
                existing?.estimatedReadyTime || "",

              estimatedPrepMinutes:
                existing?.estimatedPrepMinutes || 10,

              createdAt:
                backendOrder.created_at ||
                existing?.createdAt ||
                new Date().toISOString(),

              updatedAt: new Date().toISOString(),

              feedback: existing?.feedback,
            };
          });
        });

        console.log(
          `Loaded ${data.orders.length} real kitchen orders from backend`
        );
      } catch (error) {
        console.error("Failed to load kitchen orders:", error);
      }
    };

    loadStaffOrders();
  }, [currentUser?.id, currentUser?.role, currentRole]);

  const socketRef = useRef<any>(null);

  // Real-time order status synchronization
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !currentUser?.id) return;

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("CampusEats Socket.IO connected");

      orders
        .filter((order) =>
          ["CONFIRMED", "ACCEPTED", "PREPARING", "READY"].includes(order.status)
        )
        .forEach((order) => {
          socket.emit("joinOrder", order.id);
        });
    });

    socket.on("newOrderCreated", (data: any) => {
      console.log("New order created broadcast:", data);
      if (!data || !data.id) return;

      socket.emit("joinOrder", data.id);

      setOrders((prev) => {
        if (prev.some((o) => Number(o.id) === Number(data.id))) {
          return prev;
        }

        const isStaff =
          ["kitchen", "counter", "admin"].includes(String(currentUser.role).toLowerCase()) ||
          ["kitchen", "counter", "admin"].includes(String(currentRole).toLowerCase());
        const isMyOrder = String(data.user_id || data.userId) === String(currentUser.id);

        if (!isStaff && !isMyOrder) {
          return prev;
        }

        const newOrd: Order = {
          id: String(data.id),
          tokenNumber: String(data.token_number || data.tokenNumber),
          userId: String(data.user_id || data.userId),
          userName: data.student_name || data.userName || "Student",
          userRole: "student",
          canteenId: String(data.canteen_id || data.canteenId),
          canteenName: data.canteen_name || data.canteenName || selectedCanteen.name,
          items: Array.isArray(data.items)
            ? data.items.map((it: any) => ({
                id: String(it.menu_item_id || it.menuItemId || it.id),
                name: it.name || "Item",
                price: Number(it.price || 0),
                quantity: Number(it.quantity || 1),
                isVeg: true,
                customizationText: it.customization || undefined,
              }))
            : [],
          subtotal: Number(data.total_amount || data.totalAmount || 0),
          discount: 0,
          taxes: 0,
          total: Number(data.total_amount || data.totalAmount || 0),
          paymentMethod: data.payment_method || data.paymentMethod || "wallet",
          paymentTransactionId: data.payment_transaction_id || data.paymentTransactionId || undefined,
          paymentStatus: String(data.payment_status || data.paymentStatus || "PAID").toUpperCase() as any,
          status: "CONFIRMED",
          pickupSlot: "Immediate",
          pickupCounter: "Pickup Counter 1",
          estimatedReadyTime: "",
          estimatedPrepMinutes: 10,
          createdAt: data.created_at || data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return [newOrd, ...prev];
      });
    });

    socket.on(
      "orderStatusUpdated",
      (data: { orderId: number; status: string }) => {
        console.log("Live order status:", data);

        const statusMap: Record<string, OrderStatus> = {
          placed: "CONFIRMED",
          accepted: "ACCEPTED",
          preparing: "PREPARING",
          ready: "READY",
          completed: "COLLECTED",
          cancelled: "CANCELLED",
        };

        const newStatus =
          statusMap[String(data.status).toLowerCase()];

        if (!newStatus) return;

        if (newStatus === "READY") {
          playOrderReadyChime();
        }

        setOrders((prev) =>
          prev.map((order) =>
            Number(order.id) === Number(data.orderId)
              ? {
                  ...order,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : order
          )
        );
      }
    );

    socket.on("disconnect", () => {
      console.log("CampusEats Socket.IO disconnected");
      socketRef.current = null;
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.id, currentUser?.role, currentRole]);

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
  };

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  };

  const loginUser = async (email: string, password: string): Promise<UserProfile> => {
    try {
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
        id: String(backendUser.id),
        name: backendUser.name,
        studentId: `STU-${backendUser.id}`,
        department: "Campus",
        year: "Member",
        phone: "",
        email: backendUser.email,
        walletBalance: Number(backendUser.wallet_balance ?? 0),
        role: backendUser.role,
        favoriteItemIds: backendUser.favoriteItemIds ?? [],
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      setCurrentUserState(user);
      setRoleState(user.role);

      return user;
    } catch (apiErr: any) {
      const isConnectionError =
        apiErr.message?.includes("Unable to reach backend server") ||
        apiErr.message?.includes("Network request failed") ||
        apiErr.message?.includes("Failed to fetch") ||
        apiErr.message?.includes("status 405") ||
        apiErr.message?.includes("status 404") ||
        apiErr.message?.includes("NetworkError");

      if (isConnectionError) {
        // Find in initial demo users or match by email
        const matched = INITIAL_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        let mockRole: UserRole = 'student';
        let mockName = email.split('@')[0];

        if (email.toLowerCase().includes('kitchen')) {
          mockRole = 'kitchen';
          mockName = 'Kitchen KDS Team';
        } else if (email.toLowerCase().includes('counter')) {
          mockRole = 'counter';
          mockName = 'Pickup Counter';
        } else if (email.toLowerCase().includes('admin')) {
          mockRole = 'admin';
          mockName = 'Administrator';
        } else if (email.toLowerCase().includes('faculty')) {
          mockRole = 'faculty';
          mockName = 'Faculty Member';
        }

        const fallbackUser: UserProfile = matched || {
          id: `usr-${Date.now()}`,
          name: mockName.charAt(0).toUpperCase() + mockName.slice(1),
          studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
          department: "Campus",
          year: "Active",
          phone: "+91 98765 43210",
          email,
          walletBalance: 450,
          role: mockRole,
          favoriteItemIds: ['item-dosa', 'item-coldcoffee'],
        };

        localStorage.setItem("token", `demo-token-${Date.now()}`);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackUser));
        setCurrentUserState(fallbackUser);
        setRoleState(fallbackUser.role);

        return fallbackUser;
      }

      throw apiErr;
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    password: string,
    role: string = "student"
  ): Promise<UserProfile> => {
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      return await loginUser(email, password);
    } catch (apiErr: any) {
      const isConnectionError =
        apiErr.message?.includes("Unable to reach backend server") ||
        apiErr.message?.includes("Network request failed") ||
        apiErr.message?.includes("Failed to fetch") ||
        apiErr.message?.includes("status 405") ||
        apiErr.message?.includes("status 404") ||
        apiErr.message?.includes("NetworkError");

      if (isConnectionError) {
        const fallbackUser: UserProfile = {
          id: `usr-${Date.now()}`,
          name,
          studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
          department: "Campus",
          year: "Member",
          phone: "+91 98765 00000",
          email,
          walletBalance: 300,
          role: (role as UserRole) || "student",
          favoriteItemIds: [],
        };

        localStorage.setItem("token", `demo-token-${Date.now()}`);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackUser));
        setCurrentUserState(fallbackUser);
        setRoleState(fallbackUser.role);

        return fallbackUser;
      }

      throw apiErr;
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(STORAGE_KEYS.USER);
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
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }


    const canteenId = Number(selectedCanteen.id);

    const items = cart.map((item) => {
      const extraAmount = Math.max(
        0,
        Number(item.unitPrice) - Number(item.menuItem.price)
      );

      const customization =
        Object.entries(item.selectedCustomizations)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' • ') || null;

      return {
        menuItemId: Number(item.menuItem.id),
        quantity: item.quantity,
        extraAmount,
        customization,
      };
    });

    try {
      const data = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          canteenId,
          items,
          paymentMethod,
        }),
      });

      if (!data.success || !data.order) {
        throw new Error(data.message || 'Failed to place order');
      }

      const backendOrder = data.order;

      const subtotal = cartTotal;
      const discount = subtotal >= 100 ? 15 : 0;
      const taxes = 0;
      const total = Number(backendOrder.totalAmount);

      const maxItemPrep = Math.max(
        ...cart.map((c) => c.menuItem.prepTimeMinutes || 5)
      );

      const activeQueueOrders = orders.filter(
        (o) =>
          o.canteenId === selectedCanteen.id &&
          ['CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status)
      ).length;

      const estimatedPrepMinutes =
        maxItemPrep + Math.round(activeQueueOrders * 1.5);

      const readyDate = new Date(
        Date.now() + estimatedPrepMinutes * 60 * 1000
      );

      const estimatedReadyTime = readyDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const pickupCounter =
        selectedCanteen.counters[
          Math.floor(
            Math.random() * Math.min(2, selectedCanteen.counters.length)
          )
        ] || 'Pickup Counter 1';

      const statusMap: Record<string, OrderStatus> = {
        placed: 'CONFIRMED',
        accepted: 'ACCEPTED',
        preparing: 'PREPARING',
        ready: 'READY',
        completed: 'COLLECTED',
        cancelled: 'CANCELLED',
      };

      const frontendStatus =
        statusMap[backendOrder.status] || 'CONFIRMED';

      const newOrder: Order = {
        id: String(backendOrder.id),
        tokenNumber: backendOrder.tokenNumber,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        canteenId: selectedCanteen.id,
        canteenName: selectedCanteen.name,

        items: cart.map((item) => ({
          id: item.menuItem.id,
          name: item.menuItem.name,
          price: item.unitPrice,
          quantity: item.quantity,
          isVeg: item.menuItem.isVeg,
          customizationText:
            Object.entries(item.selectedCustomizations)
              .map(([_, value]) => value)
              .join(', ') || undefined,
        })),

        subtotal,
        discount,
        taxes,
        total,

        paymentMethod,
        paymentTransactionId:
          backendOrder.paymentTransactionId || undefined,
        paymentStatus:
          String(backendOrder.paymentStatus || 'pending').toUpperCase() as any,

        status: frontendStatus,

        pickupSlot,
        pickupCounter,
        estimatedReadyTime,
        estimatedPrepMinutes,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (data.walletBalance !== null && data.walletBalance !== undefined) {
        setCurrentUserState((prev) => ({
          ...prev,
          walletBalance: Number(data.walletBalance),
        }));
      }

      setOrders((prev) => [newOrder, ...prev]);

      // Join socket room for live status updates
      socketRef.current?.emit("joinOrder", backendOrder.id);

      setMenuItems((prev) =>
        prev.map((menuItem) => {
          const cartItem = cart.find(
            (item) => item.menuItem.id === menuItem.id
          );

          if (!cartItem) return menuItem;

          const newStock = Math.max(
            0,
            menuItem.stockQuantity - cartItem.quantity
          );

          return {
            ...menuItem,
            stockQuantity: newStock,
            inStock: newStock > 0,
          };
        })
      );

      clearCart();

      playOrderPlacedSound();

      addNotification({
        title: `Order Placed: Token ${backendOrder.tokenNumber} ðŸŽ‰`,
        message: `Your order #${backendOrder.id} is confirmed at ${selectedCanteen.name}. Estimated Ready: ${estimatedReadyTime}`,
        tokenNumber: backendOrder.tokenNumber,
        type: 'order_confirmed',
      });

    } catch (error: any) {
      console.warn('Backend order API unreachable, placing order locally in demo mode:', error);

      const subtotal = cartTotal;
      const discount = subtotal >= 100 ? 15 : 0;
      const taxes = 0;
      const total = subtotal - discount + taxes;

      if (paymentMethod === 'wallet' && currentUser.walletBalance < total) {
        throw new Error('Insufficient wallet balance. Please top up your wallet or choose UPI/Cash.');
      }

      const tokenPrefix = selectedCanteen.code || 'A';
      const tokenNumber = `${tokenPrefix}${Math.floor(100 + Math.random() * 900)}`;
      const orderId = `CE${Date.now().toString().slice(-6)}`;

      const maxItemPrep = Math.max(...cart.map((c) => c.menuItem.prepTimeMinutes || 5));
      const activeQueueOrders = orders.filter(
        (o) => o.canteenId === selectedCanteen.id && ['CONFIRMED', 'ACCEPTED', 'PREPARING'].includes(o.status)
      ).length;
      const estimatedPrepMinutes = maxItemPrep + Math.round(activeQueueOrders * 1.5);
      const readyDate = new Date(Date.now() + estimatedPrepMinutes * 60 * 1000);
      const estimatedReadyTime = readyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const pickupCounter = selectedCanteen.counters[0] || 'Pickup Counter 1';

      const localOrder: Order = {
        id: orderId,
        tokenNumber,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        canteenId: selectedCanteen.id,
        canteenName: selectedCanteen.name,
        items: cart.map((item) => ({
          id: item.menuItem.id,
          name: item.menuItem.name,
          price: item.unitPrice,
          quantity: item.quantity,
          isVeg: item.menuItem.isVeg,
          customizationText:
            Object.entries(item.selectedCustomizations)
              .map(([_, val]) => val)
              .join(', ') || undefined,
        })),
        subtotal,
        discount,
        taxes,
        total,
        paymentMethod,
        paymentTransactionId: `TXN-LOCAL-${Date.now().toString().slice(-6)}`,
        paymentStatus: paymentMethod === 'cash' ? 'PENDING' : 'COMPLETED',
        status: 'CONFIRMED',
        pickupSlot,
        pickupCounter,
        estimatedReadyTime,
        estimatedPrepMinutes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (paymentMethod === 'wallet') {
        setCurrentUserState((prev) => ({
          ...prev,
          walletBalance: Math.max(0, prev.walletBalance - total),
        }));
      }

      setOrders((prev) => [localOrder, ...prev]);

      setMenuItems((prev) =>
        prev.map((menuItem) => {
          const cartItem = cart.find((item) => item.menuItem.id === menuItem.id);
          if (!cartItem) return menuItem;
          const newStock = Math.max(0, menuItem.stockQuantity - cartItem.quantity);
          return {
            ...menuItem,
            stockQuantity: newStock,
            inStock: newStock > 0,
          };
        })
      );

      clearCart();
      playOrderPlacedSound();

      addNotification({
        title: `Order Placed: Token ${tokenNumber} 🎉`,
        message: `Your order #${orderId} is confirmed at ${selectedCanteen.name}. Estimated Ready: ${estimatedReadyTime}`,
        tokenNumber,
        type: 'order_confirmed',
      });

      return localOrder;
    }
  };

  const cancelOrder = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    // Call backend cancellation endpoint
    apiRequest(`/orders/${orderId}/cancel`, { method: "PATCH" })
      .then((data) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: "CANCELLED", updatedAt: new Date().toISOString() }
              : o
          )
        );

        if (data.walletBalance !== null && data.walletBalance !== undefined) {
          setCurrentUserState((prev) => ({
            ...prev,
            walletBalance: Number(data.walletBalance),
          }));
        }

        addNotification({
          title: `Order #${order.id} Cancelled`,
          message: data.refundProcessed
            ? `Your order #${order.id} (Token ${order.tokenNumber}) has been cancelled. Payment of ₹${order.total} is refunded to wallet.`
            : `Your order #${order.id} (Token ${order.tokenNumber}) has been cancelled.`,
          tokenNumber: order.tokenNumber,
          type: 'cancelled',
        });
      })
      .catch((err) => {
        console.error("Cancel order error:", err);
        alert(err.message || "Unable to cancel order");
      });

    return true;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const backendStatusMap: Record<string, string> = {
      CONFIRMED: "placed",
      ACCEPTED: "accepted",
      PREPARING: "preparing",
      READY: "ready",
      COLLECTED: "completed",
      CANCELLED: "cancelled",
    };

    const backendStatus = backendStatusMap[newStatus];

    if (!backendStatus) {
      console.error("Invalid order status:", newStatus);
      return;
    }

    try {
      const data = await apiRequest(`/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: backendStatus,
        }),
      });

      if (!data.success) {
        alert(data.message || "Failed to update order status");
        return;
      }

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

      if (newStatus === "PREPARING") {
        addNotification({
          title: `Kitchen Preparing: Token ${order.tokenNumber} 👨‍🍳`,
          message: `Your food is now being prepared at ${order.canteenName}.`,
          tokenNumber: order.tokenNumber,
        });
      } else if (newStatus === "READY") {
        addNotification({
          title: `Order Ready: Token ${order.tokenNumber} 🔔`,
          message: `Your order is ready for pickup at ${order.canteenName}.`,
          tokenNumber: order.tokenNumber,
        });
      } else if (newStatus === "COLLECTED") {
        addNotification({
          title: `Order Collected: Token ${order.tokenNumber} ✅`,
          message: `Order ${order.tokenNumber} has been collected.`,
          tokenNumber: order.tokenNumber,
        });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Unable to update order status. Please try again.");
    }
  };

  // Call token from pickup counter with voice announcement!
  const callToken = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    announceTokenVoice(order.tokenNumber, order.pickupCounter);

    addNotification({
      title: `ðŸ”Š Calling Token ${order.tokenNumber}`,
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
    apiRequest('/ratings', {
      method: 'POST',
      body: JSON.stringify({
        orderId: Number(orderId),
        rating: feedback.rating,
        review: feedback.comment || (feedback.issueReported ? `[Tag: ${feedback.issueReported}]` : null),
      }),
    }).catch((err) => {
      console.warn("Rating API warning:", err);
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, feedback } : o))
    );
    addNotification({
      title: 'Thank you for your rating! â­',
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
        title: 'Items Added to Cart! ðŸ›’',
        message: `Reordered ${addedCount} items from Order #${pastOrder.id}. Review and choose pickup slot.`,
        type: 'info',
      });
    } else {
      alert('Items from this order are currently unavailable or out of stock.');
    }
  };

  const topUpWallet = (amount: number) => {
    apiRequest('/wallet/add-money', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
      .then((data) => {
        if (data.walletBalance !== undefined) {
          setCurrentUserState((prev) => ({
            ...prev,
            walletBalance: Number(data.walletBalance),
          }));
        }
        addNotification({
          title: `Wallet Credited: +₹${amount}`,
          message: `Your Campus Wallet balance is now ₹${data.walletBalance}.`,
          type: 'info',
        });
      })
      .catch((err) => {
        console.error("Top-up wallet error:", err);
        alert(err.message || "Failed to add money to wallet");
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
      title: 'Inventory Restocked ðŸ“¦',
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
        loginUser,
        registerUser,
        logoutUser,
        availableUsers,
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







