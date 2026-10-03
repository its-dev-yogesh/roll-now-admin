import { useState, type ReactNode } from "react";
import { EntityForm, type FieldSpec, type FormValues } from "@/components/form";
import { Button, DataTable, EditIcon, Modal, PlusIcon, TrashIcon, type DataTableColumn } from "@/components/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { reportError } from "@/hooks/resource";
import { PageHeader } from "./PageHeader";
import { useShellSearch } from "./shell";
import { TopBarTabs } from "./TopBarTabs";

export interface ResourceStore<T> {
  add: (item: T) => Promise<void>;
  update: (id: string, patch: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export interface ResourceForm<T> {
  fields: FieldSpec[] | ((values: FormValues) => FieldSpec[]);
  toValues: (item?: T) => FormValues;
  fromValues: (values: FormValues, existing?: T) => T;
}

export interface ResourcePageProps<T extends { id: string }> {
  title: string;
  description: string;
  /** Singular noun for buttons and dialogs, e.g. "movie". */
  noun: string;
  items: T[];
  store?: ResourceStore<T>;
  columns: DataTableColumn<T>[];
  /** Text the top-bar search matches against. */
  searchText: (item: T) => string;
  /** Filter pills in the top bar; an "All" pill is added first. */
  tabs?: { label: string; match: (item: T) => boolean }[];
  form?: ResourceForm<T>;
  canCreate?: boolean;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
  deleteMessage?: (item: T) => string;
  /** Extra cleanup when deleting (references in other stores). */
  onDelete?: (item: T) => void;
  rowActions?: (item: T) => ReactNode;
  headerActions?: ReactNode;
  /** Rendered between the header and the table (stats, notes). */
  children?: ReactNode;
}

/** List + search + filter pills + create/edit modal + delete confirm — the frame of every admin list page. */
export function ResourcePage<T extends { id: string }>({
  title,
  description,
  noun,
  items,
  store,
  columns,
  searchText,
  tabs,
  form,
  canCreate = Boolean(form),
  canEdit = () => Boolean(form),
  canDelete = () => Boolean(store),
  deleteMessage,
  onDelete,
  rowActions,
  headerActions,
  children,
}: ResourcePageProps<T>) {
  const search = useShellSearch();
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const open = (item: T | "new" | null) => {
    setFormError(null);
    setEditing(item);
  };

  const active = tabs?.[Number(tab)];
  const rows = items.filter((item) => (!active || active.match(item)) && searchText(item).toLowerCase().includes(search));

  const withActions: DataTableColumn<T>[] = [
    ...columns,
    {
      header: "",
      align: "right",
      render: (row) => (
        <div className="inline-end">
          {rowActions?.(row)}
          {canEdit(row) && (
            <Button variant="ghost" small iconOnly aria-label={`Edit ${noun}`} onClick={() => open(row)}>
              <EditIcon size={16} />
            </Button>
          )}
          {store && canDelete(row) && (
            <Button
              variant="ghost"
              small
              iconOnly
              aria-label={`Delete ${noun}`}
              onClick={() =>
                confirm({ title: `Delete ${noun}`, message: deleteMessage?.(row) ?? `This permanently removes the ${noun}. This can't be undone.` }, () =>
                  store
                    .remove(row.id)
                    .then(() => onDelete?.(row))
                    .catch(reportError),
                )
              }
            >
              <TrashIcon size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {tabs && (
        <TopBarTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All", count: items.length },
            ...tabs.map((option, index) => ({ value: String(index), label: option.label, count: items.filter(option.match).length })),
          ]}
        />
      )}
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {headerActions}
            {canCreate && store && (
              <Button variant="primary" onClick={() => open("new")}>
                <PlusIcon size={16} />
                Add {noun}
              </Button>
            )}
          </>
        }
      />
      {children}
      <DataTable columns={withActions} rows={rows} keyExtractor={(row) => row.id} emptyMessage={`No ${title.toLowerCase()} match.`} />

      {editing && form && store && (
        <Modal
          title={editing === "new" ? `Add ${noun}` : `Edit ${noun}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              {formError && <span className="form-error grow">{formError}</span>}
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="resource-form" disabled={saving}>
                {saving ? "Saving…" : editing === "new" ? `Add ${noun}` : "Save changes"}
              </Button>
            </>
          }
        >
          <EntityForm
            id="resource-form"
            fields={form.fields}
            initial={form.toValues(editing === "new" ? undefined : editing)}
            onSubmit={async (values) => {
              const existing = editing === "new" ? undefined : editing;
              const item = form.fromValues(values, existing);
              setSaving(true);
              setFormError(null);
              try {
                await (existing ? store.update(existing.id, item) : store.add(item));
                setEditing(null);
              } catch (error) {
                setFormError((error as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          />
        </Modal>
      )}
      {dialog}
    </div>
  );
}
