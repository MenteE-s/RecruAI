import os
from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory, request

# support running as a module (recommended) and as a script
try:
	# when used as a package (python -m backend.app or via flask)
	from .config import Config
	from .extensions import db, migrate, jwt, socketio
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
	socketio = backend_extensions.socketio # type: ignore
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
	load_dotenv(dotenv_path, override=True)

	app = Flask(__name__)
	app.config.from_object(config_object or Config)

	# Security: trust X-Forwarded-For/Proto from nginx (single proxy) so
	# rate-limit keys and audit IPs see the real client, not the Docker gateway.
	try:
		from werkzeug.middleware.proxy_fix import ProxyFix
		app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
	except Exception:
		pass

	# Security: Set max content length
	app.config['MAX_CONTENT_LENGTH'] = app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)  # 16MB

	# Allowed frontend origins (comma-separated FRONTEND_ORIGIN); single source
	# used by Flask-CORS and Socket.IO so credentialed requests match.
	frontend_origin = app.config.get("FRONTEND_ORIGIN", "http://localhost:3000")
	origins_list = [o.strip().rstrip("/") for o in frontend_origin.split(",") if o.strip()]

	# initialize extensions
	db.init_app(app)
	migrate.init_app(app, db)

	# Register pgvector psycopg2 adapter so lists are sent as vector type in queries
	from sqlalchemy import event
	from pgvector.psycopg2 import register_vector
	with app.app_context():
		@event.listens_for(db.engine, 'connect')
		def register_pgvector(dbapi_connection, connection_record):
			register_vector(dbapi_connection)
	# init JWT (raise if missing so we catch misconfiguration early)
	# `jwt` is provided by the module-level import/fallback above so avoid
	# package-relative imports here which break when the module is executed
	# as a script or via `python -c`.
	if 'jwt' not in globals():
		raise RuntimeError("JWT extension not available; check backend.extensions")

	jwt.init_app(app)
	socketio.init_app(app, cors_allowed_origins=origins_list)

	# JWT error handlers - return JSON instead of HTML
	@jwt.expired_token_loader
	def expired_token_callback(jwt_header, jwt_payload):
		return jsonify({"error": "Token has expired", "code": "token_expired"}), 401

	@jwt.invalid_token_loader
	def invalid_token_callback(error):
		return jsonify({"error": "Invalid token", "code": "invalid_token"}), 401

	@jwt.unauthorized_loader
	def missing_token_callback(error):
		return jsonify({"error": "Authorization token is missing", "code": "authorization_required"}), 401

	@jwt.token_in_blocklist_loader
	def check_if_token_revoked(jwt_header, jwt_payload):
		# Logged-out tokens are revoked in Redis. Fail-closed when Redis is
		# expected (REDIS_ENABLED) so logout cannot be bypassed by killing Redis;
		# fail-open only when Redis is intentionally disabled.
		try:
			from .utils.cache import is_jti_blocked
			return is_jti_blocked(jwt_payload.get("jti"))
		except Exception:
			try:
				return bool(app.config.get("REDIS_ENABLED", True))
			except Exception:
				return True

	@jwt.revoked_token_loader
	def revoked_token_callback(jwt_header, jwt_payload):
		return jsonify({"error": "Token has been revoked", "code": "token_revoked"}), 401



	# Initialize Redis cache
	try:
		from .extensions import init_redis
		init_redis(app)
	except Exception as e:
		print(f"Warning: Could not initialize Redis: {e}")

	# Register socket events
	with app.app_context():
		from .api import sockets

	# Initialize Kafka service (only if enabled)
	if os.getenv("KAFKA_ENABLED", "0") == "1" or app.config.get("KAFKA_ENABLED", False):
		try:
			from .utils.kafka_service import KafkaService
			kafka = KafkaService()
			print(f"Kafka initialized with servers: {kafka.bootstrap_servers}")

			# Start background consumer for Socket.IO bridging
			from .utils.kafka_consumer import KafkaConsumerService
			consumer = KafkaConsumerService(
				bootstrap_servers=kafka.bootstrap_servers,
				group_id='recruai-broadcast-group',
				topics=[kafka.default_topic]
			)
			consumer.start(app, callback_map={}) # Add specific handlers if needed
			print(f"Kafka Consumer started for real-time broadcasts on topic: {kafka.default_topic}")
		except Exception as e:
			print(f"Warning: Could not initialize Kafka: {e}")

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

	# Security: Initialize rate limiter (Redis-backed when available so
	# limits are shared across workers; falls back to memory otherwise).
	try:
		from flask_limiter import Limiter
		from flask_limiter.util import get_remote_address
		storage_uri = app.config.get('RATELIMIT_STORAGE_URL', "memory://")
		if (not storage_uri or storage_uri == "memory://") and app.config.get("REDIS_ENABLED"):
			storage_uri = app.config.get("REDIS_URL", "redis://127.0.0.1:6379/0")
		try:
			limiter = Limiter(
				app=app,
				key_func=get_remote_address,
				storage_uri=storage_uri,
				strategy=app.config.get('RATELIMIT_STRATEGY', "fixed-window"),
				default_limits=["200 per day", "50 per hour"],
			)
		except Exception as e:
			print(f"Warning: Redis rate-limit storage unavailable ({e}); using memory://")
			limiter = Limiter(
				app=app,
				key_func=get_remote_address,
				storage_uri="memory://",
				strategy=app.config.get('RATELIMIT_STRATEGY', "fixed-window"),
				default_limits=["200 per day", "50 per hour"],
			)
	except ImportError:
		print("Warning: Flask-Limiter not installed. Rate limiting disabled.")
		limiter = None
		if app.config.get("IS_PRODUCTION"):
			raise RuntimeError("Flask-Limiter required in production")

	# Skip rate limiting for CORS preflight (OPTIONS) and video polling endpoints
	# that fire every 5-8s and would blow through normal limits instantly.
	if limiter:
		@limiter.request_filter
		def _skip_options_and_polling():
			path = request.path
			if request.method == "OPTIONS":
				return True
			if "/conversation" in path or "/recording/status" in path:
				return True
			return False

	# Security: Initialize Flask-Talisman for security headers
	try:
		from flask_talisman import Talisman
		talisman = Talisman(
			app,
			content_security_policy={
				'default-src': "'self'",
				# No unsafe-eval; no third-party script CDNs. Nonce handles
				# legit inline scripts; unsafe-inline kept only for style
				# (React inline styles) where nonces are less practical.
				'script-src': "'self'",
				'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
				'font-src': "'self' https://fonts.gstatic.com",
				'img-src': "'self' data: https:",
				'connect-src': "'self' https://api.openai.com https://api.groq.com",
				'object-src': "'none'",
				'base-uri': "'self'",
				'frame-ancestors': "'none'",
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
		# Security: never allow wildcard with credentials. Fail-closed on misconfig.
		if "*" in origins_list:
			raise ValueError("FRONTEND_ORIGIN must not contain '*' when supports_credentials=True")
		print(f"Setting CORS for {len(origins_list)} origin(s)", flush=True)
		CORS(app, origins=origins_list, supports_credentials=True, allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"], methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], expose_headers=["Content-Type", "Authorization"])
	except Exception as e:
		print(f"Failed to configure CORS: {e}", flush=True)
		pass

	# register blueprints
	app.register_blueprint(api_bp, url_prefix="/api")

	# Security: Apply rate limiting to auth endpoints (must be after blueprint registration)
	# NOTE: the blueprint is named "api", so endpoints are "api.<view>" —
	# "api_bp.<view>" matches nothing and would silently disable the limit.
	if limiter:
		def _limit(endpoint, spec):
			fn = app.view_functions.get(endpoint)
			if fn is None:
				print(f"WARNING: rate-limit target missing: {endpoint} — fix endpoint name")
				return
			limiter.limit(spec)(fn)

		_limit("api.login", "10 per minute")
		_limit("api.register", "5 per minute")
		_limit("api.get_me", "100 per minute")
		# Unauthenticated public-profile views write an analytics row per hit
		_limit("api.get_public_profile", "60 per minute")
		# OTP: tight caps stop email bombing and code guessing
		_limit("api.request_email_otp", "5 per minute")
		_limit("api.verify_email_otp", "10 per minute")
		_limit("api.request_email_change", "5 per minute")
		_limit("api.verify_email_change", "10 per minute")
		# Spam-prone writes + expensive search
		_limit("api.create_post", "30 per minute")
		_limit("api.create_application", "30 per minute")
		_limit("api.create_system_issue", "30 per minute")
		# Org creation spawns 10 default AI agents (cost) — tight cap
		_limit("api.create_organization", "5 per minute")

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

	# Register recommendations blueprint (blueprint has own url_prefix='/api/recommendations')
	try:
		from .api.recommendations import recommendations_bp
		app.register_blueprint(recommendations_bp)
	except ImportError:
		try:
			recommendations_module = importlib.import_module("backend.api.recommendations")
			app.register_blueprint(recommendations_module.recommendations_bp)
		except ImportError as e:
			print(f"Warning: Could not register recommendations blueprint: {e}")

	# Rate limits for late-registered blueprints (must run after registration)
	if limiter:
		fn = app.view_functions.get("recommendations.search_profiles")
		if fn is None:
			print("WARNING: rate-limit target missing: recommendations.search_profiles — fix endpoint name")
		else:
			limiter.limit("60 per minute")(fn)

	# Error handlers for API routes - return JSON instead of HTML.
	# Messages are generic on purpose: exception text can leak internals.
	@app.errorhandler(400)
	def bad_request(error):
		return jsonify({"error": "Bad Request"}), 400

	@app.errorhandler(401)
	def unauthorized(error):
		return jsonify({"error": "Unauthorized"}), 401

	@app.errorhandler(403)
	def forbidden(error):
		return jsonify({"error": "Forbidden"}), 403

	@app.errorhandler(404)
	def not_found(error):
		return jsonify({"error": "Not Found"}), 404

	@app.errorhandler(500)
	def internal_error(error):
	    # Flask-CORS already handles ACAO; do not echo origins or errors here.
	    return jsonify({"error": "Internal Server Error"}), 500

	# Serve uploaded files with MIME-sniffing protection
	@app.route('/uploads/<path:filename>')
	def uploaded_file(filename):
		resp = send_from_directory(os.path.join(here, 'uploads'), filename)
		resp.headers.setdefault("X-Content-Type-Options", "nosniff")
		return resp

	# Security: set safer cookie flags for session cookies. These defaults help
	# prevent client-side script access to session cookies and allow enabling
	# Secure in environments that terminate TLS.
	app.config.setdefault("SESSION_COOKIE_HTTPONLY", True)
	app.config.setdefault("SESSION_COOKIE_SAMESITE", os.getenv("SESSION_COOKIE_SAMESITE", "None" if app.config.get("IS_PRODUCTION") else "Lax"))
	app.config.setdefault(
		"SESSION_COOKIE_SECURE",
		os.getenv("SESSION_COOKIE_SECURE", "0") == "1",
	)

	# Warn if secret keys are left as defaults - helpful during development to
	# avoid accidentally running with weak keys in staging/production.
	# (Config already raises in production; this is a dev-time reminder.)
	if app.config.get("SECRET_KEY") in (None, "dev-secret-change-in-production"):
		print("WARNING: SECRET_KEY is using the dev default.\nSet SECRET_KEY and JWT_SECRET_KEY in backend/.env for secure deployments.")

	# Add common security response headers to reduce several classes of attacks.
	@app.after_request
	def set_security_headers(response):
		# Prevent MIME type sniffing
		response.headers.setdefault("X-Content-Type-Options", "nosniff")
		# Clickjacking protection (unified with Talisman DENY)
		response.headers["X-Frame-Options"] = "DENY"
		# Basic referrer policy
		response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
		# Feature-Policy / Permissions-Policy can be tightened as needed
		# response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=()")
		# HSTS on in production by default (behind TLS-terminating nginx);
		# explicitly opt out with ENABLE_HSTS=0 if ever serving plaintext.
		if app.config.get("IS_PRODUCTION", False) or os.getenv("ENABLE_HSTS", "0") == "1":
			if os.getenv("ENABLE_HSTS", "1") != "0":
				response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		return response

	@app.route("/")
	def index():
		return jsonify({"status": "ok", "message": "RecruAI backend running"})

	@app.route("/api/health")
	def health_check():
		"""Health check endpoint for Docker container monitoring"""
		try:
			# Check database connection
			from sqlalchemy import text
			db.session.execute(text("SELECT 1"))
			db_status = "healthy"
		except Exception as e:
			print(f"Health check DB failure: {e}", flush=True)
			db_status = "unhealthy"

		from .utils.timezone_utils import utc_now_iso
		return jsonify({
			"status": "ok" if db_status == "healthy" else "degraded",
			"timestamp": utc_now_iso(),
			"database": db_status
		}), 200 if db_status == "healthy" else 503

	# Health is polled every 30s by Docker — cap abuse but allow monitors.
	# (Applied here because the route must exist before limiting it.)
	if limiter:
		_fn = app.view_functions.get("health_check")
		if _fn is None:
			print("WARNING: rate-limit target missing: health_check")
		else:
			limiter.limit("60 per minute")(_fn)

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
	# quick dev runner - PORT read from backend/.env (no hardcoded fallback duplicated).
	# Debug defaults OFF and is forced off in production; opt in with FLASK_DEBUG=1.
	_debug = os.getenv("FLASK_DEBUG", "0") == "1" and not app.config.get("IS_PRODUCTION")
	app.run(host="0.0.0.0", port=app.config.get("PORT", int(os.getenv("PORT", "8000"))), debug=_debug)
