"""Canonical skill taxonomy — the one place that decides what a skill *is*.

Skills were free text on the `skills` table: "React", "react.js" and
"ReactJS" were three unrelated rows for one person, and a job requirement
of "Postgres" matched nobody who wrote "PostgreSQL". Every downstream CVAI
feature — the gap engine, assessments, quizzes, mentorship plans — needs to
count a skill reliably, so it keys off this module rather than off raw text.

Deliberately code, not a table: the taxonomy is reference data that changes
with a release, not per-user data, and keeping it in version control means
the deployment has no migration to get out of order.

Free text is still accepted anywhere a user types a skill (CVAI has to take
input from resumes and job posts nobody curates). `resolve()` maps what we
can onto the canonical set and returns None for the rest — callers decide
whether an unknown skill is an error or simply an uncatalogued skill.
"""

import re

# Proficiency scale, most-basic first.
#
# Title-Case to match Language.proficiency_level, the only other scale in the
# codebase. Rows written before this existed are lowercase ("expert"), and
# UserProfile.jsx still compares against lowercase — normalize_level() is the
# bridge for both. The tuple order is load-bearing: level_rank() indexes it to
# do gap arithmetic, so "reorder the list" is a breaking change.
LEVELS = ("Beginner", "Intermediate", "Advanced", "Expert")

# Categories. Kept broad on purpose: the category is for navigation and
# reporting, and splitting "Backend" vs "APIs" vs "Databases" too finely
# produced categories with a handful of skills each.
CATEGORIES = (
    "Programming Languages",
    "Frontend",
    "Backend",
    "Data & AI",
    "Databases",
    "Cloud & DevOps",
    "Mobile",
    "Testing & Quality",
    "Security",
    "Product & Management",
    "Design",
    "Communication & Leadership",
    "Business & Domain",
)

