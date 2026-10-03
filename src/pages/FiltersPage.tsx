import { useState } from "react";
import { EntityForm, type FieldSpec, type FormValues } from "@/components/form";
import { PageHeader, TopBarTabs, useShellSearch } from "@/components/layout";
import { Badge, Button, Card, EditIcon, Modal, PlusIcon, Switch, Thumb, TrashIcon } from "@/components/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { reloadAll, reportError } from "@/hooks/resource";
import { filtersApi, useFilters, useLiveShows, useRolls, useTitles } from "@/hooks/useStores";
import { CONTENT_PLURAL } from "@/lib/content";
import { slugify } from "@/lib/slug";
import type { ContentType, FilterGroup, FilterOption, Managed } from "@/types/catalog";

const CONTENT_TYPES = Object.keys(CONTENT_PLURAL) as ContentType[];

const GROUP_FIELDS: FieldSpec[] = [
  {
    kind: "row",
    fields: [
      { kind: "text", name: "name", label: "Filter name", required: true, placeholder: "Mood" },
      { kind: "text", name: "slug", label: "Slug", hint: "Used in site URLs and the API; generated from the name if empty" },
    ],
  },
  { kind: "textarea", name: "description", label: "What it's for" },
  { kind: "chips", name: "appliesTo", label: "Applies to", options: CONTENT_TYPES.map((type) => ({ id: type, label: CONTENT_PLURAL[type] })) },
  { kind: "switch", name: "multiple", label: "Allow several options per item", hint: "On for languages or actors, off for a certificate" },
  { kind: "switch", name: "showOnSite", label: "Show on the site", hint: "Viewers can browse by it (filter chips, category tiles)" },
];

const OPTION_FIELDS: FieldSpec[] = [
  {
    kind: "row",
    fields: [
      { kind: "text", name: "label", label: "Option", required: true, placeholder: "Feel-good" },
      { kind: "text", name: "slug", label: "Slug", hint: "Generated from the label if empty" },
    ],
  },
  { kind: "text", name: "imageUrl", label: "Image URL", hint: "Optional tile / key art, e.g. /genres/comedy.jpg or /actors/name.jpg" },
  { kind: "switch", name: "active", label: "Active", hint: "Inactive options stay on existing items but can't be picked" },
];

type Editing = { kind: "group"; group?: FilterGroup } | { kind: "option"; group: FilterGroup; option?: FilterOption };

