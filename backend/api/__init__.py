from flask import Blueprint

api_bp = Blueprint("api", __name__)

# import routes to register them on api_bp
from . import users  # noqa: E402, F401
from . import auth  # noqa: E402, F401
from . import organizations  # noqa: E402, F401
from . import profile  # noqa: E402, F401
