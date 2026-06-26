#!/usr/bin/env bun
import { writeFile } from "node:fs/promises"

const envFile = [
	`MOVIEW_MODE=authentik`,
	`MOVIEW_DB_PATH=/var/lib/moview/moview.sqlite`,
	`APP_ORIGIN=https://${process.env.DOMAIN_NAME ?? `www.moview.com`}`,
	`AUTHENTIK_GROUP_CLAIM=${process.env.AUTHENTIK_GROUP_CLAIM ?? `groups`}`,
	`OIDC_ISSUER=${process.env.OIDC_ISSUER ?? ``}`,
	`OIDC_AUDIENCE=${process.env.OIDC_AUDIENCE ?? ``}`,
	`OIDC_JWKS_URI=${process.env.OIDC_JWKS_URI ?? ``}`,
	`OIDC_CLIENT_ID=${process.env.OIDC_CLIENT_ID ?? ``}`,
	`OIDC_REDIRECT_URI=${process.env.OIDC_REDIRECT_URI ?? ``}`,
	`TMDB_API_KEY=${process.env.TMDB_API_KEY ?? ``}`,
].join(`\n`)

await writeFile(`/opt/moview/.env`, `${envFile}\n`)
console.log(`Moview runtime configuration written.`)
