import type { VNode } from "preact"

import type { Movie } from "../api/types"
import css from "./MoviePoster.module.css"

export function MoviePoster(props: { movie: Movie }): VNode {
	return (
		<movie-poster className={css.class}>
			<img alt="" loading="lazy" src={props.movie.imageUrl} />
		</movie-poster>
	)
}
