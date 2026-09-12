// Global Cart State
let cart = [];

function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartUI();
    
    // Auto open offcanvas if closed
    const cartOffcanvasEl = document.getElementById('cartOffcanvas');
    if (cartOffcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartOffcanvasEl);
        bsOffcanvas.show();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        updateCartUI();
    }
}

function updateCartUI() {
    const listEl = document.getElementById('cart-list');
    const badgeEl = document.getElementById('cart-badge-count');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const totalEl = document.getElementById('cart-total');
    const btnPlace = document.getElementById('btn-place-order');

    if (!listEl) return;

    listEl.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (btnPlace) btnPlace.disabled = true;
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
        if (btnPlace) btnPlace.disabled = false;

        cart.forEach(item => {
            total += item.price * item.quantity;
            itemCount += item.quantity;

            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center px-0 py-2';
            li.innerHTML = `
                <div>
                    <div class="fw-bold small">${item.name}</div>
                    <div class="text-muted small font-monospace">₹${item.price} each</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-secondary btn-sm py-0 px-2 rounded-circle" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                    <span class="fw-bold small font-monospace">${item.quantity}</span>
                    <button class="btn btn-outline-secondary btn-sm py-0 px-2 rounded-circle" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                    <span class="fw-bold font-monospace ms-2">₹${item.price * item.quantity}</span>
                </div>
            `;
            listEl.appendChild(li);
        });
    }

    if (badgeEl) badgeEl.textContent = itemCount;
    if (totalEl) totalEl.textContent = total;
}

async function placeOrder(canteenId) {
    if (cart.length === 0) return;
    const btn = document.getElementById('btn-place-order');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Placing Order...';
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    try {
        const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                canteen_id: canteenId,
                items: cart,
                total_amount: total,
                user_id: 'u1',
                user_name: 'Aarav Sharma',
                pickup_counter: 'Counter 1'
            })
        });
        const data = await res.json();
        if (data.success) {
            alert(`🎉 Success! Your digital token is #${data.token_number}.\nTrack your order in real-time.`);
            cart = [];
            window.location.reload();
        }
    } catch (e) {
        alert('Failed to place order. Please try again.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Pay & Generate Digital Token';
        }
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`/api/order/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        }
    } catch (e) {
        alert('Failed to update status.');
    }
}

function announceToken(tokenNumber, counter) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Token number ${tokenNumber}, please collect your order at ${counter}`);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    } else {
        alert(`Announcement: Token #${tokenNumber}, please collect your order at ${counter}`);
    }
}

function filterCategory(category, btn) {
    document.querySelectorAll('.btn-outline-dark, .btn-dark').forEach(b => {
        if (b.onclick && b.onclick.toString().includes('filterCategory')) {
            b.classList.remove('btn-dark', 'active');
            b.classList.add('btn-outline-dark');
        }
    });
    btn.classList.remove('btn-outline-dark');
    btn.classList.add('btn-dark', 'active');

    const cards = document.querySelectorAll('.menu-item-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
