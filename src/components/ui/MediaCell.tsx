import type { ReactNode } from "react";
import { Thumb, type ThumbProps } from "./Thumb";

export interface MediaCellProps extends ThumbProps {
  title: ReactNode;
  meta?: ReactNode;
}

/** Table cell: thumbnail + title + one line of meta. */
export function MediaCell({ title, meta, ...thumb }: MediaCellProps) {
  return (
    <div className="media">
      <Thumb {...thumb} />
      <div className="grow">
        <div className="media-title truncate">{title}</div>
        {meta && <div className="media-meta truncate">{meta}</div>}
      </div>
    </div>
  );
}
