import { atom, selector } from "atom.io"

export interface MoviewUser {
	avatarColor: string
	displayName: string
	email: string
	id: string
	role?: `admin` | `member`
}

export interface MoviewGroup {
	authentikGroup: string
	id: string
	name: string
}

export interface MoviewMovie {
	description: string | null
	id: string
	posterPath: string | null
	title: string
	year: number | null
}

export interface MoviewAdvocate {
	advocateNumber: number
	id: string
	movieId: string
	rank: number
	userId: string
}

export interface MoviewQueueEntry {
	addedByUserId: string
	id: string
	movieId: string
	position: number
}

export interface MoviewTurnEntry {
	id: string
	position: number
	userId: string
}

export interface MoviewHistoryEntry {
	dateWatched: string
	feelings: string | null
	goodnessOfPick: number | null
	movieId: string
	movieNightId: string
	rating: number | null
	reviewerId: string | null
	title: string
	year: number | null
}

export interface MoviewSnapshot {
	advocates: MoviewAdvocate[]
	groups: MoviewGroup[]
	history: MoviewHistoryEntry[]
	members: MoviewUser[]
	movies: MoviewMovie[]
	queue: MoviewQueueEntry[]
	selectedGroupId: string
	turnOrder: MoviewTurnEntry[]
}

export type PoolMovie = MoviewMovie & {
	advocates: MoviewAdvocate[]
	queueEntry: MoviewQueueEntry | undefined
}

export interface PersonalMovie {
	advocate: MoviewAdvocate
	movie: MoviewMovie
}

export interface ReviewSummary {
	goodness: string
	rating: string
	ready: number
}

export const seededSnapshot: MoviewSnapshot = {
	advocates: [
		{ advocateNumber: 1, id: `adv-dune-jeremy`, movieId: `movie-dune`, rank: 1, userId: `user-jeremy` },
		{ advocateNumber: 1, id: `adv-everything-moira`, movieId: `movie-everything`, rank: 1, userId: `user-moira` },
		{ advocateNumber: 2, id: `adv-everything-jeremy`, movieId: `movie-everything`, rank: 2, userId: `user-jeremy` },
		{ advocateNumber: 1, id: `adv-grand-peter`, movieId: `movie-grand-budapest`, rank: 3, userId: `user-peter` },
		{ advocateNumber: 1, id: `adv-crouching-jeremy`, movieId: `movie-crouching`, rank: 3, userId: `user-jeremy` },
		{ advocateNumber: 1, id: `adv-burning-moira`, movieId: `movie-burning`, rank: 2, userId: `user-moira` },
		{ advocateNumber: 1, id: `adv-tiptoes-peter`, movieId: `movie-tiptoes`, rank: 104, userId: `user-peter` },
		{ advocateNumber: 1, id: `adv-red-baron-peter`, movieId: `movie-red-baron`, rank: 103.7318018505, userId: `user-peter` },
		{ advocateNumber: 1, id: `adv-happily-peter`, movieId: `movie-happily`, rank: 103.463603701, userId: `user-peter` },
	],
	groups: [
		{ authentikGroup: `moview-friends`, id: `group-friends`, name: `Friday Movie Night` },
		{ authentikGroup: `moview-moira-bug`, id: `group-moira-bug`, name: `Moira and Bug` },
	],
	history: [
		{
			dateWatched: `2026-06-12`,
			feelings: `Exhausting in the exact way I wanted.`,
			goodnessOfPick: 4,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			rating: 5,
			reviewerId: `user-jeremy`,
			title: `Everything Everywhere All at Once`,
			year: 2022,
		},
		{
			dateWatched: `2026-06-12`,
			feelings: `A perfect pick for a group night.`,
			goodnessOfPick: 5,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			rating: 5,
			reviewerId: `user-moira`,
			title: `Everything Everywhere All at Once`,
			year: 2022,
		},
		{
			dateWatched: `2026-06-12`,
			feelings: `Deeply weird, very good.`,
			goodnessOfPick: 3,
			movieId: `movie-everything`,
			movieNightId: `night-everything`,
			rating: 4,
			reviewerId: `user-peter`,
			title: `Everything Everywhere All at Once`,
			year: 2022,
		},
	],
	members: [
		{ avatarColor: `#ca3f37`, displayName: `Jeremy`, email: `jeremy@moview.test`, id: `user-jeremy`, role: `admin` },
		{ avatarColor: `#4d7cba`, displayName: `Moira`, email: `moira@moview.test`, id: `user-moira`, role: `member` },
		{ avatarColor: `#4f8c5f`, displayName: `Peter`, email: `peter@moview.test`, id: `user-peter`, role: `member` },
	],
	movies: [
		{
			description: `A desert-world epic with political pressure, big feelings, and enough sand to make snacks feel dangerous.`,
			id: `movie-dune`,
			posterPath: `https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg`,
			title: `Dune`,
			year: 2021,
		},
		{
			description: `A family laundromat, fractured realities, tax anxiety, and a surprising amount of tenderness.`,
			id: `movie-everything`,
			posterPath: `https://image.tmdb.org/t/p/w342/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg`,
			title: `Everything Everywhere All at Once`,
			year: 2022,
		},
		{
			description: `A meticulous Budapest hotel caper with confection colors, formal manners, and mounting chaos.`,
			id: `movie-grand-budapest`,
			posterPath: `https://image.tmdb.org/t/p/w342/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg`,
			title: `The Grand Budapest Hotel`,
			year: 2014,
		},
		{
			description: `A detective story, a romance with weather, and a stunning argument for looking closely.`,
			id: `movie-burning`,
			posterPath: `https://image.tmdb.org/t/p/w342/kXiO80KkjZ6JMTiA6j13JnNSTmF.jpg`,
			title: `Burning`,
			year: 2018,
		},
		{ description: `A lovingly ridiculous personal-view test movie.`, id: `movie-tiptoes`, posterPath: null, title: `Tiptoes`, year: 2003 },
		{ description: `Peter's top-ranked aviation melodrama.`, id: `movie-red-baron`, posterPath: null, title: `The Red Baron`, year: 2008 },
		{ description: `Peter's previous personal-list closer.`, id: `movie-happily`, posterPath: null, title: `Happily N'ever After`, year: 2006 },
	],
	queue: [
		{ addedByUserId: `user-jeremy`, id: `queue-dune`, movieId: `movie-dune`, position: 1 },
		{ addedByUserId: `user-peter`, id: `queue-grand`, movieId: `movie-grand-budapest`, position: 2 },
		{ addedByUserId: `user-moira`, id: `queue-burning`, movieId: `movie-burning`, position: 3 },
	],
	selectedGroupId: `group-friends`,
	turnOrder: [
		{ id: `turn-jeremy`, position: 1, userId: `user-jeremy` },
		{ id: `turn-moira`, position: 2, userId: `user-moira` },
		{ id: `turn-peter`, position: 3, userId: `user-peter` },
	],
}

