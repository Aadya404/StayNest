from flask import Blueprint, render_template, jsonify, session
from models.analytics import Analytics
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/admin/dashboard')
@admin_required
def dashboard():
    stats = Analytics.get_platform_stats()
    bookings_by_city = Analytics.get_bookings_by_city()
    monthly_bookings = Analytics.get_monthly_bookings()
    top_properties = Analytics.get_top_properties(limit=10)
    return render_template('admin/dashboard.html', stats=stats,
                          bookings_by_city=bookings_by_city,
                          monthly_bookings=monthly_bookings,
                          top_properties=top_properties)


@admin_bp.route('/api/admin/stats')
@admin_required
def stats_api():
    stats = Analytics.get_platform_stats()
    return jsonify(stats)


@admin_bp.route('/api/admin/bookings-by-city')
@admin_required
def bookings_by_city_api():
    data = Analytics.get_bookings_by_city()
    return jsonify(data)


@admin_bp.route('/api/admin/monthly-bookings')
@admin_required
def monthly_bookings_api():
    data = Analytics.get_monthly_bookings()
    return jsonify(data)
