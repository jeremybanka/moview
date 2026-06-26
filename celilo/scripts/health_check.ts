#!/usr/bin/env bun
const origin = process.env.APP_ORIGIN ?? `http://localhost:3000`
const response = await fetch(`${origin}/api/bootstrap`)
if (!response.ok) {
	throw new Error(`Moview health check failed with ${response.status}`)
}
console.log(`Moview health check passed.`)
