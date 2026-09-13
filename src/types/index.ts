export type UserRole = 'student' | 'faculty' | 'kitchen' | 'counter' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  studentId: string;
  department: string;
  year: string;
  phone: string;
  email: string;
  walletBalance: number;
  role: UserRole;
  favoriteItemIds: string[];
}

export interface Canteen {
  id: string;
  name: string;
  location: string;
  code: string; // 'M', 'H', 'L', 'F'
  status: 'open' | 'busy' | 'closed';
  waitTimeMinutes: number;
  counters: string[];
  currentServingToken: string;
  openingHours: string;
  capacityPerSlot: number;
}

export type FoodCategory = 'all' | 'breakfast' | 'meals' | 'snacks' | 'drinks' | 'combos';

export interface CustomizationOption {
  name: string;
  choices: { label: string; extraPrice: number }[];
}

export interface MenuItem {
  id: string;
  canteenId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: FoodCategory;
  isVeg: boolean;
  rating: number;
  ratingCount: number;
  prepTimeMinutes: number;
  inStock: boolean;
  stockQuantity: number;
  maxStock: number;
  image: string;
  isPopular?: boolean;
  isOffer?: boolean;
  offerTag?: string;
  calories?: number;
  customizations?: CustomizationOption[];
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedCustomizations: Record<string, string>;
  unitPrice: number;
  totalPrice: number;
}

export interface PickupSlot {
  id: string;
  timeRange: string;
  status: 'available' | 'busy' | 'full';
  bookedCount: number;
  maxCapacity: number;
}

export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COLLECTED'
  | 'CANCELLED';

export interface OrderItemRecord {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  customizationText?: string;
}

export interface OrderFeedback {
  rating: number;
  foodQuality: number;
  prepSpeed: number;
  service: number;
  comment?: string;
  issueReported?: string;
  submittedAt: string;
}

export interface Order {
  id: string; // e.g. "CE10482"
  tokenNumber: string; // e.g. "A135" or "M-0903-135"
  userId: string;
  userName: string;
  userRole: 'student' | 'faculty';
  canteenId: string;
  canteenName: string;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  taxes: number;
  total: number;
  paymentMethod: 'upi' | 'wallet' | 'card' | 'cash';
  paymentTransactionId: string;
  paymentStatus: 'PAID' | 'PENDING';
  status: OrderStatus;
  pickupSlot: string;
  pickupCounter: string;
  estimatedReadyTime: string;
  estimatedPrepMinutes: number;
  createdAt: string;
  updatedAt: string;
  feedback?: OrderFeedback;
}

export interface InventoryItem {
  id: string;
  canteenId: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  lowStockThreshold: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  tokenNumber?: string;
  type: 'order_confirmed' | 'preparing' | 'ready' | 'collected' | 'reminder' | 'cancelled' | 'info';
  timestamp: string;
  read: boolean;
}
