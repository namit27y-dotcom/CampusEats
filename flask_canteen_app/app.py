import json
import random
from flask import Flask, render_template, request, jsonify, redirect, url_for
from models import init_db, get_db_connection

app = Flask(__name__)
app.secret_key = 'campus_eats_secret_key'

# Initialize SQLite database tables on startup
init_db()

@app.route('/')
def student_view():
    conn = get_db_connection()
    canteen_id = request.args.get('canteen', 'c1')
    
    canteens = conn.execute('SELECT * FROM canteens').fetchall()
    canteen = conn.execute('SELECT * FROM canteens WHERE id = ?', (canteen_id,)).fetchone() or canteens[0]
    
    menu_items = conn.execute('SELECT * FROM menu_items WHERE canteen_id = ?', (canteen['id'],)).fetchall()
    categories = sorted(list(set([item['category'] for item in menu_items])))
    
    # Active orders for preview
    active_orders = conn.execute('''
        SELECT * FROM orders 
        WHERE canteen_id = ? AND status IN ('CONFIRMED', 'PREPARING', 'READY')
        ORDER BY created_at DESC LIMIT 5
    ''', (canteen['id'],)).fetchall()
    
    user = conn.execute("SELECT * FROM users WHERE id = 'u1'").fetchone()
    conn.close()

    return render_template(
        'index.html',
        canteens=canteens,
        selected_canteen=canteen,
        menu_items=menu_items,
        categories=categories,
        active_orders=active_orders,
        current_user=user
    )

@app.route('/kitchen')
def kitchen_view():
    conn = get_db_connection()
    canteen_id = request.args.get('canteen', 'c1')
    
    canteens = conn.execute('SELECT * FROM canteens').fetchall()
    canteen = conn.execute('SELECT * FROM canteens WHERE id = ?', (canteen_id,)).fetchone() or canteens[0]
    
    orders = conn.execute('''
        SELECT * FROM orders 
        WHERE canteen_id = ? AND status IN ('CONFIRMED', 'PREPARING', 'READY')
        ORDER BY created_at ASC
    ''', (canteen['id'],)).fetchall()
    
    parsed_orders = []
    for ord in orders:
        ord_dict = dict(ord)
        ord_dict['items'] = json.loads(ord_dict['items_json'])
        parsed_orders.append(ord_dict)
        
    conn.close()
    return render_template('kitchen.html', canteens=canteens, selected_canteen=canteen, orders=parsed_orders)

@app.route('/counter')
def counter_view():
    conn = get_db_connection()
    canteen_id = request.args.get('canteen', 'c1')
    
    canteens = conn.execute('SELECT * FROM canteens').fetchall()
    canteen = conn.execute('SELECT * FROM canteens WHERE id = ?', (canteen_id,)).fetchone() or canteens[0]
    
    ready_orders = conn.execute('''
        SELECT * FROM orders 
        WHERE canteen_id = ? AND status = 'READY'
        ORDER BY created_at ASC
    ''', (canteen['id'],)).fetchall()
    
    preparing_orders = conn.execute('''
        SELECT * FROM orders 
        WHERE canteen_id = ? AND status IN ('CONFIRMED', 'PREPARING')
        ORDER BY created_at ASC
    ''', (canteen['id'],)).fetchall()
    
    conn.close()
    return render_template(
        'counter.html',
        canteens=canteens,
        selected_canteen=canteen,
        ready_orders=ready_orders,
        preparing_orders=preparing_orders
    )

@app.route('/admin')
def admin_view():
    conn = get_db_connection()
    canteen_id = request.args.get('canteen', 'c1')
    
    canteens = conn.execute('SELECT * FROM canteens').fetchall()
    canteen = conn.execute('SELECT * FROM canteens WHERE id = ?', (canteen_id,)).fetchone() or canteens[0]
    
    menu_items = conn.execute('SELECT * FROM menu_items WHERE canteen_id = ?', (canteen['id'],)).fetchall()
    recent_orders = conn.execute('''
        SELECT * FROM orders 
        WHERE canteen_id = ?
        ORDER BY created_at DESC LIMIT 15
    ''', (canteen['id'],)).fetchall()
    
    total_sales = conn.execute('''
        SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE canteen_id = ? AND status != 'CANCELLED'
    ''', (canteen['id'],)).fetchone()[0]
    
    total_orders_count = conn.execute('''
        SELECT COUNT(*) FROM orders WHERE canteen_id = ?
    ''', (canteen['id'],)).fetchone()[0]
    
    conn.close()
    return render_template(
        'admin.html',
        canteens=canteens,
        selected_canteen=canteen,
        menu_items=menu_items,
        recent_orders=recent_orders,
        total_sales=total_sales,
        total_orders_count=total_orders_count
    )

# --- REST APIs for Dynamic JavaScript Interactivity ---

@app.route('/api/order', methods=['POST'])
def place_order():
    data = request.json
    conn = get_db_connection()
    
    # Generate Token Number
    token_num = f"A{random.randint(100, 999)}"
    order_id = f"ord_{random.randint(10000, 99999)}"
    
    conn.execute('''
        INSERT INTO orders (id, token_number, user_id, user_name, canteen_id, items_json, total_amount, status, pickup_counter, pickup_slot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        order_id,
        token_num,
        data.get('user_id', 'u1'),
        data.get('user_name', 'Student'),
        data.get('canteen_id', 'c1'),
        json.dumps(data.get('items', [])),
        data.get('total_amount', 0.0),
        'CONFIRMED',
        data.get('pickup_counter', 'Counter 1'),
        data.get('pickup_slot', 'Immediate Pickup')
    ))
    
    # Deduct from user wallet
    conn.execute('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', 
                 (data.get('total_amount', 0.0), data.get('user_id', 'u1')))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'order_id': order_id,
        'token_number': token_num,
        'message': f'Order placed successfully! Your token is #{token_num}'
    })

@app.route('/api/order/<order_id>/status', methods=['POST'])
def update_order_status(order_id):
    status = request.json.get('status')
    conn = get_db_connection()
    conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    
    if status == 'READY':
        ord = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
        if ord:
            conn.execute('UPDATE canteens SET current_serving_token = ? WHERE id = ?', (ord['token_number'], ord['canteen_id']))
            
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'order_id': order_id, 'new_status': status})

@app.route('/api/menu/add', methods=['POST'])
def add_menu_item():
    conn = get_db_connection()
    item_id = f"m_{random.randint(100, 999)}"
    conn.execute('''
        INSERT INTO menu_items (id, canteen_id, name, description, price, category, is_veg, in_stock, prep_time_minutes, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        item_id,
        request.form.get('canteen_id', 'c1'),
        request.form.get('name'),
        request.form.get('description', ''),
        float(request.form.get('price', 50)),
        request.form.get('category', 'Quick Bites'),
        1 if request.form.get('is_veg') == 'on' else 0,
        1,
        int(request.form.get('prep_time_minutes', 5)),
        request.form.get('image_url', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80')
    ))
    conn.commit()
    conn.close()
    return redirect(url_for('admin_view', canteen=request.form.get('canteen_id', 'c1')))

if __name__ == '__main__':
    # Local run on standard port 5000 or 8000
    app.run(host='0.0.0.0', port=5000, debug=True)
