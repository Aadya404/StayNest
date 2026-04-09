from app import app
from flask import session
from routes.bookings import create_booking, confirm_payment
from models.db import query_db

with app.test_request_context('/api/bookings', json={
        "property_id": 16, "check_in": "2026-05-01", "check_out": "2026-05-05", 
        "num_guests": 2, "price_per_night": 100, "cleaning_fee": 10, "service_fee": 12, "total_price": 422, "special_requests": ""
    }):
    session['user_id'] = 1
    resp = create_booking()
    print("Booking response:", resp.get_json())
    b_id = resp.get_json().get('booking_id')

if b_id:
    with app.test_request_context('/api/payment/confirm', json={
            "booking_id": b_id,
            "amount": 422,
            "method": "upi",
            "payment_ref": "SIM-12345"
        }):
        session['user_id'] = 1
        resp2 = confirm_payment()
        print("Confirm response:", resp2.get_json())
