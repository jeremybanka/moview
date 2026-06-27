import type { JSX as PreactJSX } from "preact"

declare module "preact" {
	namespace JSX {
		interface IntrinsicElements {
			"app-shell": PreactJSX.HTMLAttributes<HTMLElement>
			"status-grid": PreactJSX.HTMLAttributes<HTMLElement>
		}
	}
}
