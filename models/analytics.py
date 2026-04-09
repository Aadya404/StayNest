from models.db import query_db


class Analytics:
    """
    Python implementations of cursor-based analytics.
    These correspond to the MySQL stored procedures and cursors
    in database/procedures.sql and database/cursors.sql
    """

    @staticmethod
    def get_host_dashboard(host_id):
        """sp_monthly_host_report equivalent - Host dashboard data."""
        # Total revenue
        revenue = query_db(
            """SELECT COALESCE(SUM(pay.amount), 0) AS total
               FROM payments pay
               JOIN bookings b ON pay.booking_id = b.booking_id
               JOIN properties p ON b.property_id = p.property_id
               WHERE p.host_id = ? AND pay.payment_status = 'completed'""",
            (host_id,), one=True
        )

        # Booking stats
        bookings = query_db(
            """SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               WHERE p.host_id = ?""",
            (host_id,), one=True
        )

        # Average rating
        rating = query_db(
            """SELECT COALESCE(AVG(r.rating), 0) AS avg_rating, COUNT(*) AS total_reviews
               FROM reviews r
               JOIN properties p ON r.property_id = p.property_id
               WHERE p.host_id = ?""",
            (host_id,), one=True
        )

        # Property count
        prop_count = query_db(
            "SELECT COUNT(*) AS count FROM properties WHERE host_id = ? AND is_active = 1",
            (host_id,), one=True
        )

        # Occupancy rate (last 30 days)
        occupancy = query_db(
            """SELECT COALESCE(SUM(b.total_nights), 0) AS booked_nights
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               WHERE p.host_id = ? AND b.status IN ('confirmed', 'completed')
               AND b.check_in >= date('now', '-30 days')""",
            (host_id,), one=True
        )
        total_available = (prop_count['count'] or 1) * 30
        occ_rate = round((occupancy['booked_nights'] / total_available) * 100, 1) if total_available > 0 else 0

        return {
            'total_revenue': revenue['total'] or 0,
            'total_bookings': bookings['total'] or 0,
            'pending_bookings': bookings['pending'] or 0,
            'confirmed_bookings': bookings['confirmed'] or 0,
            'completed_bookings': bookings['completed'] or 0,
            'cancelled_bookings': bookings['cancelled'] or 0,
            'average_rating': round(rating['avg_rating'] or 0, 1),
            'total_reviews': rating['total_reviews'] or 0,
            'total_properties': prop_count['count'] or 0,
            'occupancy_rate': occ_rate
        }

    @staticmethod
    def get_revenue_trends(host_id, months=6):
        """Cursor-based revenue trends - sp_revenue_trends equivalent."""
        trends = query_db(
            """SELECT strftime('%%Y-%%m', b.check_in) AS month,
                      COALESCE(SUM(pay.amount), 0) AS revenue,
                      COUNT(DISTINCT b.booking_id) AS bookings
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               LEFT JOIN payments pay ON b.booking_id = pay.booking_id
                   AND pay.payment_status = 'completed'
               WHERE p.host_id = ? AND b.status IN ('confirmed', 'completed')
               AND b.check_in >= date('now', ? || ' months')
               GROUP BY strftime('%%Y-%%m', b.check_in)
               ORDER BY month""",
            (host_id, f"-{months}")
        )
        return [dict(t) for t in trends]

    @staticmethod
    def get_top_properties(host_id=None, limit=10):
        """Cursor-based top properties - sp_top_properties_by_revenue equivalent."""
        query = """
            SELECT p.property_id, p.title, p.city,
                   pi.image_url AS primary_image,
                   COALESCE(SUM(pay.amount), 0) AS total_revenue,
                   COUNT(DISTINCT b.booking_id) AS booking_count,
                   p.average_rating, p.total_reviews
            FROM properties p
            LEFT JOIN bookings b ON p.property_id = b.property_id
                AND b.status IN ('confirmed', 'completed')
            LEFT JOIN payments pay ON b.booking_id = pay.booking_id
                AND pay.payment_status = 'completed'
            LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
            WHERE p.is_active = 1
        """
        params = []
        if host_id:
            query += " AND p.host_id = ?"
            params.append(host_id)
        query += " GROUP BY p.property_id ORDER BY total_revenue DESC LIMIT ?"
        params.append(limit)

        props = query_db(query, params)
        return [dict(p) for p in props]

    @staticmethod
    def get_listings_performance(host_id):
        """Get per-listing performance metrics for host."""
        listings = query_db(
            """SELECT p.property_id, p.title, p.city, p.price_per_night,
                      p.average_rating, p.total_reviews,
                      pi.image_url AS primary_image,
                      COUNT(DISTINCT b.booking_id) AS total_bookings,
                      COALESCE(SUM(CASE WHEN pay.payment_status = 'completed' THEN pay.amount ELSE 0 END), 0) AS revenue,
                      COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.total_nights ELSE 0 END), 0) AS total_nights_booked
               FROM properties p
               LEFT JOIN bookings b ON p.property_id = b.property_id
               LEFT JOIN payments pay ON b.booking_id = pay.booking_id
               LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
               WHERE p.host_id = ? AND p.is_active = 1
               GROUP BY p.property_id
               ORDER BY revenue DESC""",
            (host_id,)
        )
        return [dict(l) for l in listings]

    @staticmethod
    def get_platform_stats():
        """sp_calculate_platform_stats equivalent."""
        stats = query_db(
            """SELECT
                (SELECT COUNT(*) FROM users WHERE is_active = 1) AS total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'host') AS total_hosts,
                (SELECT COUNT(*) FROM properties WHERE is_active = 1) AS total_properties,
                (SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed', 'completed')) AS total_bookings,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed') AS total_revenue,
                (SELECT ROUND(COALESCE(AVG(rating), 0), 1) FROM reviews) AS avg_rating,
                (SELECT COUNT(DISTINCT city) FROM properties WHERE is_active = 1) AS cities_covered""",
            one=True
        )
        return dict(stats) if stats else {}

    @staticmethod
    def get_bookings_by_city():
        """City-wise booking analytics."""
        data = query_db(
            """SELECT p.city, COUNT(*) AS bookings,
                      COALESCE(SUM(pay.amount), 0) AS revenue
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               LEFT JOIN payments pay ON b.booking_id = pay.booking_id
                   AND pay.payment_status = 'completed'
               WHERE b.status IN ('confirmed', 'completed')
               GROUP BY p.city
               ORDER BY bookings DESC"""
        )
        return [dict(d) for d in data]

    @staticmethod
    def get_monthly_bookings(months=6):
        """Monthly booking trends platform-wide."""
        data = query_db(
            """SELECT strftime('%%Y-%%m', b.check_in) AS month,
                      COUNT(*) AS bookings,
                      COALESCE(SUM(pay.amount), 0) AS revenue
               FROM bookings b
               LEFT JOIN payments pay ON b.booking_id = pay.booking_id
                   AND pay.payment_status = 'completed'
               WHERE b.status IN ('confirmed', 'completed')
               AND b.check_in >= date('now', ? || ' months')
               GROUP BY strftime('%%Y-%%m', b.check_in)
               ORDER BY month""",
            (f"-{months}",)
        )
        return [dict(d) for d in data]
