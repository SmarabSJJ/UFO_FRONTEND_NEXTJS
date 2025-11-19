import os
import json
import secrets
import urllib.parse
import logging
from datetime import datetime, timedelta

import requests
from flask import Flask, abort, redirect, request, make_response, url_for
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

# Ensure logs always show up in terminal
import sys
app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.propagate = False

# CORS is optional for pure redirect flows; keep it if you expect fetch/XHR later.
CORS(app, origins=os.getenv("FRONTEND_URL", ""), supports_credentials=True)

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://127.0.0.1:5000/auth/linkedin/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
SESSION_COOKIE_NAME = "auth_session"

if not all([CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL]):
    raise RuntimeError("Missing LinkedIn or frontend configuration in environment.")

# In a real deployment, store state+session server-side (Redis, database, etc.).
STATE_STORE: dict[str, dict] = {}


def remember_state(state: str, payload: dict) -> None:
    STATE_STORE[state] = {
        "payload": payload,
        "expires": datetime.utcnow() + timedelta(minutes=5),
    }


def pop_state(state: str) -> dict | None:
    record = STATE_STORE.pop(state, None)
    if not record:
        return None
    if record["expires"] < datetime.utcnow():
        return None
    return record["payload"]


def build_frontend_url(path: str, query: dict | None = None) -> str:
    query_string = urllib.parse.urlencode(query or {})
    return urllib.parse.urljoin(FRONTEND_URL, path) + (f"?{query_string}" if query_string else "")


# ========== DEBUGGING: Log ALL incoming requests ==========
@app.before_request
def log_request_info():
    app.logger.info('=' * 60)
    app.logger.info('=== INCOMING REQUEST ===')
    app.logger.info('Path: %s', request.path)
    app.logger.info('Method: %s', request.method)
    app.logger.info('URL: %s', request.url)
    app.logger.info('Full Path: %s', request.full_path)
    app.logger.info('Args: %s', dict(request.args))
    app.logger.info('=' * 60)


# ========== DEBUGGING: Error handlers ==========
@app.errorhandler(404)
def not_found(error):
    app.logger.error('=' * 60)
    app.logger.error('404 ERROR - Path not found: %s', request.path)
    app.logger.error('Request URL: %s', request.url)
    app.logger.error('Full Path: %s', request.full_path)
    app.logger.error('=' * 60)
    return {'error': 'Not found', 'path': request.path, 'url': request.url}, 404


@app.errorhandler(500)
def internal_error(error):
    app.logger.error('=' * 60)
    app.logger.error('500 ERROR: %s', str(error))
    app.logger.error('Request path: %s', request.path)
    app.logger.error('=' * 60)
    return {'error': 'Internal server error'}, 500


# ========== DEBUGGING: Test route to verify Flask is working ==========
@app.route("/test")
def test_route():
    app.logger.info("Test route accessed!")
    return {"status": "ok", "message": "Flask is running", "port": 5000}


@app.route("/auth/linkedin/login")
def linkedin_login():
    # Get token from query parameter (passed from Next.js)
    # Store it in state so we can pass it back to frontend after OAuth
    token = request.args.get("token")
    is_profile = request.args.get("profile") == "true"  # Check if this is for profile page
    app.logger.info('=' * 60)
    app.logger.info('=== LINKEDIN LOGIN ROUTE ===')
    app.logger.info('Token received: %s', token[:20] + '...' if token else 'None')
    app.logger.info('Token length: %s', len(token) if token else 0)
    app.logger.info('Is profile flow: %s', is_profile)
    app.logger.info('=' * 60)
    
    state = secrets.token_urlsafe(32)

    # Store token and profile flag in state so we can pass it back after OAuth completes
    payload = {}
    if token:
        payload["token"] = token
    if is_profile:
        payload["profile"] = True
    app.logger.info('Storing in state: %s', state[:20] + '...')
    app.logger.info('Payload: %s', payload)
    remember_state(state, payload)

    scope = "openid profile email"
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "state": state,
    }

    auth_url = "https://www.linkedin.com/oauth/v2/authorization"
    return redirect(f"{auth_url}?{urllib.parse.urlencode(params)}", code=302)


