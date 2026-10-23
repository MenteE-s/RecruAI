"""Product-wide constants that must agree across models, jobs, and the UI.

Trial length used to be duplicated as 30 days in ``User`` and 7 days in
``Organization``/``SubscriptionManager``. The scheduler would have expired
individual trials 23 days early the moment it was enabled, so every consumer
now reads this one value.
"""

# One month of full access for both individual and organization trials.
TRIAL_PERIOD_DAYS = 30

# A deleted account is inaccessible immediately, but its rows are retained for
# this long so support can reverse an accidental deletion. After the grace
# period the worker hard-deletes everything keyed to the user.
ACCOUNT_DELETION_GRACE_DAYS = 30

# AI allowance per account while there is no billing. Kept here so the column
# default and the budget helper cannot drift apart.
DEFAULT_AI_TOKEN_ALLOWANCE = 50_000

# Warn when an account has consumed this fraction of its allowance.
AI_BUDGET_WARNING_FRACTION = 0.80
