# Project Instructions

Consult `./agents.yaml` when working with outside dependencies.

- Use atom.io exclusively for all frontend state.
- Use authentik groups for auth.
- Dev mode has seed data.
- Dev mode bypasses auth entirely.
- orpc does not maintain its own auth/session but uses Access JWTs.
- Never manually modify migrations. That is Drizzle's job.
- Derive Zod schemas and insert/update types from Drizzle tables.
- Always access env internally through `t3-oss/env-core` with Zod for environment variables. Never be cagey about environment variables. They are there. They have to be.
- Any and all secrets and configuration must be managed externally by celilo.
