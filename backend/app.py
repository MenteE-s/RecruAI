import os
import click
from dotenv import load_dotenv
import uuid

from flask import Flask, current_app, g, jsonify, send_from_directory, request

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
	# Load .env for the normal entry point. A caller that supplies an explicit
	# config object (tests, tooling) owns configuration and must not have the
	# process environment overwritten underneath it.
	here = os.path.dirname(os.path.abspath(__file__))
	dotenv_path = os.path.join(here, ".env")
	if config_object is None:
		load_dotenv(dotenv_path, override=True)

	app = Flask(__name__)
	app.config.from_object(config_object or Config)

	# Fail fast on production misconfiguration (missing secrets/keys) rather
	# than degrading silently at request time.
	if app.config.get("IS_PRODUCTION"):
		from .config import validate_production_config

		for warning in validate_production_config(app.config):
			app.logger.warning("config: %s", warning)

	# Security: trust X-Forwarded-For/Proto from nginx (single proxy) so
	# rate-limit keys and audit IPs see the real client, not the Docker gateway.
	try:
		from werkzeug.middleware.proxy_fix import ProxyFix
		app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
	except Exception:
		pass

	# Security: Set max content length
	app.config['MAX_CONTENT_LENGTH'] = app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)  # 16MB

	# Observability: propagate a request ID on every response and make it
	# available to handlers and structured logs. Reuse an incoming ID when the
	# caller (nginx, a job runner, another service) already set one.
	@app.before_request
	def _assign_request_id():
		g.request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex

	@app.after_request
	def _add_request_id(response):
		response.headers.setdefault("X-Request-ID", getattr(g, "request_id", ""))
		return response

	# Error tracking is optional and must never break startup. Configure with
	# SENTRY_DSN; the package is an optional dependency.
	sentry_dsn = app.config.get("SENTRY_DSN")
	if sentry_dsn:
		try:
			import sentry_sdk
			from sentry_sdk.integrations.flask import FlaskIntegration

			sentry_sdk.init(
				dsn=sentry_dsn,
				integrations=[FlaskIntegration()],
				traces_sample_rate=app.config.get("SENTRY_TRACES_SAMPLE_RATE", 0.0),
				environment=app.config.get("FLASK_ENV", "production"),
			)
		except ImportError:
			app.logger.warning("SENTRY_DSN is set but sentry-sdk is not installed")

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
	# Cross-worker fan-out: with a Redis message queue, emits from any worker
	# reach sockets owned by another worker, so the API can scale past one
	# process without dropping realtime notifications. Without Redis the queue
	# stays local (single-worker topology). Threading mode is kept: moving to
	# eventlet/gevent requires a load-tested migration (see P2-09).
	socketio_queue = None
	if app.config.get("REDIS_ENABLED", False):
		socketio_queue = app.config.get("REDIS_URL", "redis://127.0.0.1:6379/0")
	socketio.init_app(
		app,
		cors_allowed_origins=origins_list,
		message_queue=socketio_queue,
	)

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
		# 1) Explicit JTI blocklist (logout / current-token revocation).
		# Logged-out tokens are revoked in Redis. Fail-closed when Redis is
		# expected (REDIS_ENABLED) so logout cannot be bypassed by killing Redis;
		# fail-open only when Redis is intentionally disabled.
		try:
			from .utils.cache import is_jti_blocked
			if is_jti_blocked(jwt_payload.get("jti")):
				return True
		except Exception:
			try:
				if app.config.get("REDIS_ENABLED", True):
					return True
			except Exception:
				return True

		# 2) Token version: a password reset/change bumps users.token_version.
		# Any token carrying an older version is dead even if its JTI was never
		# individually blocklisted.
		try:
			from .models import User
			uid = int(jwt_payload.get("sub"))
			user = db.session.get(User, uid)
			if user is None:
				return True
			if user.deleted_at is not None:
				return True
			return int(jwt_payload.get("ver", 0)) != int(user.token_version or 0)
		except Exception:
			# Fail closed on an unreadable identity/version.
			return True

	@jwt.revoked_token_loader
	def revoked_token_callback(jwt_header, jwt_payload):
		return jsonify({"error": "Token has been revoked", "code": "token_revoked"}), 401



	# Initialize Redis cache. Production fails closed without it: the token
	# blocklist, rate-limit counters, and cache all assume shared Redis, and a
	# silent memory fallback would un-share limits and un-revoke logouts.
	try:
		from .extensions import init_redis
		init_redis(app)
	except Exception as e:
		print(f"Warning: Could not initialize Redis: {e}")
	if (
		app.config.get("IS_PRODUCTION")
		and app.config.get("REDIS_ENABLED", True)
		and app.extensions.get("redis_client") is None
	):
		raise RuntimeError(
			"Production config error: Redis is required (REDIS_URL) but unreachable. "
			"Rate limits and token revocation must be shared, not per-process memory."
		)

	# Register socket events
	with app.app_context():
		from .api import sockets

	# Initialize Kafka service (only if enabled). The config object is the
	# source of truth: reading os.getenv() here meant a test config could not
	# disable the consumer, and every process that imported the module started
	# one. TESTING always opts out.
	if app.config.get("KAFKA_ENABLED", False) and not app.config.get("TESTING"):
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

	# Initialize AI providers. Tests and one-off tooling do not need provider
	# discovery, and it can incur network calls during import.
	if not app.config.get("TESTING"):
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
	def _rate_limit_key():
		"""Authenticated requests get a per-user bucket; anonymous fall back to IP.

		Only a signature check is performed here. Full revocation/version
		validation still happens in the route's @jwt_required guard, so a stolen
		expired token cannot buy extra quota.
		"""
		try:
			from flask_jwt_extended import decode_token
			raw = None
			auth_header = request.headers.get("Authorization", "")
			if auth_header.startswith("Bearer "):
				raw = auth_header[7:].strip()
			if raw:
				claims = decode_token(raw)
				sub = claims.get("sub")
				if sub:
					return f"user:{sub}"
		except Exception:
			pass
		try:
			from flask_limiter.util import get_remote_address
			return f"ip:{get_remote_address()}"
		except Exception:
			return f"ip:{request.remote_addr or 'unknown'}"

	# A disabled limiter must not wrap view functions at all. Flask-Limiter's
	# wrappers hold only a weak reference to the extension; when the extension
	# is disabled it is not retained on app.extensions, so wrapped routes later
	# raise "weakly-referenced object no longer exists" on every request.
	limiter = None
	if app.config.get("RATELIMIT_ENABLED", True):
		try:
			from flask_limiter import Limiter
			storage_uri = app.config.get('RATELIMIT_STORAGE_URL', "memory://")
			if (not storage_uri or storage_uri == "memory://") and app.config.get("REDIS_ENABLED"):
				storage_uri = app.config.get("REDIS_URL", "redis://127.0.0.1:6379/0")
			# Defaults are deliberately generous: every unannotated read-only route
			# gets this ceiling. Auth/OTP/AI/write routes keep their tighter limits
			# below. 50/hour was low enough for one dashboard session to exhaust.
			default_limits = ["30000 per day", "3000 per hour"]
			try:
				limiter = Limiter(
					app=app,
					key_func=_rate_limit_key,
					storage_uri=storage_uri,
					strategy=app.config.get('RATELIMIT_STRATEGY', "fixed-window"),
					default_limits=default_limits,
				)
			except Exception as e:
				print(f"Warning: Redis rate-limit storage unavailable ({e}); using memory://")
				if app.config.get("IS_PRODUCTION"):
					raise RuntimeError(
						"Production config error: rate-limit storage must be Redis, not per-process memory."
					)
				limiter = Limiter(
					app=app,
					key_func=_rate_limit_key,
					storage_uri="memory://",
					strategy=app.config.get('RATELIMIT_STRATEGY', "fixed-window"),
					default_limits=default_limits,
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
				'connect-src': "'self' https://api.openai.com https://api.groq.com https://api.recruai.menteeai.org wss://api.recruai.menteeai.org",
				'media-src': "'self' blob:",
				'worker-src': "'self' blob:",
				'object-src': "'none'",
				'base-uri': "'self'",
				'frame-ancestors': "'none'",
				'form-action': "'self'",
			},
			content_security_policy_nonce_in=['script-src', 'style-src'],
			force_https=app.config['IS_PRODUCTION'],
			strict_transport_security=app.config['IS_PRODUCTION'],
			strict_transport_security_max_age=31536000,  # 1 year
			strict_transport_security_include_subdomains=True,
			frame_options='DENY',
			x_content_type_options='nosniff',
			x_xss_protection=True,
			referrer_policy='strict-origin-when-cross-origin',
			permissions_policy={
				'camera': '(self)',
				'microphone': '(self)',
				'geolocation': '()',
			},
		)
	except ImportError:
		print("Warning: Flask-Talisman not installed. Security headers disabled.")
		talisman = None

	# The scheduler is deliberately not started here. `backend.worker` owns it
	# as a separate service; starting APScheduler in every gunicorn worker would
	# duplicate every job. See backend/scheduler.py and docker-compose.aws.yml.

	# enable CORS for API routes so frontend dev server can call /api/*
	try:
		from flask_cors import CORS  # type: ignore
		# Security: never allow wildcard with credentials. Fail-closed on misconfig.
		if "*" in origins_list:
			raise ValueError("FRONTEND_ORIGIN must not contain '*' when supports_credentials=True")
		print(f"Setting CORS for {len(origins_list)} origin(s)", flush=True)
		CORS(app, origins=origins_list, supports_credentials=True, allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"], methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], expose_headers=["Content-Type", "Authorization", "Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"])
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
			# Flask-Limiter returns a wrapped view. It must be assigned back into
			# Flask's view registry; calling the decorator without assigning is a
			# silent no-op (the original P1-01 bug).
			app.view_functions[endpoint] = limiter.limit(spec)(fn)

		_limit("api.login", "10 per minute")
		_limit("api.register", "5 per minute")
		_limit("api.refresh_session", "60 per minute")
		_limit("api.logout", "30 per minute")
		_limit("api.get_me", "100 per minute")
		# Privacy endpoints re-authenticate and touch many rows; keep them rare.
		_limit("api.export_my_data", "5 per hour")
		_limit("api.delete_my_account", "5 per hour")
		_limit("api.deletion_status", "60 per minute")
		_limit("api.health_scheduler", "60 per minute")
		# Unauthenticated public-profile views write an analytics row per hit
		_limit("api.get_public_profile", "60 per minute")
		# OTP: tight caps stop email bombing and code guessing
		_limit("api.request_email_otp", "5 per minute")
		_limit("api.verify_email_otp", "10 per minute")
		_limit("api.request_email_change", "5 per minute")
		_limit("api.verify_email_change", "10 per minute")
		_limit("api.forgot_password", "5 per minute")
		_limit("api.reset_password", "10 per minute")
		# Organization invitations: the public token endpoints are unauthenticated,
		# and the admin endpoints each send an email, so cap both sides.
		_limit("api.get_invitation", "30 per minute")
		_limit("api.accept_invitation", "10 per minute")
		_limit("api.invite_team_member", "10 per minute")
		_limit("api.list_organization_invitations", "60 per minute")
		_limit("api.resend_organization_invitation", "10 per minute")
		_limit("api.revoke_organization_invitation", "20 per minute")
		# Spam-prone writes + expensive search
		_limit("api.create_post", "30 per minute")
		_limit("api.create_application", "30 per minute")
		_limit("api.create_system_issue", "30 per minute")
		# Org/page creation spawns 10 default AI agents (cost) and is now reachable by
		# every individual account — keep it tight.
		_limit("api.create_organization_page", "3 per hour")
		# Omnibox fires on every keystroke (the client debounces), and each call
		# fans out to three queries.
		_limit("api.universal_search", "60 per minute")
		# Skill taxonomy typeahead: same keystroke pattern as search, but the
		# payload is static reference data so it can be generous.
		_limit("api.get_skill_taxonomy", "120 per minute")
		# Skill resolution runs a phrase matcher over caller-supplied text, so
		# cap it rather than letting it be an amplifier.
		_limit("api.resolve_skill", "60 per minute")
		# Assessment lifecycle: starting an attempt and submitting are the
		# writes that produce the evidence everything else trusts.
		_limit("api.start_skill_assessment", "20 per minute")
		_limit("api.submit_skill_assessment", "30 per minute")
		# Authoring writes into the shared bank that everyone is measured
		# against, so it is far tighter than a per-user read.
		_limit("api.create_skill_question", "60 per hour")
		_limit("api.update_skill_question", "60 per hour")
		# Mentorship: plan generation and regeneration each call the model, so
		# they are the most expensive CVAI surface there is.
		_limit("api.create_mentorship_plan", "10 per hour")
		_limit("api.regenerate_mentorship_plan", "10 per hour")
		# Progress tracking calls no model and must stay cheap to record.
		_limit("api.list_mentorship_plans", "60 per minute")
		_limit("api.get_mentorship_plan", "60 per minute")
		_limit("api.update_mentorship_step", "120 per minute")
		# Progress views call no model and are polled while a step is open.
		_limit("api.get_mentorship_progress", "60 per minute")
		_limit("api.get_learner_progress", "60 per minute")
		# Suggestions call no model; polled whenever the CVAI panel is open.
		_limit("api.get_mentorship_suggestions", "60 per minute")
		# Quizzes call no model, but an attempt is a long piece of work worth
		# keeping on a tight leash: no reason to start many in a minute.
		_limit("api.list_quizzes", "60 per minute")
		_limit("api.get_quiz", "60 per minute")
		_limit("api.start_quiz_attempt", "20 per minute")
		_limit("api.submit_quiz_attempt", "30 per minute")
		_limit("api.list_quiz_attempts", "60 per minute")
		# Guided projects. The review endpoint calls a model, so it is the
		# tightest limit in CVAI: a retry storm must not become a bill.
		_limit("api.list_guided_projects", "60 per minute")
		_limit("api.get_guided_project", "60 per minute")
		_limit("api.start_guided_project", "20 per minute")
		_limit("api.save_guided_project_progress", "120 per minute")  # autosave
		_limit("api.submit_guided_project", "10 per minute")
		_limit("api.retry_guided_project_review", "5 per minute")
		_limit("api.list_guided_project_attempts", "60 per minute")
		# Mock interviews. The review endpoint costs a model call per attempt, so
		# it is the tightest limit in CVAI.
		_limit("api.mock_interview_meta", "60 per minute")
		_limit("api.start_mock_interview", "10 per minute")
		_limit("api.answer_mock_interview", "120 per minute")   # one per turn
		_limit("api.mock_interview_feedback", "10 per minute")
		_limit("api.abandon_mock_interview", "20 per minute")
		_limit("api.list_mock_interviews", "60 per minute")

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
			app.view_functions["recommendations.search_profiles"] = limiter.limit(
				"60 per minute"
			)(fn)

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

	@app.errorhandler(429)
	def rate_limit_exceeded(error):
		"""Return JSON (not Flask-Limiter's HTML default) with Retry-After.

		The header is normally injected by Flask-Limiter; this handler also
		sets a window-length fallback so every caller gets a usable value.
		"""
		retry_after = None
		try:
			retry_after = int(error.limit.limit.get_expiry())
		except Exception:
			retry_after = None
		response = jsonify({
			"error": "Too many requests. Please wait and try again.",
			"code": "rate_limited",
		})
		response.status_code = 429
		if retry_after:
			response.headers.setdefault("Retry-After", str(max(1, retry_after)))
		try:
			current_app.logger.warning(
				"rate_limit_exceeded endpoint=%s path=%s method=%s ip=%s limit=%s",
				request.endpoint or "unknown",
				request.path,
				request.method,
				request.remote_addr,
				getattr(error.limit, "limit", "unknown"),
			)
		except Exception:
			pass
		return response

	@app.errorhandler(500)
	def internal_error(error):
	    # Flask-CORS already handles ACAO; do not echo origins or errors here.
	    return jsonify({"error": "Internal Server Error"}), 500

	# Budget refusals are expected product states. A route that lets the
	# exception escape gets a stable 402 JSON body instead of a 500.
	try:
		from .utils.ai_budget import AIBudgetError

		@app.errorhandler(AIBudgetError)
		def ai_budget_exceeded(error):
			response = jsonify({
				"error": error.message,
				"code": error.code,
			})
			response.status_code = getattr(error, "status_code", 402)
			return response
	except Exception:
		pass

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
		# Video interviews need camera/mic for this origin; deny the rest.
		response.headers["Permissions-Policy"] = (
			"camera=(self), microphone=(self), geolocation=()"
		)
		# Manual 429s (OTP cooldowns, invite limits) also get Retry-After.
		if response.status_code == 429 and "Retry-After" not in response.headers:
			try:
				payload = response.get_json(silent=True) or {}
				retry_after = int(payload.get("retry_after") or 60)
			except Exception:
				retry_after = 60
			response.headers["Retry-After"] = str(max(1, retry_after))
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
			app.view_functions["health_check"] = limiter.limit("60 per minute")(_fn)

	# helpful shell context for `flask shell`
	try:
		from .models import User  # noqa: WPS433, E402

		@app.shell_context_processor
		def make_shell_context():
			return {"db": db, "User": User}
	except Exception:
		# models may not be importable before deps/migrations — ignore
		pass

	# Register the maintenance CLI command (defined below). Registering it here
	# keeps one app instance per process; the old module-level `app` built a
	# second one before gunicorn ever called the factory.
	app.cli.command("db-optimize")(optimize_database)
	app.cli.command("scheduler-run")(scheduler_run)
	app.cli.command("scheduler-health")(scheduler_health_command)
	app.cli.command("purge-account")(purge_account_command)
	app.cli.command("purge-due-accounts")(purge_due_accounts_command)

	return app


@click.argument("job", type=str)
def scheduler_run(job):
	"""Run one scheduler job in the foreground (for backfills and debugging)."""
	import json
	from .scheduler import JOB_DEFINITIONS, run_job

	if job not in JOB_DEFINITIONS:
		raise click.BadParameter(f"unknown job; choose from {', '.join(sorted(JOB_DEFINITIONS))}")
	result = run_job(current_app._get_current_object(), job)
	click.echo(json.dumps(result, indent=2, default=str))


def scheduler_health_command():
	"""Print scheduler freshness and exit non-zero if a job is stale."""
	import json
	from .scheduler import scheduler_health

	health = scheduler_health(current_app._get_current_object())
	click.echo(json.dumps(health, indent=2, default=str))
	if not health["healthy"]:
		raise click.ClickException("one or more scheduler jobs are stale")


@click.argument("identifier", type=str)
@click.option("--force", is_flag=True, help="Delete immediately, even inside the grace period.")
def purge_account_command(identifier, force):
	"""Hard-delete one account by id or email.

	Without --force this only purges an account whose grace period has elapsed.
	--force is the documented support path for an immediate, audited deletion.
	"""
	from .models import User
	from .utils.account_deletion import purge_account, purge_account_now

	user = None
	try:
		user = db.session.get(User, int(identifier))
	except (TypeError, ValueError):
		pass
	if user is None:
		user = User.query.filter(User.email.ilike(identifier)).first()
	if user is None:
		raise click.ClickException("account not found")

	if force:
		ok = purge_account_now(user, reason="support-cli")
		click.echo(f"purged={ok} user_id={user.id}")
	else:
		result = purge_account(user.id, force=False, reason="scheduler-cli")
		click.echo(f"result={result} user_id={user.id}")


@click.option("--limit", default=25, type=int, help="Maximum accounts to purge in this run.")
def purge_due_accounts_command(limit):
	"""Run the due-account purge once (normally the scheduler does this)."""
	from .utils.account_deletion import purge_due_accounts

	click.echo(f"purged={purge_due_accounts(batch_size=limit)}")


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
	app = create_app()
	# quick dev runner - PORT read from backend/.env (no hardcoded fallback duplicated).
	# Debug defaults OFF and is forced off in production; opt in with FLASK_DEBUG=1.
	_debug = os.getenv("FLASK_DEBUG", "0") == "1" and not app.config.get("IS_PRODUCTION")

	# Bind IPv4 (0.0.0.0), not "::".
	#
	# This was briefly "::" to fix a browser that resolved `localhost` to ::1 and
	# got connection-refused. That made it worse, not better: on Windows a socket
	# bound to :: is IPv6-ONLY, so 127.0.0.1 stopped answering while ::1 started.
	# Linux (Docker, production) does treat :: as dual-stack, so the "fix" appeared
	# to work in a container and failed on the machine that matters.
	#
	# The real fix is not here. frontend/.env names 127.0.0.1 explicitly, so the
	# browser never has to resolve `localhost` at all. DEV_HOST remains for anyone
	# who needs a different family.
	_host = os.getenv("DEV_HOST", "0.0.0.0")
	app.run(host=_host, port=app.config.get("PORT", int(os.getenv("PORT", "8000"))), debug=_debug)
