from flask import Blueprint, request, jsonify, render_template, session
from models.property import Property
from models.payment import Wishlist

properties_bp = Blueprint('properties', __name__)


@properties_bp.route('/explore')
def explore():
    categories = Property.get_categories()
    amenities = Property.get_amenities()
    return render_template('properties/search.html', categories=categories, amenities=amenities)


@properties_bp.route('/property/<int:property_id>')
def detail(property_id):
    prop = Property.get_by_id(property_id)
    if not prop:
        return render_template('404.html'), 404

    booked_dates = Property.get_booked_dates(property_id)
    is_wishlisted = False
    if 'user_id' in session:
        wishlist_ids = Wishlist.get_user_wishlist_ids(session['user_id'])
        is_wishlisted = property_id in wishlist_ids

    return render_template('properties/detail.html', property=prop,
                          booked_dates=booked_dates, is_wishlisted=is_wishlisted)


@properties_bp.route('/api/properties')
def search_api():
    page = request.args.get('page', 1, type=int)
    filters = {}

    for key in ['location', 'city', 'check_in', 'check_out', 'guests',
                 'min_price', 'max_price', 'property_type', 'category_id', 'bedrooms']:
        val = request.args.get(key)
        if val:
            filters[key] = val

    amenities = request.args.getlist('amenities')
    if amenities:
        filters['amenities'] = amenities

    result = Property.get_all(page=page, filters=filters if filters else None, user_id=session.get('user_id'))
    return jsonify(result)


@properties_bp.route('/api/properties/<int:property_id>')
def get_property_api(property_id):
    prop = Property.get_by_id(property_id)
    if not prop:
        return jsonify({'error': 'Property not found'}), 404
    return jsonify(prop)


@properties_bp.route('/api/properties/<int:property_id>/booked-dates')
def get_booked_dates(property_id):
    dates = Property.get_booked_dates(property_id)
    return jsonify(dates)


@properties_bp.route('/api/categories')
def get_categories():
    categories = Property.get_categories()
    return jsonify(categories)


@properties_bp.route('/api/amenities')
def get_amenities():
    amenities = Property.get_amenities()
    return jsonify(amenities)


@properties_bp.route('/compare')
def compare():
    ids = request.args.getlist('ids')
    properties = []
    for pid in ids[:4]:
        prop = Property.get_by_id(int(pid))
        if prop:
            properties.append(prop)
    return render_template('properties/compare.html', properties=properties)
