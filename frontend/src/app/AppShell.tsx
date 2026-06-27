import type { VNode } from "preact"

import css from "./AppShell.module.css"

const metrics: Array<{ label: string; value: string }> = [
	{ label: `Pool`, value: `0 titles` },
	{ label: `Queue`, value: `0 upcoming` },
	{ label: `Turn`, value: `Unassigned` },
]

export function AppShell(): VNode {
	return (
		<app-shell className={css.class}>
			<header>
				<strong>Moview</strong>
			</header>
			<main>
				<section aria-labelledby="moview-heading">
					<h1 id="moview-heading">Movie Night</h1>
					<status-grid>
						{metrics.map((metric) => (
							<article key={metric.label}>
								<span>{metric.label}</span>
								<strong>{metric.value}</strong>
							</article>
						))}
					</status-grid>
				</section>
			</main>
		</app-shell>
	)
}
