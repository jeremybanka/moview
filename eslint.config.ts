import * as tsParser from "@typescript-eslint/parser"
import AtomIOPlugin from "atom.io/eslint-plugin"
import type { Linter } from "eslint"
import * as ImportPlugin from "eslint-plugin-import-x"
import { default as SimpleImportSortPlugin } from "eslint-plugin-simple-import-sort"
import LasertagPlugin from "lasertag/eslint-plugin"

import { LINT_IGNORES } from "./scripts/lint-common.ts"

type Rules = Linter.Config[`rules`]

const WARN = 1
const ERROR = 2

const TS_LANG_OPTIONS: Linter.Config[`languageOptions`] = {
	parser: tsParser,
	parserOptions: {
		projectService: true,
		sourceType: `module`,
	} satisfies tsParser.ParserOptions,
}

const COMMON_RULES: Rules = {
	"atom.io/exact-catch-types": ERROR,
	"atom.io/explicit-state-types": [ERROR, { permitAnnotation: true }],
	"atom.io/naming-convention": ERROR,

	"import/newline-after-import": ERROR,
	"import/no-duplicates": ERROR,
	"import/extensions": [
		ERROR,
		`never`,
		{
			checkTypeImports: true,
			fix: true,
			ignorePackages: true,
			pattern: {
				cts: `always`,
				mts: `always`,
				ts: `always`,
				tsx: `always`,
			},
		},
	],

	"simple-import-sort/imports": ERROR,
	"simple-import-sort/exports": ERROR,

	"no-mixed-spaces-and-tabs": 0,
	quotes: [ERROR, `backtick`],
}

const LASERTAG_RULES: Rules = {
	"lasertag/access-css-module-class-only": ERROR,
	"lasertag/ban-div": ERROR,
	"lasertag/export-own-component-only": ERROR,
	"lasertag/header-main-footer-as-group": ERROR,
	"lasertag/import-own-css-module-only": ERROR,
	"lasertag/name-imported-css-module-as-css": ERROR,
	"lasertag/render-tag-with-own-name": ERROR,
}

const IGNORES: Linter.Config = {
	ignores: LINT_IGNORES,
}

const COMMON: Linter.Config = {
	languageOptions: TS_LANG_OPTIONS,
	files: [`**/*.ts{,x}`, `eslint.config.ts`],
	plugins: {
		"atom.io": AtomIOPlugin,
		import: ImportPlugin,
		"simple-import-sort": SimpleImportSortPlugin,
	},
	rules: COMMON_RULES,
}

const LASERTAG_TSX: Linter.Config = {
	files: [`frontend/**/*.tsx`],
	ignores: [],
	plugins: { lasertag: LasertagPlugin },
	rules: LASERTAG_RULES,
}

const TYPE_DECLARATIONS: Linter.Config = {
	files: [`**/*.d.ts`],
	rules: {
		quotes: 0,
	},
}

export default [
	IGNORES,
	COMMON,
	TYPE_DECLARATIONS,
	LASERTAG_TSX,
] satisfies Linter.Config[]
