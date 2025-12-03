import os
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory

# support running as a module (recommended) and as a script
try:
	# when used as a package (python -m backend.app or via flask)
	from .config import Config
	from .extensions import db, migrate, jwt
	from .api import api_bp
except Exception:
	# when executed directly as a script (python app.py) the package-relative
	# imports often fail. To support running the script from inside the
	# `backend/` directory we insert the repo root on sys.path and import the
	# `backend` package explicitly so package-relative imports inside submodules
	# (like `api.users` which uses `..extensions`) resolve correctly.
	import sys
	import os
	import importlib

	repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
	if repo_root not in sys.path:
		sys.path.insert(0, repo_root)

	backend_config = importlib.import_module("backend.config")
	backend_extensions = importlib.import_module("backend.extensions")
	backend_api = importlib.import_module("backend.api")

	Config = backend_config.Config  # type: ignore
	db = backend_extensions.db  # type: ignore
	migrate = backend_extensions.migrate  # type: ignore
	jwt = backend_extensions.jwt  # type: ignore
	api_bp = backend_api.api_bp  # type: ignore


def create_app(config_object: object | None = None):
	"""Flask application factory.

	- Loads environment from .env
	- Initializes extensions (db, migrate)
	- Registers blueprints under /api
	"""
	# load .env located next to this file (backend/.env) so CLI runs from
	# the repo root still pick up the correct DATABASE_URL.
	here = os.path.dirname(os.path.abspath(__file__))
	dotenv_path = os.path.join(here, ".env")
	load_dotenv(dotenv_path)

	app = Flask(__name__)
	app.config.from_object(config_object or Config)

	# initialize extensions
	db.init_app(app)
	migrate.init_app(app, db)
	# init JWT (raise if missing so we catch misconfiguration early)
	# `jwt` is provided by the module-level import/fallback above so avoid
	# package-relative imports here which break when the module is executed
	# as a script or via `python -c`.
	if 'jwt' not in globals():
		raise RuntimeError("JWT extension not available; check backend.extensions")

	jwt.init_app(app)

	# Initialize background scheduler for interview status updates
	# Temporarily disabled to debug API issues
	# try:
	# 	from .scheduler import init_scheduler
	# 	init_scheduler(app)
	# except Exception as e:
	# 	print(f"Warning: Could not initialize background scheduler: {e}")
	pass

	# enable CORS for API routes so frontend dev server can call /api/*
	try:
		from flask_cors import CORS  # type: ignore
		# Restrict CORS origins to the frontend origin when available. In local
		# development frontend commonly runs on http://localhost:3000; prefer an
		# explicit origin over a wildcard to reduce CSRF risk for APIs.
		frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
		jwt_samesite = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
		jwt_secure = os.getenv("JWT_COOKIE_SECURE", "0")
		print(f"FRONTEND_ORIGIN: {frontend_origin}", flush=True)
		print(f"JWT_COOKIE_SAMESITE: {jwt_samesite}", flush=True)
		print(f"JWT_COOKIE_SECURE: {jwt_secure}", flush=True)
		# Support comma-separated list of origins
		origins_list = [o.strip().rstrip("/") for o in frontend_origin.split(",")]
		print(f"Setting CORS origins to: {origins_list}", flush=True)
		CORS(app, resources={r"/api/*": {"origins": origins_list}}, supports_credentials=True)
	except Exception as e:
		print(f"Failed to configure CORS: {e}", flush=True)
		# flask-cors not installed or not needed in production
		pass

	# register blueprints
	app.register_blueprint(api_bp, url_prefix="/api")

	# Debug logging for requests
	@app.before_request
	def log_request_info():
		from flask import request
		print(f"REQUEST: {request.method} {request.url} - Origin: {request.headers.get('Origin')} - Cookies: {bool(request.cookies)}", flush=True)

	# Error handlers for API routes - return JSON instead of HTML
	@app.errorhandler(400)
	def bad_request(error):
		return jsonify({"error": "Bad Request", "message": str(error)}), 400

	@app.errorhandler(401)
	def unauthorized(error):
		return jsonify({"error": "Unauthorized", "message": str(error)}), 401

	@app.errorhandler(403)
	def forbidden(error):
		return jsonify({"error": "Forbidden", "message": str(error)}), 403

	@app.errorhandler(404)
	def not_found(error):
		return jsonify({"error": "Not Found", "message": str(error)}), 404

	@app.errorhandler(500)
	def internal_error(error):
		return jsonify({"error": "Internal Server Error", "message": str(error)}), 500

	# Serve uploaded files
	@app.route('/uploads/<path:filename>')
	def uploaded_file(filename):
		return send_from_directory(os.path.join(here, 'uploads'), filename)

	# Security: set safer cookie flags for session cookies. These defaults help
	# prevent client-side script access to session cookies and allow enabling
	# Secure in environments that terminate TLS.
	app.config.setdefault("SESSION_COOKIE_HTTPONLY", True)
	app.config.setdefault(
		"SESSION_COOKIE_SECURE",
		os.getenv("SESSION_COOKIE_SECURE", "0") == "1",
	)

	# Warn if secret keys are left as defaults - helpful during development to
	# avoid accidentally running with weak keys in staging/production.
	if app.config.get("SECRET_KEY") in (None, "dev-secret") or app.config.get("JWT_SECRET_KEY") in (None, app.config.get("SECRET_KEY")):
		print("WARNING: SECRET_KEY or JWT_SECRET_KEY appears to be using a default value.\nSet SECRET_KEY and JWT_SECRET_KEY in backend/.env for secure deployments.")

	# Add common security response headers to reduce several classes of attacks.
	@app.after_request
	def set_security_headers(response):
		# Prevent MIME type sniffing
		response.headers.setdefault("X-Content-Type-Options", "nosniff")
		# Clickjacking protection
		response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
		# Basic referrer policy
		response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
		# Feature-Policy / Permissions-Policy can be tightened as needed
		# response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=()")
		# HSTS only when explicitly enabled (set ENABLE_HSTS=1 in production)
		if os.getenv("ENABLE_HSTS", "0") == "1":
			response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		return response

	# debug: log Authorization header for /api/auth/me to help diagnose token issues
	@app.before_request
	def log_auth_header():
		from flask import request
		if request.path == "/api/auth/me":
			# print the raw Authorization header (may be None)
			print("DEBUG: Authorization header:", request.headers.get("Authorization"))

	@app.route("/")
	def index():
		return jsonify({"status": "ok", "message": "RecruAI backend running"})

	# helpful shell context for `flask shell`
	try:
		from .models import User  # noqa: WPS433, E402

		@app.shell_context_processor
		def make_shell_context():
			return {"db": db, "User": User}
	except Exception:
		# models may not be importable before deps/migrations — ignore
		pass

	return app


# Create the app instance for gunicorn
app = create_app()


if __name__ == "__main__":
	# quick dev runner
	app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "1") == "1")
