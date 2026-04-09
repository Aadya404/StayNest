from flask import Blueprint, request, jsonify, render_template, session, send_file, redirect
from models.booking import Booking
from models.property import Property
from models.payment import Payment, Review, Wishlist, Message, Notification
from models.analytics import Analytics
from utils.decorators import login_required, host_required
from utils.pdf_generator import generate_invoice_pdf
from utils.email import send_booking_confirmation
import io

bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/api/bookings', methods=['POST'])
@login_required
def create_booking():
    data = request.get_json()
    try:
        listing_id = data.get('property_id')
        prop = Property.get_by_id(listing_id)
        if not prop:
            return jsonify({'success': False, 'error': 'Property not found'}), 404

        booking_id = Booking.create(
            property_id=listing_id,
            guest_id=session['user_id'],
            check_in=data['check_in'],
            check_out=data['check_out'],
            num_guests=int(data.get('num_guests', 1)),
            price_per_night=float(data['price_per_night']),
            cleaning_fee=float(data.get('cleaning_fee', 0)),
            service_fee=float(data.get('service_fee', 0)),
            total_price=float(data['total_price']),
            special_requests=data.get('special_requests')
        )
        return jsonify({'success': True, 'booking_id': booking_id, 'message': 'Booking request sent successfully!'})
    except Exception as e:
        import traceback; traceback.print_exc(); return jsonify({'success': False, 'error': str(e)}), 400


@bookings_bp.route('/api/payment/confirm', methods=['POST'])
@login_required
def confirm_payment():
    data = request.get_json()
    try:
        Payment.confirm(
            booking_id=data['booking_id'],
            amount=data['amount'],
            method=data['method'],
            transaction_id=data['payment_ref']
        )
        return jsonify({'success': True, 'message': 'Payment confirmed and booking verified'})
    except Exception as e:
        import traceback; traceback.print_exc(); return jsonify({'success': False, 'error': str(e)}), 400


@bookings_bp.route('/api/apply-voucher', methods=['POST'])
@login_required
def apply_voucher():
    from models.db import query_db
    data = request.get_json()
    code = data.get('code', '').upper()
    total = float(data.get('total', 0))
    voucher = query_db("SELECT * FROM vouchers WHERE code = ? AND is_active = 1", (code,), one=True)
    if not voucher: return jsonify({'success': False, 'error': 'Invalid or expired voucher code'}), 400
    
    if total < voucher['min_booking_amount']:
        return jsonify({'success': False, 'error': f"Minimum booking amount is Rs.{voucher['min_booking_amount']} for this voucher"}), 400
        
    discounted = voucher['discount_value']
    if voucher['discount_type'] == 'percentage':
        discounted = total * (voucher['discount_value'] / 100.0)
        
    return jsonify({'success': True, 'discount': discounted, 'message': f"Voucher applied! Saved Rs.{discounted}"})


@bookings_bp.route('/my-account')
@login_required
def my_account():
    # Gather everything for the unified Guest Dashboard
    from models.db import query_db
    bookings = Booking.get_guest_bookings(session['user_id'])
    wishlist = Wishlist.get_user_wishlist(session['user_id'])
    vouchers = query_db("SELECT * FROM vouchers WHERE is_active = 1")
    loyalty_tx = query_db("SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC", (session['user_id'],))
    
    return render_template('guest/dashboard.html', 
                           bookings=bookings, 
                           wishlist=wishlist, 
                           vouchers=vouchers,
                           loyalty_tx=loyalty_tx)


@bookings_bp.route('/my-trips')
@login_required
def my_trips():
    return redirect('/my-account?tab=bookings')

@bookings_bp.route('/wishlist')
@login_required
def wishlist():
    return redirect('/my-account?tab=wishlist')

@bookings_bp.route('/api/bookings/my-trips')
@login_required
def my_trips_api():
    bookings = Booking.get_guest_bookings(session['user_id'])
    return jsonify(bookings)


@bookings_bp.route('/api/bookings/<int:booking_id>/approve', methods=['PUT'])
@host_required
def approve_booking(booking_id):
    success, message = Booking.approve(booking_id, session['user_id'])
    if success:
        booking = Booking.get_by_id(booking_id)
        if booking:
            send_booking_confirmation(
                booking['guest_email'],
                booking['guest_first_name'],
                booking['property_title'],
                booking['check_in'],
                booking['check_out'],
                booking['total_price']
            )
    return jsonify({'success': success, 'message': message})


