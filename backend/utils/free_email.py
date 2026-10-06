"""Detection of consumer / free-mail domains.

Used to nudge people toward a real company domain when they fill in a page's
contact email. It is advisory, never blocking: plenty of legitimate small
businesses and solo founders only have a Gmail, and refusing them would be
worse than warning them. The server reuses this so the frontend warning and
the API response can never drift apart.
"""

# Consumer mailbox providers, plus the regional variants people actually use.
# Deliberately NOT exhaustive — this is a nudge, not a blocklist. A miss just
# means no warning is shown, which is the harmless direction to fail.
FREE_EMAIL_DOMAINS = frozenset({
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "yahoo.co.in",
    "yahoo.com.pk",
    "ymail.com",
    "rocketmail.com",
    "hotmail.com",
    "hotmail.co.uk",
    "hotmail.com.pk",
    "outlook.com",
    "outlook.pk",
    "live.com",
    "live.co.uk",
    "msn.com",
    "aol.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "proton.me",
    "protonmail.com",
    "pm.me",
    "tutanota.com",
    "tuta.io",
    "gmx.com",
    "gmx.de",
    "gmx.net",
    "mail.com",
    "mail.ru",
    "yandex.com",
    "yandex.ru",
    "zoho.com",
    "fastmail.com",
    "hushmail.com",
    "inbox.com",
    "yandex.by",
    "web.de",
    "orange.fr",
    "free.fr",
    "wanadoo.fr",
    "libero.it",
    "virgilio.it",
    "rediffmail.com",
    "qq.com",
    "163.com",
    "126.com",
    "naver.com",
    "daum.net",
    "hey.com",
})

# Domains that are technically consumer-hosted but are the norm for a company
# in that market, so warn with softer copy instead of "this looks personal".
REGIONAL_BUSINESS_ALLOWLIST = frozenset({
    "outlook.pk",     # very common for Pakistani businesses
    "hotmail.com.pk",
    "yahoo.com.pk",
})


def email_domain(email: str) -> str:
    """Lowercased domain part of an address, or '' when there isn't one."""
    if not email or "@" not in email:
        return ""
    return email.rsplit("@", 1)[-1].strip().lower()


def is_free_email_domain(email: str) -> bool:
    """True when the address belongs to a known consumer mailbox provider."""
    domain = email_domain(email)
    if not domain:
        return False
    if domain in FREE_EMAIL_DOMAINS:
        return True
    # gmail.com.pk / yahoo.com.br style: a free provider plus a ccTLD.
    root = domain.split(".")[0]
    return root in {d.split(".")[0] for d in FREE_EMAIL_DOMAINS if d.startswith(root + ".")}


def contact_email_warning(email: str):
    """Return an advisory warning for a page contact email, else None.

    Shape mirrors what the frontend renders, so the API can hand the reason
    back instead of the client re-deriving it.
    """
    domain = email_domain(email)
    if not domain or not is_free_email_domain(email):
        return None

    soft = domain in REGIONAL_BUSINESS_ALLOWLIST
    return {
        "code": "free_email_domain",
        "field": "contact_email",
        "domain": domain,
        "severity": "warning",
        "message": (
            f"{domain} is a personal mailbox, so candidates can't tell it apart "
            "from a recruiter's personal address. A company email looks more "
            "trustworthy and replies land in a shared inbox."
        ) if soft else (
            f"{domain} is a free personal mailbox. Candidates are less likely to "
            "trust replies from it, and you won't get shared-inbox features. "
            "You can use a company domain like jobs@yourcompany.com instead."
        ),
    }