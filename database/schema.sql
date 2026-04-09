-- ============================================================
-- StayNest Rental Marketplace - Database Schema
-- Normalized to 3NF with full constraints
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_country_code TEXT DEFAULT '+91',
    phone_number TEXT,
    profile_image TEXT DEFAULT '/static/images/default_avatar.png',
    role TEXT NOT NULL DEFAULT 'guest' CHECK(role IN ('guest', 'host', 'admin')),
    is_verified INTEGER DEFAULT 0 CHECK(is_verified IN (0, 1)),
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    date_of_birth TEXT,
    bio TEXT,
    loyalty_points INTEGER DEFAULT 0 CHECK(loyalty_points >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. EMAIL VERIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS email_verifications (
    verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used INTEGER DEFAULT 0 CHECK(is_used IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 3. HOST PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS host_profiles (
    host_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    is_superhost INTEGER DEFAULT 0 CHECK(is_superhost IN (0, 1)),
    total_revenue REAL DEFAULT 0.0 CHECK(total_revenue >= 0),
    total_bookings INTEGER DEFAULT 0 CHECK(total_bookings >= 0),
    average_rating REAL DEFAULT 0.0 CHECK(average_rating >= 0 AND average_rating <= 5),
    response_rate REAL DEFAULT 100.0 CHECK(response_rate >= 0 AND response_rate <= 100),
    response_time_hours INTEGER DEFAULT 1,
    payout_method TEXT DEFAULT 'bank_transfer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0
);

-- ============================================================
-- 5. CANCELLATION POLICIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cancellation_policies (
    policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    refund_percentage_before_7_days REAL DEFAULT 100,
    refund_percentage_before_48_hours REAL DEFAULT 50,
    refund_percentage_after REAL DEFAULT 0,
    penalty_percentage REAL DEFAULT 0
);

-- ============================================================
-- 6. PROPERTIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
    property_id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id INTEGER NOT NULL,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'house', 'villa', 'cabin', 'cottage', 'loft', 'studio', 'resort', 'farmhouse', 'treehouse', 'houseboat', 'castle')),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    zip_code TEXT,
    latitude REAL,
    longitude REAL,
    price_per_night REAL NOT NULL CHECK(price_per_night > 0),
    cleaning_fee REAL DEFAULT 0 CHECK(cleaning_fee >= 0),
    service_fee_percentage REAL DEFAULT 14.0 CHECK(service_fee_percentage >= 0),
    max_guests INTEGER NOT NULL DEFAULT 1 CHECK(max_guests > 0),
    bedrooms INTEGER DEFAULT 1 CHECK(bedrooms >= 0),
    beds INTEGER DEFAULT 1 CHECK(beds >= 0),
    bathrooms REAL DEFAULT 1.0 CHECK(bathrooms >= 0),
    check_in_time TEXT DEFAULT '14:00',
    check_out_time TEXT DEFAULT '11:00',
    minimum_stay INTEGER DEFAULT 1 CHECK(minimum_stay >= 1),
    maximum_stay INTEGER DEFAULT 365 CHECK(maximum_stay >= 1),
    cancellation_policy_id INTEGER DEFAULT 1,
    average_rating REAL DEFAULT 0.0 CHECK(average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK(total_reviews >= 0),
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    is_approved INTEGER DEFAULT 1 CHECK(is_approved IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (cancellation_policy_id) REFERENCES cancellation_policies(policy_id)
);

CREATE INDEX idx_properties_host ON properties(host_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price_per_night);
CREATE INDEX idx_properties_category ON properties(category_id);
CREATE INDEX idx_properties_active ON properties(is_active);

-- ============================================================
-- 7. PROPERTY IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS property_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_primary INTEGER DEFAULT 0 CHECK(is_primary IN (0, 1)),
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

CREATE INDEX idx_property_images_property ON property_images(property_id);

-- ============================================================
-- 8. AMENITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS amenities (
    amenity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    category TEXT DEFAULT 'general' CHECK(category IN ('general', 'safety', 'kitchen', 'outdoor', 'entertainment', 'bathroom', 'bedroom', 'accessibility'))
);

-- ============================================================
-- 9. PROPERTY AMENITIES (M:N Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS property_amenities (
    property_id INTEGER NOT NULL,
    amenity_id INTEGER NOT NULL,
    PRIMARY KEY (property_id, amenity_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
);

-- ============================================================
-- 10. BOOKINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_guests INTEGER NOT NULL DEFAULT 1 CHECK(num_guests > 0),
    total_nights INTEGER NOT NULL CHECK(total_nights > 0),
    price_per_night REAL NOT NULL CHECK(price_per_night > 0),
    cleaning_fee REAL DEFAULT 0,
    service_fee REAL DEFAULT 0,
    total_price REAL NOT NULL CHECK(total_price > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')),
    cancellation_reason TEXT,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK(check_out > check_in)
);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================================
-- 11. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL UNIQUE,
    amount REAL NOT NULL CHECK(amount > 0),
    payment_method TEXT DEFAULT 'credit_card' CHECK(payment_method IN ('credit_card', 'debit_card', 'upi', 'net_banking', 'wallet')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'refunded', 'failed')),
    transaction_id TEXT UNIQUE,
    invoice_number TEXT UNIQUE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ============================================================
-- 12. REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL UNIQUE,
    property_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    cleanliness_rating INTEGER CHECK(cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    accuracy_rating INTEGER CHECK(accuracy_rating >= 1 AND accuracy_rating <= 5),
    checkin_rating INTEGER CHECK(checkin_rating >= 1 AND checkin_rating <= 5),
    communication_rating INTEGER CHECK(communication_rating >= 1 AND communication_rating <= 5),
    location_rating INTEGER CHECK(location_rating >= 1 AND location_rating <= 5),
    value_rating INTEGER CHECK(value_rating >= 1 AND value_rating <= 5),
    comment TEXT,
    host_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_property ON reviews(property_id);

-- ============================================================
-- 13. WISHLISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
    wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE
);

-- ============================================================
-- 14. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    property_id INTEGER,
    booking_id INTEGER,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
);

CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);

-- ============================================================
-- 15. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('booking_request', 'booking_confirmed', 'booking_rejected', 'booking_cancelled', 'review_received', 'message_received', 'payment_received', 'listing_approved', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id INTEGER,
    reference_type TEXT,
    is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- 16. AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT,
    new_values TEXT,
    user_id INTEGER,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);

-- ============================================================
-- 17. RATE LIMITING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limiting (
    rate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint)
);

