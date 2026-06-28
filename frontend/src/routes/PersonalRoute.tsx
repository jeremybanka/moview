import type { VNode } from "preact"

import { movePersonalRank } from "../api/client"
import type { AppState, PersonalMovie } from "../api/types"
import { MoviePoster } from "../components/MoviePoster"
import { replaceAppState } from "../state/app-state"
import css from "./PersonalRoute.module.css"

export function PersonalRoute(props: { state: AppState }): VNode {
	const last = props.state.personalPool.at(-1)
	const secondLast = props.state.personalPool.at(-2)

	return (
		<personal-route className={css.class}>
			<section>
				<h1>{props.state.currentUser.displayName}</h1>
				<p>{props.state.personalPool.length} advocated titles</p>
			</section>
			<personal-list>
				{props.state.personalPool.map((entry, index) => (
					<PersonalCard
						entry={entry}
						index={index}
						key={entry.id}
						last={last}
						secondLast={secondLast}
					/>
				))}
			</personal-list>
		</personal-route>
	)
}

function PersonalCard(props: {
	entry: PersonalMovie
	index: number
	last: PersonalMovie | undefined
	secondLast: PersonalMovie | undefined
}): VNode {
	function moveToEnd(): void {
		if (!props.last || props.last.id === props.entry.id) {
			return
		}
		void movePersonalRank({
			advocateId: props.entry.id,
			afterAdvocateId: props.last.id,
		}).then(replaceAppState)
	}

	function moveBetweenFinalPair(): void {
		if (!props.last || !props.secondLast) {
			return
		}
		void movePersonalRank({
			advocateId: props.entry.id,
			afterAdvocateId: props.secondLast.id,
			beforeAdvocateId: props.last.id,
		}).then(replaceAppState)
	}

	return (
		<article>
			<strong>{props.index + 1}</strong>
			<MoviePoster movie={props.entry.movie} />
			<personal-copy>
				<h2>{props.entry.movie.title}</h2>
				<p>rank {formatRank(props.entry.rank)}</p>
				<span>contributed by {props.entry.contributor.displayName}</span>
				<personal-actions>
					<button onClick={moveToEnd} type="button">
						End
					</button>
					<button onClick={moveBetweenFinalPair} type="button">
						Between final pair
					</button>
				</personal-actions>
			</personal-copy>
		</article>
	)
}

function formatRank(rank: number): string {
	return Number.isInteger(rank) ? rank.toFixed(3) : rank.toString()
}
