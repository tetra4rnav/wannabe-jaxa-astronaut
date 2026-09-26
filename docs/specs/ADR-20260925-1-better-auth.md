# ADR-20260925-1 — Better Auth for operator login

**Status:** accepted  
**Date:** 2026-09-25

## Context

`/admin` was gated by a Cloudflare Access application on `wannabe-jaxa-astronaut.diaphana.io/admin*`. The public site should stay readable without a login, and operator access should live in the app so it can be revoked with the same D1 database as the catalog.

## Decision

- The public Astro Worker uses **Better Auth** (email and password) with sessions stored in the existing D1 `DB`.
- Public pages stay open. A session is available site-wide. `/admin` and `/admin/api/*` require `role = admin` and an email still listed in `ADMIN_EMAILS`. An empty list denies everyone.
- Public sign-up is disabled. Operator accounts are created only by `POST /api/operator/accounts`, which requires `BOOTSTRAP_SECRET` and an allowlisted email. That route sets `role = admin`. Repeating it resets the password.
- There is no password-reset email.
- `ADMIN_OPEN=1` remains an explicit bypass and must not be set in production. Local `astro dev` does not skip the session check.
- Jobs Worker `/run` stays on `RUN_SECRET`. Better Auth secrets are not placed on that Worker.
- Cloudflare Access is no longer the admin gate. The self-hosted Access application for this site is removed after this build is in production. Do not delete shared Access policies or other applications.

## Consequences

- Auth tables (`user`, `session`, `account`, `verification`, `rate_limit`) live in `wannabe-jaxa-db` (and the preview database).
- Removing an email from `ADMIN_EMAILS` blocks `/admin` on the next request even if a session cookie remains.
- [ADR-20260923-1](./ADR-20260923-1-runtime-d1-sot.md) still owns the catalog / news / proposals SoT. Its Access decision is superseded here.

## Alternatives considered

- Keep Cloudflare Access in front of `/admin` — rejected; operator login should be the app session, not an edge IdP.
- Open registration with a later role grant — rejected; only listed operator emails may exist.
- Better Auth admin plugin (impersonation, ban, user admin API) — rejected; a `role` field is enough and avoids extra auth endpoints.

## Related

- [REQ-20260923-1-admin-runtime-sot.md](./REQ-20260923-1-admin-runtime-sot.md)
- [VER-20260923-1-admin-and-d1.md](./VER-20260923-1-admin-and-d1.md)
- [ADR-20260923-1-runtime-d1-sot.md](./ADR-20260923-1-runtime-d1-sot.md)
