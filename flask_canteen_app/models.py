import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(__file__), 'canteen.db')

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            student_id TEXT,
            wallet_balance REAL DEFAULT 500.0
        )
    ''')

    # Canteens Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS canteens (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            wait_time_minutes INTEGER DEFAULT 12,
            current_serving_token TEXT DEFAULT 'A134'
        )
    ''')

    # Menu Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            canteen_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            is_veg INTEGER DEFAULT 1,
            in_stock INTEGER DEFAULT 1,
            prep_time_minutes INTEGER DEFAULT 8,
            image_url TEXT,
            rating REAL DEFAULT 4.5,
            FOREIGN KEY (canteen_id) REFERENCES canteens (id)
        )
    ''')

    # Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            token_number TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            canteen_id TEXT NOT NULL,
            items_json TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pickup_counter TEXT DEFAULT 'Counter 1',
            pickup_slot TEXT DEFAULT 'Immediate'
        )
    ''')

    # Seed Initial Canteens if empty
    cursor.execute('SELECT COUNT(*) FROM canteens')
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT INTO canteens (id, name, location, status, wait_time_minutes, current_serving_token)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', [
            ('c1', 'Main Academic Canteen', 'Ground Floor, North Block', 'open', 12, 'A134'),
            ('c2', 'Engineering Block Cafe', 'Block B Annex, 2nd Floor', 'open', 5, 'B042'),
            ('c3', 'Hostel Mess & Night Canteen', 'Near Boys Hostel 3', 'open', 18, 'H089')
        ])

    # Seed Initial Users if empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT INTO users (id, name, email, role, student_id, wallet_balance)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', [
            ('u1', 'Aarav Sharma', 'aarav.cs22@campus.edu', 'student', 'CS2022-084', 680.0),
            ('u2', 'Priya Patel', 'priya.ec23@campus.edu', 'student', 'EC2023-112', 420.0),
            ('u3', 'Dr. Ramesh Kumar', 'ramesh.faculty@campus.edu', 'faculty', 'FAC-MECH-09', 1250.0)
        ])

    # Seed Initial Menu Items if empty
    cursor.execute('SELECT COUNT(*) FROM menu_items')
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT INTO menu_items (id, canteen_id, name, description, price, category, is_veg, in_stock, prep_time_minutes, image_url, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [
            ('m1', 'c1', 'Masala Dosa with Sambar & Chutneys', 'Crispy fermented crepe with spiced potato masala, sambar, coconut chutney.', 70.0, 'South Indian', 1, 1, 6, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80', 4.8),
            ('m2', 'c1', 'Paneer Kathi Roll', 'Flaky paratha stuffed with marinated grilled paneer, crunchy onions, mint chutney.', 90.0, 'Snacks', 1, 1, 8, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', 4.7),
            ('m3', 'c1', 'Veg Hakka Noodles', 'Wok-tossed noodles with shredded cabbage, bell peppers, carrots, soy seasoning.', 80.0, 'Chinese', 1, 1, 7, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', 4.5),
            ('m4', 'c1', 'Samosa Pav (2 pcs)', 'Spiced potato samosas tucked inside butter-toasted pav with garlic & green chutney.', 40.0, 'Quick Bites', 1, 1, 2, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 4.9),
            ('m5', 'c1', 'Cold Coffee with Ice Cream', 'Chilled espresso blended with thick milk, dark chocolate drizzle, vanilla scoop.', 60.0, 'Beverages', 1, 1, 3, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80', 4.9),
            ('m6', 'c1', 'Aloo Paratha with Curd & Pickle', 'Whole wheat tawa paratha filled with spiced mashed potato, served with butter & curd.', 65.0, 'North Indian', 1, 1, 8, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80', 4.6)
        ])

    conn.commit()
    conn.close()
