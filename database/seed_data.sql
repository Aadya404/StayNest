-- ============================================================
-- StayNest - Sample/Seed Data for Testing
-- ============================================================

-- Categories
INSERT INTO categories (name, icon, description, display_order) VALUES
('Beachfront', 'fa-umbrella-beach', 'Properties right on the beach', 1),
('Mountain', 'fa-mountain', 'Mountain retreats and cabins', 2),
('City', 'fa-city', 'Urban apartments and lofts', 3),
('Countryside', 'fa-tree', 'Rural farmhouses and cottages', 4),
('Lakefront', 'fa-water', 'Properties by the lake', 5),
('Tropical', 'fa-sun', 'Tropical paradise stays', 6),
('Historical', 'fa-landmark', 'Heritage and historical properties', 7),
('Luxury', 'fa-gem', 'Premium luxury stays', 8),
('Treehouse', 'fa-leaf', 'Unique treehouse experiences', 9),
('Houseboat', 'fa-ship', 'Floating accommodations', 10);

-- Cancellation Policies
INSERT INTO cancellation_policies (name, description, refund_percentage_before_7_days, refund_percentage_before_48_hours, refund_percentage_after, penalty_percentage) VALUES
('Flexible', 'Full refund up to 24 hours before check-in', 100, 100, 100, 0),
('Moderate', 'Full refund 5 days before check-in, 50% after', 100, 50, 0, 50),
('Strict', 'Full refund 7 days before, 50% within 7 days, none after 48h', 100, 50, 0, 100);

-- Amenities
INSERT INTO amenities (name, icon, category) VALUES
('WiFi', 'fa-wifi', 'general'),
('Air Conditioning', 'fa-snowflake', 'general'),
('Heating', 'fa-temperature-high', 'general'),
('TV', 'fa-tv', 'entertainment'),
('Kitchen', 'fa-utensils', 'kitchen'),
('Washer', 'fa-soap', 'general'),
('Dryer', 'fa-wind', 'general'),
('Free Parking', 'fa-parking', 'general'),
('Pool', 'fa-swimming-pool', 'outdoor'),
('Hot Tub', 'fa-hot-tub', 'outdoor'),
('Gym', 'fa-dumbbell', 'general'),
('BBQ Grill', 'fa-fire', 'outdoor'),
('Fireplace', 'fa-fire-alt', 'general'),
('Balcony', 'fa-building', 'outdoor'),
('Garden', 'fa-seedling', 'outdoor'),
('Smoke Detector', 'fa-bell', 'safety'),
('First Aid Kit', 'fa-first-aid', 'safety'),
('Fire Extinguisher', 'fa-fire-extinguisher', 'safety'),
('Iron', 'fa-tshirt', 'general'),
('Hair Dryer', 'fa-wind', 'bathroom'),
('Shampoo', 'fa-pump-soap', 'bathroom'),
('Bed Linens', 'fa-bed', 'bedroom'),
('Coffee Maker', 'fa-coffee', 'kitchen'),
('Microwave', 'fa-microwave', 'kitchen'),
('Refrigerator', 'fa-box', 'kitchen'),
('Dishwasher', 'fa-sink', 'kitchen'),
('Elevator', 'fa-elevator', 'accessibility'),
('Wheelchair Accessible', 'fa-wheelchair', 'accessibility'),
('Pet Friendly', 'fa-paw', 'general'),
('Workspace', 'fa-laptop', 'general');

-- Users (password is 'Password123!' for all - hashed with werkzeug)
-- Hash generated: pbkdf2:sha256:600000$...
INSERT INTO users (email, password_hash, first_name, last_name, phone_country_code, phone_number, role, is_verified, bio) VALUES
('guest@staynest.com', 'pbkdf2:sha256:600000$placeholder$hash', 'Arjun', 'Sharma', '+91', '9876543210', 'guest', 1, 'Love traveling and exploring new places.'),
('host1@staynest.com', 'pbkdf2:sha256:600000$placeholder$hash', 'Priya', 'Patel', '+91', '9876543211', 'host', 1, 'Superhost with 5 years of experience hosting guests from around the world.'),
('host2@staynest.com', 'pbkdf2:sha256:600000$placeholder$hash', 'Rahul', 'Mehta', '+91', '9876543212', 'host', 1, 'Passionate about providing the best stays in Goa.'),
('guest2@staynest.com', 'pbkdf2:sha256:600000$placeholder$hash', 'Ananya', 'Gupta', '+91', '9876543213', 'guest', 1, 'Foodie and adventure seeker.'),
('admin@staynest.com', 'pbkdf2:sha256:600000$placeholder$hash', 'Admin', 'StayNest', '+91', '9876543200', 'admin', 1, 'Platform administrator.');