@bookings_bp.route('/api/bookings/<int:booking_id>/reject', methods=['PUT'])
@host_required
def reject_booking(booking_id):
    data = request.get_json() or {}
    success, message = Booking.reject(booking_id, session['user_id'], data.get('reason'))
    return jsonify({'success': success, 'message': message})


@bookings_bp.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT'])
@login_required
def cancel_booking(booking_id):
    data = request.get_json() or {}
    success, message, refund = Booking.cancel(booking_id, session['user_id'], data.get('reason'))
    return jsonify({'success': success, 'message': message, 'refund_amount': refund})


@bookings_bp.route('/api/bookings/<int:booking_id>/invoice')
@login_required
def get_invoice(booking_id):
    invoice_data = Payment.get_invoice_data(booking_id)
    if not invoice_data:
        return jsonify({'error': 'Invoice not found'}), 404

    # Check access
    booking = Booking.get_by_id(booking_id)
    if not booking or (booking['guest_id'] != session['user_id'] and
                       booking['host_id'] != session['user_id'] and
                       session.get('role') != 'admin'):
        return jsonify({'error': 'Access denied'}), 403

    pdf_bytes = generate_invoice_pdf(invoice_data)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"StayNest_Invoice_{invoice_data.get('invoice_number', booking_id)}.pdf"
    )


@bookings_bp.route('/invoice/<int:booking_id>')
@login_required
def view_invoice(booking_id):
    invoice_data = Payment.get_invoice_data(booking_id)
    if not invoice_data:
        return render_template('404.html'), 404
    return render_template('bookings/invoice.html', invoice=invoice_data)


# ============ Wishlist ============

@bookings_bp.route('/api/wishlist/toggle/<int:property_id>', methods=['POST'])
@login_required
def toggle_wishlist_attr(property_id):
    added = Wishlist.toggle(session['user_id'], property_id)
    return jsonify({'success': True, 'added': added, 'message': 'Added to wishlist' if added else 'Removed from wishlist'})


@bookings_bp.route('/api/wishlist', methods=['GET'])
@login_required
def get_wishlist_api():
    properties = Wishlist.get_user_wishlist(session['user_id'])
    return jsonify({'success': True, 'properties': properties})


@bookings_bp.route('/api/wishlist/ids', methods=['GET'])
@login_required
def get_wishlist_ids_api():
    ids = Wishlist.get_user_wishlist_ids(session['user_id'])
    return jsonify({'success': True, 'ids': ids})


@bookings_bp.route('/api/wishlist/toggle', methods=['POST'])
@login_required
def toggle_wishlist():
    data = request.get_json()
    property_id = data.get('property_id')
    added = Wishlist.toggle(session['user_id'], property_id)
    return jsonify({'success': True, 'added': added})


@bookings_bp.route('/wishlist')
@login_required
def wishlist_page():
    properties = Wishlist.get_user_wishlist(session['user_id'])
    return render_template('bookings/wishlist.html', properties=properties)


# ============ Reviews ============

@bookings_bp.route('/api/reviews', methods=['POST'])
@login_required
def create_review():
    data = request.get_json()
    try:
        review_id = Review.create(
            booking_id=data['booking_id'],
            property_id=data['property_id'],
            guest_id=session['user_id'],
            rating=int(data['rating']),
            comment=data.get('comment', ''),
            cleanliness=data.get('cleanliness_rating'),
            accuracy=data.get('accuracy_rating'),
            checkin=data.get('checkin_rating'),
            communication=data.get('communication_rating'),
            location=data.get('location_rating'),
            value=data.get('value_rating')
        )
        return jsonify({'success': True, 'review_id': review_id})
    except ValueError as e:
        import traceback; traceback.print_exc(); return jsonify({'success': False, 'error': str(e)}), 400


# ============ Messages (Disabled) ============
# Messaging functionality removed as per configuration

# ============ Notifications ============

@bookings_bp.route('/api/notifications')
@login_required
def get_notifications():
    notifications = Notification.get_for_user(session['user_id'])
    unread = Notification.get_unread_count(session['user_id'])
    return jsonify({'notifications': notifications, 'unread_count': unread})


@bookings_bp.route('/api/notifications/read', methods=['POST'])
@login_required
def mark_notifications_read():
    data = request.get_json() or {}
    if data.get('notification_id'):
        Notification.mark_read(data['notification_id'], session['user_id'])
    else:
        Notification.mark_all_read(session['user_id'])
    return jsonify({'success': True})
