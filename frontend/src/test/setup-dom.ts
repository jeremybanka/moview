import { Window } from "happy-dom"

export function installDom(url = `http://localhost/pool`): Window {
	const window = new Window({ url })
	const globalObject = globalThis as typeof globalThis & {
		[key: string]: unknown
	}

	for (const key of [
		`window`,
		`document`,
		`history`,
		`location`,
		`navigator`,
		`HTMLElement`,
		`HTMLAnchorElement`,
		`HTMLButtonElement`,
		`HTMLFormElement`,
		`HTMLInputElement`,
		`HTMLSelectElement`,
		`HTMLTextAreaElement`,
		`Event`,
		`InputEvent`,
		`MouseEvent`,
		`SubmitEvent`,
		`Node`,
		`Text`,
		`MutationObserver`,
		`Response`,
		`Request`,
		`Headers`,
		`URL`,
		`URLSearchParams`,
	]) {
		globalObject[key] = window[key as keyof Window]
	}

	return window
}
