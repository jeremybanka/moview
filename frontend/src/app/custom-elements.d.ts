import type { JSX as PreactJSX } from "preact"

declare module "preact" {
	namespace JSX {
		interface IntrinsicElements {
			"action-row": PreactJSX.HTMLAttributes<HTMLElement>
			"advocate-row": PreactJSX.HTMLAttributes<HTMLElement>
			"app-anchor": PreactJSX.HTMLAttributes<HTMLElement>
			"app-controls": PreactJSX.HTMLAttributes<HTMLElement>
			"app-shell": PreactJSX.HTMLAttributes<HTMLElement>
			"bottom-nav": PreactJSX.HTMLAttributes<HTMLElement>
			"feelings-list": PreactJSX.HTMLAttributes<HTMLElement>
			"group-actions": PreactJSX.HTMLAttributes<HTMLElement>
			"groups-route": PreactJSX.HTMLAttributes<HTMLElement>
			"history-copy": PreactJSX.HTMLAttributes<HTMLElement>
			"history-list": PreactJSX.HTMLAttributes<HTMLElement>
			"history-route": PreactJSX.HTMLAttributes<HTMLElement>
			"loading-state": PreactJSX.HTMLAttributes<HTMLElement>
			"login-route": PreactJSX.HTMLAttributes<HTMLElement>
			"member-list": PreactJSX.HTMLAttributes<HTMLElement>
			"metric-strip": PreactJSX.HTMLAttributes<HTMLElement>
			"movie-card-body": PreactJSX.HTMLAttributes<HTMLElement>
			"status-grid": PreactJSX.HTMLAttributes<HTMLElement>
			"movie-grid": PreactJSX.HTMLAttributes<HTMLElement>
			"movie-meta": PreactJSX.HTMLAttributes<HTMLElement>
			"movie-poster": PreactJSX.HTMLAttributes<HTMLElement>
			"not-found-route": PreactJSX.HTMLAttributes<HTMLElement>
			"personal-actions": PreactJSX.HTMLAttributes<HTMLElement>
			"personal-copy": PreactJSX.HTMLAttributes<HTMLElement>
			"personal-list": PreactJSX.HTMLAttributes<HTMLElement>
			"personal-route": PreactJSX.HTMLAttributes<HTMLElement>
			"pool-route": PreactJSX.HTMLAttributes<HTMLElement>
			"queue-copy": PreactJSX.HTMLAttributes<HTMLElement>
			"queue-list": PreactJSX.HTMLAttributes<HTMLElement>
			"queue-route": PreactJSX.HTMLAttributes<HTMLElement>
			"ready-list": PreactJSX.HTMLAttributes<HTMLElement>
			"review-summary": PreactJSX.HTMLAttributes<HTMLElement>
			"review-target": PreactJSX.HTMLAttributes<HTMLElement>
			"reviews-route": PreactJSX.HTMLAttributes<HTMLElement>
			"score-row": PreactJSX.HTMLAttributes<HTMLElement>
			"turn-list": PreactJSX.HTMLAttributes<HTMLElement>
		}
	}
}
