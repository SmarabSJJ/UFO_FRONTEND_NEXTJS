# Flask App Changes Needed

The Flask app running in your other directory needs these changes to preserve the token through LinkedIn OAuth.

## Change 1: `/auth/linkedin/login` route

**Find this route and update it to:**

```python
@app.route("/auth/linkedin/login")
def linkedin_login():
    # Get token from query parameter (passed from Next.js)
    token = request.args.get("token")
    
    state = secrets.token_urlsafe(32)

    # Store token in state so we can pass it back after OAuth completes
    remember_state(state, {"token": token} if token else {})

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
```

**Key change:** Add `token = request.args.get("token")` and store it in state: `remember_state(state, {"token": token} if token else {})`

## Change 2: `/auth/linkedin/callback` route

**Find the callback route and add this code BEFORE the final redirect:**

```python
# Get token from saved state to pass back to frontend
saved_token = saved_state.get("token") if saved_state else None

# Build callback URL with token if available
callback_params = {"status": "success"}
if saved_token:
    callback_params["token"] = saved_token

callback_url = build_frontend_url("/auth/callback", callback_params)

response = make_response(
    redirect(
        callback_url,
        code=302
    )
)
```

**Key change:** Extract token from `saved_state` and include it in the `callback_params` when building the redirect URL.

## Summary

1. **Login route**: Accept `?token=...` query param and store it in state
2. **Callback route**: Retrieve token from state and pass it back in redirect URL as `?token=...`

That's it! The token will flow: Next.js → Flask (store in state) → LinkedIn → Flask (retrieve from state) → Next.js callback page.

