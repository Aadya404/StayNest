import sqlite3
import random

db_path = 'instance/staynest.db' if __import__('os').path.exists('instance/staynest.db') else 'database/staynest.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get a valid host id
cur.execute("SELECT user_id FROM users WHERE role='host' OR role='admin' LIMIT 1")
host_id = cur.fetchone()
if host_id:
    host_id = host_id[0]
else:
    # Get any valid user
    cur.execute("SELECT user_id FROM users LIMIT 1")
    host_id = cur.fetchone()[0]

# Get valid category ID
cur.execute("SELECT category_id FROM categories ORDER BY category_id")
cats = [row[0] for row in cur.fetchall()]
if not cats: cats = [1]

adjectives = ["Luxury", "Cozy", "Modern", "Spacious", "Rustic", "Charming", "Stunning", "Beautiful", "Quiet", "Sunny", "Secluded", "Vintage"]
types = ["Villa", "Apartment", "House", "Cottage", "Loft", "Studio", "Retreat", "Cabin"]
locations = ["Goa", "Mumbai", "Delhi", "Bangalore", "Himalayas", "Kerala", "Jaipur", "Manali", "Pune", "Chennai"]
images = [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800"
]

inserted = 0
for i in range(15):
    title = f"{random.choice(adjectives)} {random.choice(types)} in {random.choice(locations)}"
    desc = f"Experience the ultimate getaway in this {title.lower()}. Perfect for families and couples!"
    city = random.choice(locations)
    img = random.choice(images)
    price = random.randint(30, 800) * 10
    rating = round(random.uniform(3.0, 5.0), 1)
    revs = random.randint(0, 150)
    cat = random.choice(cats)
    
    cur.execute("""
        INSERT INTO properties (host_id, category_id, title, description, property_type,
            address, city, state, country, latitude, longitude,
            bedrooms, beds, bathrooms, max_guests, price_per_night, cleaning_fee,
            is_active, is_approved, average_rating, total_reviews)
        VALUES (?, ?, ?, ?, ?, 'Sample Road', ?, 'State', 'India', 0, 0, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
    """, (host_id, cat, title, desc, random.choice(['apartment','house','villa', 'cabin']), city, 
          random.randint(1,5), random.randint(1,5), random.randint(1,3), random.randint(1,8),
          price, random.randint(5,50)*10, rating, revs))
    prop_id = cur.lastrowid
    
    cur.execute("INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, 1)", (prop_id, img))
    inserted += 1

conn.commit()
conn.close()
print(f"Added {inserted} new properties successfully!")
