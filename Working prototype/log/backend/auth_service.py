"""
AuthSentinel — Authentication Service
======================================
Email-based authentication using Resend for transactional emails.
Handles verification token generation, email sending, and JWT issuance.
"""

import os
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Tuple

import jwt
import resend
from email_validator import validate_email, EmailNotValidError

logger = logging.getLogger("authsentinel.auth")

# ── Configuration ────────────────────────────────────────────────────────────
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@tavix-guard.dev")
VERIFICATION_TOKEN_EXPIRY_MINUTES = 15
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30

# ── Frontend URL ─────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
VERIFICATION_CALLBACK_URL = f"{FRONTEND_URL}/verify-email"


# ── Utility Functions ────────────────────────────────────────────────────────
def generate_verification_token() -> str:
    """Generate a secure random verification token."""
    return secrets.token_urlsafe(32)


def validate_email_format(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format using email_validator library.
    Returns (is_valid, error_message).
    """
    try:
        validate_email(email, check_deliverability=False)
        return True, None
    except EmailNotValidError as e:
        return False, str(e)


def send_verification_email(email: str, verification_token: str) -> Tuple[bool, Optional[str]]:
    """
    Send verification email via Resend.
    Returns (success, error_message).
    """
    # If RESEND_API_KEY is not set, log to console instead
    if not RESEND_API_KEY or RESEND_API_KEY == "":
        logger.warning(f"[MOCK EMAIL] Verification link for {email}:")
        verification_url = f"{VERIFICATION_CALLBACK_URL}?token={verification_token}"
        logger.warning(f"[MOCK EMAIL] Click here: {verification_url}")
        logger.warning(f"[MOCK EMAIL] Token expires in {VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes")
        return True, None

    # Send via Resend
    try:
        resend.api_key = RESEND_API_KEY
        
        verification_url = f"{VERIFICATION_CALLBACK_URL}?token={verification_token}"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                    .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>TAVIX GUARD</h1>
                        <p>Email Verification</p>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for signing up to TAVIX GUARD. Click the button below to verify your email address and access the dashboard.</p>
                        <p>This link expires in {VERIFICATION_TOKEN_EXPIRY_MINUTES} minutes.</p>
                        <a href="{verification_url}" class="button">Verify Email</a>
                        <p style="margin-top: 20px; color: #666; font-size: 14px;">
                            Or copy and paste this link in your browser:<br>
                            <code style="background: #e5e7eb; padding: 8px; border-radius: 4px; display: block; word-break: break-all; margin-top: 10px;">
                                {verification_url}
                            </code>
                        </p>
                    </div>
                    <div class="footer">
                        <p>If you did not request this email, you can safely ignore it.</p>
                        <p>&copy; 2025 TAVIX GUARD. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        params = {
            "from": RESEND_FROM_EMAIL,
            "to": email,
            "subject": "Verify your TAVIX GUARD email",
            "html": html_content,
        }
        
        email_response = resend.Emails.send(params)
        
        if email_response.get("id"):
            logger.info(f"Verification email sent to {email} (id: {email_response['id']})")
            return True, None
        else:
            error = email_response.get("message", "Unknown error")
            logger.error(f"Failed to send email to {email}: {error}")
            return False, error
    
    except Exception as e:
        logger.error(f"Exception sending verification email to {email}: {str(e)}")
        return False, str(e)


def generate_jwt_token(user_id: int, email: str) -> str:
    """
    Generate a JWT token for authenticated user.
    Expires in JWT_EXPIRY_DAYS days.
    """
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(days=JWT_EXPIRY_DAYS)
    
    payload = {
        "user_id": user_id,
        "email": email,
        "iat": now,
        "exp": expiry,
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def verify_jwt_token(token: str) -> Optional[Dict]:
    """
    Verify JWT token and return payload if valid.
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        return None


def get_token_from_header(authorization_header: Optional[str]) -> Optional[str]:
    """
    Extract JWT token from Authorization header.
    Expected format: "Bearer <token>"
    """
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


# ── Initialization ───────────────────────────────────────────────────────────
def init_auth_service():
    """Initialize the auth service (called on app startup)."""
    if RESEND_API_KEY:
        logger.info("Resend API key configured. Emails will be sent via Resend.")
        resend.api_key = RESEND_API_KEY
    else:
        logger.warning("RESEND_API_KEY not set. Emails will be logged to console (mock mode).")
    
    logger.info(f"JWT secret key: {'configured' if JWT_SECRET_KEY != 'your-secret-key-change-in-production' else 'NOT CONFIGURED - using default'}")
    logger.info(f"Frontend URL: {FRONTEND_URL}")
