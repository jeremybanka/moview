import { useI, useO } from "atom.io/react"
import type { JSX, VNode } from "preact"

import { submitReview } from "../api/client"
import type { AppState, ReviewSummary } from "../api/types"
import { MoviePoster } from "../components/MoviePoster"
import {
	replaceAppState,
	reviewFeelingsAtom,
	reviewGoodnessAtom,
	reviewRatingAtom,
} from "../state/app-state"
import css from "./ReviewsRoute.module.css"

export function ReviewsRoute(props: { state: AppState }): VNode {
	const target = props.state.history[0]
	const goodness = useO(reviewGoodnessAtom)
	const rating = useO(reviewRatingAtom)
	const feelings = useO(reviewFeelingsAtom)
	const setGoodness = useI(reviewGoodnessAtom)
	const setRating = useI(reviewRatingAtom)
	const setFeelings = useI(reviewFeelingsAtom)

	function submit(event: JSX.TargetedSubmitEvent<HTMLFormElement>): void {
		event.preventDefault()
		if (!target) {
			return
		}
		void submitReview({
			feelings,
			goodnessOfPick: goodness,
			groupId: props.state.activeGroup.id,
			movieId: target.movie.id,
			rating,
			userId: props.state.currentUser.id,
		}).then(replaceAppState)
	}

	function updateGoodness(
		event: JSX.TargetedInputEvent<HTMLInputElement>,
	): void {
		setGoodness(event.currentTarget.valueAsNumber)
	}

	function updateRating(event: JSX.TargetedInputEvent<HTMLInputElement>): void {
		setRating(event.currentTarget.valueAsNumber)
	}

	function updateFeelings(
		event: JSX.TargetedInputEvent<HTMLTextAreaElement>,
	): void {
		setFeelings(event.currentTarget.value)
	}

	if (!target) {
		return (
			<reviews-route className={css.class}>
				<section>
					<h1>Reviews</h1>
					<p>No watched movies yet.</p>
				</section>
			</reviews-route>
		)
	}

	return (
		<reviews-route className={css.class}>
			<section>
				<h1>Reviews</h1>
				<MoviePoster movie={target.movie} />
				<review-target>
					<h2>{target.movie.title}</h2>
					<p>{target.dateWatched}</p>
				</review-target>
			</section>
			<form onSubmit={submit}>
				<label>
					<span>Goodness</span>
					<input
						max="10"
						min="-10"
						onInput={updateGoodness}
						type="number"
						value={goodness}
					/>
				</label>
				<label>
					<span>Rating</span>
					<input
						max="10"
						min="-10"
						onInput={updateRating}
						type="number"
						value={rating}
					/>
				</label>
				<label>
					<span>Feelings</span>
					<textarea onInput={updateFeelings} rows={4} value={feelings} />
				</label>
				<button type="submit">Done</button>
			</form>
			<ReviewSummaryPanel summary={target} />
		</reviews-route>
	)
}

function ReviewSummaryPanel(props: { summary: ReviewSummary }): VNode {
	return (
		<review-summary>
			<score-row>
				<strong>{props.summary.averageRating.toFixed(1)}</strong>
				<span>average rating</span>
				<strong>{props.summary.averageGoodnessOfPick.toFixed(1)}</strong>
				<span>goodness</span>
			</score-row>
			<ready-list>
				{props.summary.ready.map((entry) => (
					<span data-ready={entry.ready ? `true` : `false`} key={entry.user.id}>
						{entry.user.displayName}
					</span>
				))}
			</ready-list>
			<feelings-list>
				{props.summary.individualRatings.map((entry) => (
					<article key={entry.user.id}>
						<strong>{entry.user.displayName}</strong>
						<p>{entry.feelings ?? `No feelings recorded.`}</p>
					</article>
				))}
			</feelings-list>
		</review-summary>
	)
}
