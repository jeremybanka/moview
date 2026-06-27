import "./styles/globals.css"

import { render } from "preact"

import { AppShell } from "./app/AppShell"

const root = document.getElementById(`root`)

if (!root) {
	throw new Error(`Missing Moview root element.`)
}

render(<AppShell />, root)