-- ============================================================
-- 18. VOUCHERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value REAL NOT NULL CHECK(discount_value > 0),
    min_booking_amount REAL DEFAULT 0,
    expiry_date TIMESTAMP,
    usage_limit INTEGER DEFAULT NULL,
    times_used INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 19. LOYALTY TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    booking_id INTEGER,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned', 'redeemed', 'adjusted')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- TRIGGER 1: Prevent double booking (date overlap detection)
CREATE TRIGGER IF NOT EXISTS trg_prevent_double_booking
BEFORE INSERT ON bookings
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM bookings
            WHERE property_id = NEW.property_id
            AND status IN ('pending', 'confirmed')
            AND booking_id != COALESCE(NEW.booking_id, 0)
            AND NEW.check_in < check_out
            AND NEW.check_out > check_in
        )
        THEN RAISE(ABORT, 'DOUBLE_BOOKING: These dates overlap with an existing booking')
    END;
END;

-- TRIGGER 2: Auto-update host revenue after payment
CREATE TRIGGER IF NOT EXISTS trg_update_host_revenue
AFTER UPDATE ON payments
WHEN NEW.payment_status = 'completed' AND OLD.payment_status != 'completed'
BEGIN
    UPDATE host_profiles
    SET total_revenue = total_revenue + NEW.amount,
        total_bookings = total_bookings + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = (
        SELECT p.host_id FROM properties p
        JOIN bookings b ON b.property_id = p.property_id
        WHERE b.booking_id = NEW.booking_id
    );
END;

-- TRIGGER 3: Calculate superhost badge after review
CREATE TRIGGER IF NOT EXISTS trg_calculate_superhost
AFTER INSERT ON reviews
BEGIN
    UPDATE host_profiles
    SET is_superhost = CASE
        WHEN (
            SELECT AVG(r.rating) FROM reviews r
            JOIN properties p ON r.property_id = p.property_id
            WHERE p.host_id = (
                SELECT host_id FROM properties WHERE property_id = NEW.property_id
            )
        ) >= 4.8
        AND total_bookings >= 10
        THEN 1
        ELSE is_superhost
    END,
    updated_at = CURRENT_TIMESTAMP
    WHERE user_id = (
        SELECT host_id FROM properties WHERE property_id = NEW.property_id
    );
END;

-- TRIGGER 4: Booking cancellation penalty
CREATE TRIGGER IF NOT EXISTS trg_cancellation_penalty
AFTER UPDATE ON bookings
WHEN NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed')
BEGIN
    UPDATE payments
    SET payment_status = 'refunded',
        amount = CASE
            WHEN julianday(NEW.check_in) - julianday('now') > 7 THEN amount * 0.0
            WHEN julianday(NEW.check_in) - julianday('now') > 2 THEN amount * 0.5
            ELSE amount * 1.0
        END
    WHERE booking_id = NEW.booking_id;
END;

-- TRIGGER 5: Audit log for bookings
CREATE TRIGGER IF NOT EXISTS trg_audit_booking_insert
AFTER INSERT ON bookings
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, new_values)
    VALUES ('bookings', NEW.booking_id, 'INSERT',
        '{"property_id":' || NEW.property_id ||
        ',"guest_id":' || NEW.guest_id ||
        ',"check_in":"' || NEW.check_in ||
        '","check_out":"' || NEW.check_out ||
        '","status":"' || NEW.status ||
        '","total_price":' || NEW.total_price || '}');
END;

CREATE TRIGGER IF NOT EXISTS trg_audit_booking_update
AFTER UPDATE ON bookings
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
    VALUES ('bookings', NEW.booking_id, 'UPDATE',
        '{"status":"' || OLD.status || '","total_price":' || OLD.total_price || '}',
        '{"status":"' || NEW.status || '","total_price":' || NEW.total_price || '}');
END;

-- TRIGGER 6: Update property average rating after review
CREATE TRIGGER IF NOT EXISTS trg_update_property_rating
AFTER INSERT ON reviews
BEGIN
    UPDATE properties
    SET average_rating = (
        SELECT ROUND(AVG(rating), 2) FROM reviews WHERE property_id = NEW.property_id
    ),
    total_reviews = (
        SELECT COUNT(*) FROM reviews WHERE property_id = NEW.property_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE property_id = NEW.property_id;
END;

-- TRIGGER 7: Create notification for host on new booking
CREATE TRIGGER IF NOT EXISTS trg_booking_notification
AFTER INSERT ON bookings
BEGIN
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
        (SELECT host_id FROM properties WHERE property_id = NEW.property_id),
        'booking_request',
        'New Booking Request',
        'You have a new booking request for ' ||
            (SELECT title FROM properties WHERE property_id = NEW.property_id) ||
            ' from ' || NEW.check_in || ' to ' || NEW.check_out,
        NEW.booking_id,
        'booking'
    );
END;

-- TRIGGER 8: Update timestamp on user update
CREATE TRIGGER IF NOT EXISTS trg_user_updated_at
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;
