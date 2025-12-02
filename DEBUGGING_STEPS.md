# Debugging Steps for Flask Callback Issue

## What I Added to Your Flask App

1. **Enhanced Logging Configuration** - All requests will now be logged
2. **Request Interceptor** - Logs EVERY incoming request before it reaches any route
3. **Error Handlers** - Catches 404 and 500 errors with detailed logging
4. **Test Route** - `/test` endpoint to verify Flask is running
5. **Enhanced Callback Logging** - More detailed logs in the callback route

## How to Debug

### Step 1: Restart Your Flask App

```bash
python app.py
```

You should see startup logs showing:
- REDIRECT_URI
- FRONTEND_URL
- CLIENT_ID (first 10 chars)
- CLIENT_SECRET status

### Step 2: Test Flask is Running

Open in your browser:
```
http://localhost:5000/test
```

You should see:
- Logs showing the request was received
- JSON response: `{"status": "ok", "message": "Flask is running", "port": 5000}`

### Step 3: Test the Callback Route Directly

Open in your browser:
```
http://localhost:5000/auth/linkedin/callback?code=test123&state=teststate
```

**What to look for:**
- If you see `=== INCOMING REQUEST ===` logs → Flask is receiving the request
- If you see `=== CALLBACK ROUTE CALLED ===` logs → The route is being matched
- If you see `404 ERROR` logs → The route is NOT being matched (routing issue)

### Step 4: Try LinkedIn OAuth Flow

1. Click "Connect with LinkedIn" from your frontend
2. Complete LinkedIn authentication
3. Watch the Flask logs

**What to look for:**

#### Scenario A: You see `=== INCOMING REQUEST ===` but NOT `=== CALLBACK ROUTE CALLED ===`
- **Problem:** Route is not matching
- **Check:** The `Path:` in the logs - does it match `/auth/linkedin/callback` exactly?
- **Solution:** There might be a trailing slash issue or the route isn't registered

#### Scenario B: You see `404 ERROR` logs
- **Problem:** Route definitely not found
- **Check:** What path is shown in the 404 error?
- **Solution:** Verify the route decorator is correct

#### Scenario C: You see NO logs at all
- **Problem:** Flask is not receiving the request
- **Possible causes:**
  - Flask is not running
  - Wrong port (not 5000)
  - Wrong hostname (localhost vs 127.0.0.1)
  - Request is going to a different server

#### Scenario D: You see `=== CALLBACK ROUTE CALLED ===`
- **Success!** The route is being called
- Check the code and state values in the logs
- Continue debugging from there

## Common Issues

### Issue 1: Route Not Matching
**Symptoms:** See incoming request logs but not callback route logs

**Check:**
- Is the path exactly `/auth/linkedin/callback`? (no trailing slash)
- Is there another route that might be catching it first?

**Fix:**
- The `strict_slashes=False` should handle this, but verify

### Issue 2: Flask Not Running
**Symptoms:** No logs at all, browser shows connection error

**Check:**
- Is Flask actually running? Check terminal
- Is it on port 5000? Check the startup logs
- Try accessing `/test` route

### Issue 3: Wrong URL
**Symptoms:** Request goes to wrong server

**Check:**
- LinkedIn app redirect URI must match exactly: `http://localhost:5000/auth/linkedin/callback`
- Make sure you're using `localhost` not `127.0.0.1` (or vice versa consistently)

### Issue 4: CORS Blocking
**Symptoms:** Request might be blocked before reaching Flask

**Check:**
- CORS is configured, but if you see incoming request logs, CORS is not the issue
- CORS only affects browser fetch/XHR, not redirects

## What the Logs Will Tell You

When LinkedIn redirects to your callback, you should see:

```
============================================================
=== INCOMING REQUEST ===
Path: /auth/linkedin/callback
Method: GET
URL: http://localhost:5000/auth/linkedin/callback?code=...&state=...
Full Path: /auth/linkedin/callback?code=...&state=...
Args: {'code': '...', 'state': '...'}
============================================================
============================================================
=== CALLBACK ROUTE CALLED ===
Path: /auth/linkedin/callback
URL: http://localhost:5000/auth/linkedin/callback?code=...&state=...
Code: ...
State: ...
All args: {'code': '...', 'state': '...'}
============================================================
```

If you see the first block but NOT the second, the route is not matching.

## Next Steps

1. Run Flask and watch the logs
2. Try the test route: `http://localhost:5000/test`
3. Try the callback directly: `http://localhost:5000/auth/linkedin/callback?code=test&state=test`
4. Try the full LinkedIn OAuth flow
5. Share the logs you see (especially what appears when LinkedIn redirects)

