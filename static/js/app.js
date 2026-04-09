/* ============================================================
   StayNest - Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    initThemeToggle();
    initUserMenu();
    initNotifications();
    initFlashMessages();
});

/* ============ Theme Toggle ============ */
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
    toggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });
}
function updateThemeIcon(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* ============ User Menu ============ */
function initUserMenu() {
    const btn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (!btn || !dropdown) return;
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        // Close notification dropdown
        const notifDrop = document.getElementById('notification-dropdown');
        if (notifDrop) notifDrop.classList.remove('active');
    });
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

/* ============ Notifications ============ */
function initNotifications() {
    const btn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notification-dropdown');
    if (!btn || !dropdown) return;
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) loadNotifications();
        const userDrop = document.getElementById('user-dropdown');
        if (userDrop) userDrop.classList.remove('active');
    });
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
            fetch('/api/notifications/read', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({})
            }).then(() => {
                loadNotifications();
                const badge = btn.querySelector('.notification-badge');
                if (badge) badge.remove();
            });
        });
    }
}
function loadNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;
    fetch('/api/notifications')
        .then(r => r.json())
        .then(data => {
            if (!data.notifications || data.notifications.length === 0) {
                list.innerHTML = '<div class="notification-empty">No notifications yet</div>';
                return;
            }
            list.innerHTML = data.notifications.map(n => `
                <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="markNotifRead(${n.notification_id})">
                    <div class="notif-title">${escapeHtml(n.title)}</div>
                    <div class="notif-message">${escapeHtml(n.message)}</div>
                    <div class="notif-time">${formatTime(n.created_at)}</div>
                </div>
            `).join('');
        })
        .catch(() => {
            list.innerHTML = '<div class="notification-empty">Failed to load notifications</div>';
        });
}
function markNotifRead(id) {
    fetch('/api/notifications/read', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({notification_id: id})
    });
}

/* ============ Flash Messages ============ */
function initFlashMessages() {
    document.querySelectorAll('[data-auto-dismiss]').forEach(el => {
        setTimeout(() => {
            el.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => el.remove(), 300);
        }, 5000);
    });
}

/* ============ Utility Functions ============ */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return date.toLocaleDateString();
}
function formatCurrency(amount) {
    return 'Rs. ' + Number(amount).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0});
}

