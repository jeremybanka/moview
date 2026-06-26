# Moview Full App Implementation Plan

## Summary
Build Moview as a full-stack Bun workspace app: Astro/Preact frontend, Bun backend with oRPC, Drizzle over Bun SQLite, TMDB movie enrichment, two auth modes, and a Celilo deployment module with end-to-end deployment validation.

The first completed review target is a locally usable full app covering the README stories, plus deployable Celilo packaging and E2E smoke coverage.

## Key Changes

- Replace the starter UI with a real app shell:
  - Group switcher, pool, personal view, queue, turn order, history, and review flow.
  - Use Preact components and CSS modules following the local `lasertag` conventions.
  - Avoid a marketing landing page; first screen is the usable app.

- Add backend API and domain model:
  - Users, groups, memberships, invites, movies, advocates, queue entries, turn-order entries, movie-night sessions, group reviews, and individual reviews.
  - oRPC procedures for auth/session, groups/invites, TMDB search/enrichment, pool operations, advocacy, queue moves, turn order, movie-night completion, reviews, and history sorting.
  - Rank logic lives on `advocates.rank`; queue ordering is separate and supports insert at on-deck, second position, return to pool, and reorder.

- Add persistence:
  - Drizzle schema and migrations for Bun SQLite.
  - Use uniqueness constraints for:
    - group/movie/advocate number
    - group/user/rank
    - one group review per user/group/movie/night
    - one individual review per user/movie/night
  - Store TMDB metadata locally after enrichment, with manual title/year/image/description fallback.

- Add two auth modes:
  - `AUTH_MODE=dev`: selectable seeded/dev users for local review.
  - `AUTH_MODE=authentik`: OIDC login against Authentik for Celilo deployment.
  - Same internal user/session model in both modes so app behavior does not fork.

- Add TMDB integration:
  - `TMDB_API_KEY` secret/config value.
  - Search by title, import selected movie metadata, cache title/year/description/poster path/source id.
  - If TMDB is unavailable or no key is configured in dev, allow manual movie creation.

- Add Celilo deployment:
  - Create a `manifest.yml` app module with `celilo_contract: "1.0"`, `version_source: { kind: changeset }`, one app-system LXC, required `public_web` and `idp` capabilities, and secrets for TMDB and admin/bootstrap credentials.
  - Add lifecycle hooks for install, configure, start/restart, backup/restore SQLite data, and health check.
  - Configure Caddy/public web routing for the DOMAIN_NAME that the celilo module asks the user to configure.
  - Configure Authentik OIDC client from Celilo-provided IDP capability.
  - Bootstrap smoke-test user and first admin account; expose the generated admin password to the operator through Celilo secrets/output.

## Public Interfaces

- Environment/config:
  - `AUTH_MODE=dev|authentik`
  - `DATABASE_URL` or `MOVIEW_DB_PATH` for SQLite
  - `TMDB_API_KEY`
  - `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`
  - `APP_ORIGIN`

- Main API groups:
  - `auth.*`
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
  - Permission checks for group membership.

- Backend/API tests:
  - Dev auth session creation.
  - Group creation and invite acceptance.
  - Duplicate movie advocacy flow.
  - TMDB success, no-result, and manual fallback flows.
  - History sorting by `date_watched`, `goodness_of_pick`, and rating.

- Frontend checks:
  - Build with `bun run build`.
  - Exercise core user flows in dev mode with seeded Jeremy, Moira, Peter, and Bug.
  - Responsive checks for pool, queue, review summary, and history views.

- Celilo/E2E:
  - Validate module with `celilo module check .`.
  - Deploy in `@celilo/e2e` full-stack topology with public web and IDP.
  - Confirm `https://www.moview.com` serves over the simulated public path.
  - Log in as smoke-test user through Authentik.
  - Create group, add/import movie, queue it, complete reviews, and verify history.

## Assumptions

- Full README scope is in scope, including Celilo deployment and E2E validation.
- TMDB is the initial metadata provider.
- SQLite is the production database for the Celilo-deployed app unless later changed.
- Dev mode may seed Jeremy, Moira, Peter, and Bug for fast review.
- Authentik mode is required for deployed use; dev auth is local-only.
- Domain target is `www.moview.com`; actual registrar/DNS operator access is handled outside the app code but validated through Celilo where possible.
