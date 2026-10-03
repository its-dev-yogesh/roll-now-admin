import { FilterTags, ReviewBadge } from "@/components/content";
import { ResourcePage } from "@/components/layout";
import { MediaCell } from "@/components/ui";
import { useFilters, useRolls } from "@/hooks/useStores";
import { groupsFor } from "@/lib/content";
import { createId } from "@/lib/ids";
import type { AdminRoll, FilterValues } from "@/types/catalog";

export function RollsPage() {
  const rolls = useRolls();
  const filters = useFilters().items;

  return (
    <ResourcePage<AdminRoll>
      title="Rolls"
      noun="roll"
      description="Short vertical clips on the Rolls feed and the Home “Quick rolls” rail."
      items={rolls.items}
      store={rolls}
      searchText={(roll) => `${roll.handle} ${roll.caption} ${roll.sourceTitle ?? ""}`}
      tabs={[
        { label: "Approved", match: (roll) => roll.review.status === "approved" },
        { label: "In review", match: (roll) => roll.review.status === "pending" },
        { label: "Rejected", match: (roll) => roll.review.status === "rejected" },
      ]}
      columns={[
        { header: "Roll", render: (row) => <MediaCell seed={row.id} view="portrait" width={44} radius={8} title={row.handle} meta={row.caption} /> },
        { header: "Category", render: (row) => <FilterTags groups={filters} values={row.filters} groupId="category" /> },
        { header: "Source", render: (row) => <span className="muted">{row.sourceTitle ?? "—"}</span> },
        { header: "Views", render: (row) => row.viewCount, align: "right" },
        { header: "Likes", render: (row) => row.likeCount, align: "right" },
        { header: "Review", render: (row) => <ReviewBadge review={row.review} /> },
      ]}
      form={{
        fields: [
          {
            kind: "row",
            fields: [
              { kind: "text", name: "handle", label: "Handle", required: true, placeholder: "@chaistall.tales" },
              { kind: "text", name: "sourceTitle", label: "Source", hint: "Shown as “From …”, e.g. “From The Great Chai Heist”" },
            ],
          },
          { kind: "textarea", name: "caption", label: "Caption", required: true },
          { kind: "text", name: "soundName", label: "Sound", required: true },
          { kind: "filters", name: "filters", label: "Filters", groups: groupsFor(filters, "roll") },
        ],
        toValues: (roll) => ({
          handle: roll?.handle ?? "",
          sourceTitle: roll?.sourceTitle ?? "",
          caption: roll?.caption ?? "",
          soundName: roll?.soundName ?? "",
          filters: roll?.filters ?? {},
        }),
        fromValues: (values, existing) => ({
          ...existing,
          id: existing?.id ?? createId("roll"),
          handle: String(values.handle),
          sourceTitle: String(values.sourceTitle) || undefined,
          caption: String(values.caption),
          soundName: String(values.soundName),
          // Counts are tracked by the API from real views/likes/comments.
          viewCount: existing?.viewCount ?? "0",
          likeCount: existing?.likeCount ?? "0",
          commentCount: existing?.commentCount ?? "0",
          filters: values.filters as FilterValues,
          review: existing?.review ?? { status: "pending", passedRuleIds: [] },
        }),
      }}
    />
  );
}