# canonical slug -> (display name, category, aliases)
#
# Slugs are lowercase-hyphen and stable: they are the join key between this
# file and stored rows, so renaming a slug orphans existing profile skills.
# Aliases exist for the spellings people and job posts actually use. An alias
# is normalized with normalize_key() before lookup, so write it however it is
# normally typed ("node.js", "NodeJS", "Node JS").
_SKILL_SEED = {
    # --- Programming Languages -------------------------------------------
    "python": ("Python", "Programming Languages", ()),
    "javascript": ("JavaScript", "Programming Languages", ("js", "ecmascript")),
    "typescript": ("TypeScript", "Programming Languages", ("ts",)),
    "java": ("Java", "Programming Languages", ()),
    "kotlin": ("Kotlin", "Programming Languages", ()),
    "swift": ("Swift", "Programming Languages", ()),
    "c": ("C", "Programming Languages", ()),
    "c-sharp": ("C#", "Programming Languages", ("c#", "csharp", "c sharp")),
    "c-plus-plus": ("C++", "Programming Languages", ("c++",)),
    "go": ("Go", "Programming Languages", ("golang",)),
    "rust": ("Rust", "Programming Languages", ()),
    "ruby": ("Ruby", "Programming Languages", ()),
    "php": ("PHP", "Programming Languages", ()),
    "r": ("R", "Programming Languages", ()),
    "scala": ("Scala", "Programming Languages", ()),
    "elixir": ("Elixir", "Programming Languages", ()),
    "bash": ("Bash", "Programming Languages", ("shell", "shell scripting", "sh")),
    "sql": ("SQL", "Programming Languages", ()),
    "html": ("HTML", "Programming Languages", ("html5",)),
    "css": ("CSS", "Programming Languages", ("css3",)),
    # --- Frontend ----------------------------------------------------------
    "react": ("React", "Frontend", ("reactjs", "react.js")),
    "next-js": ("Next.js", "Frontend", ("nextjs", "next.js")),
    "vue": ("Vue.js", "Frontend", ("vuejs", "vue", "vue.js")),
    "angular": ("Angular", "Frontend", ("angularjs", "angular.js")),
    "react-native": ("React Native", "Frontend", ("reactnative",)),
    "svelte": ("Svelte", "Frontend", ("sveltekit", "sveltekit")),
    "redux": ("Redux", "Frontend", ()),
    "tailwind-css": ("Tailwind CSS", "Frontend", ("tailwind",)),
    # "tailwind" is deliberately NOT an alias here even though it is a CSS
    # framework — it is already an alias of the Tailwind CSS skill above, and
    # duplicate aliases resolve by dict order, which is luck, not design.
    "css-frameworks": ("CSS Frameworks", "Frontend", ("bootstrap", "sass", "scss")),
    "web-performance": ("Web Performance", "Frontend", ("page speed", "lighthouse")),
    "accessibility": ("Accessibility", "Frontend", ("a11y", "wcag")),
    "responsive-design": ("Responsive Design", "Frontend", ("mobile first",)),
    # --- Backend ------------------------------------------------------------
    "node-js": ("Node.js", "Backend", ("node", "nodejs", "node.js")),
    "django": ("Django", "Backend", ()),
    "flask": ("Flask", "Backend", ()),
    "fastapi": ("FastAPI", "Backend", ("fast api",)),
    "express-js": ("Express.js", "Backend", ("express", "expressjs", "express.js")),
    "spring-boot": ("Spring Boot", "Backend", ("spring", "springboot")),
    "rails": ("Ruby on Rails", "Backend", ("ror", "ruby on rails")),
    "dotnet": (".NET", "Backend", ("dotnet", ".net", "asp.net", "aspnet")),
    "laravel": ("Laravel", "Backend", ()),
    "rest-apis": ("REST APIs", "Backend", ("rest", "rest api", "restful")),
    "graphql": ("GraphQL", "Backend", ()),
    "grpc": ("gRPC", "Backend", ()),
    "websockets": ("WebSockets", "Backend", ("websocket", "socket.io", "socketio")),
    "microservices": ("Microservices", "Backend", ("micro services",)),
    "api-design": ("API Design", "Backend", ("api design",)),
    "messaging": ("Message Queues", "Backend", ("rabbitmq", "kafka queues", "sqs")),
    "caching": ("Caching", "Backend", ("redis cache", "memcached")),
    "background-jobs": ("Background Jobs", "Backend", ("celery", "cron jobs", "task queue")),
    # --- Data & AI ----------------------------------------------------------
    "machine-learning": ("Machine Learning", "Data & AI", ("ml", "machine learning")),
    "deep-learning": ("Deep Learning", "Data & AI", ("neural networks",)),
    "nlp": ("Natural Language Processing", "Data & AI", ("natural language processing", "nlp")),
    "computer-vision": ("Computer Vision", "Data & AI", ("cv",)),
    "llm": ("Large Language Models", "Data & AI", ("llms", "genai", "generative ai", "large language models")),
    "prompt-engineering": ("Prompt Engineering", "Data & AI", ("prompting",)),
    "rag": ("RAG", "Data & AI", ("retrieval augmented generation", "retrieval-augmented generation")),
    "pandas": ("pandas", "Data & AI", ()),
    "numpy": ("NumPy", "Data & AI", ("numpy",)),
    "pytorch": ("PyTorch", "Data & AI", ("torch",)),
    "tensorflow": ("TensorFlow", "Data & AI", ("keras",)),
    "scikit-learn": ("scikit-learn", "Data & AI", ("sklearn", "scikit learn")),
    "data-analysis": ("Data Analysis", "Data & AI", ("data analytics",)),
    "data-visualization": ("Data Visualization", "Data & AI", ("dataviz", "matplotlib", "seaborn")),
    "statistics": ("Statistics", "Data & AI", ("statistical analysis",)),
    "experimentation": ("A/B Testing", "Data & AI", ("ab testing", "split testing", "experimentation")),
    "etl": ("ETL", "Data & AI", ("data pipelines", "data pipeline", "elt")),
    "mlops": ("MLOps", "Data & AI", ("model deployment",)),
    "vector-databases": ("Vector Databases", "Data & AI", ("pgvector", "pinecone", "weaviate", "chromadb")),
    # --- Databases ----------------------------------------------------------
    "postgresql": ("PostgreSQL", "Databases", ("postgres", "psql", "postgre")),
    "mysql": ("MySQL", "Databases", ("mariadb",)),
    "mongodb": ("MongoDB", "Databases", ("mongo",)),
    "sqlite": ("SQLite", "Databases", ()),
    "redis": ("Redis", "Databases", ()),
    "elasticsearch": ("Elasticsearch", "Databases", ("elastic search", "opensearch")),
    "dynamodb": ("DynamoDB", "Databases", ()),
    "data-modeling": ("Data Modeling", "Databases", ("database design", "normalization", "er diagram")),
    "query-optimization": ("Query Optimization", "Databases", ("sql tuning", "indexing", "explain plan")),
    # --- Cloud & DevOps ------------------------------------------------------
    "aws": ("AWS", "Cloud & DevOps", ("amazon web services",)),
    "azure": ("Azure", "Cloud & DevOps", ("microsoft azure",)),
    "gcp": ("GCP", "Cloud & DevOps", ("google cloud",)),
    "docker": ("Docker", "Cloud & DevOps", ("containers", "containerization")),
    "kubernetes": ("Kubernetes", "Cloud & DevOps", ("k8s", "eks", "gke", "aks")),
    "terraform": ("Terraform", "Cloud & DevOps", ("infrastructure as code", "iac")),
    "ci-cd": ("CI/CD", "Cloud & DevOps", ("continuous integration", "continuous delivery")),
    "github-actions": ("GitHub Actions", "Cloud & DevOps", ()),
    "jenkins": ("Jenkins", "Cloud & DevOps", ()),
    "linux": ("Linux", "Cloud & DevOps", ()),
    "nginx": ("Nginx", "Cloud & DevOps", ()),
    "observability": ("Observability", "Cloud & DevOps", ("monitoring", "prometheus", "grafana")),
    "logging": ("Logging", "Cloud & DevOps", ("log management",)),
    "infrastructure": ("Infrastructure", "Cloud & DevOps", ("infra", "systems design")),
    "git": ("Git", "Cloud & DevOps", ("version control", "github", "gitlab")),
    # --- Mobile ---------------------------------------------------------------
    "android": ("Android", "Mobile", ("android development",)),
    "ios": ("iOS", "Mobile", ("iphone development",)),
    "flutter": ("Flutter", "Mobile", ()),
    # --- Testing & Quality -----------------------------------------------------
    "unit-testing": ("Unit Testing", "Testing & Quality", ("unit tests", "jest", "pytest", "junit")),
    "integration-testing": ("Integration Testing", "Testing & Quality", ("integration tests",)),
    "end-to-end-testing": ("End-to-End Testing", "Testing & Quality", ("e2e", "e2e testing", "cypress", "playwright")),
    "test-automation": ("Test Automation", "Testing & Quality", ("automation testing", "selenium")),
    "qa": ("Quality Assurance", "Testing & Quality", ("qa testing",)),
    "performance-testing": ("Performance Testing", "Testing & Quality", ("load testing", "jmeter")),
    # --- Security --------------------------------------------------------------
    "authentication": ("Authentication", "Security", ("auth", "oauth", "oauth2", "jwt")),
    "authorization": ("Authorization", "Security", ("authz", "rbac", "permissions")),
    "application-security": ("Application Security", "Security", ("appsec", "owasp", "vulnerability assessment")),
    "encryption": ("Encryption", "Security", ("cryptography", "hashing")),
    "penetration-testing": ("Penetration Testing", "Security", ("pentest", "pen testing")),
    "compliance": ("Compliance", "Security", ("gdpr", "hipaa", "iso 27001", "pci dss")),
    # --- Product & Management ----------------------------------------------------
    "product-management": ("Product Management", "Product & Management", ("product manager", "product ownership")),
    "roadmapping": ("Roadmapping", "Product & Management", ("product roadmap",)),
    "agile": ("Agile", "Product & Management", ("scrum", "kanban", "safe", "sprint planning")),
    "user-research": ("User Research", "Product & Management", ("customer discovery", "usability testing")),
    "stakeholder-management": ("Stakeholder Management", "Product & Management", ("stakeholder communication",)),
    "requirements-gathering": ("Requirements Gathering", "Product & Management", ("business requirements",)),
    "project-management": ("Project Management", "Product & Management", ("program management", "pmp")),
    # --- Design -------------------------------------------------------------------
    "ui-design": ("UI Design", "Design", ("user interface design", "figma", "wireframing")),
    "ux-design": ("UX Design", "Design", ("user experience design", "ux research")),
    "design-systems": ("Design Systems", "Design", ("component library",)),
    "prototyping": ("Prototyping", "Design", ("interactive prototype",)),
    # --- Communication & Leadership --------------------------------------------------
    "technical-writing": ("Technical Writing", "Communication & Leadership", ("documentation", "docs")),
    "presentations": ("Presentations", "Communication & Leadership", ("public speaking", "slide decks")),
    "code-review": ("Code Review", "Communication & Leadership", ("peer review",)),
    "mentoring": ("Mentoring", "Communication & Leadership", ("coaching others", "onboarding others")),
    "team-leadership": ("Team Leadership", "Communication & Leadership", ("leading teams", "tech lead")),
    "collaboration": ("Collaboration", "Communication & Leadership", ("cross functional work", "cross-functional")),
    "requirement-analysis": ("Requirement Analysis", "Communication & Leadership", ("client requirement analysis",)),
    # --- Business & Domain ------------------------------------------------------------
    "finance": ("Finance", "Business & Domain", ("financial analysis",)),
    "accounting": ("Accounting", "Business & Domain", ()),
    "marketing": ("Marketing", "Business & Domain", ("growth marketing", "digital marketing")),
    "sales": ("Sales", "Business & Domain", ()),
    "customer-support": ("Customer Support", "Business & Domain", ("customer success", "support")),
    "recruiting": ("Recruiting", "Business & Domain", ("talent acquisition", "hiring")),
    "e-commerce": ("E-commerce", "Business & Domain", ("ecommerce", "online retail")),
    "healthcare": ("Healthcare", "Business & Domain", ("medical", "clinical")),
    "education-sector": ("Education Sector", "Business & Domain", ("teaching", "edtech")),
    "logistics": ("Logistics", "Business & Domain", ("supply chain",)),
    # --- Soft / language ----------------------------------------------------------------
    "english": ("English", "Communication & Leadership", ("english language",)),
}


