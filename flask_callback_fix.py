# Quick fixes to try in your Flask app

# FIX 1: Add strict_slashes=False to handle trailing slash issues
@app.route("/auth/linkedin/callback", strict_slashes=False)
def linkedin_callback():
    # FIX 2: Add try/except and more logging at the very start
    try:
        app.logger.info("=== CALLBACK ROUTE CALLED ===")
        app.logger.info("Request path: %s", request.path)
        app.logger.info("Request URL: %s", request.url)
        app.logger.info("Request method: %s", request.method)
        app.logger.info("/auth/linkedin/callback route accessed. code=%s, state=%s", 
                        request.args.get("code"), request.args.get("state"))
        
        code = request.args.get("code")
        state = request.args.get("state")
        
        # ... rest of your existing code
        
    except Exception as e:
        app.logger.exception("Exception in callback: %s", e)
        return redirect(
            build_frontend_url("/auth/callback", {"error": "callback_exception"}), code=302
        )


# FIX 3: Add a before_request handler to log ALL requests
@app.before_request
def log_request_info():
    app.logger.info('=== INCOMING REQUEST ===')
    app.logger.info('Path: %s', request.path)
    app.logger.info('Method: %s', request.method)
    app.logger.info('URL: %s', request.url)
    app.logger.info('=======================')


# FIX 4: Add error handlers to catch routing errors
@app.errorhandler(404)
def not_found(error):
    app.logger.error('404 ERROR - Path not found: %s', request.path)
    app.logger.error('Request URL: %s', request.url)
    return {'error': 'Not found', 'path': request.path}, 404

