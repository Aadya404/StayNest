import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config


def send_email(to_email, subject, html_body):
    """
    Send an email. Falls back to console logging if SMTP is not configured.
    """
    if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
        # Console mode - log the email
        print(f"\n{'='*60}")
        print(f"EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"{'='*60}")
        print(html_body[:500])
        print(f"{'='*60}\n")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = Config.MAIL_DEFAULT_SENDER
        msg['To'] = to_email

        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)

        with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
            server.starttls()
            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.sendmail(Config.MAIL_DEFAULT_SENDER, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False


def send_verification_email(email, token, first_name):
    """Send email verification link."""
    verification_url = f"http://localhost:5000/auth/verify/{token}"
    html = f"""
    <div style="font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF385C; font-size: 28px; margin: 0;">StayNest</h1>
        </div>
        <h2 style="color: #222;">Verify your email address</h2>
        <p style="color: #484848; line-height: 1.6;">Hello {first_name},</p>
        <p style="color: #484848; line-height: 1.6;">Thank you for signing up with StayNest. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" style="background-color: #FF385C; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #767676; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #EBEBEB; margin: 30px 0;">
        <p style="color: #767676; font-size: 12px; text-align: center;">StayNest - Find your perfect stay</p>
    </div>
    """
    return send_email(email, "Verify your StayNest account", html)


def send_booking_confirmation(email, first_name, property_title, check_in, check_out, total_price):
    """Send booking confirmation email."""
    html = f"""
    <div style="font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF385C; font-size: 28px; margin: 0;">StayNest</h1>
        </div>
        <h2 style="color: #222;">Booking Confirmed!</h2>
        <p style="color: #484848; line-height: 1.6;">Hello {first_name},</p>
        <p style="color: #484848; line-height: 1.6;">Great news! Your booking has been confirmed.</p>
        <div style="background: #F7F7F7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #222; margin-top: 0;">{property_title}</h3>
            <p style="color: #484848; margin: 8px 0;"><strong>Check-in:</strong> {check_in}</p>
            <p style="color: #484848; margin: 8px 0;"><strong>Check-out:</strong> {check_out}</p>
            <p style="color: #484848; margin: 8px 0;"><strong>Total:</strong> Rs. {total_price:,.2f}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #EBEBEB; margin: 30px 0;">
        <p style="color: #767676; font-size: 12px; text-align: center;">StayNest - Find your perfect stay</p>
    </div>
    """
    return send_email(email, f"Booking Confirmed - {property_title}", html)
