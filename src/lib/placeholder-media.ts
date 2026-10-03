/**
 * MVP placeholder media: deterministic remote images (Picsum, Pravatar) and a small
 * rotation of freely-licensed, full-frame (no baked-in letterboxing) sample video clips.
 * Swap these for real CMS/CDN URLs once actual catalog assets exist.
 *
 * A few other commonly-cited public sample clips were tried and rejected: Google's old
 * gtv-videos-bucket now 403s, and Sintel/movie_300/oceans/Big-Buck-Bunny (learningcontainer.com)
 * all turned out to have black letterboxing baked into the source pixels, which shows up as an
 * ugly band even with `object-fit: cover`.
 */

const SAMPLE_VIDEOS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
];

/** Simple deterministic string hash so the same seed always maps to the same asset. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** A stable Picsum photo URL for the given seed and pixel size. */
export function placeholderImageUrl(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${Math.round(width)}/${Math.round(height)}`;
}

/** A stable Pravatar (generated headshot) URL for the given seed. */
export function placeholderAvatarUrl(seed: string, size = 128): string {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;
}

/** Local genre key art (cropped from a themed placeholder grid), keyed by lowercase genre name. */
const GENRE_IMAGES: Record<string, string> = {
  comedy: "/genres/comedy.jpg",
  "sci-fi": "/genres/action.jpg",
  family: "/genres/family.jpg",
  thriller: "/genres/thriller.jpg",
  adventure: "/genres/kids.jpg",
  romance: "/genres/romance.jpg",
  action: "/genres/action.jpg",
  drama: "/genres/drama.jpg",
  horror: "/genres/horror.jpg",
  documentary: "/genres/documentary.jpg",
  kids: "/genres/kids.jpg",
};

/** Key art for a movie category/genre chip, falling back to a generic drama frame. */
export function genreImageUrl(category: string): string {
  return GENRE_IMAGES[category.toLowerCase()] ?? "/genres/drama.jpg";
}

/** Deterministically picks one of a small rotation of public-domain sample clips, seeking
 * to a different start offset per seed (media fragment `#t=`) so items sharing a clip don't
 * all open on the exact same frame. */
export function placeholderVideoUrl(seed: string): string {
  const hash = hashSeed(seed);
  const clip = SAMPLE_VIDEOS[hash % SAMPLE_VIDEOS.length];
  const offsetSeconds = Math.floor(hash / SAMPLE_VIDEOS.length) % 20;
  return `${clip}#t=${offsetSeconds}`;
}