-- Host Profiles
INSERT INTO host_profiles (user_id, is_superhost, total_revenue, total_bookings, average_rating, response_rate, response_time_hours) VALUES
(2, 1, 125000.00, 45, 4.85, 98.0, 1),
(3, 0, 45000.00, 18, 4.5, 90.0, 3);

-- Properties
INSERT INTO properties (host_id, category_id, title, description, property_type, address, city, state, country, zip_code, latitude, longitude, price_per_night, cleaning_fee, max_guests, bedrooms, beds, bathrooms, average_rating, total_reviews) VALUES
(2, 1, 'Luxurious Beachfront Villa in Goa', 'Wake up to the sound of waves in this stunning 3-bedroom villa located right on Calangute Beach. Featuring a private pool, modern amenities, and breathtaking ocean views, this is the perfect getaway for families and groups. The villa comes with a fully equipped kitchen, outdoor dining area, and direct beach access.', 'villa', '123 Beach Road, Calangute', 'Goa', 'Goa', 'India', '403516', 15.5438, 73.7553, 8500.00, 1500.00, 8, 3, 4, 2.5, 4.9, 28),
(2, 3, 'Modern Penthouse in Mumbai Skyline', 'Experience Mumbai from above in this designer penthouse with panoramic city views. Located in Bandra West, this 2-bedroom apartment features floor-to-ceiling windows, a private terrace, premium furnishings, and access to building amenities including gym and pool.', 'apartment', '456 Linking Road, Bandra West', 'Mumbai', 'Maharashtra', 'India', '400050', 19.0596, 72.8295, 12000.00, 2000.00, 4, 2, 2, 2.0, 4.8, 15),
(2, 2, 'Cozy Mountain Cabin in Manali', 'Escape to the mountains in this charming wooden cabin surrounded by pine forests. Features a stone fireplace, hot tub with mountain views, and a fully stocked kitchen. Perfect for couples or small families looking for a peaceful mountain retreat.', 'cabin', '789 Old Manali Road', 'Manali', 'Himachal Pradesh', 'India', '175131', 32.2396, 77.1887, 4500.00, 800.00, 4, 2, 2, 1.0, 4.7, 22),
(3, 1, 'Tropical Beach House with Pool', 'A charming beach house just 50 meters from Palolem Beach. This 2-bedroom property features a private garden, outdoor shower, hammocks under palm trees, and a small plunge pool. Ideal for couples seeking a tropical retreat.', 'house', '101 Palolem Beach Road', 'Goa', 'Goa', 'India', '403702', 15.0100, 74.0230, 5500.00, 1000.00, 5, 2, 3, 1.5, 4.6, 12),
(3, 4, 'Heritage Farmhouse in Rajasthan', 'Stay in a beautifully restored 200-year-old farmhouse in the Rajasthani countryside. Features traditional Rajasthani architecture with modern comforts, organic farm-to-table dining, camel safari experiences, and stunning sunset views over the Thar Desert.', 'farmhouse', '202 Village Road, Jodhpur', 'Jodhpur', 'Rajasthan', 'India', '342001', 26.2389, 73.0243, 6000.00, 1200.00, 6, 3, 4, 2.0, 4.5, 8),
(2, 8, 'Royal Suite at Palace Hotel', 'Live like royalty in this palatial suite featuring hand-painted frescoes, antique furniture, marble bathrooms, and a private courtyard. Includes butler service, spa access, and authentic Rajasthani cuisine. A once-in-a-lifetime experience.', 'resort', '303 Palace Road, Udaipur', 'Udaipur', 'Rajasthan', 'India', '313001', 24.5854, 73.7125, 18000.00, 3000.00, 2, 1, 1, 1.0, 5.0, 10),
(2, 3, 'Designer Loft in Bangalore Tech Hub', 'A sleek, modern loft in the heart of Bangalore''s tech district. Features an open floor plan, designer furniture, high-speed internet, and a dedicated workspace. Walking distance to top restaurants, cafes, and coworking spaces.', 'loft', '404 Koramangala 4th Block', 'Bangalore', 'Karnataka', 'India', '560034', 12.9352, 77.6245, 3500.00, 500.00, 2, 1, 1, 1.0, 4.4, 18),
(3, 5, 'Lakeside Cottage in Kerala', 'A serene cottage on the backwaters of Kerala. Watch houseboats glide by from your private deck. Features include a canoe for exploring waterways, outdoor dining area, and traditional Kerala breakfast served daily. Pure tranquility.', 'cottage', '505 Backwater Lane, Alleppey', 'Alleppey', 'Kerala', 'India', '688001', 9.4981, 76.3388, 4000.00, 700.00, 4, 2, 2, 1.0, 4.7, 14),
(2, 6, 'Hilltop Retreat in Munnar', 'Perched atop a tea plantation hill, this retreat offers 360-degree views of rolling green hills. Features include a glass-walled living room, infinity pool, and complimentary tea plantation tours. Wake up above the clouds.', 'house', '606 Tea Estate Road, Munnar', 'Munnar', 'Kerala', 'India', '685612', 10.0889, 77.0595, 7500.00, 1200.00, 6, 3, 3, 2.0, 4.8, 20),
(3, 3, 'Artistic Studio in Jaipur Old City', 'A colorfully restored haveli studio in the Pink City. Hand-block printed textiles, jharokha windows, and a rooftop terrace with Hawa Mahal views. Includes walking tour and block-printing workshop. Art meets heritage.', 'studio', '707 Johari Bazaar, Jaipur', 'Jaipur', 'Rajasthan', 'India', '302003', 26.9124, 75.7873, 2800.00, 400.00, 2, 1, 1, 1.0, 4.6, 16),
(2, 9, 'Jungle Treehouse in Wayanad', 'Sleep among the treetops in this magical treehouse deep in Wayanad''s rainforest. Built sustainably from bamboo, it features a suspended walkway, outdoor rain shower, and nightly visits from friendly owls. A nature lover''s dream.', 'treehouse', '808 Forest Road, Wayanad', 'Wayanad', 'Kerala', 'India', '673577', 11.6854, 76.1320, 3200.00, 600.00, 2, 1, 1, 1.0, 4.9, 25),
(3, 10, 'Luxury Houseboat in Dal Lake', 'Float on the legendary Dal Lake in this beautifully carved Kashmiri houseboat. Features hand-carved walnut wood interiors, a sundeck with mountain views, and shikara rides included. Traditional Wazwan dinner served onboard.', 'houseboat', '909 Dal Lake, Boulevard Road', 'Srinagar', 'Jammu and Kashmir', 'India', '190001', 34.0837, 74.7973, 5000.00, 800.00, 4, 2, 2, 1.0, 4.8, 19);