@app.route("/auth/linkedin/callback", strict_slashes=False)
def linkedin_callback():
    # ========== ENHANCED DEBUGGING ==========
    app.logger.info('=' * 60)
    app.logger.info('=== CALLBACK ROUTE CALLED ===')
    app.logger.info('Path: %s', request.path)
    app.logger.info('URL: %s', request.url)
    app.logger.info('Code: %s', request.args.get("code"))
    app.logger.info('State: %s', request.args.get("state"))
    app.logger.info('All args: %s', dict(request.args))
    app.logger.info('=' * 60)
    
    code = request.args.get("code")
    state = request.args.get("state")

    if not code or not state:
        # Can't determine if profile flow without state, default to regular flow
        return redirect(
            build_frontend_url("/auth/callback", {"error": "missing_code_state"}), code=302
        )

    saved_state = pop_state(state)
    app.logger.info('=' * 60)
    app.logger.info('=== CALLBACK STATE RETRIEVAL ===')
    app.logger.info('State received from LinkedIn: %s', state[:20] + '...' if state else 'None')
    app.logger.info('Saved state retrieved: %s', saved_state)
    if saved_state:
        app.logger.info('Token in saved_state: %s', saved_state.get("token", "NOT FOUND")[:20] + '...' if saved_state.get("token") else "NOT FOUND")
    app.logger.info('=' * 60)
    
    if saved_state is None:
        is_profile_flow = False  # Default to regular flow
        redirect_path = "/auth/callback"
        callback_params = {"error": "invalid_or_expired_state"}
        # Try to determine if it was a profile flow from the state (fallback)
        # But since state is invalid, we default to regular flow
        return redirect(
            build_frontend_url(redirect_path, callback_params), code=302
        )

    try:
        token_resp = requests.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise ValueError("Access token missing in response.")
    except Exception as exc:
        app.logger.exception("Token exchange failed: %s", exc)
        # saved_state already popped above, check if it's a profile flow
        is_profile_error = saved_state.get("profile", False) if saved_state else False
        redirect_path = "/profile" if is_profile_error else "/auth/callback"
        return redirect(
            build_frontend_url(redirect_path, {"error": "token_exchange_failed"}), code=302
        )

    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        profile_resp = requests.get("https://api.linkedin.com/v2/userinfo", headers=headers, timeout=10)
        profile_resp.raise_for_status()
        profile = profile_resp.json()
    except Exception as exc:
        app.logger.exception("Failed to fetch LinkedIn profile: %s", exc)
        # saved_state already popped above, check it before it was popped
        # Actually we need to get it from the state that was already popped
        # Since we already have saved_state, use it
        is_profile_error = saved_state.get("profile", False) if saved_state else False
        redirect_path = "/profile" if is_profile_error else "/auth/callback"
        return redirect(
            build_frontend_url(redirect_path, {"error": "profile_fetch_failed"}), code=302
        )

    # Extract the fields you need
    # LinkedIn userinfo endpoint returns profile picture in 'picture' field
    profile_picture = profile.get("picture") or profile.get("picture_url") or ""
    
    user_info = {
        "firstName": profile.get("given_name") or profile.get("localizedFirstName") or "",
        "lastName": profile.get("family_name") or profile.get("localizedLastName") or "",
        "email": profile.get("email", ""),
        "linkedinId": profile.get("sub", ""),
        "profilePicture": profile_picture,
        # Note: seat/token info is handled by frontend, not needed here
    }

    # TODO: store user_info + tokens in DB/session.
    # Here we mint a dummy session token. Replace with your session logic.
    session_token = secrets.token_urlsafe(32)

    # Get token and profile flag from saved state to pass back to frontend
    saved_token = saved_state.get("token") if saved_state else None
    is_profile_flow = saved_state.get("profile", False) if saved_state else False
    app.logger.info('=' * 60)
    app.logger.info('=== BUILDING CALLBACK URL ===')
    app.logger.info('Saved token extracted: %s', saved_token[:20] + '...' if saved_token else 'None')
    app.logger.info('Token length: %s', len(saved_token) if saved_token else 0)
    app.logger.info('Is profile flow: %s', is_profile_flow)
    
    # Build callback URL - if profile flow, redirect to /profile, otherwise /auth/callback
    if is_profile_flow:
        # For profile flow, redirect directly to /profile with success
        callback_params = {"linkedin": "connected"}
        callback_url = build_frontend_url("/profile", callback_params)
    else:
        # For regular flow, use /auth/callback with token if available
        callback_params = {"status": "success"}
        if saved_token:
            callback_params["token"] = saved_token
        callback_url = build_frontend_url("/auth/callback", callback_params)
    
    app.logger.info('Callback URL: %s', callback_url)
    app.logger.info('Callback params: %s', callback_params)
    app.logger.info('=' * 60)
    
    response = make_response(
        redirect(
            callback_url,
            code=302
        )
    )
    response.set_cookie(
        SESSION_COOKIE_NAME,
        session_token,
        httponly=True,
        secure=FRONTEND_URL.startswith("https"),
        samesite="Lax",
        max_age=3600,
    )

    # In real usage, tie session_token to user_info in your session store.
    STATE_STORE[session_token] = {"user": user_info}

    return response


