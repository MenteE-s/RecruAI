"""Transactional email via Resend (OTP + welcome).

Design: MenteE monochrome — charcoal header, white body, emerald accents.
Templates are table-based with inline CSS so they render in every client.
All sending is fail-soft: functions return (ok, error) and never raise, so
a mail outage can never break registration or login.
"""

import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# ---- Brand ----
BRAND_NAME = "RecruAI"
BRAND_BYLINE = "by MenteE"
CHARCOAL = "#171717"
EMERALD = "#10b981"
MUTED = "#737373"
LIGHT_BG = "#f5f5f5"
BORDER = "#e5e5e5"

SITE_MENTEE = "https://menteeai.org"
SITE_RECRUAI = "https://recruai.menteeai.org"
# Brand mark (black-on-light, so it sits on the white body, not the dark header).
LOGO_URL = "https://www.menteeai.org/MenteE.png"
SOCIAL_X = "https://x.com/menteeaiorg"
SOCIAL_LINKEDIN = "https://linkedin.com/company/menteeai"
SOCIAL_INSTAGRAM = "https://instagram.com/mentee.ai"
CONTACT_EMAIL = "contact@menteeai.org"


def _config(key: str, default: Optional[str] = None) -> Optional[str]:
    try:
        from flask import current_app

        return current_app.config.get(key, default)
    except RuntimeError:
        return default


def _resend_client():
    """Configured Resend client, or None when email is not set up."""
    api_key = _config("RESEND_API_KEY")
    if not api_key:
        return None
    try:
        import resend

        resend.api_key = api_key
        return resend
    except Exception as e:
        logger.warning(f"Resend unavailable: {e}")
        return None


def _footer_html() -> str:
    return f"""
      <tr><td style="padding:28px 36px 8px 36px;text-align:center;">
        <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;letter-spacing:2px;color:{MUTED};">FOLLOW MENTEE</p>
        <p style="margin:0;font-size:13px;color:{CHARCOAL};">
          <a href="{SOCIAL_X}" style="color:{CHARCOAL};font-weight:700;text-decoration:none;">X</a>
          <span style="color:{BORDER};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
          <a href="{SOCIAL_LINKEDIN}" style="color:{CHARCOAL};font-weight:700;text-decoration:none;">LinkedIn</a>
          <span style="color:{BORDER};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
          <a href="{SOCIAL_INSTAGRAM}" style="color:{CHARCOAL};font-weight:700;text-decoration:none;">Instagram</a>
        </p>
        <p style="margin:10px 0 0 0;font-size:12px;color:{MUTED};">
          <a href="{SITE_MENTEE}" style="color:{MUTED};text-decoration:underline;">menteeai.org</a>
          &nbsp;·&nbsp;
          <a href="{SITE_RECRUAI}" style="color:{MUTED};text-decoration:underline;">recruai.menteeai.org</a>
        </p>
      </td></tr>
      <tr><td style="padding:16px 36px 28px 36px;text-align:center;border-top:1px solid {BORDER};">
        <p style="margin:12px 0 0 0;font-size:11px;line-height:1.7;color:{MUTED};">
          Questions? Write to <a href="mailto:{CONTACT_EMAIL}" style="color:{MUTED};text-decoration:underline;">{CONTACT_EMAIL}</a><br>
          © 2026 {BRAND_NAME} {BRAND_BYLINE} · Built for Pakistan, expanding across the Gulf &amp; beyond
        </p>
      </td></tr>
    """


def _logo_url() -> str:
    return _config("RESEND_LOGO_URL", LOGO_URL) or LOGO_URL


