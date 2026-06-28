import { useI, useO } from "atom.io/react"
import type { JSX, VNode } from "preact"

import type { AppState, ReviewSummary } from "../api/types"
import { MoviePoster } from "../components/MoviePoster"
import { historySortAtom } from "../state/app-state"
import css from "./HistoryRoute.module.css"

export function HistoryRoute(props: { state: AppState }): VNode {
	const sort = useO(historySortAtom)
	const setSort = useI(historySortAtom)
	const history = [...props.state.history].sort((a, b) =>
		compareHistory(a, b, sort),
	)

	function updateSort(event: JSX.TargetedInputEvent<HTMLSelectElement>): void {
		setSort(event.currentTarget.value as `date_watched` | `goodness` | `rating`)
	}

	return (
		<history-route className={css.class}>
			<section>
				<h1>History</h1>
				<label>
					<span>Sort</span>
					<select onInput={updateSort} value={sort}>
						<option value="date_watched">Date watched</option>
						<option value="goodness">Goodness</option>
						<option value="rating">Rating</option>
					</select>
				</label>
			</section>
			<history-list>
				{history.map((summary) => (
					<article key={summary.id}>
						<MoviePoster movie={summary.movie} />
						<history-copy>
							<h2>{summary.movie.title}</h2>
							<p>{summary.dateWatched}</p>
							<score-row>
								<span>Goodness {summary.averageGoodnessOfPick.toFixed(1)}</span>
								<span>Rating {summary.averageRating.toFixed(1)}</span>
							</score-row>
						</history-copy>
					</article>
				))}
			</history-list>
		</history-route>
	)
}

function compareHistory(
	a: ReviewSummary,
	b: ReviewSummary,
	sort: `date_watched` | `goodness` | `rating`,
): number {
	if (sort === `goodness`) {
		return b.averageGoodnessOfPick - a.averageGoodnessOfPick
	}
	if (sort === `rating`) {
		return b.averageRating - a.averageRating
	}
	return b.dateWatched.localeCompare(a.dateWatched)
}