SKILLS = {
    slug: {
        "slug": slug,
        "name": name,
        "category": category,
        "aliases": sorted(aliases),
    }
    for slug, (name, category, aliases) in _SKILL_SEED.items()
}

# Alias lookup is built from the seed rather than hand-maintained, so adding a
# skill to _SKILL_SEED is all it takes for its spellings to resolve.
def normalize_key(raw):
    """Lowercase, collapse punctuation/whitespace runs to single hyphens.

    The single lookup form used by resolve(), search() and alias matching, so
    "Node JS", "node.js" and "nodejs" all land on the same key.
    """
    key = (raw or "").strip().lower()
    key = re.sub(r"[^a-z0-9+#]+", "-", key)
    return key.strip("-")


ALIASES = {}
for _slug, _entry in SKILLS.items():
    for _alias in _entry["aliases"]:
        ALIASES.setdefault(normalize_key(_alias), _slug)


def normalize_level(raw):
    """Map any spelling of a proficiency level onto the canonical Title-Case.

    Accepts "expert", "Expert", "EXPERT" and trailing whitespace. Returns None
    for anything unknown so callers can reject rather than silently store a
    level nothing else will recognize.
    """
    key = (raw or "").strip().lower()
    for level in LEVELS:
        if level.lower() == key:
            return level
    return None


