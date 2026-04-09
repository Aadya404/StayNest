from models.db import query_db, execute_db


class Payment:
    @staticmethod
    def get_by_booking(booking_id):
        """Get payment details for a booking."""
        payment = query_db(
            "SELECT * FROM payments WHERE booking_id = ?",
            (booking_id,), one=True
        )
        return dict(payment) if payment else None

    @staticmethod
    def get_invoice_data(booking_id):
        """Get full invoice data - implements sp_generate_invoice."""
        data = query_db(
            """SELECT
                b.booking_id, b.check_in, b.check_out, b.total_nights,
                b.price_per_night, b.cleaning_fee, b.service_fee, b.total_price,
                b.num_guests, b.status,
                p.title AS property_title, p.address, p.city, p.state, p.country,
                gu.first_name AS guest_first_name, gu.last_name AS guest_last_name,
                gu.email AS guest_email, gu.phone_number AS guest_phone,
                hu.first_name AS host_first_name, hu.last_name AS host_last_name,
                hu.email AS host_email,
                pay.invoice_number, pay.payment_method, pay.payment_status,
                pay.paid_at, pay.transaction_id
            FROM bookings b
            JOIN properties p ON b.property_id = p.property_id
            JOIN users gu ON b.guest_id = gu.user_id
            JOIN users hu ON p.host_id = hu.user_id
            LEFT JOIN payments pay ON b.booking_id = pay.booking_id
            WHERE b.booking_id = ?""",
            (booking_id,), one=True
        )
        return dict(data) if data else None

    @staticmethod
    def get_host_payments(host_id):
        """Get all payments for a host's properties."""
        payments = query_db(
            """SELECT pay.*, b.check_in, b.check_out,
                      p.title AS property_title,
                      gu.first_name AS guest_first_name, gu.last_name AS guest_last_name
               FROM payments pay
               JOIN bookings b ON pay.booking_id = b.booking_id
               JOIN properties p ON b.property_id = p.property_id
               JOIN users gu ON b.guest_id = gu.user_id
               WHERE p.host_id = ? AND pay.payment_status = 'completed'
               ORDER BY pay.paid_at DESC""",
            (host_id,)
        )
    @staticmethod
    def confirm(booking_id, amount, method, transaction_id):
        """Confirm a payment and update booking status."""
        from models.booking import Booking
        
        # Create payment record
        invoice_num = f"INV-{transaction_id[-6:]}"
        execute_db(
            """INSERT INTO payments (booking_id, amount, payment_method, payment_status,
               transaction_id, invoice_number, paid_at)
               VALUES (?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)""",
            (booking_id, amount, method, transaction_id, invoice_num)
        )
        
        # Update booking status to confirmed
        execute_db(
            "UPDATE bookings SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?",
            (booking_id,)
        )
        
        # Get host_id for notification
        booking = Booking.get_by_id(booking_id)
        if booking:
            # Notify Host
            Notification.create(
                booking['host_id'], 
                'payment_received',
                'Payment Received',
                f"Payment of Rs.{amount} received for {booking['property_title']}.",
                booking_id, 'booking'
            )
            # Notify Guest
            Notification.create(
                booking['guest_id'],
                'booking_confirmed',
                'Booking Confirmed',
                f"Your booking for {booking['property_title']} is confirmed!",
                booking_id, 'booking'
            )
            
        return True


