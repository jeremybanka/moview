import type { NewMovie } from "../db/schema"

type CatalogMovie = Omit<NewMovie, `id` | `createdAt`>

const catalogMovies = [
	{
		title: `The Red Baron`,
		description: `A historical aviation drama that Peter keeps defending as a perfect movie-night swing.`,
		imageUrl: posterDataUrl(`The Red Baron`, `Aerial drama`),
		releasedYear: 2008,
		runtimeMinutes: 129,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q437380`,
	},
	{
		title: `Tiptoes`,
		description: `A notorious ensemble drama preserved here mostly because the group refuses to stop talking about it.`,
		imageUrl: posterDataUrl(`Tiptoes`, `Oddball pick`),
		releasedYear: 2003,
		runtimeMinutes: 90,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q7807577`,
	},
	{
		title: `Happily N'Ever After`,
		description: `An animated fairy-tale remix that makes a useful anchor for sparse personal ranking examples.`,
		imageUrl: posterDataUrl(`Happily N'Ever After`, `Animated chaos`),
		releasedYear: 2006,
		runtimeMinutes: 87,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q1563941`,
	},
	{
		title: `The Iron Giant`,
		description: `A tender animated science-fiction film and the sort of pool pick everyone can advocate for.`,
		imageUrl: posterDataUrl(`The Iron Giant`, `Robot heart`),
		releasedYear: 1999,
		runtimeMinutes: 86,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q220911`,
	},
	{
		title: `Moonstruck`,
		description: `A romantic comedy contributed by Moira first, leaving room for Jeremy to become advocate number two.`,
		imageUrl: posterDataUrl(`Moonstruck`, `Romantic comedy`),
		releasedYear: 1987,
		runtimeMinutes: 102,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q845057`,
	},
	{
		title: `Tampopo`,
		description: `A food-obsessed comedy that has become the group shorthand for a high-goodness pick.`,
		imageUrl: posterDataUrl(`Tampopo`, `Ramen western`),
		releasedYear: 1985,
		runtimeMinutes: 114,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q1196981`,
	},
	{
		title: `The Wages of Fear`,
		description: `A white-knuckle thriller that Peter added because the queue needed something tense.`,
		imageUrl: posterDataUrl(`The Wages of Fear`, `Tension`),
		releasedYear: 1953,
		runtimeMinutes: 131,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q711303`,
	},
	{
		title: `Mikey and Nicky`,
		description: `A nervous friendship spiral that sits in the pool for when the group wants prickly energy.`,
		imageUrl: posterDataUrl(`Mikey and Nicky`, `Night walk`),
		releasedYear: 1976,
		runtimeMinutes: 119,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q1930475`,
	},
	{
		title: `House`,
		description: `A surreal haunted-house blast and Jeremy's fourth original pool contribution.`,
		imageUrl: posterDataUrl(`House`, `Surreal horror`),
		releasedYear: 1977,
		runtimeMinutes: 88,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q2473337`,
	},
	{
		title: `A Matter of Life and Death`,
		description: `A luminous fantasy romance that Moira keeps near the middle of the upcoming queue.`,
		imageUrl: posterDataUrl(`A Matter of Life and Death`, `Heavenly trial`),
		releasedYear: 1946,
		runtimeMinutes: 104,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q1190633`,
	},
	{
		title: `Black Narcissus`,
		description: `A saturated monastery melodrama and one of the queued Powell and Pressburger nights.`,
		imageUrl: posterDataUrl(`Black Narcissus`, `Mountain fever`),
		releasedYear: 1947,
		runtimeMinutes: 100,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q886789`,
	},
	{
		title: `The Long Goodbye`,
		description: `A laid-back detective movie that Peter wants close to the top when his turn comes around.`,
		imageUrl: posterDataUrl(`The Long Goodbye`, `Sun-baked noir`),
		releasedYear: 1973,
		runtimeMinutes: 112,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q1210842`,
	},
	{
		title: `Daisies`,
		description: `A playful Czech New Wave title Moira put in the pool for a shorter movie night.`,
		imageUrl: posterDataUrl(`Daisies`, `Prank cinema`),
		releasedYear: 1966,
		runtimeMinutes: 76,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q1192017`,
	},
	{
		title: `Local Hero`,
		description: `A gentle oil-town comedy that makes the queue feel less like homework.`,
		imageUrl: posterDataUrl(`Local Hero`, `Coastal comedy`),
		releasedYear: 1983,
		runtimeMinutes: 111,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q958848`,
	},
	{
		title: `The 5,000 Fingers of Dr. T.`,
		description: `A musical fever dream for the nights when nobody wants a normal recommendation.`,
		imageUrl: posterDataUrl(`The 5000 Fingers of Dr T`, `Piano nightmare`),
		releasedYear: 1953,
		runtimeMinutes: 89,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q398652`,
	},
	{
		title: `Police Story`,
		description: `A propulsive action comedy that Bug keeps asking Moira to add to a separate group.`,
		imageUrl: posterDataUrl(`Police Story`, `Stunt night`),
		releasedYear: 1985,
		runtimeMinutes: 101,
		metadataSource: `wikidata`,
		metadataUrl: `https://www.wikidata.org/wiki/Q724806`,
	},
] satisfies CatalogMovie[]

const catalog = new Map<string, CatalogMovie>(
	catalogMovies.map((movie) => [normalizeTitle(movie.title), movie]),
)

export function getCatalogMovie(title: string): CatalogMovie {
	const existing = catalog.get(normalizeTitle(title))
	if (existing) {
		return existing
	}
	return {
		title: title.trim(),
		description: `A newly remembered movie-night candidate awaiting richer open metadata.`,
		imageUrl: posterDataUrl(title.trim(), `New pool title`),
		releasedYear: null,
		runtimeMinutes: null,
		metadataSource: `open_movie_db`,
		metadataUrl: `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(title.trim())}`,
	}
}

export function normalizeTitle(title: string): string {
	return title.trim().toLocaleLowerCase()
}

export function posterDataUrl(title: string, kicker: string): string {
	const hue = stableHue(title)
	const escapedTitle = escapeXml(title)
	const escapedKicker = escapeXml(kicker)
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 620"><rect width="420" height="620" fill="hsl(${hue} 33% 18%)"/><rect x="28" y="28" width="364" height="564" fill="none" stroke="hsl(${(hue + 150) % 360} 68% 72%)" stroke-width="8"/><circle cx="330" cy="104" r="42" fill="hsl(${(hue + 80) % 360} 76% 66%)"/><text x="48" y="412" fill="#f7f4ec" font-family="Arial, sans-serif" font-size="54" font-weight="900">${escapedTitle}</text><text x="50" y="474" fill="#d9d2bf" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapedKicker}</text></svg>`
	return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function stableHue(value: string): number {
	let hash = 0
	for (const character of value) {
		hash = (hash * 31 + character.charCodeAt(0)) % 360
	}
	return hash
}

function escapeXml(value: string): string {
	return value
		.replaceAll(`&`, `&amp;`)
		.replaceAll(`<`, `&lt;`)
		.replaceAll(`>`, `&gt;`)
		.replaceAll(`"`, `&quot;`)
		.replaceAll(`'`, `&apos;`)
}