def level_rank(level):
    """Numeric rank for gap arithmetic (0 when unknown/unset).

    A gap is "how many levels from current to required", so both sides have to
    be comparable. Beginner is 1, not 0 — rank 0 means "we don't know", which
    is a different thing from "knows nothing".
    """
    canonical = normalize_level(level)
    if canonical is None:
        return 0
    return LEVELS.index(canonical) + 1


# De-spaced slugs ("scikit learn" -> scikit-learn) resolved once instead of
# scanning every skill on each miss. setdefault keeps first-wins ordering.
_DE_SPACED = {}
for _slug in SKILLS:
    _DE_SPACED.setdefault(_slug.replace("-", ""), _slug)


def resolve(raw):
    """Map free text onto the canonical set.

    Returns the taxonomy entry (slug/name/category/aliases) or None when the
    skill isn't catalogued. Tries, in order: exact slug, exact alias, then a
    normalized form of the input ("React JS" -> "react-js" -> react).
    """
    key = normalize_key(raw)
    if not key:
        return None
    if key in SKILLS:
        return SKILLS[key]
    if key in ALIASES:
        return SKILLS[ALIASES[key]]
    # "react js" normalizes to "react-js", which IS a skill, but someone typing
    # "Node JS" gets "node-js" — covered above. The last case is a spacing
    # variant of a catalogued slug that no alias lists, e.g. "scikit learn".
    de_spaced = key.replace("-", "")
    slug = _DE_SPACED.get(de_spaced)
    return SKILLS[slug] if slug else None


def is_known(raw):
    return resolve(raw) is not None


# Precomputed once at import: name/alias haystacks per skill. Rebuilding these
# inside search() made every keystroke of a typeahead rebuild 137 entries.
_SEARCH_INDEX = [
    (entry, (entry["slug"], entry["name"].lower(), *(a.lower() for a in entry["aliases"])))
    for entry in SKILLS.values()
]


def search(term, limit=20):
    """Typeahead over the taxonomy: slug, display name and aliases all match."""
    key = normalize_key(term)
    if not key:
        return []
    matches = []
    for entry, haystacks in _SEARCH_INDEX:
        if any(key in h for h in haystacks):
            matches.append(entry)
    matches.sort(key=lambda e: (not e["slug"].startswith(key), e["name"]))
    return matches[:limit]


def skills_in_category(category):
    return [e for e in SKILLS.values() if e["category"] == category]


def level_for_score(percent_correct):
    """Map a percentage correct onto a proficiency level.

    Thresholds live next to LEVELS because they define what the scale means:
    below 50% is not "unknown", it is Beginner — the band means the user
    demonstrably cannot do this yet. The top band stops short of requiring
    perfection, so a small wrong-answer count does not read as Expert and
    then disagree with the level a retake awards.
    """
    if percent_correct is None:
        return None
    if percent_correct >= 90:
        return "Expert"
    if percent_correct >= 70:
        return "Advanced"
    if percent_correct >= 50:
        return "Intermediate"
    return "Beginner"


def taxonomy_payload():
    """Full reference payload for the client — the picker and the validator
    read the same lists, so they cannot disagree."""
    return {
        "levels": list(LEVELS),
        "categories": list(CATEGORIES),
        "skills": [SKILLS[slug] for slug in sorted(SKILLS)],
        "total": len(SKILLS),
    }