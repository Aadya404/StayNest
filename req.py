import urllib.request, json
req = urllib.request.Request("http://127.0.0.1:5000/api/payment/confirm", data=json.dumps({"booking_id": 16, "amount": 100, "method": "upi", "payment_ref": "SIM-"}).encode(), headers={'Content-Type': 'application/json', 'Cookie': 'session='+open('.flask_session_token').read().strip()})
try: print(urllib.request.urlopen(req).read().decode())
except Exception as e: print(e.read().decode() if hasattr(e, 'read') else str(e))
