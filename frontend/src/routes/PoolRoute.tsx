import { useI, useO } from "atom.io/react"
import type { JSX, VNode } from "preact"

import { addMovie, placeQueue } from "../api/client"
import type { AppState, PoolMovie } from "../api/types"
import { MoviePoster } from "../components/MoviePoster"
import { addMovieTitleAtom, replaceAppState } from "../state/app-state"
import css from "./PoolRoute.module.css"

export function PoolRoute(props: { state: AppState }): VNode {
	const title = useO(addMovieTitleAtom)
	const setTitle = useI(addMovieTitleAtom)

	function submitMovie(event: JSX.TargetedSubmitEvent<HTMLFormElement>): void {
		event.preventDefault()
		const trimmed = title.trim()
		if (!trimmed) {
			return
		}
		void addMovie({
			groupId: props.state.activeGroup.id,
			title: trimmed,
			userId: props.state.currentUser.id,
		}).then((nextState) => {
			replaceAppState(nextState)
			setTitle(``)
		})
	}

	function updateTitle(event: JSX.TargetedInputEvent<HTMLInputElement>): void {
		setTitle(event.currentTarget.value)
	}

	return (
		<pool-route className={css.class}>
			<section>
				<h1>{props.state.activeGroup.name} Pool</h1>
				<form onSubmit={submitMovie}>
					<label>
						<span>Movie title</span>
						<input
							autoComplete="off"
							onInput={updateTitle}
							placeholder="Tampopo"
							type="text"
							value={title}
						/>
					</label>
					<button disabled={!title.trim()} type="submit">
						Add
					</button>
				</form>
			</section>
			<movie-grid>
				{props.state.pool.map((poolMovie) => (
					<MovieCard
						key={poolMovie.groupMovieId}
						poolMovie={poolMovie}
						state={props.state}
					/>
				))}
			</movie-grid>
		</pool-route>
	)
}

function MovieCard(props: { poolMovie: PoolMovie; state: AppState }): VNode {
	function queue(placement: `end` | `on_deck` | `second`): void {
		void placeQueue({
			groupId: props.state.activeGroup.id,
			movieId: props.poolMovie.movie.id,
			placement,
			userId: props.state.currentUser.id,
		}).then(replaceAppState)
	}

	return (
		<article>
			<MoviePoster movie={props.poolMovie.movie} />
			<movie-card-body>
				<h2>{props.poolMovie.movie.title}</h2>
				<p>{props.poolMovie.movie.description}</p>
				<movie-meta>
					<span>{props.poolMovie.movie.releasedYear ?? `Year open`}</span>
					<span>{props.poolMovie.movie.metadataSource}</span>
				</movie-meta>
				<advocate-row>
					<strong>{props.poolMovie.contributor.displayName}</strong>
					{props.poolMovie.advocates.map((advocate) => (
						<span key={advocate.id}>
							#{advocate.advocateNumber} {advocate.user.faceTag}
						</span>
					))}
				</advocate-row>
				<action-row>
					<button
						onClick={() => {
							queue(`on_deck`)
						}}
						type="button"
					>
						On deck
					</button>
					<button
						onClick={() => {
							queue(`second`)
						}}
						type="button"
					>
						Second
					</button>
					<button
						onClick={() => {
							queue(`end`)
						}}
						type="button"
					>
						End
					</button>
				</action-row>
			</movie-card-body>
		</article>
	)
}
