from flask import Blueprint, request, jsonify, render_template, session
from models.booking import Booking
from models.property import Property
from models.analytics import Analytics
from models.payment import Payment, Notification
from utils.decorators import host_required

host_bp = Blueprint('host', __name__)


@host_bp.route('/host/dashboard')
@host_required
def dashboard():
    stats = Analytics.get_host_dashboard(session['user_id'])
    upcoming = Booking.get_upcoming_for_host(session['user_id'])
    revenue_trends = Analytics.get_revenue_trends(session['user_id'])
    top_properties = Analytics.get_top_properties(session['user_id'], 5)
    pending_requests = Booking.get_host_requests(session['user_id'], 'pending')
    return render_template('host/dashboard.html', stats=stats, upcoming=upcoming,
                          revenue_trends=revenue_trends, top_properties=top_properties,
                          pending_requests=pending_requests)


@host_bp.route('/api/host/dashboard')
@host_required
def dashboard_api():
    stats = Analytics.get_host_dashboard(session['user_id'])
    return jsonify(stats)


@host_bp.route('/host/listings')
@host_required
def listings():
    properties = Property.get_by_host(session['user_id'])
    return render_template('host/listings.html', properties=properties)


@host_bp.route('/host/listing/new')
@host_required
def new_listing():
    categories = Property.get_categories()
    amenities = Property.get_amenities()
    return render_template('host/listing_form.html', categories=categories,
                          amenities=amenities, property=None)


@host_bp.route('/host/listing/<int:property_id>/edit')
@host_required
def edit_listing(property_id):
    prop = Property.get_by_id(property_id)
    if not prop or prop['host_id'] != session['user_id']:
        return render_template('404.html'), 404
    categories = Property.get_categories()
    amenities = Property.get_amenities()
    return render_template('host/listing_form.html', categories=categories,
                          amenities=amenities, property=prop)


@host_bp.route('/api/host/listings', methods=['POST'])
@host_required
def create_listing():
    data = request.get_json()
    try:
        prop_id = Property.create(session['user_id'], data)
        return jsonify({'success': True, 'property_id': prop_id,
                        'message': 'Listing created successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@host_bp.route('/api/host/listings/<int:property_id>', methods=['PUT'])
@host_required
def update_listing(property_id):
    data = request.get_json()
    try:
        Property.update(property_id, session['user_id'], data)
        return jsonify({'success': True, 'message': 'Listing updated successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@host_bp.route('/api/host/listings/<int:property_id>', methods=['DELETE'])
@host_required
def delete_listing(property_id):
    Property.delete(property_id, session['user_id'])
    return jsonify({'success': True, 'message': 'Listing deleted successfully!'})


@host_bp.route('/host/requests')
@host_required
def booking_requests():
    requests_list = Booking.get_host_requests(session['user_id'])
    return render_template('host/requests.html', requests=requests_list)


@host_bp.route('/api/host/requests')
@host_required
def booking_requests_api():
    status = request.args.get('status')
    requests_list = Booking.get_host_requests(session['user_id'], status)
    return jsonify(requests_list)


@host_bp.route('/api/host/analytics')
@host_required
def analytics_api():
    stats = Analytics.get_host_dashboard(session['user_id'])
    revenue_trends = Analytics.get_revenue_trends(session['user_id'])
    top_properties = Analytics.get_top_properties(session['user_id'])
    listings_perf = Analytics.get_listings_performance(session['user_id'])
    return jsonify({
        'stats': stats,
        'revenue_trends': revenue_trends,
        'top_properties': top_properties,
        'listings_performance': listings_perf
    })


@host_bp.route('/api/host/revenue-trends')
@host_required
def revenue_trends_api():
    months = request.args.get('months', 6, type=int)
    trends = Analytics.get_revenue_trends(session['user_id'], months)
    return jsonify(trends)


@host_bp.route('/api/host/billing')
@host_required
def get_billing_api():
    host_id = session['user_id']
    from models.db import query_db
    
    # Summary
    summary = query_db("""
        SELECT 
            COALESCE(SUM(amount), 0) AS total_earnings,
            COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END), 0) AS pending_payouts,
            COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) AS paid_out
        FROM payments pay
        JOIN bookings b ON pay.booking_id = b.booking_id
        JOIN properties p ON b.property_id = p.property_id
        WHERE p.host_id = ?
    """, (host_id,), one=True)
    
    # Commissions (Assume platform takes 10%)
    total_revenue = summary['total_earnings']
    commissions = total_revenue * 0.1
    
    # Tier info
    booking_count = query_db("""
        SELECT COUNT(*) AS count FROM bookings b
        JOIN properties p ON b.property_id = p.property_id
        WHERE p.host_id = ? AND b.status = 'completed'
    """, (host_id,), one=True)['count']
    
    tier = "Bronze"
    rate = 10
    if booking_count >= 50:
        tier = "Gold"
        rate = 5
    elif booking_count >= 10:
        tier = "Silver"
        rate = 7
        
    rate_multiplier = rate / 100.0

    # Transactions
    transactions = query_db("""
        SELECT 
            pay.payment_id, pay.amount, pay.payment_status, pay.paid_at, pay.transaction_id, pay.invoice_number,
            b.check_in, b.check_out, b.total_nights,
            p.title AS property_title,
            gu.first_name || ' ' || gu.last_name AS guest_name
        FROM payments pay
        JOIN bookings b ON pay.booking_id = b.booking_id
        JOIN properties p ON b.property_id = p.property_id
        JOIN users gu ON b.guest_id = gu.user_id
        WHERE p.host_id = ?
        ORDER BY pay.created_at DESC
    """, (host_id,))
    
    formatted_transactions = []
    for t in transactions:
        tx = dict(t)
        tx['commission_rate'] = f"{rate}%"
        tx['commission_deducted'] = tx['amount'] * rate_multiplier
        tx['net_payout'] = tx['amount'] * (1 - rate_multiplier)
        formatted_transactions.append(tx)

    # Get Host Name
    host = query_db("SELECT first_name, last_name FROM users WHERE user_id = ?", (host_id,), one=True)
    host_name = f"{host['first_name']} {host['last_name']}"
    
    return jsonify({
        'success': True,
        'summary': {
            'total_earnings': summary['total_earnings'],
            'pending_payouts': summary['pending_payouts'],
            'paid_out': summary['paid_out'],
            'commissions_paid': summary['total_earnings'] * rate_multiplier
        },
        'host_name': host_name,
        'tier': {
            'name': tier,
            'rate': f"{rate}%",
            'bookings': booking_count,
            'next_tier': 'Silver' if tier == 'Bronze' else 'Gold' if tier == 'Silver' else None,
            'progress': min(100, (booking_count / 10 * 100) if tier == 'Bronze' else (booking_count / 50 * 100) if tier == 'Silver' else 100)
        },
        'transactions': formatted_transactions
    })
