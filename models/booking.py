from models.db import query_db, execute_db, get_db, close_db
from datetime import datetime


class Booking:
    @staticmethod
    def create(property_id, guest_id, check_in, check_out, num_guests,
               price_per_night, cleaning_fee, service_fee, total_price, special_requests=None):
        """Create a new booking request. Trigger prevents double booking."""
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d')
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d')
        total_nights = (check_out_date - check_in_date).days

        if total_nights <= 0:
            raise ValueError("Check-out must be after check-in")

        try:
            booking_id = execute_db(
                """INSERT INTO bookings (property_id, guest_id, check_in, check_out,
                   num_guests, total_nights, price_per_night, cleaning_fee, service_fee,
                   total_price, status, special_requests)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)""",
                (property_id, guest_id, check_in, check_out, num_guests, total_nights,
                 price_per_night, cleaning_fee, service_fee, total_price, special_requests)
            )
            return booking_id
        except Exception as e:
            if 'DOUBLE_BOOKING' in str(e):
                raise ValueError("These dates are already booked")
            raise

    @staticmethod
    def get_by_id(booking_id):
        """Get booking with full details."""
        booking = query_db(
            """SELECT b.*, p.title AS property_title, p.address, p.city, p.state,
                      p.host_id,
                      pi.image_url AS property_image,
                      gu.first_name AS guest_first_name, gu.last_name AS guest_last_name,
                      gu.email AS guest_email, gu.phone_number AS guest_phone,
                      hu.first_name AS host_first_name, hu.last_name AS host_last_name,
                      hu.email AS host_email
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
               JOIN users gu ON b.guest_id = gu.user_id
               JOIN users hu ON p.host_id = hu.user_id
               WHERE b.booking_id = ?""",
            (booking_id,), one=True
        )
        return dict(booking) if booking else None

    @staticmethod
    def get_guest_bookings(guest_id):
        """Get all bookings for a guest."""
        bookings = query_db(
            """SELECT b.*, p.title AS property_title, p.city, p.state,
                      pi.image_url AS property_image,
                      p.host_id,
                      hu.first_name AS host_first_name, hu.last_name AS host_last_name,
                      (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.booking_id) AS has_review
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
               JOIN users hu ON p.host_id = hu.user_id
               WHERE b.guest_id = ?
               ORDER BY b.created_at DESC""",
            (guest_id,)
        )
        return [dict(b) for b in bookings]

    @staticmethod
    def get_host_requests(host_id, status=None):
        """Get booking requests for a host's properties."""
        query = """
            SELECT b.*, p.title AS property_title, p.city,
                   pi.image_url AS property_image,
                   gu.first_name AS guest_first_name, gu.last_name AS guest_last_name,
                   gu.email AS guest_email, gu.profile_image AS guest_avatar
            FROM bookings b
            JOIN properties p ON b.property_id = p.property_id
            LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
            JOIN users gu ON b.guest_id = gu.user_id
            WHERE p.host_id = ?
        """
        params = [host_id]
        if status:
            query += " AND b.status = ?"
            params.append(status)
        query += " ORDER BY b.created_at DESC"

        bookings = query_db(query, params)
        return [dict(b) for b in bookings]

    @staticmethod
    def approve(booking_id, host_id):
        """Host approves a booking - implements sp_confirm_booking logic."""
        db = get_db()
        try:
            # Verify ownership and status
            booking = db.execute(
                """SELECT b.*, p.host_id FROM bookings b
                   JOIN properties p ON b.property_id = p.property_id
                   WHERE b.booking_id = ? AND p.host_id = ? AND b.status = 'pending'""",
                (booking_id, host_id)
            ).fetchone()

            if not booking:
                return False, "Booking not found or not in pending status"

            # Check for conflicts
            conflict = db.execute(
                """SELECT COUNT(*) as cnt FROM bookings
                   WHERE property_id = ? AND booking_id != ?
                   AND status = 'confirmed'
                   AND check_in < ? AND check_out > ?""",
                (booking['property_id'], booking_id,
                 booking['check_out'], booking['check_in'])
            ).fetchone()

            if conflict['cnt'] > 0:
                return False, "Date conflict with another confirmed booking"

            # Confirm booking
            db.execute(
                "UPDATE bookings SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?",
                (booking_id,)
            )

            # Create payment record
            invoice_number = f"INV-{datetime.now().year}-{str(booking_id).zfill(6)}"
            transaction_id = f"TXN-{datetime.now().year}-{str(booking_id).zfill(6)}"
            db.execute(
                """INSERT INTO payments (booking_id, amount, payment_status, transaction_id,
                   invoice_number, paid_at) VALUES (?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)""",
                (booking_id, booking['total_price'], transaction_id, invoice_number)
            )

            # Notify guest
            db.execute(
                """INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
                   VALUES (?, 'booking_confirmed', 'Booking Confirmed',
                   'Your booking has been confirmed! Get ready for your trip.', ?, 'booking')""",
                (booking['guest_id'], booking_id)
            )

            # Award Loyalty Points
            points_earned = int(booking['total_price'] / 100.0)
            if points_earned > 0:
                db.execute(
                    "UPDATE users SET loyalty_points = loyalty_points + ? WHERE user_id = ?",
                    (points_earned, booking['guest_id'])
                )
                db.execute(
                    """INSERT INTO loyalty_transactions (user_id, booking_id, points, transaction_type)
                       VALUES (?, ?, ?, 'earned')""",
                    (booking['guest_id'], booking_id, points_earned)
                )

            db.commit()
            return True, "Booking confirmed successfully"
        except Exception as e:
            db.rollback()
            return False, str(e)
        finally:
            close_db(db)

    @staticmethod
    def reject(booking_id, host_id, reason=None):
        """Host rejects a booking."""
        db = get_db()
        try:
            result = db.execute(
                """UPDATE bookings SET status = 'rejected', cancellation_reason = ?,
                   updated_at = CURRENT_TIMESTAMP
                   WHERE booking_id = ? AND status = 'pending'
                   AND property_id IN (SELECT property_id FROM properties WHERE host_id = ?)""",
                (reason or 'Rejected by host', booking_id, host_id)
            )

            if result.rowcount == 0:
                return False, "Booking not found or not in pending status"

            # Get guest_id for notification
            booking = db.execute("SELECT guest_id FROM bookings WHERE booking_id = ?",
                                (booking_id,)).fetchone()
            if booking:
                db.execute(
                    """INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
                       VALUES (?, 'booking_rejected', 'Booking Declined',
                       'Unfortunately, your booking request was declined.', ?, 'booking')""",
                    (booking['guest_id'], booking_id)
                )

            db.commit()
            return True, "Booking rejected"
        except Exception as e:
            db.rollback()
            return False, str(e)
        finally:
            close_db(db)

    @staticmethod
    def cancel(booking_id, user_id, reason=None):
        """Cancel a booking - implements sp_cancel_booking logic with penalties."""
        db = get_db()
        try:
            booking = db.execute(
                "SELECT * FROM bookings WHERE booking_id = ? AND (guest_id = ? OR property_id IN (SELECT property_id FROM properties WHERE host_id = ?))",
                (booking_id, user_id, user_id)
            ).fetchone()

            if not booking:
                return False, "Booking not found", 0

            if booking['status'] not in ('pending', 'confirmed'):
                return False, "Cannot cancel this booking", 0

            # Calculate refund based on days until check-in
            days_until = (datetime.strptime(booking['check_in'], '%Y-%m-%d') - datetime.now()).days
            if days_until > 7:
                refund_pct = 100
            elif days_until > 2:
                refund_pct = 50
            else:
                refund_pct = 0

            refund_amount = booking['total_price'] * (refund_pct / 100)

            db.execute(
                """UPDATE bookings SET status = 'cancelled', cancellation_reason = ?,
                   updated_at = CURRENT_TIMESTAMP WHERE booking_id = ?""",
                (reason or 'Cancelled by user', booking_id)
            )

            # Update payment if exists
            db.execute(
                """UPDATE payments SET payment_status = CASE WHEN ? = 100 THEN 'refunded' ELSE payment_status END
                   WHERE booking_id = ?""",
                (refund_pct, booking_id)
            )

            db.commit()
            return True, f"Booking cancelled. Refund: {refund_pct}%", refund_amount
        except Exception as e:
            db.rollback()
            return False, str(e), 0
        finally:
            close_db(db)

    @staticmethod
    def get_upcoming_for_host(host_id, limit=5):
        """Get upcoming bookings for host dashboard."""
        bookings = query_db(
            """SELECT b.*, p.title AS property_title,
                      gu.first_name AS guest_first_name, gu.last_name AS guest_last_name,
                      gu.profile_image AS guest_avatar
               FROM bookings b
               JOIN properties p ON b.property_id = p.property_id
               JOIN users gu ON b.guest_id = gu.user_id
               WHERE p.host_id = ? AND b.status = 'confirmed'
               AND b.check_in >= date('now')
               ORDER BY b.check_in ASC LIMIT ?""",
            (host_id, limit)
        )
        return [dict(b) for b in bookings]
