import re


def validate_password(password):
    """
    Validate password strength.
    Returns (is_valid, message, strength).
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long", "weak"

    strength = "weak"
    score = 0

    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r'[A-Z]', password):
        score += 1
    if re.search(r'[a-z]', password):
        score += 1
    if re.search(r'\d', password):
        score += 1
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1

    if score <= 2:
        strength = "weak"
    elif score <= 4:
        strength = "medium"
    else:
        strength = "strong"

    if score < 3:
        return False, "Password is too weak. Include uppercase, lowercase, digits, and special characters.", strength

    return True, "Password is strong", strength


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(pattern, email):
        return True, "Valid email"
    return False, "Invalid email format"


def validate_phone(phone, country_code='+91'):
    """Validate phone number (10 digits for Indian numbers)."""
    # Remove spaces and dashes
    phone = re.sub(r'[\s\-]', '', phone)

    if country_code == '+91':
        if re.match(r'^[6-9]\d{9}$', phone):
            return True, "Valid phone number"
        return False, "Indian phone number must be 10 digits starting with 6-9"

    # Generic validation for other countries
    if re.match(r'^\d{7,15}$', phone):
        return True, "Valid phone number"
    return False, "Phone number must be 7-15 digits"


COUNTRY_CODES = [
    ('+91', 'India'),
    ('+1', 'United States'),
    ('+44', 'United Kingdom'),
    ('+61', 'Australia'),
    ('+81', 'Japan'),
    ('+49', 'Germany'),
    ('+33', 'France'),
    ('+86', 'China'),
    ('+971', 'UAE'),
    ('+65', 'Singapore'),
    ('+60', 'Malaysia'),
    ('+66', 'Thailand'),
    ('+82', 'South Korea'),
    ('+39', 'Italy'),
    ('+34', 'Spain'),
    ('+7', 'Russia'),
    ('+55', 'Brazil'),
    ('+52', 'Mexico'),
    ('+27', 'South Africa'),
    ('+234', 'Nigeria'),
]
