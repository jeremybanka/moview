import { rankBetween } from "./rank"

export type QueuePlacement =
	| `on-deck`
	| `second`
	| { afterEntryId: string }
	| `end`

export interface OrderedQueueEntry {
	id: string
	position: number
}

export function positionForPlacement(
	entries: readonly OrderedQueueEntry[],
	placement: QueuePlacement,
): number {
	const ordered = [...entries].sort((a, b) => a.position - b.position)
	if (placement === `on-deck`) {
		return rankBetween(null, ordered[0]?.position ?? null)
	}
	if (placement === `second`) {
		return rankBetween(
			ordered[0]?.position ?? null,
			ordered[1]?.position ?? null,
		)
	}
	if (placement === `end`) {
		return rankBetween(ordered.at(-1)?.position ?? null, null)
	}
	const index = ordered.findIndex((entry) => entry.id === placement.afterEntryId)
	if (index === -1) {
		return positionForPlacement(ordered, `end`)
	}
	return rankBetween(
		ordered[index]?.position ?? null,
		ordered[index + 1]?.position ?? null,
	)
}