@app.route("/auth/session")
def auth_session():
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    record = STATE_STORE.get(session_token)
    if not record:
        abort(401)
    return record["user"]


@app.route("/api/profile", methods=["POST"])
def save_profile():
    """
    Save user profile data.
    Can be called with or without session (for profile page usage).
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return {"error": "No data provided"}, 400
        
        firstName = data.get("firstName", "")
        lastName = data.get("lastName", "")
        email = data.get("email", "")
        linkedInURL = data.get("linkedInURL", "")
        photo = data.get("photo", "")
        
        if not firstName or not lastName or not email:
            return {"error": "firstName, lastName, and email are required"}, 400
        
        # Get session token if available (optional for profile page)
        session_token = request.cookies.get(SESSION_COOKIE_NAME)
        
        # Prepare profile data
        profile_data = {
            "firstName": firstName,
            "lastName": lastName,
            "email": email,
            "linkedInURL": linkedInURL,
            "photo": photo,
        }
        
        # If session exists, update the user data in session store
        if session_token:
            record = STATE_STORE.get(session_token)
            if record:
                # Update existing session user data
                record["user"] = {**record.get("user", {}), **profile_data}
                STATE_STORE[session_token] = record
                app.logger.info(f"Updated profile for session: {session_token[:20]}...")
            else:
                # Create new session entry
                STATE_STORE[session_token] = {"user": profile_data}
                app.logger.info(f"Created new session profile: {session_token[:20]}...")
        
        # TODO: In production, save to database instead of in-memory store
        # For now, we'll just return success
        # You can add database save logic here:
        # db.save_profile(email, profile_data)
        
        app.logger.info(f"Profile saved for: {email}")
        
        return {
            "success": True,
            "message": "Profile saved successfully",
            "data": profile_data
        }, 200
        
    except Exception as exc:
        app.logger.exception("Error saving profile: %s", exc)
        return {"error": "Failed to save profile", "details": str(exc)}, 500


# Make app available for flask run command
# Set FLASK_APP=app.py and use: flask run
# OR run directly with: python app.py

if __name__ == "__main__":
    app.logger.info('=' * 60)
    app.logger.info('Starting Flask app...')
    app.logger.info('REDIRECT_URI: %s', REDIRECT_URI)
    app.logger.info('FRONTEND_URL: %s', FRONTEND_URL)
    app.logger.info('CLIENT_ID: %s', CLIENT_ID[:10] + '...' if CLIENT_ID else 'NOT SET')
    app.logger.info('CLIENT_SECRET: %s', 'SET' if CLIENT_SECRET else 'NOT SET')
    app.logger.info('Listening on: http://127.0.0.1:5000')
    app.logger.info('=' * 60)
    app.run(host="127.0.0.1", port=5000, debug=True)
