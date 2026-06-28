import type { VNode } from "preact"

import { returnQueue } from "../api/client"
import type { AppState } from "../api/types"
import { MoviePoster } from "../components/MoviePoster"
import { replaceAppState } from "../state/app-state"
import css from "./QueueRoute.module.css"

export function QueueRoute(props: { state: AppState }): VNode {
	return (
		<queue-route className={css.class}>
			<section>
				<h1>Queue</h1>
				<turn-list>
					{props.state.turnOrder.map((entry) => (
						<span
							aria-current={entry.isCurrent ? `step` : undefined}
							key={entry.id}
						>
							{entry.user.displayName}
						</span>
					))}
				</turn-list>
			</section>
			<queue-list>
				{props.state.queue.map((entry, index) => (
					<article key={entry.id}>
						<strong>{index === 0 ? `Deck` : index.toString()}</strong>
						<MoviePoster movie={entry.movie} />
						<queue-copy>
							<h2>{entry.movie.title}</h2>
							<p>
								{entry.status.replaceAll(`_`, ` `)} by{` `}
								{entry.addedBy.displayName}
							</p>
							<button
								onClick={() => {
									void returnQueue(entry.id).then(replaceAppState)
								}}
								type="button"
							>
								Return
							</button>
						</queue-copy>
					</article>
				))}
			</queue-list>
		</queue-route>
	)
}
