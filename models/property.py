from models.db import query_db, execute_db, execute_many_db, get_db, close_db


class Property:
    @staticmethod
    def get_all(page=1, per_page=12, filters=None, user_id=None):
        """Get paginated properties with optional filters."""
        where_clauses = ["p.is_active = 1", "p.is_approved = 1"]
        params = []
        
        # Add wishlist check if user_id is provided
        wishlist_select = "0 AS is_wishlisted"
        if user_id:
            wishlist_select = "(SELECT 1 FROM wishlists WHERE user_id = ? AND property_id = p.property_id) AS is_wishlisted"
            params.append(user_id)

        if filters:
            # ... (filtering logic) ...
            if filters.get('city'):
                where_clauses.append("LOWER(p.city) LIKE LOWER(?)")
                params.append(f"%{filters['city']}%")
            if filters.get('location'):
                where_clauses.append(
                    "(LOWER(p.city) LIKE LOWER(?) OR LOWER(p.state) LIKE LOWER(?) OR LOWER(p.address) LIKE LOWER(?))")
                params.extend([f"%{filters['location']}%"] * 3)
            if filters.get('min_price'):
                where_clauses.append("p.price_per_night >= ?")
                params.append(float(filters['min_price']))
            if filters.get('max_price'):
                where_clauses.append("p.price_per_night <= ?")
                params.append(float(filters['max_price']))
            if filters.get('guests'):
                where_clauses.append("p.max_guests >= ?")
                params.append(int(filters['guests']))
            if filters.get('property_type'):
                where_clauses.append("p.property_type = ?")
                params.append(filters['property_type'])
            if filters.get('category_id'):
                where_clauses.append("p.category_id = ?")
                params.append(int(filters['category_id']))
            if filters.get('bedrooms'):
                where_clauses.append("p.bedrooms >= ?")
                params.append(int(filters['bedrooms']))
            if filters.get('check_in') and filters.get('check_out'):
                where_clauses.append("""
                    NOT EXISTS (
                        SELECT 1 FROM bookings b
                        WHERE b.property_id = p.property_id
                        AND b.status IN ('confirmed', 'pending')
                        AND ? < b.check_out AND ? > b.check_in
                    )
                """)
                params.extend([filters['check_in'], filters['check_out']])
            if filters.get('amenities'):
                amenity_ids = filters['amenities'] if isinstance(filters['amenities'], list) else [filters['amenities']]
                placeholders = ','.join(['?' for _ in amenity_ids])
                where_clauses.append(f"""
                    p.property_id IN (
                        SELECT pa.property_id FROM property_amenities pa
                        WHERE pa.amenity_id IN ({placeholders})
                        GROUP BY pa.property_id
                        HAVING COUNT(DISTINCT pa.amenity_id) = ?
                    )
                """)
                params.extend([int(a) for a in amenity_ids])
                params.append(len(amenity_ids))

        where_sql = " AND ".join(where_clauses)
        offset = (page - 1) * per_page

        # Get total count (exclude wishlist subquery prefix from params)
        count_params = params[1:] if user_id else params
        count = query_db(
            f"SELECT COUNT(*) as count FROM properties p WHERE {where_sql}",
            count_params, one=True
        )
        total = count['count'] if count else 0

        # Handle Sorting
        order_sql = "p.average_rating DESC, p.total_reviews DESC"
        if filters:
            if filters.get('sort') == 'rating_desc':
                order_sql = "p.average_rating DESC, p.total_reviews DESC"
            elif filters.get('sort') == 'rating_asc':
                order_sql = "NULLIF(p.average_rating, 0) ASC, p.total_reviews ASC" # Push 0/New to bottom or let them be first? Actually standard is p.average_rating ASC but we might want properties with a rating. Lets just do p.average_rating ASC
                order_sql = "p.average_rating ASC, p.total_reviews ASC"

        # Get properties with primary image and wishlist status
        props = query_db(
            f"""SELECT p.*, pi.image_url AS primary_image,
                       c.name AS category_name, c.icon AS category_icon,
                       u.first_name AS host_first_name, u.last_name AS host_last_name,
                       u.profile_image AS host_avatar,
                       hp.is_superhost,
                       {wishlist_select}
                FROM properties p
                LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
                LEFT JOIN categories c ON p.category_id = c.category_id
                JOIN users u ON p.host_id = u.user_id
                LEFT JOIN host_profiles hp ON u.user_id = hp.user_id
                WHERE {where_sql}
                ORDER BY {order_sql}
                LIMIT ? OFFSET ?""",
            params + [per_page, offset]
        )

        return {
            'properties': [dict(p) for p in props],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }

    @staticmethod
    def get_by_id(property_id):
        """Get full property details by ID."""
        prop = query_db(
            """SELECT p.*, c.name AS category_name, c.icon AS category_icon,
                      u.first_name AS host_first_name, u.last_name AS host_last_name,
                      u.profile_image AS host_avatar, u.bio AS host_bio,
                      u.created_at AS host_since,
                      hp.is_superhost, hp.total_bookings AS host_total_bookings,
                      hp.average_rating AS host_rating, hp.response_rate, hp.response_time_hours,
                      cp.name AS cancellation_policy_name, cp.description AS cancellation_policy_desc
               FROM properties p
               LEFT JOIN categories c ON p.category_id = c.category_id
               JOIN users u ON p.host_id = u.user_id
               LEFT JOIN host_profiles hp ON u.user_id = hp.user_id
               LEFT JOIN cancellation_policies cp ON p.cancellation_policy_id = cp.policy_id
               WHERE p.property_id = ?""",
            (property_id,), one=True
        )
        if not prop:
            return None

        result = dict(prop)

        # Get host stats
        host_id = result['host_id']
        stats = query_db("""
            SELECT 
                (SELECT COUNT(*) FROM properties WHERE host_id = ?) as listing_count,
                (SELECT COUNT(*) FROM reviews r JOIN properties p ON r.property_id = p.property_id WHERE p.host_id = ?) as review_count,
                (SELECT COUNT(*) FROM bookings b JOIN properties p ON b.property_id = p.property_id WHERE p.host_id = ? AND b.status = 'completed') as completed_bookings
        """, (host_id, host_id, host_id), one=True)
        
        result['host_stats'] = {
            'listings': stats['listing_count'],
            'reviews': stats['review_count'],
            'bookings': stats['completed_bookings']
        }

        # Get images
        images = query_db(
            "SELECT * FROM property_images WHERE property_id = ? ORDER BY display_order",
            (property_id,)
        )
        result['images'] = [dict(img) for img in images]

        # Get amenities
        amenities = query_db(
            """SELECT a.* FROM amenities a
               JOIN property_amenities pa ON a.amenity_id = pa.amenity_id
               WHERE pa.property_id = ?
               ORDER BY a.category, a.name""",
            (property_id,)
        )
        result['amenities'] = [dict(a) for a in amenities]

        # Get reviews
        reviews = query_db(
            """SELECT r.*, u.first_name, u.last_name, u.profile_image
               FROM reviews r
               JOIN users u ON r.guest_id = u.user_id
               WHERE r.property_id = ?
               ORDER BY r.created_at DESC""",
            (property_id,)
        )
        result['reviews'] = [dict(r) for r in reviews]

        return result

    @staticmethod
    def create(host_id, data):
        """Create a new property listing."""
        prop_id = execute_db(
            """INSERT INTO properties (host_id, category_id, title, description,
               property_type, address, city, state, country, zip_code,
               price_per_night, cleaning_fee, max_guests, bedrooms, beds, bathrooms,
               minimum_stay, cancellation_policy_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (host_id, data.get('category_id'), data['title'], data['description'],
             data['property_type'], data['address'], data['city'], data['state'],
             data.get('country', 'India'), data.get('zip_code', ''),
             float(data['price_per_night']), float(data.get('cleaning_fee', 0)),
             int(data['max_guests']), int(data.get('bedrooms', 1)),
             int(data.get('beds', 1)), float(data.get('bathrooms', 1)),
             int(data.get('minimum_stay', 1)), int(data.get('cancellation_policy_id', 1)))
        )

        # Add images
        if data.get('images'):
            for i, img_url in enumerate(data['images']):
                execute_db(
                    """INSERT INTO property_images (property_id, image_url, is_primary, display_order)
                       VALUES (?, ?, ?, ?)""",
                    (prop_id, img_url, 1 if i == 0 else 0, i + 1)
                )
        else:
            execute_db(
                """INSERT INTO property_images (property_id, image_url, is_primary, display_order)
                   VALUES (?, ?, 1, 1)""",
                (prop_id, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800')
            )

        # Add amenities
        if data.get('amenities'):
            for amenity_id in data['amenities']:
                execute_db(
                    "INSERT OR IGNORE INTO property_amenities (property_id, amenity_id) VALUES (?, ?)",
                    (prop_id, int(amenity_id))
                )

        return prop_id

    @staticmethod
    def update(property_id, host_id, data):
        """Update a property listing."""
        allowed = ['title', 'description', 'property_type', 'address', 'city', 'state',
                    'country', 'zip_code', 'price_per_night', 'cleaning_fee', 'max_guests',
                    'bedrooms', 'beds', 'bathrooms', 'minimum_stay', 'category_id',
                    'cancellation_policy_id']
        sets = []
        values = []
        for key, value in data.items():
            if key in allowed and value is not None:
                sets.append(f"{key} = ?")
                values.append(value)
        if sets:
            sets.append("updated_at = CURRENT_TIMESTAMP")
            values.extend([property_id, host_id])
            execute_db(
                f"UPDATE properties SET {', '.join(sets)} WHERE property_id = ? AND host_id = ?",
                values
            )

        # Update amenities if provided
        if 'amenities' in data:
            execute_db("DELETE FROM property_amenities WHERE property_id = ?", (property_id,))
            for amenity_id in data['amenities']:
                execute_db(
                    "INSERT OR IGNORE INTO property_amenities (property_id, amenity_id) VALUES (?, ?)",
                    (property_id, int(amenity_id))
                )

    @staticmethod
    def delete(property_id, host_id):
        """Soft delete a property."""
        execute_db(
            "UPDATE properties SET is_active = 0 WHERE property_id = ? AND host_id = ?",
            (property_id, host_id)
        )

    @staticmethod
    def get_by_host(host_id):
        """Get all properties for a host."""
        props = query_db(
            """SELECT p.*, pi.image_url AS primary_image,
                      c.name AS category_name,
                      (SELECT COUNT(*) FROM bookings b WHERE b.property_id = p.property_id AND b.status = 'confirmed') AS active_bookings
               FROM properties p
               LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = 1
               LEFT JOIN categories c ON p.category_id = c.category_id
               WHERE p.host_id = ? AND p.is_active = 1
               ORDER BY p.created_at DESC""",
            (host_id,)
        )
        return [dict(p) for p in props]

    @staticmethod
    def get_categories():
        """Get all categories."""
        cats = query_db("SELECT * FROM categories ORDER BY display_order")
        return [dict(c) for c in cats]

    @staticmethod
    def get_amenities():
        """Get all amenities grouped by category."""
        amenities = query_db("SELECT * FROM amenities ORDER BY category, name")
        return [dict(a) for a in amenities]

    @staticmethod
    def get_booked_dates(property_id):
        """Get all booked date ranges for a property."""
        bookings = query_db(
            """SELECT check_in, check_out FROM bookings
               WHERE property_id = ? AND status IN ('confirmed', 'pending')""",
            (property_id,)
        )
        return [dict(b) for b in bookings]
