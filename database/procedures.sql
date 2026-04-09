-- ============================================================
-- StayNest - Stored Procedures (MySQL Syntax)
-- For academic reference - implemented in Python for SQLite
-- ============================================================

-- NOTE: These procedures are written in MySQL syntax for
-- academic demonstration. In the SQLite implementation,
-- equivalent logic is implemented in Python (models/analytics.py).

DELIMITER //

-- ============================================================
-- PROCEDURE 1: Monthly Host Performance Report
-- Uses cursor to iterate through host bookings
-- ============================================================
CREATE PROCEDURE sp_monthly_host_report(
    IN p_host_id INT,
    IN p_month INT,
    IN p_year INT
)
BEGIN
    DECLARE v_total_revenue DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_bookings INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(3,2) DEFAULT 0;
    DECLARE v_occupancy_rate DECIMAL(5,2) DEFAULT 0;
    DECLARE v_total_nights INT DEFAULT 0;
    DECLARE v_days_in_month INT;
    DECLARE v_property_count INT;

    -- Cursor variables
    DECLARE v_booking_id INT;
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_done INT DEFAULT FALSE;

    -- Cursor: iterate through all bookings for the host in given month
    DECLARE booking_cursor CURSOR FOR
        SELECT b.booking_id, b.total_price
        FROM bookings b
        JOIN properties p ON b.property_id = p.property_id
        WHERE p.host_id = p_host_id
        AND b.status IN ('confirmed', 'completed')
        AND MONTH(b.check_in) = p_month
        AND YEAR(b.check_in) = p_year;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    SET v_days_in_month = DAY(LAST_DAY(CONCAT(p_year, '-', p_month, '-01')));

    SELECT COUNT(*) INTO v_property_count
    FROM properties WHERE host_id = p_host_id AND is_active = 1;

    OPEN booking_cursor;

    read_loop: LOOP
        FETCH booking_cursor INTO v_booking_id, v_amount;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        SET v_total_revenue = v_total_revenue + v_amount;
        SET v_total_bookings = v_total_bookings + 1;
    END LOOP;

    CLOSE booking_cursor;

    -- Calculate occupancy rate
    SELECT COALESCE(SUM(b.total_nights), 0) INTO v_total_nights
    FROM bookings b
    JOIN properties p ON b.property_id = p.property_id
    WHERE p.host_id = p_host_id
    AND b.status IN ('confirmed', 'completed')
    AND MONTH(b.check_in) = p_month
    AND YEAR(b.check_in) = p_year;

    IF v_property_count > 0 THEN
        SET v_occupancy_rate = (v_total_nights / (v_days_in_month * v_property_count)) * 100;
    END IF;

    -- Get average rating
    SELECT COALESCE(AVG(r.rating), 0) INTO v_avg_rating
    FROM reviews r
    JOIN properties p ON r.property_id = p.property_id
    WHERE p.host_id = p_host_id;

    -- Return results
    SELECT v_total_revenue AS total_revenue,
           v_total_bookings AS total_bookings,
           v_avg_rating AS average_rating,
           v_occupancy_rate AS occupancy_rate,
           v_property_count AS total_properties;
END //

-- ============================================================
-- PROCEDURE 2: Booking Confirmation Workflow
-- Handles the full booking confirmation process
-- ============================================================
CREATE PROCEDURE sp_confirm_booking(
    IN p_booking_id INT
)
BEGIN
    DECLARE v_property_id INT;
    DECLARE v_guest_id INT;
    DECLARE v_host_id INT;
    DECLARE v_total_price DECIMAL(10,2);
    DECLARE v_check_in DATE;
    DECLARE v_check_out DATE;
    DECLARE v_conflict_count INT;

    -- Start transaction
    START TRANSACTION;

    -- Get booking details
    SELECT property_id, guest_id, total_price, check_in, check_out
    INTO v_property_id, v_guest_id, v_total_price, v_check_in, v_check_out
    FROM bookings WHERE booking_id = p_booking_id AND status = 'pending';

    IF v_property_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found or not in pending status';
    END IF;

    -- Check for conflicts (double booking prevention)
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE property_id = v_property_id
    AND booking_id != p_booking_id
    AND status = 'confirmed'
    AND check_in < v_check_out
    AND check_out > v_check_in;

    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Date conflict detected';
    END IF;

    -- Update booking status
    UPDATE bookings SET status = 'confirmed', updated_at = NOW()
    WHERE booking_id = p_booking_id;

    -- Create payment record
    INSERT INTO payments (booking_id, amount, payment_status, invoice_number)
    VALUES (p_booking_id, v_total_price, 'completed',
            CONCAT('INV-', YEAR(NOW()), '-', LPAD(p_booking_id, 6, '0')));

    -- Get host_id
    SELECT host_id INTO v_host_id FROM properties WHERE property_id = v_property_id;

    -- Notify guest
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (v_guest_id, 'booking_confirmed', 'Booking Confirmed',
            CONCAT('Your booking has been confirmed!'), p_booking_id, 'booking');

    COMMIT;