class Review:
    @staticmethod
    def create(booking_id, property_id, guest_id, rating, comment,
               cleanliness=None, accuracy=None, checkin=None,
               communication=None, location=None, value=None):
        """Create a review for a completed booking."""
        # Verify booking belongs to guest and is completed
        booking = query_db(
            "SELECT * FROM bookings WHERE booking_id = ? AND guest_id = ? AND status IN ('completed', 'confirmed')",
            (booking_id, guest_id), one=True
        )
        if not booking:
            raise ValueError("Invalid booking or not eligible for review")

        # Check if review already exists
        existing = query_db(
            "SELECT * FROM reviews WHERE booking_id = ?",
            (booking_id,), one=True
        )
        if existing:
            raise ValueError("Review already submitted for this booking")

        review_id = execute_db(
            """INSERT INTO reviews (booking_id, property_id, guest_id, rating,
               cleanliness_rating, accuracy_rating, checkin_rating,
               communication_rating, location_rating, value_rating, comment)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (booking_id, property_id, guest_id, rating,
             cleanliness, accuracy, checkin, communication, location, value, comment)
        )
        return review_id

    @staticmethod
    def get_by_property(property_id, limit=10):
        """Get reviews for a property."""
        reviews = query_db(
            """SELECT r.*, u.first_name, u.last_name, u.profile_image
               FROM reviews r
               JOIN users u ON r.guest_id = u.user_id
               WHERE r.property_id = ?
               ORDER BY r.created_at DESC LIMIT ?""",
            (property_id, limit)
        )
        return [dict(r) for r in reviews]

    @staticmethod
    def get_property_stats(property_id):
        """Get review statistics for a property."""
        stats = query_db(
            """SELECT
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating), 1) AS avg_rating,
                ROUND(AVG(cleanliness_rating), 1) AS avg_cleanliness,
                ROUND(AVG(accuracy_rating), 1) AS avg_accuracy,
                ROUND(AVG(checkin_rating), 1) AS avg_checkin,
                ROUND(AVG(communication_rating), 1) AS avg_communication,
                ROUND(AVG(location_rating), 1) AS avg_location,
                ROUND(AVG(value_rating), 1) AS avg_value
               FROM reviews WHERE property_id = ?""",
            (property_id,), one=True
        )
        return dict(stats) if stats else None


class Wishlist:
    @staticmethod
    def toggle(user_id, property_id):
        """Add or remove property from wishlist."""
        existing = query_db(
            "SELECT * FROM wishlists WHERE user_id = ? AND property_id = ?",
            (user_id, property_id), one=True
        )
        if existing:
            execute_db(
                "DELETE FROM wishlists WHERE user_id = ? AND property_id = ?",
                (user_id, property_id)
            )
            return False  # Removed
        else:
            execute_db(
                "INSERT INTO wishlists (user_id, property_id) VALUES (?, ?)",
                (user_id, property_id)
            )
            return True  # Added

    @staticmethod
    def get_user_wishlist(user_id):
        """Get all wishlisted properties for a user."""
        props = query_db(
            """SELECT p.*, pi.image_url AS primary_image,
                       c.name AS category_name,
                       u.first_name AS host_first_name, u.last_name AS host_last_name,
                       u.profile_image AS host_avatar_url,
                       hp.is_superhost
                FROM wishlists w
                JOIN properties p ON w.property_id = p.property_id
                LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
                LEFT JOIN categories c ON p.category_id = c.category_id
                JOIN users u ON p.host_id = u.user_id
                LEFT JOIN host_profiles hp ON u.user_id = hp.user_id
                WHERE w.user_id = ? AND p.is_active = 1
                ORDER BY w.created_at DESC""",
            (user_id,)
        )
        return [dict(p) for p in props]

    @staticmethod
    def get_user_wishlist_ids(user_id):
        """Get list of wishlisted property IDs for a user."""
        rows = query_db(
            "SELECT property_id FROM wishlists WHERE user_id = ?",
            (user_id,)
        )
        return [r['property_id'] for r in rows]


class Message:
    @staticmethod
    def send(sender_id, receiver_id, content, property_id=None, booking_id=None):
        """Send a message."""
        return execute_db(
            """INSERT INTO messages (sender_id, receiver_id, property_id, booking_id, content)
               VALUES (?, ?, ?, ?, ?)""",
            (sender_id, receiver_id, property_id, booking_id, content)
        )

    @staticmethod
    def get_conversations(user_id):
        """Get list of conversations for a user."""
        conversations = query_db(
            """SELECT
                CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
                u.first_name, u.last_name, u.profile_image,
                m.content AS last_message,
                m.created_at AS last_message_at,
                (SELECT COUNT(*) FROM messages m2
                 WHERE m2.sender_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
                 AND m2.receiver_id = ? AND m2.is_read = 0) AS unread_count
               FROM messages m
               JOIN users u ON u.user_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
               WHERE m.message_id IN (
                   SELECT MAX(message_id) FROM messages
                   WHERE sender_id = ? OR receiver_id = ?
                   GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
               )
               ORDER BY m.created_at DESC""",
            (user_id, user_id, user_id, user_id, user_id, user_id, user_id)
        )
        return [dict(c) for c in conversations]

    @staticmethod
    def get_thread(user_id, other_user_id):
        """Get message thread between two users."""
        # Mark as read
        execute_db(
            "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?",
            (other_user_id, user_id)
        )

        messages = query_db(
            """SELECT m.*, u.first_name, u.last_name, u.profile_image
               FROM messages m
               JOIN users u ON m.sender_id = u.user_id
               WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
               ORDER BY m.created_at ASC""",
            (user_id, other_user_id, other_user_id, user_id)
        )
        return [dict(m) for m in messages]

    @staticmethod
    def get_unread_count(user_id):
        """Get total unread message count."""
        result = query_db(
            "SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = 0",
            (user_id,), one=True
        )
        return result['count'] if result else 0


class Notification:
    @staticmethod
    def get_for_user(user_id, limit=20):
        """Get notifications for a user."""
        notifs = query_db(
            """SELECT * FROM notifications WHERE user_id = ?
               ORDER BY created_at DESC LIMIT ?""",
            (user_id, limit)
        )
        return [dict(n) for n in notifs]

    @staticmethod
    def mark_read(notification_id, user_id):
        """Mark a notification as read."""
        execute_db(
            "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?",
            (notification_id, user_id)
        )

    @staticmethod
    def mark_all_read(user_id):
        """Mark all notifications as read."""
        execute_db(
            "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
            (user_id,)
        )

    @staticmethod
    def get_unread_count(user_id):
        """Get unread notification count."""
        result = query_db(
            "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
            (user_id,), one=True
        )
        return result['count'] if result else 0

    @staticmethod
    def create(user_id, notif_type, title, message, reference_id=None, reference_type=None):
        """Create a new notification."""
        return execute_db(
            """INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, notif_type, title, message, reference_id, reference_type)
        )
