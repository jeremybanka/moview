# Moview Full App Implementation Plan

## Summary

Build Moview as a full-stack Bun workspace app: Astro/Preact frontend, Bun backend with oRPC, Drizzle over Bun SQLite, TMDB movie enrichment, Authentik-backed group auth for deployed use, dev-mode seed data with auth bypassed entirely, and a Celilo deployment module with end-to-end deployment validation.

The first completed review target is a locally usable full app covering the README stories, plus deployable Celilo packaging and E2E smoke coverage.

## Key Changes

- Replace the starter UI with a real app shell:
  - Group switcher, pool, personal view, queue, turn order, history, and review flow.
  - Use Preact components and CSS modules following the local `lasertag` conventions.
  - Use atom.io exclusively for all frontend state, including local UI state, selected group/user state, derived views, and remote data wrappers.
  - Avoid a marketing landing page; first screen is the usable app.

- Add backend API and domain model:
  - Users, groups, memberships, invites, movies, advocates, queue entries, turn-order entries, movie-night sessions, group reviews, and individual reviews.
  - Groups and memberships are authorized from Authentik group claims in deployed mode.
  - oRPC procedures for groups/invites, TMDB search/enrichment, pool operations, advocacy, queue moves, turn order, movie-night completion, reviews, and history sorting.
  - oRPC does not maintain its own auth or session model. It accepts and validates Access JWTs from the request context in deployed mode.
  - Rank logic lives on `advocates.rank`; queue ordering is separate and supports insert at on-deck, second position, return to pool, and reorder.

- Add persistence:
  - Drizzle schema and generated migrations for Bun SQLite.
  - Never manually modify migration files; create migrations through Drizzle tooling only.
  - Derive Zod schemas and insert/update types from Drizzle tables instead of maintaining parallel handwritten schemas.
  - Use uniqueness constraints for:
    - group/movie/advocate number
    - group/user/rank
    - one group review per user/group/movie/night
    - one individual review per user/movie/night
  - Store TMDB metadata locally after enrichment, with manual title/year/image/description fallback.

- Add auth behavior:
  - Dev mode bypasses auth entirely and includes seed data for local review.
  - Deployed mode uses Authentik groups for authorization.
  - Deployed requests carry Authentik Access JWTs; backend code validates them and maps group claims to Moview membership/permissions.
  - Do not add app-owned sessions, refresh-token storage, cookie session state, or a separate oRPC auth/session API.

- Add TMDB integration:
  - `TMDB_API_KEY` is externally managed by Celilo and consumed through the typed env layer.
  - Search by title, import selected movie metadata, cache title/year/description/poster path/source id.
  - If TMDB is unavailable or no key is configured in dev, allow manual movie creation.

- Add typed env/config access:
  - All internal environment access goes through `t3-oss/env-core` with Zod validation.
  - Env vars are required when the active runtime mode needs them; code should fail clearly rather than treat configuration as unknowable.
  - Secrets and configuration are managed externally by Celilo, not committed defaults, local ad hoc files, or in-app secret editors.

- Add Celilo deployment:
  - Create a `manifest.yml` app module with `celilo_contract: "1.0"`, `version_source: { kind: changeset }`, one app-system LXC, required `public_web` and `idp` capabilities, and secrets for TMDB and admin/bootstrap credentials.
  - Add lifecycle hooks for install, configure, start/restart, backup/restore SQLite data, and health check.
  - Configure Caddy/public web routing for the DOMAIN_NAME that the celilo module asks the user to configure.
  - Configure Authentik OIDC client from Celilo-provided IDP capability.
  - Configure required Authentik groups through the IDP capability and map those groups to app permissions.
  - Bootstrap smoke-test identity/group membership through Celilo-managed configuration and secrets where needed.

## Public Interfaces

- Environment/config:
  - Accessed only through the app env module built with `t3-oss/env-core` and Zod.
  - `MOVIEW_MODE=dev|authentik`
  - `DATABASE_URL` or `MOVIEW_DB_PATH` for SQLite
  - `TMDB_API_KEY`
  - `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URI`, `OIDC_CLIENT_ID`, `OIDC_REDIRECT_URI`
  - `AUTHENTIK_GROUP_CLAIM`
  - `APP_ORIGIN`
  - Celilo owns all deployed secret/config values.

- Main API groups:
  - `groups.*`
  - `invites.*`
  - `movies.*`
  - `pool.*`
  - `queue.*`
  - `turnOrder.*`
  - `reviews.*`
  - `history.*`

- Main routes/views:
  - `/` active group dashboard
  - `/groups/:groupId/pool`
  - `/groups/:groupId/personal`
  - `/groups/:groupId/queue`
  - `/groups/:groupId/turns`
  - `/groups/:groupId/review/:movieNightId`
  - `/groups/:groupId/history`

## Test Plan

- Unit tests:
  - Advocate numbering and contributor behavior.
  - Personal rank insertion and move-to-end math.
  - Queue insertion at on-deck/second/upcoming positions.
  - Returning queued movies to pool.
  - Review aggregation and readiness status.
  - Permission checks from Authentik group claims.
  - Env schema validation with mode-specific required variables.

- Backend/API tests:
  - Dev mode skips auth checks and serves seeded data.
  - Access JWT validation and Authentik group mapping in deployed mode.
  - Group creation and invite acceptance.
  - Duplicate movie advocacy flow.
  - TMDB success, no-result, and manual fallback flows.
  - History sorting by `date_watched`, `goodness_of_pick`, and rating.

- Frontend checks:
  - Build with `bun run build`.
  - Verify frontend state uses atom.io exclusively, with no React/Preact context or ad hoc global stores for app state.
  - Exercise core user flows in dev mode with seeded Jeremy, Moira, Peter, and Bug.
  - Responsive checks for pool, queue, review summary, and history views.

- Celilo/E2E:
  - Validate module with `celilo module check .`.
  - Deploy in `@celilo/e2e` full-stack topology with public web and IDP.
  - Confirm `https://www.moview.com` serves over the simulated public path.
  - Log in as smoke-test user through Authentik and confirm group-derived access.
  - Create group, add/import movie, queue it, complete reviews, and verify history.

## Assumptions

- Full README scope is in scope, including Celilo deployment and E2E validation.
- TMDB is the initial metadata provider.
- SQLite is the production database for the Celilo-deployed app unless later changed.
- Dev mode seeds Jeremy, Moira, Peter, and Bug for fast review and bypasses auth entirely.
- Authentik groups are required for deployed authorization.
- Access JWTs are the only deployed auth/session input to oRPC.
- Drizzle owns migration generation; Zod schemas and insert/update types are derived from Drizzle tables.
- Celilo owns all deployed secrets and configuration.
- Domain target is `www.moview.com`; actual registrar/DNS operator access is handled outside the app code but validated through Celilo where possible.