/** Dynamic filters: main filters (Genre, Language, Actors…) and their options, all admin-defined. */
export function FiltersPage() {
  const filters = useFilters();
  const titles = useTitles();
  const shows = useLiveShows();
  const rolls = useRolls();
  const search = useShellSearch();
  const [focus, setFocus] = useState("all");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const allItems: Managed[] = [...titles.items, ...shows.items, ...rolls.items];
  const usage = (groupId: string, optionId: string) => allItems.filter((item) => item.filters[groupId]?.includes(optionId)).length;

  /** Saves via the filter endpoints, then reloads everything (deletes cascade to tagged items + sections). */
  async function save(values: FormValues) {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing.kind === "group") {
        await filtersApi.saveGroup(
          {
            name: String(values.name),
            slug: String(values.slug) || slugify(String(values.name)),
            description: String(values.description),
            appliesTo: values.appliesTo as ContentType[],
            multiple: Boolean(values.multiple),
            showOnSite: Boolean(values.showOnSite),
          },
          editing.group?.id,
        );
      } else {
        await filtersApi.saveOption(
          editing.group.id,
          { label: String(values.label), slug: String(values.slug), imageUrl: String(values.imageUrl), active: Boolean(values.active) },
          editing.option?.id,
        );
      }
      await reloadAll();
      setEditing(null);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const run = (action: () => Promise<unknown>) => action().then(reloadAll).catch(reportError);

  const groups = filters.items.filter((group) => focus === "all" || group.id === focus);

  return (
    <div>
      <TopBarTabs
        value={focus}
        onChange={setFocus}
        options={[{ value: "all", label: "All filters", count: filters.items.length }, ...filters.items.map((group) => ({ value: group.id, label: group.name, count: group.options.length }))]}
      />
      <PageHeader
        title="Filters"
        description="Main filters and their options — Genre, Category, Language, Actors and anything else you add. Content is tagged with them and the site browses by them."
        actions={
          <Button variant="primary" onClick={() => setEditing({ kind: "group" })}>
            <PlusIcon size={16} />
            New filter
          </Button>
        }
      />

      <div className="stack">
        {groups.map((group) => {
          const options = group.options.filter((option) => option.label.toLowerCase().includes(search));
          return (
            <Card
              key={group.id}
              title={group.name}
              meta={group.description}
              actions={
                <div className="inline">
                  <Button small onClick={() => setEditing({ kind: "option", group })}>
                    <PlusIcon size={14} />
                    Option
                  </Button>
                  <Button variant="ghost" small iconOnly aria-label={`Edit ${group.name}`} onClick={() => setEditing({ kind: "group", group })}>
                    <EditIcon size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    small
                    iconOnly
                    aria-label={`Delete ${group.name}`}
                    onClick={() =>
                      confirm(
                        { title: `Delete the ${group.name} filter?`, message: `Its ${group.options.length} options are removed from every item, and page sections built on it are deleted.` },
                        () => run(() => filtersApi.deleteGroup(group.id)),
                      )
                    }
                  >
                    <TrashIcon size={16} />
                  </Button>
                </div>
              }
            >
              <div className="inline wrap mb">
                {group.appliesTo.map((type) => (
                  <Badge key={type} tone="accent">
                    {CONTENT_PLURAL[type]}
                  </Badge>
                ))}
                <Badge>{group.multiple ? "Multiple choice" : "Single choice"}</Badge>
                <Badge tone={group.showOnSite ? "success" : "neutral"}>{group.showOnSite ? "Shown on site" : "Internal"}</Badge>
              </div>
              <div className="list">
                {options.map((option) => (
                  <div key={option.id} className="list-row">
                    {option.imageUrl && <Thumb seed={option.id} src={option.imageUrl} width={64} radius={8} fit="cover" />}
                    <div className="grow">
                      <div className="strong">{option.label}</div>
                      <div className="muted small">
                        /{option.slug} · used by {usage(group.id, option.id)}
                      </div>
                    </div>
                    <Switch label={`${option.label} active`} checked={option.active} onChange={(active) => run(() => filtersApi.saveOption(group.id, { ...option, active }, option.id))} />
                    <Button variant="ghost" small iconOnly aria-label={`Edit ${option.label}`} onClick={() => setEditing({ kind: "option", group, option })}>
                      <EditIcon size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      small
                      iconOnly
                      aria-label={`Delete ${option.label}`}
                      onClick={() =>
                        confirm({ title: `Delete “${option.label}”?`, message: `It's removed from the ${usage(group.id, option.id)} items that use it.` }, () =>
                          run(() => filtersApi.deleteOption(group.id, option.id)),
                        )
                      }
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </div>
                ))}
                {options.length === 0 && <p className="muted small">No options{search && " match your search"}.</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <Modal
          title={editing.kind === "group" ? (editing.group ? `Edit ${editing.group.name}` : "New filter") : editing.option ? `Edit ${editing.option.label}` : `New ${editing.group.name} option`}
          onClose={() => setEditing(null)}
          footer={
            <>
              {formError && <span className="form-error grow">{formError}</span>}
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="filter-form" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <EntityForm
            id="filter-form"
            fields={editing.kind === "group" ? GROUP_FIELDS : OPTION_FIELDS}
            initial={
              editing.kind === "group"
                ? {
                    name: editing.group?.name ?? "",
                    slug: editing.group?.slug ?? "",
                    description: editing.group?.description ?? "",
                    appliesTo: editing.group?.appliesTo ?? ["movie", "show"],
                    multiple: editing.group?.multiple ?? true,
                    showOnSite: editing.group?.showOnSite ?? true,
                  }
                : { label: editing.option?.label ?? "", slug: editing.option?.slug ?? "", imageUrl: editing.option?.imageUrl ?? "", active: editing.option?.active ?? true }
            }
            onSubmit={save}
          />
        </Modal>
      )}
      {dialog}
    </div>
  );
}