function showToast(message, type = 'success') {
    const container = document.getElementById('flash-container') || createFlashContainer();
    const flash = document.createElement('div');
    flash.className = `flash-message flash-${type}`;
    flash.innerHTML = `
        <div class="flash-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="flash-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(flash);
    setTimeout(() => {
        flash.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => flash.remove(), 300);
    }, 4000);
}
function createFlashContainer() {
    const c = document.createElement('div');
    c.className = 'flash-container';
    c.id = 'flash-container';
    document.body.appendChild(c);
    return c;
}

/* ============ Wishlist Toggle ============ */
function toggleWishlist(propertyId, btn) {
    fetch('/api/wishlist/toggle', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({property_id: propertyId})
    })
    .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return; }
        return r.json();
    })
    .then(data => {
        if (!data) return;
        const icon = btn.querySelector('i');
        const span = btn.querySelector('span');
        
        if (data.added) {
            btn.classList.add('active');
            if (icon) {
                icon.className = 'fas fa-heart';
                if (btn.classList.contains('wishlist-toggle-btn')) icon.style.color = '#ff385c';
            }
            if (span && btn.classList.contains('wishlist-toggle-btn')) span.textContent = 'Saved';
            showToast('Added to wishlist');
        } else {
            btn.classList.remove('active');
            if (icon) {
                icon.className = 'far fa-heart';
                if (btn.classList.contains('wishlist-toggle-btn')) icon.style.color = 'inherit';
            }
            if (span && btn.classList.contains('wishlist-toggle-btn')) span.textContent = 'Save';
            showToast('Removed from wishlist');
        }
    });
}

/* ============ Guest Selector ============ */
function initGuestSelector(maxGuests) {
    const countEl = document.getElementById('guest-count');
    const minusBtn = document.getElementById('guest-minus');
    const plusBtn = document.getElementById('guest-plus');
    const input = document.getElementById('guest-input');
    if (!countEl || !minusBtn || !plusBtn) return;
    let count = 1;
    function update() {
        countEl.textContent = count + (count === 1 ? ' guest' : ' guests');
        if (input) input.value = count;
        minusBtn.disabled = count <= 1;
        plusBtn.disabled = count >= (maxGuests || 16);
        updateBookingPrice();
    }
    minusBtn.addEventListener('click', () => { if (count > 1) { count--; update(); } });
    plusBtn.addEventListener('click', () => { if (count < (maxGuests || 16)) { count++; update(); } });
    update();
}

/* ============ Booking Price Calculator ============ */
function updateBookingPrice() {
    const checkin = document.getElementById('checkin-date');
    const checkout = document.getElementById('checkout-date');
    const pricePerNight = parseFloat(document.getElementById('price-per-night')?.value || 0);
    const cleaningFee = parseFloat(document.getElementById('cleaning-fee')?.value || 0);
    const servicePct = parseFloat(document.getElementById('service-pct')?.value || 14);

    if (!checkin || !checkout || !checkin.value || !checkout.value) return;

    const ci = new Date(checkin.value);
    const co = new Date(checkout.value);
    const nights = Math.ceil((co - ci) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return;

    const subtotal = pricePerNight * nights;
    const serviceFee = Math.round(subtotal * servicePct / 100);
    const total = subtotal + cleaningFee + serviceFee;

    const summaryEl = document.getElementById('booking-summary');
    const bookBtn = document.getElementById('book-btn');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="summary-row">
                <span>${formatCurrency(pricePerNight)} x ${nights} nights</span>
                <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Cleaning fee</span>
                <span>${formatCurrency(cleaningFee)}</span>
            </div>
            <div class="summary-row">
                <span>Service fee</span>
                <span>${formatCurrency(serviceFee)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>${formatCurrency(total)}</span>
            </div>
        `;
        summaryEl.style.display = 'block';
    }
    if (bookBtn) {
        bookBtn.disabled = false;
        bookBtn.dataset.nights = nights;
        bookBtn.dataset.subtotal = subtotal;
        bookBtn.dataset.serviceFee = serviceFee;
        bookBtn.dataset.total = total;
    }
}

/* ============ Booking Submit ============ */
function submitBooking(propertyId) {
    const btn = document.getElementById('book-btn');
    const checkin = document.getElementById('checkin-date').value;
    const checkout = document.getElementById('checkout-date').value;
    const guests = parseInt(document.getElementById('guest-input')?.value || 1);
    const pricePerNight = parseFloat(document.getElementById('price-per-night').value);
    const cleaningFee = parseFloat(document.getElementById('cleaning-fee').value);
    const serviceFee = parseFloat(btn.dataset.serviceFee || 0);
    const total = parseFloat(btn.dataset.total || 0);
    const specialRequests = document.getElementById('special-requests')?.value || '';

    if (!checkin || !checkout) { showToast('Please select dates', 'warning'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Processing...';

    fetch('/api/bookings', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            property_id: propertyId, check_in: checkin, check_out: checkout,
            num_guests: guests, price_per_night: pricePerNight,
            cleaning_fee: cleaningFee, service_fee: serviceFee,
            total_price: total, special_requests: specialRequests
        })
    })
    .then(r => {
        if (r.status === 401) { window.location.href = '/login'; return; }
        return r.json();
    })
    .then(data => {
        if (!data) return;
        if (data.success) {
            showToast(data.message);
            setTimeout(() => window.location.href = '/my-trips', 1500);
        } else {
            showToast(data.error || 'Booking failed', 'danger');
            btn.disabled = false;
            btn.textContent = 'Request to Book';
        }
    })
    .catch(() => {
        showToast('Something went wrong', 'danger');
        btn.disabled = false;
        btn.textContent = 'Request to Book';
    });
}

