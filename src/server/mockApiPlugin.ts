import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

interface StoredOrder {
  id: number;
  user_id: number;
  student_name: string;
  canteen_id: number;
  canteen_name: string;
  total_amount: number;
  token_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_transaction_id: string;
  created_at: string;
  items: Array<{
    id: number;
    menu_item_id: number;
    name: string;
    quantity: number;
    price: number;
    customization?: string | null;
    extra_amount?: number;
  }>;
}

const CANTEENS = [
  { id: 1, name: 'Main Campus Canteen', location: 'Near Academic Block A, Ground Floor', code: 'M', is_active: 1 },
  { id: 2, name: 'Hostel Block Canteen', location: 'Boys & Girls Hostel Plaza, Wing B', code: 'H', is_active: 1 },
  { id: 3, name: 'Library Cyber Café', location: 'Central Library 1st Floor Atrium', code: 'L', is_active: 1 },
  { id: 4, name: 'Food Court Arena', location: 'Near Student Activity Center', code: 'F', is_active: 1 },
];

const MENU_ITEMS = [
  { id: 1, canteen_id: 1, name: 'Special Masala Dosa', description: 'Crispy fermented crepe filled with spiced potato masala, served with coconut chutney and piping hot sambar.', price: 65, category: 'breakfast', is_available: true, is_veg: true, prep_time: 8, image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80' },
  { id: 2, canteen_id: 1, name: 'Cold Coffee (Signature)', description: 'Chilled rich espresso blended with creamy milk, vanilla swirl, and topped with chocolate powder.', price: 50, category: 'drinks', is_available: true, is_veg: true, prep_time: 3, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80' },
  { id: 3, canteen_id: 1, name: 'Veg Grilled Cheese Sandwich', description: 'Multigrain bread stuffed with crunchy garden vegetables, mint spread, and melted mozzarella cheese.', price: 55, category: 'snacks', is_available: true, is_veg: true, prep_time: 6, image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },
  { id: 4, canteen_id: 1, name: 'Steamed Idli Sambar (3 Pcs)', description: 'Pillowy soft steamed rice cakes served with aromatic lentil sambar and fresh tomato chutney.', price: 45, category: 'breakfast', is_available: true, is_veg: true, prep_time: 4, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' },
  { id: 5, canteen_id: 1, name: 'Paneer Tikka Kathi Roll', description: 'Flaky paratha loaded with smoky spiced cottage cheese chunks, sliced onions, and tangy mint mayo.', price: 85, category: 'snacks', is_available: true, is_veg: true, prep_time: 9, image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80' },
  { id: 6, canteen_id: 1, name: 'North Indian Thali Meal', description: 'Wholesome platter with 3 butter rotis, paneer sabzi, dal tadka, jeera rice, salad, and gulab jamun.', price: 110, category: 'meals', is_available: true, is_veg: true, prep_time: 10, image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
  { id: 7, canteen_id: 1, name: 'South Indian Filter Coffee', description: 'Freshly brewed chicory blend with frothy whole milk served steaming hot in traditional dabara set.', price: 25, category: 'drinks', is_available: true, is_veg: true, prep_time: 3, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { id: 8, canteen_id: 1, name: 'Mumbai Vada Pav (2 Pcs)', description: 'Golden batter fried spiced potato dumplings in soft pav buns with fiery garlic peanut chutney.', price: 40, category: 'snacks', is_available: true, is_veg: true, prep_time: 4, image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80' },
  { id: 9, canteen_id: 1, name: 'Hakka Noodles & Manchurian Combo', description: 'Wok tossed vegetable Hakka noodles paired with crunchy vegetable Manchurian balls in rich gravy.', price: 120, category: 'combos', is_available: true, is_veg: true, prep_time: 12, image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80' },
];

let nextOrderId = 101;
const ordersDb: StoredOrder[] = [
  {
    id: 1001,
    user_id: 1,
    student_name: 'Namit',
    canteen_id: 1,
    canteen_name: 'Main Campus Canteen',
    total_amount: 115,
    token_number: 'M-135',
    status: 'placed',
    payment_method: 'wallet',
    payment_status: 'paid',
    payment_transaction_id: 'CW-WALLET-1001',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    items: [
      { id: 1, menu_item_id: 1, name: 'Special Masala Dosa', quantity: 1, price: 65 },
      { id: 2, menu_item_id: 2, name: 'Cold Coffee (Signature)', quantity: 1, price: 50 },
    ],
  },
  {
    id: 1002,
    user_id: 1,
    student_name: 'Namit',
    canteen_id: 1,
    canteen_name: 'Main Campus Canteen',
    total_amount: 120,
    token_number: 'M-138',
    status: 'preparing',
    payment_method: 'upi',
    payment_status: 'paid',
    payment_transaction_id: 'DEMO-UPI-1002',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    items: [
      { id: 3, menu_item_id: 9, name: 'Hakka Noodles & Manchurian Combo', quantity: 1, price: 120 },
    ],
  },
];

let userWalletBalance = 450;

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        const method = (req.method || 'GET').toUpperCase();

        if (!url.startsWith('/api')) {
          return next();
        }

        if (method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          return res.end();
        }

        const cleanPath = url.split('?')[0];

        // 1. Health check
        if (cleanPath === '/api/health') {
          return sendJson(res, 200, {
            success: true,
            status: 'OK',
            database: 'Connected',
            message: 'CampusEats Backend API is running',
          });
        }

        // 2. Canteens
        if (cleanPath === '/api/canteens' && method === 'GET') {
          return sendJson(res, 200, {
            success: true,
            canteens: CANTEENS,
          });
        }

        // 3. Menu items for canteen
        if (cleanPath.startsWith('/api/menu') && method === 'GET') {
          return sendJson(res, 200, {
            success: true,
            items: MENU_ITEMS,
          });
        }

        // 4. Auth login
        if (cleanPath === '/api/auth/login' && method === 'POST') {
          const body = await readBody(req);
          const email = (body.email || 'student@campus.edu').toLowerCase();
          let role = 'student';
          let name = email.split('@')[0];

          if (email.includes('kitchen')) {
            role = 'kitchen';
            name = 'Kitchen KDS Team';
          } else if (email.includes('counter')) {
            role = 'counter';
            name = 'Pickup Counter';
          } else if (email.includes('admin')) {
            role = 'admin';
            name = 'Administrator';
          } else if (email.includes('faculty')) {
            role = 'faculty';
            name = 'Faculty Member';
          }

          return sendJson(res, 200, {
            success: true,
            message: 'Login successful',
            token: `token-${Date.now()}`,
            user: {
              id: 1,
              name: name.charAt(0).toUpperCase() + name.slice(1),
              email,
              role,
              wallet_balance: userWalletBalance,
            },
          });
        }

        // 5. Auth register
        if (cleanPath === '/api/auth/register' && method === 'POST') {
          const body = await readBody(req);
          return sendJson(res, 201, {
            success: true,
            message: 'User registered successfully',
            token: `token-${Date.now()}`,
            user: {
              id: 1,
              name: body.name || 'Campus Student',
              email: body.email || 'student@campus.edu',
              role: body.role || 'student',
              wallet_balance: userWalletBalance,
            },
          });
        }

        // 6. Current user /auth/me
        if (cleanPath === '/api/auth/me' && method === 'GET') {
          return sendJson(res, 200, {
            success: true,
            user: {
              id: 1,
              name: 'Namit',
              email: 'namit@campus.edu',
              role: 'student',
              wallet_balance: userWalletBalance,
            },
          });
        }

        // 7. Orders - My Orders
        if (cleanPath === '/api/orders/my-orders' && method === 'GET') {
          return sendJson(res, 200, {
            success: true,
            orders: ordersDb,
          });
        }

        // 8. Place Order
        if (cleanPath === '/api/orders' && method === 'POST') {
          const body = await readBody(req);
          const { canteenId, items, paymentMethod = 'wallet' } = body;

          let subtotal = 0;
          const orderItems = (items || []).map((it: any, idx: number) => {
            const menuItem = MENU_ITEMS.find((m) => m.id === Number(it.menuItemId)) || MENU_ITEMS[0];
            const price = menuItem ? menuItem.price : 50;
            const extra = Number(it.extraAmount || 0);
            const unitPrice = price + extra;
            const quantity = Number(it.quantity || 1);
            subtotal += unitPrice * quantity;
            return {
              id: idx + 1,
              menu_item_id: Number(it.menuItemId),
              name: menuItem?.name || 'Canteen Special',
              quantity,
              price: unitPrice,
              customization: it.customization || null,
              extra_amount: extra,
            };
          });

          const discount = subtotal >= 100 ? 15 : 0;
          const totalAmount = Math.max(0, subtotal - discount);

          let paymentStatus = paymentMethod === 'cash' ? 'pending' : 'paid';
          const paymentTransactionId = `CW-ORDER-${Date.now()}`;

          if (paymentMethod === 'wallet') {
            userWalletBalance = Math.max(0, userWalletBalance - totalAmount);
          }

          const orderId = nextOrderId++;
          const tokenNumber = `M-${Math.floor(100 + Math.random() * 900)}`;

          const newOrder: StoredOrder = {
            id: orderId,
            user_id: 1,
            student_name: 'Namit',
            canteen_id: Number(canteenId || 1),
            canteen_name: CANTEENS.find((c) => c.id === Number(canteenId))?.name || 'Main Campus Canteen',
            total_amount: totalAmount,
            token_number: tokenNumber,
            status: 'placed',
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            payment_transaction_id: paymentTransactionId,
            created_at: new Date().toISOString(),
            items: orderItems,
          };

          ordersDb.unshift(newOrder);

          return sendJson(res, 201, {
            success: true,
            message: 'Order placed successfully',
            order: {
              id: orderId,
              tokenNumber,
              subtotal,
              discount,
              taxes: 0,
              totalAmount,
              status: 'placed',
              paymentMethod,
              paymentStatus,
              paymentTransactionId,
            },
            walletBalance: userWalletBalance,
          });
        }

        // 9. Cancel Order
        if (cleanPath.includes('/api/orders/') && cleanPath.endsWith('/cancel') && method === 'PATCH') {
          const parts = cleanPath.split('/');
          const orderId = Number(parts[parts.indexOf('orders') + 1]);
          const order = ordersDb.find((o) => o.id === orderId);
          if (order) {
            order.status = 'cancelled';
          }
          return sendJson(res, 200, {
            success: true,
            message: 'Order cancelled successfully',
          });
        }

        // 10. Kitchen Orders
        if (cleanPath === '/api/kitchen/orders' && method === 'GET') {
          const activeKitchenOrders = ordersDb.filter((o) =>
            ['placed', 'accepted', 'preparing', 'ready'].includes(o.status)
          );
          return sendJson(res, 200, {
            success: true,
            orders: activeKitchenOrders,
          });
        }

        // 11. Kitchen Order Status update
        if (cleanPath.includes('/api/kitchen/orders/') && cleanPath.endsWith('/status') && method === 'PATCH') {
          const body = await readBody(req);
          const parts = cleanPath.split('/');
          const orderId = Number(parts[parts.indexOf('orders') + 1]);
          const order = ordersDb.find((o) => o.id === orderId);
          if (order && body.status) {
            order.status = body.status;
          }
          return sendJson(res, 200, {
            success: true,
            message: 'Order status updated successfully',
            order,
          });
        }

        // 12. Counter Orders
        if (cleanPath === '/api/counter/orders' && method === 'GET') {
          const counterOrders = ordersDb.filter((o) => ['ready', 'completed'].includes(o.status));
          return sendJson(res, 200, {
            success: true,
            orders: counterOrders,
          });
        }

        // 13. Counter Order Collect
        if (cleanPath.includes('/api/counter/orders/') && cleanPath.endsWith('/collect') && method === 'PATCH') {
          const parts = cleanPath.split('/');
          const orderId = Number(parts[parts.indexOf('orders') + 1]);
          const order = ordersDb.find((o) => o.id === orderId);
          if (order) {
            order.status = 'completed';
          }
          return sendJson(res, 200, {
            success: true,
            message: 'Order collected successfully',
            order,
          });
        }

        // 14. Wallet Add Money
        if (cleanPath === '/api/wallet/add-money' && method === 'POST') {
          const body = await readBody(req);
          const amount = Number(body.amount || 0);
          userWalletBalance += amount;
          return sendJson(res, 200, {
            success: true,
            message: `Added ₹${amount} to wallet`,
            balance: userWalletBalance,
          });
        }

        // 15. Wallet Balance
        if (cleanPath === '/api/wallet/balance' && method === 'GET') {
          return sendJson(res, 200, {
            success: true,
            balance: userWalletBalance,
          });
        }

        // 16. Ratings
        if (cleanPath === '/api/ratings' && method === 'POST') {
          return sendJson(res, 201, {
            success: true,
            message: 'Rating recorded successfully',
          });
        }

        // Default 404 for unmatched /api routes
        return sendJson(res, 404, {
          success: false,
          message: `Endpoint ${cleanPath} not found`,
        });
      });
    },
  };
}
