import { placeholderImageUrl } from "@/lib/placeholder-media";

export interface ThumbProps {
  /** Same seed the site uses, so admin thumbnails match the site's artwork. */
  seed: string;
  src?: string;
  view?: "landscape" | "portrait" | "square";
  width?: number;
  radius?: number;
  fit?: "cover" | "contain";
}

const RATIO = { landscape: 9 / 16, portrait: 16 / 9, square: 1 };

export function Thumb({ seed, src, view = "landscape", width = 96, radius = 12, fit = "cover" }: ThumbProps) {
  const height = Math.round(width * RATIO[view]);
  return (
    <img
      className="thumb"
      src={src ?? placeholderImageUrl(seed, width * 2, height * 2)}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      style={{ width, height, borderRadius: radius, objectFit: fit }}
    />
  );
}
