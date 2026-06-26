export function nextWholeRank(ranks: readonly number[]): number {
	if (ranks.length === 0) {
		return 1
	}
	return Math.floor(Math.max(...ranks)) + 1
}

export function rankBetween(
	previous: number | null,
	next: number | null,
): number {
	if (previous === null && next === null) {
		return 1
	}
	if (previous === null) {
		return next === null ? 1 : next - 1
	}
	if (next === null) {
		return nextWholeRank([previous])
	}
	return previous + (next - previous) / 2
}

export function moveRank(
	currentRanks: readonly number[],
	targetIndex: number,
	movingRank?: number,
): number {
	const ranks = currentRanks
		.filter((rank) => rank !== movingRank)
		.sort((a, b) => a - b)
	if (targetIndex >= ranks.length) {
		return nextWholeRank(ranks)
	}
	const previous = targetIndex > 0 ? (ranks[targetIndex - 1] ?? null) : null
	const next = ranks[targetIndex] ?? null
	return rankBetween(previous, next)
}
