from flask import Blueprint, request, session, redirect, url_for, flash, render_template, jsonify
from models.user import User
from utils.validators import validate_email, validate_password, validate_phone, COUNTRY_CODES
from utils.email import send_verification_email

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET'])
def login_page():
    if 'user_id' in session:
        return redirect(url_for('main.index'))
    return render_template('auth/login.html')


@auth_bp.route('/register', methods=['GET'])
def register_page():
    if 'user_id' in session:
        return redirect(url_for('main.index'))
    return render_template('auth/register.html', country_codes=COUNTRY_CODES)


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() if request.is_json else request.form

    email = data.get('email', '').strip()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone_country_code = data.get('phone_country_code', '+91')
    phone_number = data.get('phone_number', '').strip()
    role = data.get('role', 'guest')

    # Validate
    errors = []
    if not first_name:
        errors.append("First name is required")
    if not last_name:
        errors.append("Last name is required")

    valid_email, msg = validate_email(email)
    if not valid_email:
        errors.append(msg)

    valid_pw, msg, strength = validate_password(password)
    if not valid_pw:
        errors.append(msg)

    if phone_number:
        valid_phone, msg = validate_phone(phone_number, phone_country_code)
        if not valid_phone:
            errors.append(msg)

    if User.get_by_email(email):
        errors.append("An account with this email already exists")

    if errors:
        if request.is_json:
            return jsonify({'success': False, 'errors': errors}), 400
        for err in errors:
            flash(err, 'danger')
        return redirect(url_for('auth.register_page'))

    try:
        user_id = User.create(email, password, first_name, last_name,
                               phone_country_code, phone_number, role)

        # Create verification token and send email
        token = User.create_verification_token(user_id)
        send_verification_email(email, token, first_name)

        if request.is_json:
            return jsonify({'success': True, 'message': 'Account created successfully. Please check your email to verify your account.',
                           'user_id': user_id})

        flash('Account created! Please check your email to verify your account.', 'success')
        return redirect(url_for('auth.login_page'))

    except Exception as e:
        if request.is_json:
            return jsonify({'success': False, 'errors': [str(e)]}), 500
        flash(f'Registration failed: {str(e)}', 'danger')
        return redirect(url_for('auth.register_page'))


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() if request.is_json else request.form

    email = data.get('email', '').strip()
    password = data.get('password', '')

    user = User.authenticate(email, password)
    if not user:
        if request.is_json:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        flash('Invalid email or password.', 'danger')
        return redirect(url_for('auth.login_page'))

    # Set session
    session['user_id'] = user['user_id']
    session['email'] = user['email']
    session['first_name'] = user['first_name']
    session['last_name'] = user['last_name']
    session['role'] = user['role']
    session['profile_image'] = user['profile_image']

    if request.is_json:
        return jsonify({'success': True, 'message': 'Login successful',
                        'user': {'user_id': user['user_id'], 'role': user['role'],
                                 'first_name': user['first_name']}})

    next_url = request.args.get('next')
    if user['role'] == 'host':
        return redirect(next_url or url_for('host.dashboard'))
    elif user['role'] == 'admin':
        return redirect(next_url or url_for('admin.dashboard'))
    return redirect(next_url or url_for('main.index'))


@auth_bp.route('/api/auth/logout', methods=['POST', 'GET'])
def logout():
    session.clear()
    if request.is_json:
        return jsonify({'success': True})
    return redirect(url_for('main.index'))


@auth_bp.route('/auth/verify/<token>')
def verify_email(token):
    if User.verify_email(token):
        flash('Email verified successfully! You can now log in.', 'success')
    else:
        flash('Invalid or expired verification link.', 'danger')
    return redirect(url_for('auth.login_page'))


@auth_bp.route('/api/auth/validate-password', methods=['POST'])
def validate_password_api():
    data = request.get_json()
    password = data.get('password', '')
    valid, msg, strength = validate_password(password)
    return jsonify({'valid': valid, 'message': msg, 'strength': strength})
