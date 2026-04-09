import os
import sys
from flask import Flask, render_template, session, jsonify, Blueprint
from flask_cors import CORS
from config import Config
from models.payment import Notification, Message
from dotenv import load_dotenv
load_dotenv()

main_bp = Blueprint('main', __name__)

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    app.config.from_object(Config)

    os.makedirs(os.path.join(app.static_folder, 'uploads'), exist_ok=True)
    os.makedirs(os.path.join(app.static_folder, 'images'), exist_ok=True)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.properties import properties_bp
    from routes.bookings import bookings_bp
    from routes.host import host_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(host_bp)
    app.register_blueprint(admin_bp)

    # Main route on blueprint for url_for resolution
    @main_bp.route('/')
    def index():
        from models.property import Property
        user_id = session.get('user_id')
        result = Property.get_all(page=1, per_page=8, user_id=user_id)
        categories = Property.get_categories()
        return render_template('index.html', properties=result['properties'],
                              categories=categories)

    app.register_blueprint(main_bp)

    # Context processor for all templates
    @app.context_processor
    def inject_user():
        user_data = {
            'current_user': None,
            'unread_notifications': 0,
            'unread_messages': 0,
            'wishlist_ids': []
        }
        if 'user_id' in session:
            from models.user import User
            from models.payment import Wishlist
            fresh_user = User.get_by_id(session['user_id'])
            if fresh_user:
                user_data = {
                    'current_user': fresh_user,
                    'unread_notifications': Notification.get_unread_count(session['user_id']),
                    'unread_messages': 0,
                    'wishlist_ids': Wishlist.get_user_wishlist_ids(session['user_id'])
                }
        return user_data

    @app.errorhandler(404)
    def not_found(e):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template('500.html'), 500

    return app


app = create_app()

if __name__ == '__main__':
    if not os.path.exists(Config.DATABASE):
        print("Database not found. Initializing...")
        from init_db import initialize_database
        initialize_database()
        print("Database initialized successfully!")

    app.run(debug=True, host='0.0.0.0', port=5000)
