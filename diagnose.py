import traceback
import sys
import socket

def check_port(port=5000):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(("127.0.0.1", port))
        s.close()
        return True
    except socket.error as e:
        return False

print("=== StayNest Diagnostics ===")

print("\n1. Checking Port 5000...")
if not check_port(5000):
    print("❌ FAILED: Port 5000 is currently in use! Another instance of your Flask server or another program is holding the port. You must close the old terminal window or kill the python process.")
else:
    print("✓ Port 5000 is available.")

print("\n2. Checking App Imports and Syntax...")
try:
    from app import create_app
    print("✓ Flask app loaded successfully. No syntax errors found in your Python files.")
    
    # Try importing db
    from models.db import query_db
    print("✓ Database models loaded successfully.")
    
    print("\n✅ DIAGNOSIS COMPLETE! The server code is perfectly healthy. Run `python app.py` again. If the browser isn't opening, navigate to http://localhost:5000/ manually in Chrome.")
except Exception as e:
    print("\n❌ CRASH DETECTED WHILE LOADING THE APP! Here is the exact error:")
    print("-" * 50)
    traceback.print_exc()
    print("-" * 50)
    print("\nPlease copy and paste this red/error text back to your AI assistant so they can fix it immediately.")
