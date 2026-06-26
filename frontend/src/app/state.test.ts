import { describe, expect, test } from "bun:test"

import { seededSnapshot } from "./state"

describe(`seeded Moview state`, () => {
	test(`starts with the README review group and queue`, () => {
		expect(seededSnapshot.selectedGroupId).toBe(`group-friends`)
		expect(seededSnapshot.members.map((member) => member.displayName)).toContain(`Jeremy`)
		expect(seededSnapshot.queue).toHaveLength(3)
	})
})
