import { env } from "../env"

export interface AuthContext {
	mode: `dev` | `authentik`
	userId: string
	groups: string[]
}

function parseJwtPayload(token: string): Record<string, unknown> {
	const payload = token.split(`.`)[1]
	if (!payload) {
		throw new Error(`Access JWT is missing a payload`)
	}
	return JSON.parse(
		Buffer.from(payload, `base64url`).toString(`utf8`),
	) as Record<string, unknown>
}

export function authContextFromRequest(request: Request): AuthContext {
	if (env.MOVIEW_MODE === `dev`) {
		return { groups: [`moview-friends`], mode: `dev`, userId: `user-jeremy` }
	}
	const header = request.headers.get(`authorization`)
	if (!header?.startsWith(`Bearer `)) {
		throw new Response(`Missing Access JWT`, { status: 401 })
	}
	const claims = parseJwtPayload(header.slice(`Bearer `.length))
	const subject = String(claims.sub ?? ``)
	const groupClaim = claims[env.AUTHENTIK_GROUP_CLAIM]
	const groups = Array.isArray(groupClaim) ? groupClaim.map(String) : []
	if (!subject || groups.length === 0) {
		throw new Response(`Access JWT lacks subject or Authentik group claims`, {
			status: 403,
		})
	}
	return { groups, mode: `authentik`, userId: subject }
}

export function assertGroupAccess(
	auth: AuthContext,
	authentikGroup: string,
): void {
	if (auth.mode === `dev`) {
		return
	}
	if (!auth.groups.includes(authentikGroup)) {
		throw new Response(`Forbidden`, { status: 403 })
	}
}
