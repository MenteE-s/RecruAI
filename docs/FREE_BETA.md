# Controlled free beta

RecruAI is launching without paid checkout. The code deliberately closes the
old self-service upgrade path and hides payment CTAs until a real payment
provider is wired end to end.

## What is enforced

- `POST /api/subscription/upgrade` returns **410** with `code=billing_disabled`
  and never mutates the account. This removes both the free paid upgrade and the
  expired-trial reset.
- The frontend reads `REACT_APP_BILLING_ENABLED`. While it is not `"true"`:
  - CVAI, billing, and settings pages do not offer a purchase;
  - payment-method and invoice panels explain that billing is closed;
  - marketing copy does not promise a $15 or $29.99 plan.
- New accounts still receive the 30-day full-access trial. After it expires the
  account falls back to the free plan; admins can grant a plan or a single
  feature override from the admin app.
- Admin-only grants remain available and require a superadmin JWT.

## Configuration

| Surface | Variable | Value |
| --- | --- | --- |
| Frontend (Vercel) | `REACT_APP_BILLING_ENABLED` | `false` |
| Backend | no billing flag is needed | upgrade endpoint is always closed |

Set `REACT_APP_BILLING_ENABLED=true` only after a verified checkout, signed
webhooks, customer portal, tax/refund policy, and reconciliation are deployed.
The backend upgrade endpoint must be replaced or guarded by that payment flow
before the flag is turned on.

## Verification

- `backend/tests/test_subscription.py` asserts the 410 response and that an
  expired trial's status, `paid_plan`, and `trial_start_date` do not change.
- The frontend production build is checked with
  `REACT_APP_BILLING_ENABLED=false`.
- Search the frontend for `Subscribe now`, `Upgrade`, or `$` pricing copy before
  each beta release; every paid CTA must be behind `BILLING_ENABLED`.
