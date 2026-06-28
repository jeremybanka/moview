import type { VNode } from "preact"

import type { AppState } from "../api/types"
import css from "./MetricStrip.module.css"

export function MetricStrip(props: { state: AppState }): VNode {
	const currentTurn =
		props.state.turnOrder.find((entry) => entry.isCurrent)?.user.displayName ??
		`Unassigned`

	return (
		<metric-strip className={css.class}>
			<article>
				<span>Pool</span>
				<strong>{props.state.pool.length}</strong>
			</article>
			<article>
				<span>Queue</span>
				<strong>{props.state.queue.length}</strong>
			</article>
			<article>
				<span>Turn</span>
				<strong>{currentTurn}</strong>
			</article>
		</metric-strip>
	)
}
