import type { VNode } from "preact"
import { useEffect, useState } from "preact/hooks"

import { getRuntimeConfig, hasAuthConfig } from "../api/runtime-config"
import type { AppState } from "../api/types"
import css from "./LoginRoute.module.css"

export function LoginRoute(props: { state?: AppState }): VNode {
	const [status, setStatus] = useState(``)

	useEffect(() => {
		const url = new URL(window.location.href)
		const code = url.searchParams.get(`code`)
		if (!code || !hasAuthConfig()) {
			return
		}
		void exchangeCode(code)
			.then(() => {
				window.history.replaceState(null, ``, `/pool`)
				window.location.assign(`/pool`)
			})
			.catch((error) => {
				setStatus(error instanceof Error ? error.message : String(error))
			})
	}, [])

	if (hasAuthConfig()) {
		return (
			<login-route className={css.class}>
				<h1>Moview</h1>
				<p>{status || `Sign in`}</p>
				<button onClick={() => void startLogin()}>Authentik</button>
			</login-route>
		)
	}

	return (
		<login-route className={css.class}>
			<h1>Dev Login</h1>
			<p>{props.state?.currentUser.displayName ?? `Moview`}</p>
			<span>auth bypass active</span>
		</login-route>
	)
}

async function startLogin(): Promise<void> {
	const config = requireAuthConfig()
	const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)))
	const challenge = base64Url(
		new Uint8Array(
			await crypto.subtle.digest(`SHA-256`, new TextEncoder().encode(verifier)),
		),
	)
	localStorage.setItem(`moviewPkceVerifier`, verifier)

	const authUrl = new URL(`/application/o/authorize/`, config.AUTHENTIK_AUTH_URL)
	authUrl.searchParams.set(`client_id`, config.AUTHENTIK_CLIENT_ID)
	authUrl.searchParams.set(`code_challenge`, challenge)
	authUrl.searchParams.set(`code_challenge_method`, `S256`)
	authUrl.searchParams.set(`redirect_uri`, `${window.location.origin}/login`)
	authUrl.searchParams.set(`response_type`, `code`)
	authUrl.searchParams.set(`scope`, `openid profile email groups`)
	window.location.assign(authUrl.toString())
}

async function exchangeCode(code: string): Promise<void> {
	const config = requireAuthConfig()
	const verifier = localStorage.getItem(`moviewPkceVerifier`)
	if (!verifier) {
		throw new Error(`Missing login verifier.`)
	}

	const tokenUrl = new URL(`/application/o/token/`, config.AUTHENTIK_AUTH_URL)
	const body = new URLSearchParams({
		client_id: config.AUTHENTIK_CLIENT_ID,
		code,
		code_verifier: verifier,
		grant_type: `authorization_code`,
		redirect_uri: `${window.location.origin}/login`,
	})
	const response = await fetch(tokenUrl, {
		body,
		headers: { "content-type": `application/x-www-form-urlencoded` },
		method: `POST`,
	})
	if (!response.ok) {
		throw new Error(`Login failed with ${response.status}.`)
	}
	const token = (await response.json()) as { access_token?: string }
	if (!token.access_token) {
		throw new Error(`Login response did not include an access token.`)
	}
	localStorage.setItem(`moviewAccessToken`, token.access_token)
	localStorage.removeItem(`moviewPkceVerifier`)
}

function requireAuthConfig(): Required<
	Pick<
		ReturnType<typeof getRuntimeConfig>,
		`AUTHENTIK_AUTH_URL` | `AUTHENTIK_CLIENT_ID` | `AUTHENTIK_PROVIDER_SLUG`
	>
> {
	const config = getRuntimeConfig()
	if (
		!config.AUTHENTIK_AUTH_URL ||
		!config.AUTHENTIK_CLIENT_ID ||
		!config.AUTHENTIK_PROVIDER_SLUG
	) {
		throw new Error(`Auth is not configured.`)
	}
	return {
		AUTHENTIK_AUTH_URL: config.AUTHENTIK_AUTH_URL,
		AUTHENTIK_CLIENT_ID: config.AUTHENTIK_CLIENT_ID,
		AUTHENTIK_PROVIDER_SLUG: config.AUTHENTIK_PROVIDER_SLUG,
	}
}

function base64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll(`+`, `-`)
		.replaceAll(`/`, `_`)
		.replaceAll(`=`, ``)
}
