const POSTER_SRC = "/posters/movie-placeholder.jpg";

/** Movies use the shared poster art on the site; everything else uses its seeded placeholder. */
export function posterSrc(title: { id: string; kind: string }): string | undefined {
  return title.kind === "movie" ? POSTER_SRC : undefined;
}