/* ============ Search/Filter ============ */
function searchProperties(page = 1) {
    const params = new URLSearchParams();
    const location = document.getElementById('search-location')?.value;
    const checkin = document.getElementById('filter-checkin')?.value;
    const checkout = document.getElementById('filter-checkout')?.value;
    const guests = document.getElementById('filter-guests')?.value;
    const minPrice = document.getElementById('filter-min-price')?.value;
    const maxPrice = document.getElementById('filter-max-price')?.value;
    const type = document.getElementById('filter-type')?.value;
    const sort = document.getElementById('filter-sort')?.value;

    if (location) params.set('location', location);
    if (checkin) params.set('check_in', checkin);
    if (checkout) params.set('check_out', checkout);
    if (guests) params.set('guests', guests);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (type) params.set('property_type', type);
    if (sort) params.set('sort', sort);
    params.set('page', page);

    // Get active category
    const activeCat = document.querySelector('.category-item.active');
    if (activeCat && activeCat.dataset.id) params.set('category_id', activeCat.dataset.id);

    const grid = document.getElementById('property-grid');
    const count = document.getElementById('results-count');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;"><span class="loading-spinner"></span></div>';

    fetch('/api/properties?' + params.toString())
        .then(r => r.json())
        .then(data => {
            if (count) count.textContent = data.total + ' stays found';
            if (grid) {
                if (data.properties.length === 0) {
                    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-search"></i><h3>No properties found</h3><p>Try adjusting your search filters</p></div>';
                    return;
                }
                grid.innerHTML = data.properties.map(p => createPropertyCard(p)).join('');
            }
            // Pagination
            const pag = document.getElementById('pagination');
            if (pag && data.total_pages > 1) {
                let html = '';
                for (let i = 1; i <= data.total_pages; i++) {
                    html += `<button class="filter-btn ${i === data.page ? 'active' : ''}" onclick="searchProperties(${i})">${i}</button>`;
                }
                pag.innerHTML = html;
            }
        });
}

function createPropertyCard(p) {
    const img = p.primary_image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800';
    const rating = p.average_rating ? p.average_rating.toFixed(1) : 'New';
    return `
        <a href="/property/${p.property_id}" class="property-card">
            <div class="card-image-container">
                <img src="${img}" alt="${escapeHtml(p.title)}" class="card-image" loading="lazy"
                     onerror="this.src='https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'">
                ${p.is_superhost ? '<span class="card-badge">Superhost</span>' : ''}
                <button class="card-wishlist ${p.is_wishlisted ? 'active' : ''}" onclick="event.preventDefault();toggleWishlist(${p.property_id}, this)">
                    <i class="${p.is_wishlisted ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
            <div class="card-info">
                <div class="card-info-top">
                    <span class="card-location">${escapeHtml(p.city)}, ${escapeHtml(p.state)}</span>
                    <span class="card-rating"><i class="fas fa-star"></i> ${rating}</span>
                </div>
                <div class="card-type">${escapeHtml(p.title)}</div>
                <div class="card-price" style="margin-bottom:12px;"><strong>${formatCurrency(p.price_per_night)}</strong> <span>/ night</span></div>
                
                <div style="border-top:1px solid var(--border-light); padding-top:12px; display:flex; align-items:center; gap:8px;">
                    <div style="width:24px; height:24px; background:var(--primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0;">
                        ${p.host_first_name ? p.host_first_name.charAt(0) : ''}${p.host_last_name ? p.host_last_name.charAt(0) : ''}
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <span style="font-weight:600; color:var(--text-main);">${escapeHtml(p.host_first_name)}</span>
                        ${p.is_superhost ? '<i class="fas fa-medal" style="color:#FFC107; font-size:12px;" title="Superhost"></i>' : ''}
                    </div>
                </div>
            </div>
        </a>
    `;
}
