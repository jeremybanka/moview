import type { MoviewSnapshot } from "./state"

export const apiBase = typeof window === `undefined` ? `` : window.location.origin.replace(`:4321`, `:3000`)

export async function postSnapshot(path: string, body: unknown): Promise<MoviewSnapshot | null> {
	try {
		const response = await fetch(`${apiBase}${path}`, {
			body: JSON.stringify(body),
			headers: { "content-type": `application/json` },
			method: `POST`,
		})
		return response.ok ? await response.json() as MoviewSnapshot : null
	} catch {
		return null
	}
}

export async function deleteSnapshot(path: string): Promise<MoviewSnapshot | null> {
	try {
		const response = await fetch(`${apiBase}${path}`, { method: `DELETE` })
		return response.ok ? await response.json() as MoviewSnapshot : null
	} catch {
		return null
	}
}
