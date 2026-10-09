"""Grant, inspect and revoke a subscription by hand.

There is no payment processor in the MVP, so this is the only way to put an
account into the paid state — and the only way to let a tester or design partner
in without hand-editing Postgres.

It exists as a script rather than an endpoint because the model has no admin
role: `role` is only 'individual' or 'organization'. An admin endpoint would
need a role invented for it, and that is a larger decision than the MVP
deserves right now.

    python scripts/grant_subscription.py --list
    python scripts/grant_subscription.py --email you@example.com
    python scripts/grant_subscription.py --email you@example.com --grant
    python scripts/grant_subscription.py --email you@example.com --grant --days 30
    python scripts/grant_subscription.py --email you@example.com --trial --days 7
    python scripts/grant_subscription.py --email you@example.com --revoke
    python scripts/grant_subscription.py --email you@example.com --reset-ai-usage

Both fields are always set together on purpose. `User.is_subscription_active()`
requires `subscription_status == "active"` AND `paid_plan is True`, so setting
only the status produces an account that looks paid and is denied by every
gated endpoint with a 403 that reads like a bug.
"""
import argparse
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import or_

from backend.app import create_app
from backend.extensions import db
from backend.models import User, Organization
from backend.utils.ai_budget import budget_status


def _fmt(value):
    if value is None:
        return "-"
    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="seconds") + "Z"
    return str(value)


def _describe(user):
    org = db.session.get(Organization, user.organization_id) if user.organization_id else None
    lines = [
        f"  id             : {user.id}",
        f"  name           : {user.name}",
        f"  email          : {user.email}",
        f"  role           : {user.role}",
        f"  page           : {org.name if org else '-'} (org {user.organization_id or '-'})",
        f"  status         : {user.subscription_status}",
        f"  paid_plan      : {user.paid_plan}",
        f"  trial started  : {_fmt(user.trial_start_date)}",
        f"  token total    : {user.tokens_used}",
        f"  paid active    : {user.is_subscription_active()}",
        f"  trial active   : {user.is_trial_active()}",
    ]
    status = budget_status(user)
    lines.append(
        f"  AI today       : {status['tokens_used_today']:,} / "
        f"{'unlimited' if status['unlimited'] else format(status['daily_limit'], ',')}"
        f"{'  EXHAUSTED' if status['exhausted'] else ''}"
    )
    return "\n".join(lines)


def _find_user(email):
    return db.session.query(User).filter(
        or_(User.email == email, User.name == email)
    ).first()


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--email", help="account email (or exact name)")
    parser.add_argument("--grant", action="store_true", help="set paid + active")
    parser.add_argument("--trial", action="store_true", help="start/refresh a trial instead")
    parser.add_argument("--revoke", action="store_true", help="cancel paid access")
    parser.add_argument("--days", type=int, default=None,
                        help="expiry horizon recorded for a trial (default: 7)")
    parser.add_argument("--reset-ai-usage", action="store_true",
                        help="clear today's token rows so a budget-blocked account is unblocked now")
    parser.add_argument("--list", action="store_true", help="list accounts and their tiers")
    args = parser.parse_args()

    actions = sum([bool(args.grant), bool(args.trial), bool(args.revoke),
                   bool(args.reset_ai_usage)])
    if not args.list and not args.email:
        parser.error("pass --email <account>, or --list")
    if actions > 1:
        parser.error("--grant, --trial, --revoke and --reset-ai-usage are mutually exclusive")

    app = create_app()
    with app.app_context():
        if args.list:
            print("\n=== accounts ===")
            rows = (db.session.query(User)
                    .order_by(User.subscription_status, User.id)
                    .limit(50).all())
            for u in rows:
                print(f"  {u.id:>4}  {u.subscription_status:<9} paid={str(bool(u.paid_plan)):<5} "
                      f"{(u.email or u.name or '')[:44]}")
            print(f"  ({len(rows)} shown, max 50)")
            return

        user = _find_user(args.email)
        if not user:
            print(f"No account matching {args.email!r}. Nothing changed.")
            return

        print("\n=== before ===")
        print(_describe(user))

        changed = []
        if args.grant:
            user.subscription_status = "active"
            user.paid_plan = True
            user.trial_start_date = None
            changed += ["subscription_status -> active", "paid_plan -> True",
                        "trial_start_date -> cleared"]
        elif args.trial:
            days = args.days if args.days is not None else 7
            if days <= 0:
                print("--days must be greater than 0 for a trial")
                return
            user.subscription_status = "trial"
            user.paid_plan = False
            user.trial_start_date = datetime.utcnow()
            changed += ["subscription_status -> trial", "paid_plan -> False",
                        f"trial_start_date -> now (expires ~{_fmt(datetime.utcnow() + timedelta(days=days))})"]
        elif args.revoke:
            user.subscription_status = "expired"
            user.paid_plan = False
            changed += ["subscription_status -> expired", "paid_plan -> False"]
        elif args.reset_ai_usage:
            from backend.utils.ai_budget import reset_today_usage
            removed = reset_today_usage(user)
            print(f"\nRemoved {removed} token_usage row(s) for today.")
            print("=== after ===")
            print(_describe(user))
            return

        if changed:
            db.session.commit()
            print("\n=== applied ===")
            for line in changed:
                print(f"  - {line}")

        print("\n=== after ===")
        print(_describe(user))


if __name__ == "__main__":
    main()