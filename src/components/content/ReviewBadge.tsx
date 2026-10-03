import { Badge } from "@/components/ui";
import { capitalize, REVIEW_TONE } from "@/lib/content";
import type { Review } from "@/types/catalog";

export function ReviewBadge({ review }: { review: Review }) {
  return (
    <Badge tone={REVIEW_TONE[review.status]} title={review.note}>
      {review.status === "pending" ? "In review" : capitalize(review.status)}
    </Badge>
  );
}
