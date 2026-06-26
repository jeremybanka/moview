import { describe, expect, test } from "bun:test"

import { positionForPlacement } from "../src/domain/queue"
import { moveRank, nextWholeRank, rankBetween } from "../src/domain/rank"

describe(`personal rank math`, () => {
	test(`moves a middle-ranked movie to the next whole number after the last rank`, () => {
		expect(nextWholeRank([12.130561, 63.1065076, 103.463603701])).toBe(104)
	})

	test(`moves a top-ranked movie between Tiptoes and Happily N'ever After`, () => {
		const rank = rankBetween(103.463603701, 104)
		expect(rank).toBe(103.7318018505)
	})

	test(`calculates insertion ranks from an ordered personal list`, () => {
		expect(moveRank([12.130561, 103.463603701, 104], 1, 12.130561)).toBe(
			103.7318018505,
		)
	})
})

describe(`queue insertion`, () => {
	const queue = [
		{ id: `first`, position: 1 },
		{ id: `second`, position: 2 },
		{ id: `third`, position: 3 },
	]

	test(`inserts on deck before the first queued movie`, () => {
		expect(positionForPlacement(queue, `on-deck`)).toBe(0)
	})

	test(`inserts at the second upcoming position`, () => {
		expect(positionForPlacement(queue, `second`)).toBe(1.5)
	})

	test(`returns an end position after the last queued movie`, () => {
		expect(positionForPlacement(queue, `end`)).toBe(4)
	})
})
