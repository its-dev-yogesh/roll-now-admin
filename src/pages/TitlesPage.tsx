import { EpisodesField, FilterTags, ReviewBadge } from "@/components/content";
import type { FieldSpec } from "@/components/form";
import { ResourcePage } from "@/components/layout";
import { MediaCell } from "@/components/ui";
import { useFilters, useTitles } from "@/hooks/useStores";
import { filterLabels, groupsFor, siteFieldsFromFilters } from "@/lib/content";
import { posterSrc } from "@/lib/poster";
import { createId } from "@/lib/ids";
import type { AdminTitle, Episode, FilterValues, TitleKind } from "@/types/catalog";

const COPY = {
  movie: { title: "Movies", noun: "movie", description: "Films on the site's Home and Movies pages." },
  drama: { title: "Shows", noun: "show", description: "Series on the site's Home and Shows pages, with their episodes." },
};

/** Movies and Shows: same model (the site's Title), split by kind. */
export function TitlesPage({ kind }: { kind: TitleKind }) {
  const titles = useTitles();
  const filters = useFilters().items;
  const type = kind === "movie" ? "movie" : "show";
  const groups = groupsFor(filters, type);
  const items = titles.items.filter((title) => title.kind === kind);

  const fields: FieldSpec[] = [
    { kind: "text", name: "title", label: "Title", required: true, placeholder: "The Great Chai Heist" },
    {
      kind: "row",
      fields: [
        { kind: "text", name: "meta", label: "Meta line", required: true, hint: "Under the title on the site, e.g. “Comedy · 1h 52m · U/A 13+”" },
        { kind: "text", name: "rating", label: "Rating", hint: "Out of 10, e.g. 8.4" },
      ],
    },
    { kind: "text", name: "tag", label: "Tag", hint: "Badge on hover cards, e.g. “Family drama”" },
    { kind: "textarea", name: "synopsis", label: "Synopsis" },
    { kind: "filters", name: "filters", label: "Filters", groups },
    { kind: "chips", name: "similarIds", label: "More like this", options: titles.items.map((title) => ({ id: title.id, label: title.title })) },
    ...(kind === "drama"
      ? [{ kind: "custom", name: "episodes", label: "Episodes", render: (value, set) => <EpisodesField episodes={value as Episode[]} onChange={set} /> } satisfies FieldSpec]
      : []),
  ];

  return (
    <ResourcePage<AdminTitle>
      {...COPY[kind]}
      items={items}
      store={titles}
      searchText={(title) => `${title.title} ${title.meta}`}
      tabs={[
        { label: "Approved", match: (title) => title.review.status === "approved" },
        { label: "In review", match: (title) => title.review.status === "pending" },
        { label: "Rejected", match: (title) => title.review.status === "rejected" },
      ]}
      columns={[
        { header: COPY[kind].noun, render: (row) => <MediaCell seed={row.id} src={posterSrc(row)} title={row.title} meta={row.meta} /> },
        { header: "Genre", render: (row) => <FilterTags groups={filters} values={row.filters} groupId="genre" /> },
        { header: "Languages", render: (row) => <span className="muted">{filterLabels(filters, row.filters, "language").join(", ") || "—"}</span> },
        { header: "Rating", render: (row) => (row.rating ? `★ ${row.rating}` : "—"), align: "center" },
        ...(kind === "drama" ? [{ header: "Episodes", render: (row: AdminTitle) => row.episodes?.length ?? 0, align: "center" as const }] : []),
        { header: "Review", render: (row) => <ReviewBadge review={row.review} /> },
      ]}
      form={{
        fields,
        toValues: (title) => ({
          title: title?.title ?? "",
          meta: title?.meta ?? "",
          rating: title?.rating ?? "",
          tag: title?.tag ?? "",
          synopsis: title?.synopsis ?? "",
          filters: title?.filters ?? {},
          similarIds: title?.similarIds ?? [],
          episodes: title?.episodes ?? [],
        }),
        fromValues: (values, existing) => {
          const picked = values.filters as FilterValues;
          const episodes = values.episodes as Episode[];
          return {
            ...existing,
            id: existing?.id ?? createId(COPY[kind].noun),
            kind,
            title: String(values.title),
            meta: String(values.meta),
            rating: String(values.rating) || undefined,
            tag: String(values.tag) || undefined,
            synopsis: String(values.synopsis) || undefined,
            similarIds: (values.similarIds as string[]).filter((id) => id !== existing?.id),
            episodes: kind === "drama" && episodes.length ? episodes : undefined,
            filters: picked,
            ...siteFieldsFromFilters(filters, picked),
            review: existing?.review ?? { status: "pending", passedRuleIds: [] },
          };
        },
      }}
      deleteMessage={(title) => `This removes “${title.title}” from the catalog and from every section. This can't be undone.`}
    />
  );
}
