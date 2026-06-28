export type MoviewRuntimeConfig = {
	AUTHENTIK_AUTH_URL?: string
	AUTHENTIK_CLIENT_ID?: string
	AUTHENTIK_PROVIDER_SLUG?: string
	MOVIEW_API_ORIGIN?: string
}

declare global {
	interface Window {
		__MOVIEW_CONFIG__?: MoviewRuntimeConfig
	}
}

export function getRuntimeConfig(): MoviewRuntimeConfig {
	if (typeof window === `undefined`) {
		return {}
	}
	return window.__MOVIEW_CONFIG__ ?? {}
}

export function hasAuthConfig(): boolean {
	const config = getRuntimeConfig()
	return Boolean(
		config.AUTHENTIK_AUTH_URL &&
		config.AUTHENTIK_CLIENT_ID &&
		config.AUTHENTIK_PROVIDER_SLUG,
	)
}
