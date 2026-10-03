import { filterLabels } from "@/lib/content";
import type { FilterGroup, FilterValues } from "@/types/catalog";

/** Read-only chips for one filter group's picks, e.g. an item's genres. */
export function FilterTags({ groups, values, groupId, max = 3 }: { groups: FilterGroup[]; values: FilterValues; groupId: string; max?: number }) {
  const labels = filterLabels(groups, values, groupId);
  if (labels.length === 0) return <span className="muted">—</span>;
  return (
    <span className="chips">
      {labels.slice(0, max).map((label) => (
        <span key={label} className="chip chip-static">
          {label}
        </span>
      ))}
      {labels.length > max && <span className="muted small">+{labels.length - max}</span>}
    </span>
  );
}
