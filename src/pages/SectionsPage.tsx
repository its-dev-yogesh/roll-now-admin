import { useState } from "react";
import { EntityForm, type FieldSpec, type FormValues } from "@/components/form";
import { PageHeader, TopBarTabs, useShellSearch } from "@/components/layout";
import { ArrowDownIcon, ArrowUpIcon, Badge, Button, Card, cx, EditIcon, Modal, PlusIcon, Switch, Thumb, TrashIcon } from "@/components/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { useFilters, useLiveShows, useRolls, useSections, useTitles } from "@/hooks/useStores";
import { CONTENT_PLURAL, groupsFor } from "@/lib/content";
import { AUTO_LABEL, contentOf, resolveSection, type SectionData } from "@/lib/sections";
import { slugify } from "@/lib/slug";
import { createId } from "@/lib/ids";
import type { AutoSource, ContentType, Section, SectionLayout, SectionSource, SitePage } from "@/types/catalog";

const PAGES: { value: SitePage; label: string; path: string }[] = [
  { value: "home", label: "Home", path: "/" },
  { value: "movies", label: "Movies", path: "/movies" },
  { value: "shows", label: "Shows", path: "/shows" },
  { value: "live", label: "Live", path: "/live" },
];

const LAYOUTS: Record<SectionLayout, string> = {
  hero: "Hero carousel",
  landscape: "Landscape cards (16:9)",
  portrait: "Portrait cards (9:16)",
  poster: "Poster cards (5:4)",
  tiles: "Filter tiles",
};

const SOURCE_TYPES = [
  { value: "manual", label: "Hand-picked items" },
  { value: "filter", label: "Everything with a filter option" },
  { value: "group", label: "A filter's options as tiles" },
  { value: "auto", label: "Automatic" },
];

const CONTENT_TYPES = Object.keys(CONTENT_PLURAL) as ContentType[];

