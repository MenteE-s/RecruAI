# Email DNS runbook — Resend + Google Workspace

Status checked from public DNS on **30 Oct 2026**. This is a read-only
verification; changing records requires Cloudflare access.

## Observed state

| Record | Observed | Meaning |
|---|---|---|
| `menteeai.org` MX | `1 smtp.google.com` | Google Workspace receives root-domain mail. |
| `menteeai.org` TXT | Google site verification only | **No SPF record.** |
| `_dmarc.menteeai.org` TXT | none | **No DMARC policy or reports.** |
| `resend._domainkey.menteeai.org` TXT | present (RSA DKIM key) | Resend DKIM signing is configured. |
| `send.menteeai.org` | CNAME → `send.forge.rmta.net` | The sending subdomain supplies SPF and the feedback MX. |

Do not add a TXT record at `send.menteeai.org` while it is a CNAME; a CNAME
cannot coexist with other record types at the same name. Keep the Resend
dashboard's exact record values authoritative if they differ from this page.

## Records to add

### 1. Root SPF for Google Workspace

Add one TXT record at `@` / `menteeai.org`:

```text
v=spf1 include:_spf.google.com ~all
```

Keep the existing Google site-verification TXT. If an SPF record already
exists, **edit it** instead of adding a second one; multiple SPF records make
SPF fail. Resend's envelope domain is the `send` subdomain, so this root SPF
is for Google Workspace mail, not a replacement for the Resend records.

### 2. DMARC

Add one TXT record at `_dmarc.menteeai.org`:

```text
v=DMARC1; p=none; rua=mailto:dmarc@menteeai.org; fo=1; pct=100
```

`p=none` starts monitoring without rejecting the beta's legitimate mail.
Confirm `dmarc@menteeai.org` exists (or use a mailbox you actually read).
After two weeks with passing reports and no unexplained failures, tighten in
stages:

```text
v=DMARC1; p=quarantine; rua=mailto:dmarc@menteeai.org; fo=1; pct=25
```

Then raise `pct` to `100`, and finally move to `p=reject`. Do not jump
straight to reject during the beta.

### 3. Resend records

Keep the DKIM TXT and `send` CNAME/MX exactly as Resend issued them. In the
Resend dashboard, the domain should show **Verified** before external email is
enabled. Resend's free tier is enough for the controlled beta.

## Verify DNS

From Windows PowerShell:

```powershell
Resolve-DnsName menteeai.org -Type TXT
Resolve-DnsName _dmarc.menteeai.org -Type TXT
Resolve-DnsName resend._domainkey.menteeai.org -Type TXT
Resolve-DnsName send.menteeai.org -Type CNAME
Resolve-DnsName send.menteeai.org -Type MX
```

If the local resolver times out, query DNS-over-HTTPS:

```powershell
curl.exe -s "https://cloudflare-dns.com/dns-query?name=_dmarc.menteeai.org&type=TXT" `
  -H "accept: application/dns-json"
```

## Deliverability test

1. Confirm Resend shows the domain as verified and the `RESEND_FROM_EMAIL`
   sender is on that domain (`no-reply@menteeai.org` by default).
2. Trigger a real password reset and an organization invitation to external
   Gmail and Outlook addresses.
3. Check the received headers for `spf=pass`, `dkim=pass`, and `dmarc=pass`.
4. Confirm the outbox event reaches `sent`; inspect admin → Outbox for retries
   or dead letters.
5. Check the spam folder and Resend's delivery/bounce events.
6. Only then enable external invites. Internal test addresses first, then the
   controlled beta cohort.

If OTP or reset mail fails, the product path still returns the generic reset
response; support must use the outbox/admin retry path rather than asking the
user to retry indefinitely.
