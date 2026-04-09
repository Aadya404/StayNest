from werkzeug.security import generate_password_hash, check_password_hash
from models.db import query_db, execute_db
import uuid
from datetime import datetime, timedelta


class User:
    @staticmethod
    def create(email, password, first_name, last_name, phone_country_code='+91',
               phone_number=None, role='guest'):
        """Create a new user with hashed password."""
        password_hash = generate_password_hash(password)
        user_id = execute_db(
            """INSERT INTO users (email, password_hash, first_name, last_name,
               phone_country_code, phone_number, role)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (email, password_hash, first_name, last_name, phone_country_code,
             phone_number, role)
        )

        # If registering as host, create host profile
        if role == 'host':
            execute_db(
                "INSERT INTO host_profiles (user_id) VALUES (?)",
                (user_id,)
            )

        return user_id

    @staticmethod
    def authenticate(email, password):
        """Authenticate user with email and password."""
        user = query_db("SELECT * FROM users WHERE email = ? AND is_active = 1",
                        (email,), one=True)
        if user and check_password_hash(user['password_hash'], password):
            return dict(user)
        return None

    @staticmethod
    def get_by_id(user_id):
        """Get user by ID."""
        user = query_db("SELECT * FROM users WHERE user_id = ?", (user_id,), one=True)
        return dict(user) if user else None

    @staticmethod
    def get_by_email(email):
        """Get user by email."""
        user = query_db("SELECT * FROM users WHERE email = ?", (email,), one=True)
        return dict(user) if user else None

    @staticmethod
    def update_profile(user_id, **kwargs):
        """Update user profile fields."""
        allowed = ['first_name', 'last_name', 'phone_country_code', 'phone_number',
                    'profile_image', 'date_of_birth', 'bio']
        sets = []
        values = []
        for key, value in kwargs.items():
            if key in allowed and value is not None:
                sets.append(f"{key} = ?")
                values.append(value)
        if sets:
            values.append(user_id)
            execute_db(f"UPDATE users SET {', '.join(sets)} WHERE user_id = ?", values)

    @staticmethod
    def create_verification_token(user_id):
        """Create email verification token."""
        token = str(uuid.uuid4())
        expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
        execute_db(
            "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)",
            (user_id, token, expires_at)
        )
        return token

    @staticmethod
    def verify_email(token):
        """Verify email with token."""
        verification = query_db(
            """SELECT * FROM email_verifications
               WHERE token = ? AND is_used = 0 AND expires_at > datetime('now')""",
            (token,), one=True
        )
        if verification:
            execute_db("UPDATE email_verifications SET is_used = 1 WHERE token = ?", (token,))
            execute_db("UPDATE users SET is_verified = 1 WHERE user_id = ?",
                        (verification['user_id'],))
            return True
        return False

    @staticmethod
    def get_host_profile(user_id):
        """Get host profile data."""
        return query_db(
            """SELECT u.*, hp.*
               FROM users u
               JOIN host_profiles hp ON u.user_id = hp.user_id
               WHERE u.user_id = ?""",
            (user_id,), one=True
        )

    @staticmethod
    def become_host(user_id):
        """Upgrade a guest to host role."""
        execute_db("UPDATE users SET role = 'host' WHERE user_id = ?", (user_id,))
        existing = query_db("SELECT 1 FROM host_profiles WHERE user_id = ?",
                           (user_id,), one=True)
        if not existing:
            execute_db("INSERT INTO host_profiles (user_id) VALUES (?)", (user_id,))