/** The rails/blocks on each site page, in order — what used to be hard-coded on the site. */
export function SectionsPage() {
  const sections = useSections();
  const filters = useFilters().items;
  const data: SectionData = { titles: useTitles().items, liveShows: useLiveShows().items, rolls: useRolls().items, filters };
  const search = useShellSearch();
  const [page, setPage] = useState<SitePage>("home");
  const [editing, setEditing] = useState<Section | "new" | null>(null);
  const { confirm, dialog } = useConfirm();

  const onPage = sections.items.filter((section) => section.page === page);
  const rows = onPage.filter((section) => section.title.toLowerCase().includes(search));

  function describe(source: SectionSource) {
    const group = "groupId" in source ? filters.find((candidate) => candidate.id === source.groupId) : undefined;
    switch (source.type) {
      case "manual":
        return `${source.itemIds.length} hand-picked`;
      case "filter":
        return `${CONTENT_PLURAL[source.contentType]} where ${group?.name ?? "?"} = ${group?.options.find((option) => option.id === source.optionId)?.label ?? "?"}`;
      case "group":
        return `${group?.name ?? "?"} options as tiles`;
      case "auto":
        return AUTO_LABEL[source.rule];
    }
  }

  const fields = (values: FormValues): FieldSpec[] => {
    const type = values.contentType as ContentType;
    const group = filters.find((candidate) => candidate.id === values.groupId);
    return [
      {
        kind: "row",
        fields: [
          { kind: "text", name: "title", label: "Title on the page", required: true, placeholder: "Top rated" },
          { kind: "text", name: "slug", label: "Slug", hint: "For its “See all” page; generated from the title if empty" },
        ],
      },
      {
        kind: "row",
        fields: [
          { kind: "select", name: "layout", label: "Layout", options: Object.entries(LAYOUTS).map(([value, label]) => ({ value, label })) },
          { kind: "select", name: "sourceType", label: "Content", options: SOURCE_TYPES },
        ],
      },
      {
        kind: "select",
        name: "contentType",
        label: "Content type",
        show: (current) => current.sourceType === "manual" || current.sourceType === "filter",
        options: CONTENT_TYPES.map((value) => ({ value, label: CONTENT_PLURAL[value] })),
      },
      {
        kind: "chips",
        name: "itemIds",
        label: "Items, in order",
        show: (current) => current.sourceType === "manual",
        options: contentOf(data, type).map((item) => ({ id: item.id, label: item.label })),
        emptyMessage: "No approved items of this type yet.",
      },
      {
        kind: "select",
        name: "groupId",
        label: "Filter",
        show: (current) => current.sourceType === "filter" || current.sourceType === "group",
        options: (values.sourceType === "filter" ? groupsFor(filters, type) : filters).map((candidate) => ({ value: candidate.id, label: candidate.name })),
      },
      {
        kind: "select",
        name: "optionId",
        label: "Option",
        show: (current) => current.sourceType === "filter",
        options: (group?.options ?? []).map((option) => ({ value: option.id, label: option.label })),
      },
      {
        kind: "select",
        name: "rule",
        label: "Automatic list",
        show: (current) => current.sourceType === "auto",
        options: Object.entries(AUTO_LABEL).map(([value, label]) => ({ value, label })),
      },
      { kind: "switch", name: "active", label: "Visible on the site" },
    ];
  };

  function toValues(section?: Section): FormValues {
    const source = section?.source;
    return {
      title: section?.title ?? "",
      slug: section?.slug ?? "",
      layout: section?.layout ?? "poster",
      sourceType: source?.type ?? "manual",
      contentType: source && "contentType" in source ? source.contentType : page === "shows" ? "show" : page === "live" ? "live" : "movie",
      itemIds: source?.type === "manual" ? source.itemIds : [],
      groupId: source && "groupId" in source ? source.groupId : (filters[0]?.id ?? ""),
      optionId: source?.type === "filter" ? source.optionId : "",
      rule: source?.type === "auto" ? source.rule : "top-rated",
      active: section?.active ?? true,
    };
  }

  function save(values: FormValues) {
    const contentType = values.contentType as ContentType;
    const groupId = String(values.groupId);
    const optionId = String(values.optionId) || (filters.find((group) => group.id === groupId)?.options[0]?.id ?? "");
    const source: SectionSource =
      values.sourceType === "manual"
        ? { type: "manual", contentType, itemIds: values.itemIds as string[] }
        : values.sourceType === "filter"
          ? { type: "filter", contentType, groupId, optionId }
          : values.sourceType === "group"
            ? { type: "group", groupId }
            : { type: "auto", rule: values.rule as AutoSource };
    const section: Section = {
      id: editing && editing !== "new" ? editing.id : createId(page),
      page,
      title: String(values.title),
      slug: String(values.slug) || slugify(String(values.title)),
      layout: values.layout as SectionLayout,
      source,
      active: Boolean(values.active),
    };
    if (editing && editing !== "new") sections.update(section.id, section);
    else sections.add(section);
    setEditing(null);
  }

  return (
    <div>
      <TopBarTabs
        value={page}
        onChange={setPage}
        options={PAGES.map((option) => ({ value: option.value, label: option.label, count: sections.items.filter((section) => section.page === option.value).length }))}
      />
      <PageHeader
        title="Sections"
        description={`What the ${PAGES.find((option) => option.value === page)?.label} page (${PAGES.find((option) => option.value === page)?.path}) shows, top to bottom.`}
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            <PlusIcon size={16} />
            Add section
          </Button>
        }
      />

      <div className="stack">
        {rows.map((section) => {
          const index = onPage.indexOf(section);
          const preview = resolveSection(section, data);
          const tile = section.layout === "portrait" ? "portrait" : "landscape";
          return (
            <Card
              key={section.id}
              title={
                <span className="inline">
                  <span className="muted">{index + 1}.</span> {section.title}
                </span>
              }
              meta={`${LAYOUTS[section.layout]} · ${describe(section.source)}`}
              actions={
                <div className="inline">
                  <Switch label={`${section.title} visible`} checked={section.active} onChange={(active) => sections.update(section.id, { active })} />
                  <Button variant="ghost" small iconOnly aria-label="Move up" disabled={index === 0} onClick={() => sections.move(section.id, -1)}>
                    <ArrowUpIcon size={15} />
                  </Button>
                  <Button variant="ghost" small iconOnly aria-label="Move down" disabled={index === onPage.length - 1} onClick={() => sections.move(section.id, 1)}>
                    <ArrowDownIcon size={15} />
                  </Button>
                  <Button variant="ghost" small iconOnly aria-label={`Edit ${section.title}`} onClick={() => setEditing(section)}>
                    <EditIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    small
                    iconOnly
                    aria-label={`Delete ${section.title}`}
                    onClick={() => confirm({ title: `Delete “${section.title}”?`, message: "The section disappears from the page. The content in it stays." }, () => sections.remove(section.id))}
                  >
                    <TrashIcon size={16} />
                  </Button>
                </div>
              }
            >
              {!section.active && <Badge className="mb">Hidden on the site</Badge>}
              <div className="strip">
                {preview.map((item) => (
                  <figure key={item.id} className={cx("strip-item", tile)}>
                    <Thumb seed={item.seed} src={item.src} view={tile} width={tile === "portrait" ? 84 : 150} radius={12} />
                    <figcaption className="truncate">{item.label}</figcaption>
                  </figure>
                ))}
                {preview.length === 0 && <p className="muted text-xs">{section.source.type === "auto" && section.source.rule === "continue-watching" ? "Filled per viewer from their watch history." : "Nothing to show yet — the section is skipped on the site."}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <Modal
          title={editing === "new" ? "Add section" : `Edit ${editing.title}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="section-form">
                Save
              </Button>
            </>
          }
        >
          <EntityForm id="section-form" fields={fields} initial={toValues(editing === "new" ? undefined : editing)} onSubmit={save} />
        </Modal>
      )}
      {dialog}
    </div>
  );
}
