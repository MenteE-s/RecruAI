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
from . import notifications  # noqa: E402, F401
from . import billing  # noqa: E402, F401
from . import search  # noqa: E402, F401
# CVAI mentorship (B1), quizzes (C1) and guided projects (C2). On api_bp rather
# than their own blueprints so the email-verification guard in guards.py applies.
from . import mentorship  # noqa: E402, F401
from . import quizzes  # noqa: E402, F401
from . import projects  # noqa: E402, F401
from . import mock_interviews  # noqa: E402, F401
# Removed practice_ai_agents import to avoid circular import - registered in app.py instead
from . import guards  # noqa: E402, F401 - blueprint guards, registered once here
