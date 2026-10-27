"""Grant, inspect and revoke platform superadmin access by hand.

Superadmins bypass org scoping and may use /api/admin/* (the admin dashboard).
The flag cannot be self-granted through any endpoint.

    python scripts/grant_superadmin.py --list
    python scripts/grant_superadmin.py --email you@example.com --grant
    python scripts/grant_superadmin.py --email you@example.com --revoke

Refusing to remove the last superadmin (or your own access is left to the
dashboard guard) — this script requires --force to do it, and says so loudly.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import create_app
from backend.extensions import db
from backend.models import User


def _find_user(email):
    return db.session.query(User).filter(User.email == email).first()


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--email", help="account email")
    parser.add_argument("--grant", action="store_true", help="set is_superadmin")
    parser.add_argument("--revoke", action="store_true", help="clear is_superadmin")
    parser.add_argument("--force", action="store_true",
                        help="allow removing the last superadmin")
    parser.add_argument("--list", action="store_true", help="list superadmins")
    args = parser.parse_args()

    if args.grant and args.revoke:
        parser.error("--grant and --revoke are mutually exclusive")
    if not args.list and not args.email:
        parser.error("pass --email <account>, or --list")
    if not args.list and not (args.grant or args.revoke):
        parser.error("pass --grant or --revoke (or --list)")

    app = create_app()
    with app.app_context():
        if args.list:
            rows = User.query.filter_by(is_superadmin=True).order_by(User.id).all()
            print("\n=== superadmins ===")
            for u in rows:
                print(f"  {u.id:>4}  {(u.email or u.name or '')[:44]}")
            print(f"  ({len(rows)} total)")
            return

        user = _find_user(args.email)
        if not user:
            print(f"No account matching {args.email!r}. Nothing changed.")
            return

        if args.grant:
            user.is_superadmin = True
            db.session.commit()
            print(f"{user.email} is now a superadmin.")
            return

        if args.revoke:
            others = (
                User.query.filter(User.is_superadmin.is_(True), User.id != user.id).count()
            )
            if others == 0 and not args.force:
                print("Refusing to remove the last superadmin (pass --force to override).")
                return
            user.is_superadmin = False
            db.session.commit()
            print(f"{user.email} is no longer a superadmin.")


if __name__ == "__main__":
    main()
