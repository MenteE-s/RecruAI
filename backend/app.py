import os
from dotenv import load_dotenv
from flask import Flask, jsonify

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

	# enable CORS for API routes so frontend dev server can call /api/*
	try:
		from flask_cors import CORS  # type: ignore

		# allow cross-origin requests to /api/* from any origin in dev
		CORS(app, resources={r"/api/*": {"origins": "*"}})
	except Exception:
		# flask-cors not installed or not needed in production
		pass

	# register blueprints
	app.register_blueprint(api_bp, url_prefix="/api")

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


if __name__ == "__main__":
	# quick dev runner
	app = create_app()
	app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "1") == "1")