export const snapshotAtom = atom<MoviewSnapshot>({
	default: seededSnapshot,
	key: `snapshot`,
})

export const selectedUserIdAtom = atom<string>({
	default: `user-jeremy`,
	key: `selectedUserId`,
})

export const historySortAtom = atom<`date_watched` | `goodness_of_pick` | `rating`>({
	default: `date_watched`,
	key: `historySort`,
})

export const addMovieTitleAtom = atom<string>({
	default: ``,
	key: `addMovieTitle`,
})

export const addMovieYearAtom = atom<string>({
	default: ``,
	key: `addMovieYear`,
})

export const poolMoviesSelector = selector<PoolMovie[]>({
	get: ({ get }) => {
		const snapshot = get(snapshotAtom)
		return snapshot.movies
			.map((movie) => ({
				...movie,
				advocates: snapshot.advocates.filter((advocate) => advocate.movieId === movie.id),
				queueEntry: snapshot.queue.find((entry) => entry.movieId === movie.id),
			}))
			.sort((a, b) => a.title.localeCompare(b.title))
	},
	key: `poolMovies`,
})

export const personalMoviesSelector = selector<PersonalMovie[]>({
	get: ({ get }) => {
		const snapshot = get(snapshotAtom)
		const selectedUserId = get(selectedUserIdAtom)
		return snapshot.advocates
			.filter((advocate) => advocate.userId === selectedUserId)
			.sort((a, b) => a.rank - b.rank)
			.map((advocate) => ({
				advocate,
				movie: snapshot.movies.find((movie) => movie.id === advocate.movieId),
			}))
			.filter((entry): entry is PersonalMovie => entry.movie !== undefined)
	},
	key: `personalMovies`,
})

export const sortedHistorySelector = selector<MoviewHistoryEntry[]>({
	get: ({ get }) => {
		const snapshot = get(snapshotAtom)
		const sort = get(historySortAtom)
		return [...snapshot.history].sort((a, b) => {
			if (sort === `rating`) {
				return (b.rating ?? -999) - (a.rating ?? -999)
			}
			if (sort === `goodness_of_pick`) {
				return (b.goodnessOfPick ?? -999) - (a.goodnessOfPick ?? -999)
			}
			return b.dateWatched.localeCompare(a.dateWatched)
		})
	},
	key: `sortedHistory`,
})

export const reviewSummarySelector = selector<ReviewSummary>({
	get: ({ get }) => {
		const history = get(snapshotAtom).history
		return {
			goodness: average(history.map((entry) => entry.goodnessOfPick)),
			rating: average(history.map((entry) => entry.rating)),
			ready: new Set(history.map((entry) => entry.reviewerId).filter(Boolean)).size,
		}
	},
	key: `reviewSummary`,
})

function average(values: Array<number | null>): string {
	const real = values.filter((value): value is number => typeof value === `number`)
	if (real.length === 0) {
		return `-`
	}
	return (real.reduce((sum, value) => sum + value, 0) / real.length).toFixed(1)
}