-- Property Images (mapped properly to explicitly requested Unsplash URLs)
INSERT INTO property_images (property_id, image_url, caption, is_primary, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', 'Beach Villa Exterior', 1, 1),
(2, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 'Penthouse View', 1, 1),
(3, 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80', 'Mountain Cabin', 1, 1),
(4, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', 'Beach House', 1, 1),
(5, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', 'Farmhouse', 1, 1),
(6, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', 'Palace Suite', 1, 1),
(7, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 'Apartment/Loft View', 1, 1),
(8, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 'Lakeside Cottage', 1, 1),
(9, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80', 'Hilltop Retreat', 1, 1),
(10, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80', 'Studio View', 1, 1),
(11, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80', 'Treehouse', 1, 1),
(12, 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80', 'Houseboat', 1, 1);


-- Property Amenities mapping
INSERT INTO property_amenities (property_id, amenity_id) VALUES
(1,1),(1,2),(1,5),(1,8),(1,9),(1,12),(1,14),(1,15),(1,16),(1,17),(1,22),(1,23),
(2,1),(2,2),(2,4),(2,5),(2,6),(2,7),(2,9),(2,11),(2,14),(2,16),(2,19),(2,30),
(3,1),(3,3),(3,4),(3,5),(3,8),(3,10),(3,13),(3,16),(3,17),(3,22),
(4,1),(4,2),(4,5),(4,8),(4,9),(4,14),(4,15),(4,16),(4,22),(4,29),
(5,1),(5,2),(5,5),(5,8),(5,12),(5,14),(5,15),(5,16),(5,17),
(6,1),(6,2),(6,3),(6,4),(6,5),(6,9),(6,11),(6,16),(6,19),(6,20),(6,22),(6,27),
(7,1),(7,2),(7,4),(7,5),(7,6),(7,19),(7,23),(7,27),(7,30),
(8,1),(8,2),(8,5),(8,14),(8,15),(8,16),(8,22),(8,29),
(9,1),(9,2),(9,4),(9,5),(9,9),(9,14),(9,15),(9,16),(9,22),
(10,1),(10,2),(10,4),(10,5),(10,14),(10,16),(10,22),
(11,1),(11,15),(11,16),(11,17),(11,22),
(12,1),(12,2),(12,4),(12,5),(12,14),(12,16),(12,22);

-- Sample Bookings
INSERT INTO bookings (property_id, guest_id, check_in, check_out, num_guests, total_nights, price_per_night, cleaning_fee, service_fee, total_price, status) VALUES
(1, 1, '2026-03-15', '2026-03-20', 4, 5, 8500.00, 1500.00, 5950.00, 49950.00, 'completed'),
(2, 4, '2026-03-10', '2026-03-13', 2, 3, 12000.00, 2000.00, 5040.00, 43040.00, 'completed'),
(3, 1, '2026-04-01', '2026-04-05', 2, 4, 4500.00, 800.00, 2520.00, 21320.00, 'confirmed'),
(4, 4, '2026-04-15', '2026-04-20', 3, 5, 5500.00, 1000.00, 3850.00, 32350.00, 'pending'),
(6, 1, '2026-05-01', '2026-05-03', 2, 2, 18000.00, 3000.00, 5040.00, 44040.00, 'pending'),
(9, 4, '2026-04-20', '2026-04-25', 4, 5, 7500.00, 1200.00, 5250.00, 43950.00, 'confirmed');

-- Payments for completed/confirmed bookings
INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id, invoice_number, paid_at) VALUES
(1, 49950.00, 'credit_card', 'completed', 'TXN-2026-000001', 'INV-2026-000001', '2026-03-15 10:00:00'),
(2, 43040.00, 'upi', 'completed', 'TXN-2026-000002', 'INV-2026-000002', '2026-03-10 14:00:00'),
(3, 21320.00, 'debit_card', 'completed', 'TXN-2026-000003', 'INV-2026-000003', '2026-04-01 09:00:00'),
(6, 43950.00, 'net_banking', 'completed', 'TXN-2026-000006', 'INV-2026-000006', '2026-04-20 11:00:00');

-- Reviews
INSERT INTO reviews (booking_id, property_id, guest_id, rating, cleanliness_rating, accuracy_rating, checkin_rating, communication_rating, location_rating, value_rating, comment) VALUES
(1, 1, 1, 5, 5, 5, 5, 5, 5, 4, 'Absolutely stunning villa! The beach access was incredible and the host was very responsive. We had an amazing family vacation. Highly recommend!'),
(2, 2, 4, 5, 5, 4, 5, 5, 5, 4, 'The penthouse views are unreal. Perfect location in Bandra with easy access to everything. The apartment was spotlessly clean and beautifully designed.'),
(3, 3, 1, 4, 4, 5, 5, 4, 5, 4, 'Great cozy cabin exactly as described. Loved the hot tub and the quiet nature trails nearby. Will come back.'),
(6, 4, 4, 5, 5, 5, 5, 5, 5, 5, 'The host was incredibly fast to respond and provided great recommendations. The place was beautifully maintained.');

-- Wishlist entries
INSERT INTO wishlists (user_id, property_id) VALUES
(1, 2), (1, 6), (1, 9),
(4, 1), (4, 3), (4, 11);

-- Sample Messages
INSERT INTO messages (sender_id, receiver_id, property_id, booking_id, content) VALUES
(1, 2, 1, 1, 'Hi! We are really looking forward to our stay. Is early check-in possible?'),
(2, 1, 1, 1, 'Welcome! Early check-in at 12 PM should be fine. I will have everything ready for you.'),
(4, 3, 4, 4, 'Hello! We are excited about exploring Palolem. Any restaurant recommendations nearby?'),
(3, 4, 4, 4, 'Of course! I will send you a list of my favorite beach shacks and restaurants. You will love it!');

-- Notifications
INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type) VALUES
(2, 'booking_request', 'New Booking Request', 'You have a new booking request for Tropical Beach House with Pool', 4, 'booking'),
(2, 'booking_request', 'New Booking Request', 'You have a new booking request for Royal Suite at Palace Hotel', 5, 'booking'),
(1, 'booking_confirmed', 'Booking Confirmed', 'Your booking for Cozy Mountain Cabin in Manali has been confirmed', 3, 'booking'),
(4, 'booking_confirmed', 'Booking Confirmed', 'Your booking for Hilltop Retreat in Munnar has been confirmed', 6, 'booking');

-- Vouchers Seed Data
INSERT INTO vouchers (code, discount_type, discount_value, min_booking_amount, expiry_date, usage_limit, times_used, is_active) VALUES
('WELCOME10', 'percentage', 10.0, 0, '2026-12-31 23:59:59', 1000, 0, 1),
('SUMMER500', 'fixed', 500.0, 5000.0, '2026-08-31 23:59:59', 500, 0, 1),
('LOYALTY25', 'percentage', 25.0, 0, '2026-12-31 23:59:59', 100, 0, 1);
