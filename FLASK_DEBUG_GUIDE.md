# Flask Route Debugging Guide

## Problem
The `/auth/linkedin/callback` route is not being called even though LinkedIn redirects to it.

## Debugging Steps

### 1. Add a catch-all route to see if Flask is receiving ANY requests

Add this **temporarily** at the end of your Flask app (before `if __name__ == "__main__"`):

```python
@app.before_request
def log_request_info():
    app.logger.info('=== REQUEST RECEIVED ===')
    app.logger.info('Path: %s', request.path)
    app.logger.info('Method: %s', request.method)
    app.logger.info('URL: %s', request.url)
    app.logger.info('Args: %s', dict(request.args))
    app.logger.info('=======================')

@app.errorhandler(404)
def not_found(error):
    app.logger.error('404 ERROR - Path not found: %s', request.path)
    return {'error': 'Not found', 'path': request.path}, 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error('500 ERROR: %s', str(error))
    return {'error': 'Internal server error'}, 500
```

### 2. Check if the route is registered correctly

Add this right after your route definition to verify it's registered:

```python
@app.route("/auth/linkedin/callback")
def linkedin_callback():
    # Add this at the very start
    app.logger.info("=== CALLBACK ROUTE CALLED ===")
    app.logger.info("/auth/linkedin/callback route accessed. code=%s, state=%s", 
                    request.args.get("code"), request.args.get("state"))
    
    # ... rest of your code
```

### 3. Check for trailing slash issues

Flask can be sensitive to trailing slashes. Try both:

```python
@app.route("/auth/linkedin/callback")  # Without trailing slash
@app.route("/auth/linkedin/callback/")  # With trailing slash
```

Or use `strict_slashes=False`:

```python
@app.route("/auth/linkedin/callback", strict_slashes=False)
def linkedin_callback():
    # ...
```

### 4. Verify Flask is actually running

Make sure your Flask app is running and listening on port 5000. Check:

```python
if __name__ == "__main__":
    app.logger.setLevel(logging.INFO)  # Make sure logging is enabled
    app.run(debug=True, port=5000, host='0.0.0.0')  # Listen on all interfaces
```

### 5. Check if CORS is blocking the request

If CORS is misconfigured, it might block the redirect. Try temporarily disabling CORS:

```python
# Temporarily comment out or modify CORS
# CORS(app, origins=os.getenv("FRONTEND_URL", ""), supports_credentials=True)
CORS(app, origins="*", supports_credentials=True)  # Allow all origins temporarily
```

### 6. Check for other routes that might be catching this

Make sure you don't have another route that matches `/auth/linkedin/callback` before this one.

### 7. Test the route directly

Try accessing the route directly in your browser (without the code/state):
```
http://localhost:5000/auth/linkedin/callback?code=test&state=test
```

This should trigger your logger if the route is working.

## Most Likely Issues

1. **Route not registered**: The route decorator might not be working
2. **Flask not running**: The app might not be running on port 5000
3. **Trailing slash mismatch**: LinkedIn might be redirecting with/without a trailing slash
4. **Error before logger**: An exception might be happening before the logger line

## Quick Fix to Try First

Add this at the very top of your `linkedin_callback` function:

```python
@app.route("/auth/linkedin/callback")
def linkedin_callback():
    try:
        app.logger.info("=== CALLBACK ROUTE CALLED ===")
        app.logger.info("Request path: %s", request.path)
        app.logger.info("Request URL: %s", request.url)
        app.logger.info("Code: %s", request.args.get("code"))
        app.logger.info("State: %s", request.args.get("state"))
        
        # ... rest of your existing code
    except Exception as e:
        app.logger.exception("Exception in callback: %s", e)
        raise
```

This will help identify if:
- The route is being called at all
- An exception is happening before your logger
- The request is reaching Flask

