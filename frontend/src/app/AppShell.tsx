import { useI, useO } from "atom.io/react"
import type { JSX, VNode } from "preact"
import { useEffect, useMemo } from "preact/hooks"

import css from "./AppShell.module.css"
import {
	currentNavItemSelector,
	type CurrentRoute,
	navigate,
	pageTitleSelector,
	type Pathname,
	pathnameAtom,
	routeGroupIdSelector,
	routeMovieIdSelector,
	routeMovieNightIdSelector,
	routeSelector,
} from "./routes"
import {
	addMovieTitleAtom,
	addMovieYearAtom,
	historySortAtom,
	type MoviewSnapshot,
	personalMoviesSelector,
	poolMoviesSelector,
	selectedUserIdAtom,
	snapshotAtom,
	sortedHistorySelector,
} from "./state"

const apiBase = typeof window === `undefined` ? `` : window.location.origin.replace(`:4321`, `:3000`)

type AppAnchorProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, `href`> & {
	href: Pathname
}

function AppAnchor(props: AppAnchorProps): VNode {
	return <a {...props} />
}

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

async function deleteSnapshot(path: string): Promise<MoviewSnapshot | null> {
	try {
		const response = await fetch(`${apiBase}${path}`, { method: `DELETE` })
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

export function AppShell(): VNode {
	const snapshot = useO(snapshotAtom)
	const setSnapshot = useI(snapshotAtom)
	const selectedUserId = useO(selectedUserIdAtom)
	const setSelectedUserId = useI(selectedUserIdAtom)
	const route = useO(routeSelector)
	const pathname = useO(pathnameAtom)
	const groupId = useO(routeGroupIdSelector)
	const currentNavItem = useO(currentNavItemSelector)
	const pageTitle = useO(pageTitleSelector)

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

	useEffect(() => {
		if (pathname === `/` && snapshot.groups[0]) {
			navigate(`/groups/${snapshot.groups[0].id}` as Pathname)
		}
	}, [pathname, snapshot.groups])

	const selectedGroup = snapshot.groups.find((group) => group.id === groupId) ?? snapshot.groups[0]
	const selectedUser = snapshot.members.find((member) => member.id === selectedUserId) ?? snapshot.members[0]

	return (
		<app-shell className={css.class}>
			<header>
				<nav aria-label="Moview sections">
					<AppAnchor href={selectedGroup ? `/groups/${selectedGroup.id}` as Pathname : `/`}>
						<strong>Moview</strong>
					</AppAnchor>
					{selectedGroup ? (
						<app-nav>
							{([
								[`dashboard`, `Dashboard`, `/groups/${selectedGroup.id}`],
								[`pool`, `Pool`, `/groups/${selectedGroup.id}/pool`],
								[`personal`, `Personal`, `/groups/${selectedGroup.id}/personal`],
								[`queue`, `Queue`, `/groups/${selectedGroup.id}/queue`],
								[`turns`, `Turns`, `/groups/${selectedGroup.id}/turns`],
								[`history`, `History`, `/groups/${selectedGroup.id}/history`],
							] as const).map(([item, label, href]) => (
								<AppAnchor aria-current={currentNavItem === item ? `page` : undefined} href={href as Pathname} key={item}>
									{label}
								</AppAnchor>
							))}
						</app-nav>
					) : null}
				</nav>
				<form>
					<label>
						Group
						<select value={selectedGroup?.id} onInput={(event) => navigate(`/groups/${event.currentTarget.value}` as Pathname)}>
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
				<page-heading>
					<h1>{pageTitle}</h1>
					{selectedGroup ? <span>{selectedGroup.name}</span> : null}
				</page-heading>
				<CurrentRoute route={route} />
			</main>
		</app-shell>
	)
}

function CurrentRoute(props: { route: CurrentRoute }): VNode {
	if (props.route === 404) {
		return <NotFoundPage />
	}
	if (props.route.length === 0 || props.route[0] !== `groups`) {
		return <GroupNewPage />
	}
	if (props.route[1] === `new`) {
		return <GroupNewPage />
	}
	switch (props.route[2]) {
		case undefined:
			return <DashboardPage />
		case `pool`:
			if (props.route[3] === `add`) {
				return <AddMoviePage />
			}
			if (props.route[3]) {
				return <MovieDetailPage />
			}
			return <PoolPage />
		case `personal`:
			return <PersonalPage />
		case `queue`:
			return <QueuePage />
		case `turns`:
			return <TurnsPage />
		case `invites`:
			return <InvitesPage />
		case `review`:
			if (props.route[4] === `summary`) {
				return <ReviewSummaryPage />
			}
			return <ReviewPage />
		case `history`:
			return <HistoryPage />
		default:
			return <NotFoundPage />
	}
}

function DashboardPage(): VNode {
	const snapshot = useO(snapshotAtom)
	const groupId = useO(routeGroupIdSelector)
	const nextTurn = snapshot.turnOrder[0]
	const nextTurnUser = snapshot.members.find((member) => member.id === nextTurn?.userId)
	const reviewSummary = useReviewSummary()
	const latestNightId = snapshot.history[0]?.movieNightId
	return (
		<section aria-label="Group dashboard">
			<stat-grid>
				<article>
					<span>Members</span>
					<strong>{snapshot.members.length}</strong>
					<small>Group access comes from membership</small>
				</article>
				<article>
					<span>Next turn</span>
					<strong>{nextTurnUser?.displayName ?? `Unset`}</strong>
					<small>Turn order is advisory</small>
				</article>
				<article>
					<span>Reviews</span>
					<strong>{reviewSummary.ready}/{snapshot.members.length}</strong>
					<small>Avg rating {reviewSummary.rating}</small>
				</article>
			</stat-grid>
			<route-actions>
				<AppAnchor href={`/groups/${groupId}/pool` as Pathname}>Browse pool</AppAnchor>
				<AppAnchor href={`/groups/${groupId}/queue` as Pathname}>Open queue</AppAnchor>
				{latestNightId ? <AppAnchor href={`/groups/${groupId}/review/${latestNightId}` as Pathname}>Review night</AppAnchor> : null}
			</route-actions>
		</section>
	)
}

function GroupNewPage(): VNode {
	return (
		<section aria-label="Create group">
			<form>
				<label>
					Group name
					<input placeholder="Friday Movie Night" />
				</label>
				<button type="button">Create</button>
			</form>
		</section>
	)
}

function PoolPage(): VNode {
	const poolMovies = useO(poolMoviesSelector)
	const groupId = useO(routeGroupIdSelector)
	return (
		<section aria-label="Movie pool">
			<route-actions>
				<AppAnchor href={`/groups/${groupId}/pool/add` as Pathname}>Add movie</AppAnchor>
			</route-actions>
			<movie-grid>
				{poolMovies.map((movie) => (
					<article key={movie.id}>
						{movie.posterPath ? <img alt="" src={movie.posterPath} /> : <movie-poster>{movie.title.slice(0, 2)}</movie-poster>}
						<movie-card-heading>
							<h2>{movie.title}</h2>
							<span>{movie.year ?? `Manual`}</span>
						</movie-card-heading>
						<p>{movie.description}</p>
						<movie-card-actions>
							<span>{movie.advocates.length} advocates</span>
							<AppAnchor href={`/groups/${groupId}/pool/${movie.id}` as Pathname}>Details</AppAnchor>
						</movie-card-actions>
					</article>
				))}
			</movie-grid>
		</section>
	)
}

function AddMoviePage(): VNode {
	const snapshot = useO(snapshotAtom)
	const setSnapshot = useI(snapshotAtom)
	const title = useO(addMovieTitleAtom)
	const setTitle = useI(addMovieTitleAtom)
	const year = useO(addMovieYearAtom)
	const setYear = useI(addMovieYearAtom)
	const selectedUserId = useO(selectedUserIdAtom)
	const groupId = useO(routeGroupIdSelector)

	async function addManualMovie() {
		if (!groupId || !title.trim()) {
			return
		}
		const cleanTitle = title.trim()
		const next = await postSnapshot(`/api/groups/${groupId}/movies`, {
			title: cleanTitle,
			userId: selectedUserId,
			year: year ? Number(year) : undefined,
		})
		if (next) {
			setSnapshot(next)
			const movie = next.movies.find((candidate) => candidate.title === cleanTitle)
			navigate(movie ? `/groups/${groupId}/pool/${movie.id}` as Pathname : `/groups/${groupId}/pool` as Pathname)
		} else {
			const movieId = `local-${Date.now()}`
			setSnapshot((current) => ({
				...current,
				advocates: [...current.advocates, {
					advocateNumber: 1,
					id: `adv-${movieId}`,
					movieId,
					rank: current.advocates.filter((advocate) => advocate.userId === selectedUserId).length + 1,
					userId: selectedUserId,
				}],
				movies: [...current.movies, {
					description: `Manual fallback entry.`,
					id: movieId,
					posterPath: null,
					title: cleanTitle,
					year: year ? Number(year) : null,
				}],
			}))
			navigate(`/groups/${snapshot.selectedGroupId}/pool/${movieId}` as Pathname)
		}
		setTitle(``)
		setYear(``)
	}

	return (
		<section aria-label="Add movie">
			<form onSubmit={(event) => {
				event.preventDefault()
				void addManualMovie()
			}}>
				<label>
					Title
					<input aria-label="Movie title" placeholder="Movie title" value={title} onInput={(event) => setTitle(event.currentTarget.value)} />
				</label>
				<label>
					Year
					<input aria-label="Year" inputMode="numeric" placeholder="Year" value={year} onInput={(event) => setYear(event.currentTarget.value)} />
				</label>
				<button type="submit">Add</button>
			</form>
		</section>
	)
}

function MovieDetailPage(): VNode {
	const snapshot = useO(snapshotAtom)
	const setSnapshot = useI(snapshotAtom)
	const groupId = useO(routeGroupIdSelector)
	const movieId = useO(routeMovieIdSelector)
	const selectedUserId = useO(selectedUserIdAtom)
	const movie = snapshot.movies.find((candidate) => candidate.id === movieId)
	const advocates = snapshot.advocates.filter((advocate) => advocate.movieId === movieId)

	async function queueMovie(placement: `on-deck` | `second` | `end`) {
		if (!groupId || !movieId) {
			return
		}
		const next = await postSnapshot(`/api/groups/${groupId}/queue`, {
			movieId,
			placement,
			userId: selectedUserId,
		})
		if (next) {
			setSnapshot(next)
			navigate(`/groups/${groupId}/queue` as Pathname)
		}
	}

	if (!movie) {
		return <NotFoundPage />
	}
	return (
		<section aria-label="Movie details">
			<article>
				{movie.posterPath ? <img alt="" src={movie.posterPath} /> : null}
				<h2>{movie.title} {movie.year ? `(${movie.year})` : ``}</h2>
				<p>{movie.description}</p>
			</article>
			<route-actions>
				<button type="button" onClick={() => void queueMovie(`on-deck`)}>On deck</button>
				<button type="button" onClick={() => void queueMovie(`second`)}>Second</button>
			</route-actions>
			<ol>
				{advocates.map((advocate) => {
					const user = snapshot.members.find((member) => member.id === advocate.userId)
					return <li key={advocate.id}><strong>{user?.displayName}</strong><span>Advocate #{advocate.advocateNumber}</span></li>
				})}
			</ol>
		</section>
	)
}

function PersonalPage(): VNode {
	const personalMovies = useO(personalMoviesSelector)
	const groupId = useO(routeGroupIdSelector)
	return (
		<section aria-label="Personal pool">
			<ol>
				{personalMovies.map((entry) => (
					<li key={entry.advocate.id}>
						<strong>{entry.movie.title}</strong>
						<span>Rank {entry.advocate.rank.toFixed(3)}</span>
						<AppAnchor href={`/groups/${groupId}/pool/${entry.movie.id}` as Pathname}>Details</AppAnchor>
					</li>
				))}
			</ol>
		</section>
	)
}

function QueuePage(): VNode {
	const snapshot = useO(snapshotAtom)
	const setSnapshot = useI(snapshotAtom)
	const groupId = useO(routeGroupIdSelector)

	async function returnQueueEntry(queueEntryId: string) {
		if (!groupId) {
			return
		}
		const next = await deleteSnapshot(`/api/groups/${groupId}/queue/${queueEntryId}`)
		if (next) {
			setSnapshot(next)
		} else {
			setSnapshot((current) => ({
				...current,
				queue: current.queue.filter((queued) => queued.id !== queueEntryId),
			}))
		}
	}

	return (
		<section aria-label="Upcoming queue">
			<ol>
				{snapshot.queue.map((entry) => {
					const movie = snapshot.movies.find((candidate) => candidate.id === entry.movieId)
					const user = snapshot.members.find((member) => member.id === entry.addedByUserId)
					return (
						<li key={entry.id}>
							<strong>{movie?.title}</strong>
							<span>Added by {user?.displayName}</span>
							<button type="button" onClick={() => void returnQueueEntry(entry.id)}>Return</button>
						</li>
					)
				})}
			</ol>
		</section>
	)
}

function TurnsPage(): VNode {
	const snapshot = useO(snapshotAtom)
	return (
		<section aria-label="Turn order">
			<ol>
				{snapshot.turnOrder.map((entry) => {
					const user = snapshot.members.find((member) => member.id === entry.userId)
					return <li key={entry.id}><strong>{user?.displayName}</strong><span>Position {entry.position}</span></li>
				})}
			</ol>
		</section>
	)
}

function InvitesPage(): VNode {
	const snapshot = useO(snapshotAtom)
	return (
		<section aria-label="Invites">
			<form>
				<label>
					Email
					<input placeholder="friend@example.com" type="email" />
				</label>
				<button type="button">Invite</button>
			</form>
			<ol>
				{snapshot.members.map((member) => <li key={member.id}><strong>{member.displayName}</strong><span>{member.role}</span></li>)}
			</ol>
		</section>
	)
}

function ReviewPage(): VNode {
	const snapshot = useO(snapshotAtom)
	const groupId = useO(routeGroupIdSelector)
	const movieNightId = useO(routeMovieNightIdSelector)
	const reviewSummary = useReviewSummary()
	const night = snapshot.history.find((entry) => entry.movieNightId === movieNightId)
	return (
		<section aria-label="Review">
			<article>
				<h2>{night?.title ?? `Movie night`}</h2>
				<strong>{reviewSummary.ready}/{snapshot.members.length} ready</strong>
				<p>Average individual rating {reviewSummary.rating}; average goodness of pick {reviewSummary.goodness}.</p>
			</article>
			<form>
				<label>
					Rating
					<input inputMode="numeric" placeholder="5" />
				</label>
				<label>
					Goodness of pick
					<input inputMode="numeric" placeholder="4" />
				</label>
				<label>
					Feelings
					<textarea placeholder="It landed beautifully." />
				</label>
				<button type="button">Save</button>
			</form>
			<route-actions>
				<AppAnchor href={`/groups/${groupId}/review/${movieNightId}/summary` as Pathname}>Summary</AppAnchor>
			</route-actions>
		</section>
	)
}

function ReviewSummaryPage(): VNode {
	const snapshot = useO(snapshotAtom)
	const reviewSummary = useReviewSummary()
	return (
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
	)
}

function HistoryPage(): VNode {
	const snapshot = useO(snapshotAtom)
	const sortedHistory = useO(sortedHistorySelector)
	const historySort = useO(historySortAtom)
	const setHistorySort = useI(historySortAtom)
	return (
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
	)
}

function NotFoundPage(): VNode {
	return (
		<section aria-label="Not found">
			<article>
				<h2>Not found</h2>
				<p>That Moview route does not exist.</p>
			</article>
			<route-actions>
				<AppAnchor href="/">Dashboard</AppAnchor>
			</route-actions>
		</section>
	)
}

function useReviewSummary(): { goodness: string; rating: string; ready: number } {
	const snapshot = useO(snapshotAtom)
	return useMemo(() => ({
		goodness: average(snapshot.history.map((entry) => entry.goodnessOfPick)),
		rating: average(snapshot.history.map((entry) => entry.rating)),
		ready: new Set(snapshot.history.map((entry) => entry.reviewerId).filter(Boolean)).size,
	}), [snapshot.history])
}