def _shell_html(preheader: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{BRAND_NAME}</title></head>
<body style="margin:0;padding:0;background-color:{LIGHT_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{LIGHT_BG};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid {BORDER};border-radius:14px;overflow:hidden;">
<tr><td align="center" style="background-color:{CHARCOAL};padding:26px 36px;text-align:center;">
  <p style="margin:0;font-size:19px;font-weight:800;letter-spacing:-0.3px;color:#ffffff;text-align:center;">{BRAND_NAME} <span style="font-weight:400;color:#a3a3a3;">{BRAND_BYLINE}</span></p>
</td></tr>
<tr><td align="center" style="background-color:#ffffff;padding:28px 36px 0 36px;">
  <a href="{SITE_MENTEE}"><img src="{_logo_url()}" alt="MenteE" width="120" style="display:block;width:120px;max-width:120px;height:auto;border:0;outline:none;text-decoration:none;"></a>
</td></tr>
{body_html}
{_footer_html()}
</table>
</td></tr>
</table>
</body></html>"""


def otp_email_html(name: str, code: str, minutes: int = 10, context: str = "register") -> str:
    import html as _html
    first = _html.escape((name or "there").split(" ")[0], quote=True)
    digits = "".join(
        f'<td align="center" style="width:48px;height:56px;background-color:{LIGHT_BG};border:1px solid {BORDER};border-radius:10px;font-size:26px;font-weight:800;color:{CHARCOAL};">{d}</td><td style="width:8px;"></td>'
        for d in code
    )
    if context == "change_email":
        heading = "Confirm your new email"
        intro = f"Hi {first}, use this code to confirm your new sign-in address. Your current email keeps working until you enter it."
        preheader = f"Confirm your new {BRAND_NAME} email address: {code}"
    else:
        heading = "Verify your email"
        intro = f"Hi {first}, use this code to finish creating your {BRAND_NAME} account:"
        preheader = f"Your {BRAND_NAME} verification code is {code}"
    body = f"""
<tr><td align="center" style="padding:36px 36px 8px 36px;text-align:center;">
  <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.4px;color:{CHARCOAL};text-align:center;">{heading}</p>
  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#525252;text-align:center;">{intro}</p>
</td></tr>
<tr><td style="padding:20px 36px 8px 36px;" align="center">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>{digits}</tr></table>
  <p style="margin:16px 0 0 0;font-size:12px;color:{MUTED};text-align:center;">Expires in {minutes} minutes · Never share this code</p>
</td></tr>
<tr><td align="center" style="padding:16px 36px 28px 36px;text-align:center;">
  <p style="margin:0;font-size:12px;line-height:1.7;color:{MUTED};text-align:center;">Didn&apos;t request this? Someone may have typed your address by mistake — you can safely ignore this email.</p>
</td></tr>
"""
    return _shell_html(preheader, body)


def otp_email_text(name: str, code: str, minutes: int = 10, context: str = "register") -> str:
    first = (name or "there").split(" ")[0]
    if context == "change_email":
        intro = f"Hi {first},\n\nUse this code to confirm your new {BRAND_NAME} sign-in address.\nYour current email keeps working until you enter it."
    else:
        intro = f"Hi {first},\n\nYour {BRAND_NAME} verification code is:"
    return (
        f"{intro}\n\n  {code}\n\n"
        f"It expires in {minutes} minutes. Never share this code.\n\n"
        f"Didn't request this? Just ignore this email.\n\n"
        f"— {BRAND_NAME} {BRAND_BYLINE} ({SITE_RECRUAI})"
    )


def welcome_email_html(name: str, role: str = "individual") -> str:
    import html as _html
    first = _html.escape((name or "there").split(" ")[0], quote=True)
    if role == "organization":
        steps = [
            ("Post your first role", "Publish a job in under two minutes — it goes live across Pakistan & the Gulf instantly."),
            ("Let AI screen for you", "Agents score every applicant on skills, not keywords."),
            ("Track the pipeline", "Applied → screening → interview → offer → hired, all in one view."),
        ]
        cta_url = f"{SITE_RECRUAI}/organization/jobs"
        cta_label = "Post your first job"
    else:
        steps = [
            ("Complete your profile", "Add experience, skills and education — it powers your AI matches."),
            ("Browse matched jobs", "Roles across Pakistan, UAE, Saudi Arabia, Qatar and beyond."),
            ("Practice interviews", "Unlimited mock interviews with instant AI feedback."),
        ]
        cta_url = f"{SITE_RECRUAI}/dashboard"
        cta_label = "Open your dashboard"
    steps_html = "".join(
        f"""<tr><td align="center" style="padding:0 0 20px 0;text-align:center;">
        <div style="width:30px;height:30px;border-radius:50%;background-color:{CHARCOAL};color:#ffffff;font-size:14px;font-weight:800;text-align:center;line-height:30px;margin:0 auto;">{i}</div>
        <p style="margin:8px 0 0 0;font-size:14px;font-weight:700;color:{CHARCOAL};text-align:center;">{t}</p>
        <p style="margin:3px 0 0 0;font-size:13px;line-height:1.6;color:#525252;text-align:center;">{d}</p>
        </td></tr>"""
        for i, (t, d) in enumerate(steps, 1)
    )
    body = f"""
<tr><td style="padding:36px 36px 8px 36px;text-align:center;">
  <div style="display:inline-block;width:52px;height:52px;border-radius:50%;background-color:{EMERALD};color:#ffffff;font-size:26px;font-weight:800;line-height:52px;">✓</div>
  <p style="margin:18px 0 0 0;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:{CHARCOAL};">Welcome to {BRAND_NAME}, {first}!</p>
  <p style="margin:10px 0 0 0;font-size:14px;line-height:1.7;color:#525252;">Your email is verified and your account is ready. Here&apos;s how to get the most out of it:</p>
</td></tr>
<tr><td style="padding:24px 36px 8px 36px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">{steps_html}</table></td></tr>
<tr><td style="padding:12px 36px 30px 36px;text-align:center;">
  <a href="{cta_url}" style="display:inline-block;background-color:{CHARCOAL};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 34px;border-radius:9px;">{cta_label}</a>
  <p style="margin:14px 0 0 0;font-size:12px;color:{MUTED};">Free forever plan · No credit card required</p>
</td></tr>
"""
    return _shell_html(f"Welcome to {BRAND_NAME}, {first} — your account is ready", body)


def welcome_email_text(name: str, role: str = "individual") -> str:
    first = (name or "there").split(" ")[0]
    if role == "organization":
        steps = "1. Post your first role\n2. Let AI screen applicants\n3. Track the pipeline to hired"
        cta = f"{SITE_RECRUAI}/organization/jobs"
    else:
        steps = "1. Complete your profile\n2. Browse matched jobs\n3. Practice mock interviews"
        cta = f"{SITE_RECRUAI}/dashboard"
    return (
        f"Welcome to {BRAND_NAME}, {first}!\n\nYour email is verified and your account is ready.\n\n{steps}\n\n"
        f"Get started: {cta}\n\nFree forever plan · No credit card required\n\n"
        f"Follow MenteE — X: {SOCIAL_X} · LinkedIn: {SOCIAL_LINKEDIN} · Instagram: {SOCIAL_INSTAGRAM}\n"
        f"{SITE_MENTEE} · {SITE_RECRUAI} · {CONTACT_EMAIL}"
    )


def _send(to_email: str, subject: str, html: str, text: str,
          sender: Optional[str], reply_to: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    client = _resend_client()
    if client is None:
        logger.warning("Email not sent (RESEND_API_KEY missing): %s", subject)
        return False, "email_not_configured"
    try:
        payload = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html,
            "text": text,
        }
        if reply_to:
            payload["reply_to"] = reply_to
        # SDK v2 exposes Emails (capital E) with a static send().
        emails_api = getattr(client, "Emails", None) or getattr(client, "emails", None)
        emails_api.send(payload)
        return True, None
    except Exception as e:
        logger.warning(f"Email send failed ({subject} -> {to_email}): {e}")
        return False, "email_send_failed"


def maybe_dev_log_otp(to_email: str, code: str) -> None:
    """Dev-only fallback: log OTP issuance WITHOUT the code by default.

    Full codes only appear when explicitly enabled with
    ALLOW_DEV_OTP_LOG=1 + FLASK_DEBUG=1 (local dev). Never runs in
    production, so codes can't leak into prod/staging logs.
    """
    import os
    try:
        from flask import current_app

        is_prod = bool(current_app.config.get("IS_PRODUCTION"))
    except RuntimeError:
        is_prod = False
    if is_prod or _config("RESEND_API_KEY"):
        return
    if os.getenv("ALLOW_DEV_OTP_LOG") == "1" and os.getenv("FLASK_DEBUG") == "1":
        masked = f"***{code[-2:]}" if code and len(code) >= 2 else "***"
        logger.warning("DEV-ONLY OTP issued (masked %s). Full code suppressed; check debugger.", masked)
    else:
        logger.info("OTP issued (dev log suppressed; set ALLOW_DEV_OTP_LOG=1 + FLASK_DEBUG=1 locally to debug)")


def send_otp_email(to_email: str, name: str, code: str, context: str = "register") -> Tuple[bool, Optional[str]]:
    sender = _config("RESEND_FROM_EMAIL", f"{BRAND_NAME} <no-reply@menteeai.org>")
    subject = (
        f"Confirm your new {BRAND_NAME} email: {code}"
        if context == "change_email"
        else f"Your {BRAND_NAME} verification code is {code}"
    )
    return _send(
        to_email,
        subject,
        otp_email_html(name, code, context=context),
        otp_email_text(name, code, context=context),
        sender,
    )


def send_welcome_email(to_email: str, name: str, role: str = "individual") -> Tuple[bool, Optional[str]]:
    sender = _config("RESEND_WELCOME_FROM_EMAIL", f"{BRAND_NAME} <welcome@menteeai.org>")
    return _send(
        to_email,
        f"Welcome to {BRAND_NAME} — your account is ready",
        welcome_email_html(name, role),
        welcome_email_text(name, role),
        sender,
        reply_to=CONTACT_EMAIL,
    )
