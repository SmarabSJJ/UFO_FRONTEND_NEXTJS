# Flask Backend Redirect Guide

## Problem

After LinkedIn authentication, users are stuck at `http://localhost:5000/auth/linkedin/callback` because the Flask backend isn't redirecting back to the Next.js frontend.

## Solution

The Flask backend's `/auth/linkedin/callback` route needs to redirect to the Next.js frontend after processing the LinkedIn OAuth callback.

## Required Redirect Logic

After the Flask backend successfully processes the LinkedIn callback (exchanges code for token, fetches user data, creates session, etc.), it should redirect to:

### Success Case:

```
http://localhost:3000/auth/callback?status=success&seat={seat_id}
```

### Error Case:

```
http://localhost:3000/auth/callback?error={error_message}&seat={seat_id}
```

## Example Flask Code

```python
from flask import redirect, request, session
import os

@app.route('/auth/linkedin/callback')
def linkedin_callback():
    code = request.args.get('code')
    state = request.args.get('state')  # This should contain the seat ID
    error = request.args.get('error')

    # Get the frontend URL from environment variable
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    if error:
        # Redirect to frontend with error
        seat_param = f"&seat={state}" if state else ""
        return redirect(f"{FRONTEND_URL}/auth/callback?error={error}{seat_param}")

    if not code:
        seat_param = f"&seat={state}" if state else ""
        return redirect(f"{FRONTEND_URL}/auth/callback?error=no_code{seat_param}")

    try:
        # Exchange code for access token
        # ... your token exchange logic ...

        # Fetch LinkedIn user data
        # ... your LinkedIn API calls ...

        # Create session in Flask backend
        # ... your session creation logic ...

        # Extract seat from state (or from session if you stored it)
        seat_id = state or session.get('seat_id', '')

        # Redirect to Next.js frontend with success status
        return redirect(f"{FRONTEND_URL}/auth/callback?status=success&seat={seat_id}")

    except Exception as e:
        # Handle errors
        seat_param = f"&seat={state}" if state else ""
        return redirect(f"{FRONTEND_URL}/auth/callback?error=callback_error{seat_param}")
```

## Environment Variable

Add to your Flask backend's `.env` or environment:

```env
FRONTEND_URL=http://localhost:3000
```

**Note:** Make sure you're accessing your Next.js frontend at `http://localhost:3000` in your browser to match this configuration.

## What Happens Next

1. Flask redirects to `http://localhost:3000/auth/callback?status=success&seat=...`
2. Next.js `/auth/callback` page receives the redirect
3. It fetches the session from Flask backend (`/auth/session`)
4. It redirects to `/Home?linkedin=connected&seat=...`
5. User sees the Home page with LinkedIn data populated

## Testing

After updating your Flask backend:

1. Click "Connect with LinkedIn" from the Next.js frontend
2. Complete LinkedIn authentication
3. You should be automatically redirected back to the Next.js frontend
4. The Home page should show your LinkedIn data
