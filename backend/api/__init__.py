from flask import Blueprint

api_bp = Blueprint("api", __name__)

# import routes to register them on api_bp
from . import org  # noqa: E402, F401
from . import ind  # noqa: E402, F401
from . import profile  # noqa: E402, F401
from . import interviews  # noqa: E402, F401
from . import auth  # noqa: E402, F401
from . import users  # noqa: E402, F401
from . import health  # noqa: E402, F401
from . import system_issues  # noqa: E402, F401
from . import rag  # noqa: E402, F401