END //

-- ============================================================
-- PROCEDURE 3: Generate Invoice Data
-- ============================================================
CREATE PROCEDURE sp_generate_invoice(
    IN p_booking_id INT
)
BEGIN
    SELECT
        b.booking_id,
        p.title AS property_title,
        p.address,
        p.city,
        CONCAT(gu.first_name, ' ', gu.last_name) AS guest_name,
        gu.email AS guest_email,
        CONCAT(hu.first_name, ' ', hu.last_name) AS host_name,
        b.check_in,
        b.check_out,
        b.total_nights,
        b.price_per_night,
        b.cleaning_fee,
        b.service_fee,
        b.total_price,
        b.num_guests,
        pay.invoice_number,
        pay.payment_method,
        pay.payment_status,
        pay.paid_at
    FROM bookings b
    JOIN properties p ON b.property_id = p.property_id
    JOIN users gu ON b.guest_id = gu.user_id
    JOIN users hu ON p.host_id = hu.user_id
    LEFT JOIN payments pay ON b.booking_id = pay.booking_id
    WHERE b.booking_id = p_booking_id;
END //

-- ============================================================
-- PROCEDURE 4: Advanced Property Search
-- ============================================================
CREATE PROCEDURE sp_search_properties(
    IN p_city VARCHAR(100),
    IN p_check_in DATE,
    IN p_check_out DATE,
    IN p_guests INT,
    IN p_min_price DECIMAL(10,2),
    IN p_max_price DECIMAL(10,2)
)
BEGIN
    SELECT p.*, pi.image_url AS primary_image,
           hp.is_superhost,
           CONCAT(u.first_name, ' ', u.last_name) AS host_name,
           u.profile_image AS host_avatar
    FROM properties p
    LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
    JOIN users u ON p.host_id = u.user_id
    LEFT JOIN host_profiles hp ON u.user_id = hp.user_id
    WHERE p.is_active = 1
    AND p.is_approved = 1
    AND (p_city IS NULL OR p.city LIKE CONCAT('%', p_city, '%'))
    AND (p_guests IS NULL OR p.max_guests >= p_guests)
    AND (p_min_price IS NULL OR p.price_per_night >= p_min_price)
    AND (p_max_price IS NULL OR p.price_per_night <= p_max_price)
    AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.property_id = p.property_id
        AND b.status IN ('confirmed', 'pending')
        AND p_check_in < b.check_out
        AND p_check_out > b.check_in
    )
    ORDER BY p.average_rating DESC, p.total_reviews DESC;
END //

-- ============================================================
-- PROCEDURE 5: Cancel Booking with Penalty
-- ============================================================
CREATE PROCEDURE sp_cancel_booking(
    IN p_booking_id INT,
    IN p_reason TEXT
)
BEGIN
    DECLARE v_check_in DATE;
    DECLARE v_total_price DECIMAL(10,2);
    DECLARE v_refund DECIMAL(10,2);
    DECLARE v_days_until INT;

    START TRANSACTION;

    SELECT check_in, total_price INTO v_check_in, v_total_price
    FROM bookings WHERE booking_id = p_booking_id;

    SET v_days_until = DATEDIFF(v_check_in, CURDATE());

    -- Calculate refund based on cancellation policy
    IF v_days_until > 7 THEN
        SET v_refund = v_total_price;
    ELSEIF v_days_until > 2 THEN
        SET v_refund = v_total_price * 0.5;
    ELSE
        SET v_refund = 0;
    END IF;

    UPDATE bookings
    SET status = 'cancelled',
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE booking_id = p_booking_id;

    COMMIT;

    SELECT v_refund AS refund_amount, v_days_until AS days_until_checkin;
END //

-- ============================================================
-- PROCEDURE 6: Platform Statistics
-- ============================================================
CREATE PROCEDURE sp_calculate_platform_stats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'host') AS total_hosts,
        (SELECT COUNT(*) FROM properties WHERE is_active = 1) AS total_properties,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') AS total_bookings,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed') AS total_revenue,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews) AS avg_platform_rating,
        (SELECT COUNT(DISTINCT city) FROM properties) AS cities_covered;
END //

DELIMITER ;
