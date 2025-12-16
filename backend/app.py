import os
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory

# support running as a module (recommended) and as a script
try:
	# when used as a package (python -m backend.app or via flask)
	from .config import Config
	from .extensions import db, migrate, jwt
	from .api import api_bp
	from .ai_providers import get_ai_provider_manager
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

	ai_providers_module = importlib.import_module("backend.ai_providers")
	get_ai_provider_manager = ai_providers_module.get_ai_provider_manager


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

	# Security: Set max content length
	app.config['MAX_CONTENT_LENGTH'] = app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)  # 16MB

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

	# Initialize AI providers
	try:
		ai_manager = get_ai_provider_manager()
		ai_manager.initialize()
		provider_info = ai_manager.get_provider_info()
		print(f"AI Providers initialized - LLM: {provider_info['llm_provider']}, Embedding: {provider_info['embedding_provider']}, RAG: {provider_info['rag_enabled']}")
	except Exception as e:
		print(f"Warning: Could not initialize AI providers: {e}")
		import traceback
		traceback.print_exc()

	# Security: Initialize rate limiter
	try:
		from flask_limiter import Limiter
		from flask_limiter.util import get_remote_address
		limiter = Limiter(
			app=app,
			key_func=get_remote_address,
			storage_uri=app.config.get('RATELIMIT_STORAGE_URL', "memory://"),
			strategy=app.config.get('RATELIMIT_STRATEGY', "fixed-window")
		)
	except ImportError:
		print("Warning: Flask-Limiter not installed. Rate limiting disabled.")
		limiter = None

	# Security: Initialize Flask-Talisman for security headers
	try:
		from flask_talisman import Talisman
		talisman = Talisman(
			app,
			content_security_policy={
				'default-src': "'self'",
				'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
				'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
				'font-src': "'self' https://fonts.gstatic.com",
				'img-src': "'self' data: https:",
				'connect-src': "'self' https://api.openai.com https://api.groq.com https://sentence-transformers.com",
			},
			content_security_policy_nonce_in=['script-src', 'style-src'],
			force_https=app.config['IS_PRODUCTION'],
			strict_transport_security=app.config['IS_PRODUCTION'],
			strict_transport_security_max_age=31536000,  # 1 year
			strict_transport_security_include_subdomains=True,
			frame_options='DENY',
			x_content_type_options='nosniff',
			x_xss_protection=True,
			referrer_policy='strict-origin-when-cross-origin'
		)
	except ImportError:
		print("Warning: Flask-Talisman not installed. Security headers disabled.")
		talisman = None

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
		frontend_origin = app.config.get("FRONTEND_ORIGIN", "http://localhost:3000")
		# Support comma-separated list of origins
		origins_list = [o.strip().rstrip("/") for o in frontend_origin.split(",")]
		print(f"Setting CORS origins to: {origins_list}", flush=True)
		CORS(app, origins=origins_list, supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], expose_headers=["Content-Type", "Authorization"])

		# Ensure CORS headers are added to all responses, including errors
		@app.after_request
		def add_cors_headers(response):
			response.headers['Access-Control-Allow-Origin'] = origins_list[0] if origins_list else 'http://localhost:3000'
			response.headers['Access-Control-Allow-Credentials'] = 'true'
			response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
			response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
			return response
	except Exception as e:
		print(f"Failed to configure CORS: {e}", flush=True)
		# flask-cors not installed or not needed in production
		pass

	# Security: Apply rate limiting to auth endpoints
	if limiter:
		# Authentication endpoints - strict rate limiting
		limiter.limit("10 per minute")(app.view_functions.get('api_bp.login', lambda: None))
		limiter.limit("5 per minute")(app.view_functions.get('api_bp.register', lambda: None))

		# General API endpoints - moderate rate limiting
		limiter.limit("100 per minute")(app.view_functions.get('api_bp.me', lambda: None))

	# register blueprints
	app.register_blueprint(api_bp, url_prefix="/api")

	# Register practice AI agents blueprint separately to avoid circular imports
	try:
		from .api.practice_ai_agents import practice_ai_bp
		app.register_blueprint(practice_ai_bp, url_prefix="/api")
	except ImportError:
		try:
			practice_ai_agents_module = importlib.import_module("backend.api.practice_ai_agents")
			app.register_blueprint(practice_ai_agents_module.practice_ai_bp, url_prefix="/api")
		except ImportError as e:
			print(f"Warning: Could not register practice AI agents blueprint: {e}")

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
	    response = jsonify({
	        "error": "Internal Server Error",
	        "message": str(error)
	    })
	    response.headers.add(
	        "Access-Control-Allow-Origin", "http://localhost:3000"
	    )
	    response.headers.add(
	        "Access-Control-Allow-Credentials", "true"
	    )
	    return response, 500

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


@app.cli.command("db-optimize")
def optimize_database():
    """Create database indexes for optimal query performance"""
    from sqlalchemy import text

    try:
        # Use the app's database engine directly
        engine = db.get_engine()

        with engine.connect() as conn:
            # Indexes for User model
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
            """))

            # Indexes for Post model
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON posts(organization_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_posts_employment_type ON posts(employment_type);
            """))

            # Indexes for Application model
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_applications_post_id ON applications(post_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_applications_pipeline_stage ON applications(pipeline_stage);
            """))

            # Indexes for Interview model
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at DESC);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_interviews_organization_id ON interviews(organization_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
            """))

            # Composite indexes for common query patterns
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_applications_user_post ON applications(user_id, post_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_posts_org_status ON posts(organization_id, status);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_interviews_user_status ON interviews(user_id, status);
            """))

            conn.commit()
            print("✅ Database indexes created successfully!")

    except Exception as e:
        print(f"❌ Error creating indexes: {e}")


if __name__ == "__main__":
	# quick dev runner
	app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "1") == "1")
