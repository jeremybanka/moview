import { useI, useO } from "atom.io/react"
import { useEffect, useMemo, useState } from "preact/hooks"

import css from "./AppShell.module.css"
import {
	activeViewAtom,
	historySortAtom,
	personalMoviesSelector,
	poolMoviesSelector,
	selectedUserIdAtom,
	snapshotAtom,
	sortedHistorySelector,
	type MoviewSnapshot,
} from "./state"

const apiBase = typeof window === `undefined` ? `` : window.location.origin.replace(`:4321`, `:3000`)

async function postSnapshot(path: string, body: unknown): Promise<MoviewSnapshot | null> {
	try {
		const response = await fetch(`${apiBase}${path}`, {
			body: JSON.stringify(body),
			headers: { "content-type": `application/json` },
			method: `POST`,
		})
		return response.ok ? await response.json() as MoviewSnapshot : null
	} catch {
		return null
	}
}

function average(values: Array<number | null>): string {
	const real = values.filter((value): value is number => typeof value === `number`)
	if (real.length === 0) {
		return `-`
	}
	return (real.reduce((sum, value) => sum + value, 0) / real.length).toFixed(1)
}

export default function AppShell() {
	const snapshot = useO(snapshotAtom)
	const setSnapshot = useI(snapshotAtom)
	const selectedUserId = useO(selectedUserIdAtom)
	const setSelectedUserId = useI(selectedUserIdAtom)
	const activeView = useO(activeViewAtom)
	const setActiveView = useI(activeViewAtom)
	const historySort = useO(historySortAtom)
	const setHistorySort = useI(historySortAtom)
	const poolMovies = useO(poolMoviesSelector)
	const personalMovies = useO(personalMoviesSelector)
	const sortedHistory = useO(sortedHistorySelector)
	const [title, setTitle] = useState(``)
	const [year, setYear] = useState(``)

	useEffect(() => {
		void fetch(`${apiBase}/api/bootstrap`)
			.then((response) => response.ok ? response.json() : null)
			.then((data: MoviewSnapshot | null) => {
				if (data?.selectedGroupId) {
					setSnapshot(data)
				}
			})
			.catch(() => {})
	}, [setSnapshot])

	const selectedGroup = snapshot.groups.find((group) => group.id === snapshot.selectedGroupId) ?? snapshot.groups[0]
	const selectedUser = snapshot.members.find((member) => member.id === selectedUserId) ?? snapshot.members[0]
	const nextTurn = snapshot.turnOrder[0]
	const nextTurnUser = snapshot.members.find((member) => member.id === nextTurn?.userId)
	const reviewSummary = useMemo(() => ({
		goodness: average(snapshot.history.map((entry) => entry.goodnessOfPick)),
		rating: average(snapshot.history.map((entry) => entry.rating)),
		ready: new Set(snapshot.history.map((entry) => entry.reviewerId).filter(Boolean)).size,
	}), [snapshot.history])

	async function addManualMovie() {
		if (!title.trim()) {
			return
		}
		const next = await postSnapshot(`/api/groups/${snapshot.selectedGroupId}/movies`, {
			title: title.trim(),
			userId: selectedUser?.id,
			year: year ? Number(year) : undefined,
		})
		if (next) {
			setSnapshot(next)
		} else {
			const movieId = `local-${Date.now()}`
			setSnapshot((current) => ({
				...current,
				advocates: [...current.advocates, {
					advocateNumber: 1,
					id: `adv-${movieId}`,
					movieId,
					rank: current.advocates.filter((advocate) => advocate.userId === selectedUser?.id).length + 1,
					userId: selectedUser?.id ?? `user-jeremy`,
				}],
				movies: [...current.movies, {
					description: `Manual fallback entry.`,
					id: movieId,
					posterPath: null,
					title: title.trim(),
					year: year ? Number(year) : null,
				}],
			}))
		}
		setTitle(``)
		setYear(``)
	}

	async function queueMovie(movieId: string, placement: `on-deck` | `second` | `end`) {
		const next = await postSnapshot(`/api/groups/${snapshot.selectedGroupId}/queue`, {
			movieId,
			placement,
			userId: selectedUser?.id,
		})
		if (next) {
			setSnapshot(next)
		}
	}

	return (
		<moview-app className={css.class}>
			<header>
				<nav aria-label="Moview sections">
					<strong>Moview</strong>
					{([`pool`, `personal`, `queue`, `turns`, `review`, `history`] as const).map((view) => (
						<button aria-pressed={activeView === view} key={view} type="button" onClick={() => setActiveView(view)}>
							{view}
						</button>
					))}
				</nav>
				<form>
					<label>
						Group
						<select value={selectedGroup?.id} onInput={(event) => {
							const groupId = event.currentTarget.value
							setSnapshot((current) => ({ ...current, selectedGroupId: groupId }))
						}}>
							{snapshot.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
						</select>
					</label>
					<label>
						Person
						<select value={selectedUser?.id} onInput={(event) => setSelectedUserId(event.currentTarget.value)}>
							{snapshot.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
						</select>
					</label>
				</form>
			</header>
			<main>
				<section aria-label="Group overview">
					<article>
						<span>Active group</span>
						<strong>{selectedGroup?.name}</strong>
						<small>{snapshot.members.length} members via {selectedGroup?.authentikGroup}</small>
					</article>
					<article>
						<span>Next turn</span>
						<strong>{nextTurnUser?.displayName}</strong>
						<small>Turn order is advisory, queue is separate</small>
					</article>
					<article>
						<span>Review status</span>
						<strong>{reviewSummary.ready}/{snapshot.members.length}</strong>
						<small>Avg rating {reviewSummary.rating}, pick {reviewSummary.goodness}</small>
					</article>
				</section>

				{activeView === `pool` ? (
					<section aria-label="Movie pool">
						<form onSubmit={(event) => {
							event.preventDefault()
							void addManualMovie()
						}}>
							<input aria-label="Movie title" placeholder="Movie title" value={title} onInput={(event) => setTitle(event.currentTarget.value)} />
							<input aria-label="Year" inputMode="numeric" placeholder="Year" value={year} onInput={(event) => setYear(event.currentTarget.value)} />
							<button type="submit">Add</button>
						</form>
						<movie-grid>
							{poolMovies.map((movie) => (
								<article key={movie.id}>
									{movie.posterPath ? <img alt="" src={movie.posterPath} /> : <movie-poster>{movie.title.slice(0, 2)}</movie-poster>}
									<header>
										<h2>{movie.title}</h2>
										<span>{movie.year ?? `Manual`}</span>
									</header>
									<p>{movie.description}</p>
									<footer>
										<span>{movie.advocates.length} advocates</span>
										<button type="button" onClick={() => void queueMovie(movie.id, `on-deck`)}>On deck</button>
										<button type="button" onClick={() => void queueMovie(movie.id, `second`)}>Second</button>
									</footer>
								</article>
							))}
						</movie-grid>
					</section>
				) : null}

				{activeView === `personal` ? (
					<section aria-label="Personal pool">
						<ol>
							{personalMovies.map((entry) => entry.movie ? (
								<li key={entry.advocate.id}>
									<strong>{entry.movie.title}</strong>
									<span>Rank {entry.advocate.rank.toFixed(3)}</span>
									<button type="button" onClick={() => void queueMovie(entry.movie!.id, `on-deck`)}>Pick</button>
								</li>
							) : null)}
						</ol>
					</section>
				) : null}

				{activeView === `queue` ? (
					<section aria-label="Upcoming queue">
						<ol>
							{snapshot.queue.map((entry) => {
								const movie = snapshot.movies.find((candidate) => candidate.id === entry.movieId)
								const user = snapshot.members.find((member) => member.id === entry.addedByUserId)
								return (
									<li key={entry.id}>
										<strong>{movie?.title}</strong>
										<span>Added by {user?.displayName}</span>
										<button type="button" onClick={() => {
											setSnapshot((current) => ({ ...current, queue: current.queue.filter((queued) => queued.id !== entry.id) }))
										}}>Return</button>
									</li>
								)
							})}
						</ol>
					</section>
				) : null}

				{activeView === `turns` ? (
					<section aria-label="Turn order">
						<ol>
							{snapshot.turnOrder.map((entry) => {
								const user = snapshot.members.find((member) => member.id === entry.userId)
								return <li key={entry.id}><strong>{user?.displayName}</strong><span>Position {entry.position}</span></li>
							})}
						</ol>
					</section>
				) : null}

				{activeView === `review` ? (
					<section aria-label="Review summary">
						<article>
							<h2>Everything Everywhere All at Once</h2>
							<strong>{reviewSummary.ready}/{snapshot.members.length} ready</strong>
							<p>Average individual rating {reviewSummary.rating}; average goodness of pick {reviewSummary.goodness}.</p>
						</article>
						{snapshot.history.map((entry) => {
							const user = snapshot.members.find((member) => member.id === entry.reviewerId)
							return <blockquote key={`${entry.movieNightId}-${entry.reviewerId}`}><p>{entry.feelings}</p><cite>{user?.displayName}</cite></blockquote>
						})}
					</section>
				) : null}

				{activeView === `history` ? (
					<section aria-label="History">
						<form>
							<label>
								Sort
								<select value={historySort} onInput={(event) => setHistorySort(event.currentTarget.value as typeof historySort)}>
									<option value="date_watched">date watched</option>
									<option value="goodness_of_pick">goodness of pick</option>
									<option value="rating">rating</option>
								</select>
							</label>
						</form>
						<ol>
							{sortedHistory.map((entry) => {
								const user = snapshot.members.find((member) => member.id === entry.reviewerId)
								return (
									<li key={`${entry.movieNightId}-${entry.reviewerId}`}>
										<strong>{entry.title} {entry.year ? `(${entry.year})` : ``}</strong>
										<span>{entry.dateWatched} by {user?.displayName}: rating {entry.rating}, pick {entry.goodnessOfPick}</span>
									</li>
								)
							})}
						</ol>
					</section>
				) : null}
			</main>
		</moview-app>
	)
}
