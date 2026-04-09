-- ============================================================
-- StayNest - Cursor-Based Analytics (MySQL Syntax)
-- For academic reference - implemented in Python for SQLite
-- ============================================================

DELIMITER //

-- ============================================================
-- CURSOR 1: Top Properties by Revenue
-- Iterates through all properties and ranks them by revenue
-- ============================================================
CREATE PROCEDURE sp_top_properties_by_revenue(IN p_limit INT)
BEGIN
    DECLARE v_property_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_revenue DECIMAL(10,2);
    DECLARE v_booking_count INT;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_rank INT DEFAULT 0;

    DECLARE property_cursor CURSOR FOR
        SELECT p.property_id, p.title,
               COALESCE(SUM(pay.amount), 0) AS total_revenue,
               COUNT(b.booking_id) AS booking_count
        FROM properties p
        LEFT JOIN bookings b ON p.property_id = b.property_id
            AND b.status IN ('confirmed', 'completed')
        LEFT JOIN payments pay ON b.booking_id = pay.booking_id
            AND pay.payment_status = 'completed'
        GROUP BY p.property_id, p.title
        ORDER BY total_revenue DESC
        LIMIT p_limit;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_top_properties (
        rank_position INT,
        property_id INT,
        title VARCHAR(255),
        total_revenue DECIMAL(10,2),
        booking_count INT
    );

    TRUNCATE TABLE temp_top_properties;

    OPEN property_cursor;

    read_loop: LOOP
        FETCH property_cursor INTO v_property_id, v_title, v_revenue, v_booking_count;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        SET v_rank = v_rank + 1;

        INSERT INTO temp_top_properties
        VALUES (v_rank, v_property_id, v_title, v_revenue, v_booking_count);
    END LOOP;

    CLOSE property_cursor;

    SELECT * FROM temp_top_properties;
    DROP TEMPORARY TABLE temp_top_properties;
END //

-- ============================================================
-- CURSOR 2: Monthly Revenue Trends
-- Iterates month by month to build revenue trend data
-- ============================================================
CREATE PROCEDURE sp_revenue_trends(IN p_host_id INT, IN p_months INT)
BEGIN
    DECLARE v_month DATE;
    DECLARE v_revenue DECIMAL(10,2);
    DECLARE v_bookings INT;
    DECLARE v_done INT DEFAULT FALSE;

    DECLARE month_cursor CURSOR FOR
        SELECT DATE_FORMAT(b.check_in, '%Y-%m-01') AS month,
               COALESCE(SUM(pay.amount), 0) AS revenue,
               COUNT(DISTINCT b.booking_id) AS bookings
        FROM bookings b
        JOIN properties p ON b.property_id = p.property_id
        LEFT JOIN payments pay ON b.booking_id = pay.booking_id
            AND pay.payment_status = 'completed'
        WHERE p.host_id = p_host_id
        AND b.status IN ('confirmed', 'completed')
        AND b.check_in >= DATE_SUB(CURDATE(), INTERVAL p_months MONTH)
        GROUP BY DATE_FORMAT(b.check_in, '%Y-%m-01')
        ORDER BY month;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_revenue_trends (
        month DATE,
        revenue DECIMAL(10,2),
        bookings INT
    );

    TRUNCATE TABLE temp_revenue_trends;

    OPEN month_cursor;

    read_loop: LOOP
        FETCH month_cursor INTO v_month, v_revenue, v_bookings;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        INSERT INTO temp_revenue_trends VALUES (v_month, v_revenue, v_bookings);
    END LOOP;

    CLOSE month_cursor;

    SELECT * FROM temp_revenue_trends;
    DROP TEMPORARY TABLE temp_revenue_trends;
END //

-- ============================================================
-- CURSOR 3: Host Performance Ranking
-- Ranks hosts by composite score (rating + bookings + revenue)
-- ============================================================
CREATE PROCEDURE sp_host_ranking()
BEGIN
    DECLARE v_host_id INT;
    DECLARE v_host_name VARCHAR(255);
    DECLARE v_rating DECIMAL(3,2);
    DECLARE v_bookings INT;
    DECLARE v_revenue DECIMAL(10,2);
    DECLARE v_score DECIMAL(10,2);
    DECLARE v_done INT DEFAULT FALSE;

    DECLARE host_cursor CURSOR FOR
        SELECT u.user_id,
               CONCAT(u.first_name, ' ', u.last_name) AS host_name,
               COALESCE(hp.average_rating, 0) AS avg_rating,
               COALESCE(hp.total_bookings, 0) AS total_bookings,
               COALESCE(hp.total_revenue, 0) AS total_revenue
        FROM users u
        JOIN host_profiles hp ON u.user_id = hp.user_id
        WHERE u.role = 'host';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_host_ranking (
        host_id INT,
        host_name VARCHAR(255),
        avg_rating DECIMAL(3,2),
        total_bookings INT,
        total_revenue DECIMAL(10,2),
        composite_score DECIMAL(10,2)
    );

    TRUNCATE TABLE temp_host_ranking;

    OPEN host_cursor;

    read_loop: LOOP
        FETCH host_cursor INTO v_host_id, v_host_name, v_rating, v_bookings, v_revenue;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Composite score = weighted combination
        SET v_score = (v_rating * 20) + (v_bookings * 2) + (v_revenue / 1000);

        INSERT INTO temp_host_ranking
        VALUES (v_host_id, v_host_name, v_rating, v_bookings, v_revenue, v_score);
    END LOOP;

    CLOSE host_cursor;

    SELECT * FROM temp_host_ranking ORDER BY composite_score DESC;
    DROP TEMPORARY TABLE temp_host_ranking;
END //

-- ============================================================
-- CURSOR 4: Occupancy Rate Calculator
-- Calculates per-property occupancy rate for a given period
-- ============================================================
CREATE PROCEDURE sp_occupancy_rates(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
    DECLARE v_property_id INT;
    DECLARE v_title VARCHAR(255);
    DECLARE v_booked_nights INT;
    DECLARE v_total_days INT;
    DECLARE v_occupancy DECIMAL(5,2);
    DECLARE v_done INT DEFAULT FALSE;

    DECLARE occ_cursor CURSOR FOR
        SELECT p.property_id, p.title,
               COALESCE(SUM(
                   DATEDIFF(
                       LEAST(b.check_out, p_end_date),
                       GREATEST(b.check_in, p_start_date)
                   )
               ), 0) AS booked_nights
        FROM properties p
        LEFT JOIN bookings b ON p.property_id = b.property_id
            AND b.status IN ('confirmed', 'completed')
            AND b.check_in < p_end_date
            AND b.check_out > p_start_date
        WHERE p.is_active = 1
        GROUP BY p.property_id, p.title;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    SET v_total_days = DATEDIFF(p_end_date, p_start_date);

    OPEN occ_cursor;

    read_loop: LOOP
        FETCH occ_cursor INTO v_property_id, v_title, v_booked_nights;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        SET v_occupancy = (v_booked_nights / v_total_days) * 100;

        SELECT v_property_id AS property_id,
               v_title AS title,
               v_booked_nights AS booked_nights,
               v_total_days AS total_days,
               v_occupancy AS occupancy_rate;
    END LOOP;

    CLOSE occ_cursor;
END //

DELIMITER ;
