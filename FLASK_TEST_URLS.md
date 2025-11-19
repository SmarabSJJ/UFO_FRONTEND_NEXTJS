# Flask Backend Test URLs

Open these URLs in your browser to test if your Flask backend is working.

## 1. Basic Test Route (Should Always Work)
```
http://localhost:5000/test
```
**Expected:** JSON response: `{"status": "ok", "message": "Flask is running", "port": 5000}`

**If this doesn't work:** Flask is not running or not on port 5000.

---

## 2. Test LinkedIn Login Route (Without Actually Logging In)
```
http://localhost:5000/auth/linkedin/login?seat=01
```
**Expected:** Redirects to LinkedIn authorization page

**If this doesn't work:** Check your LinkedIn CLIENT_ID configuration

---

## 3. Test Callback Route Directly (Simulate LinkedIn Redirect)
```
http://localhost:5000/auth/linkedin/callback?code=test_code_123&state=test_state_456
```
**Expected:** 
- Should see logs in Flask terminal showing the request
- Should redirect to frontend with an error (since code/state are fake)
- Redirect URL: `http://localhost:3000/auth/callback?error=invalid_or_expired_state`

**If this doesn't work:** The route might not be registered correctly

---

## 4. Test Session Route (Will Fail Without Cookie, But Should Return 401)
```
http://localhost:5000/auth/session
```
**Expected:** 
- Should return 401 Unauthorized (since no session cookie)
- This confirms the route exists

**If this doesn't work:** Route might not be registered

---

## 5. Test Non-Existent Route (Should Return 404)
```
http://localhost:5000/does-not-exist
```
**Expected:** 
- Should see 404 error logs in Flask terminal
- Should return JSON: `{"error": "Not found", "path": "/does-not-exist", "url": "..."}`

**If this doesn't work:** Error handlers might not be set up

---

## What to Check in Flask Terminal

When you open each URL, watch your Flask terminal for logs:

### For `/test`:
```
=== INCOMING REQUEST ===
Path: /test
Method: GET
...
Test route accessed!
```

### For `/auth/linkedin/callback`:
```
=== INCOMING REQUEST ===
Path: /auth/linkedin/callback
Method: GET
...
=== CALLBACK ROUTE CALLED ===
Path: /auth/linkedin/callback
Code: test_code_123
State: test_state_456
...
```

### For `/auth/session`:
```
=== INCOMING REQUEST ===
Path: /auth/session
Method: GET
...
```

### For `/does-not-exist`:
```
=== INCOMING REQUEST ===
Path: /does-not-exist
Method: GET
...
404 ERROR - Path not found: /does-not-exist
```

---

## Quick Test Sequence

1. **Start Flask:** `python app.py`
2. **Open test route:** `http://localhost:5000/test` → Should see JSON response
3. **Open callback test:** `http://localhost:5000/auth/linkedin/callback?code=test&state=test` → Should see logs and redirect
4. **Check Flask terminal** → Should see all the request logs

If all of these work, your Flask backend is running correctly!

