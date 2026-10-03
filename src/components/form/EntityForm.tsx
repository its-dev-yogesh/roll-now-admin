import { useState, type ReactNode } from "react";
import { ChipPicker, FieldRow, FormField, Input, Select, Switch, Textarea, type ChipOption } from "@/components/ui";
import type { FilterGroup, FilterValues } from "@/types/catalog";

export type FormValues = Record<string, unknown>;

interface Base {
  name: string;
  label: string;
  hint?: string;
  /** Only render while this returns true (e.g. price only for paid shows). */
  show?: (values: FormValues) => boolean;
}

export type FieldSpec =
  | (Base & { kind: "text" | "email" | "number" | "textarea" | "datetime"; placeholder?: string; required?: boolean; disabled?: boolean })
  | (Base & { kind: "select"; options: { value: string; label: string }[] })
  | (Base & { kind: "chips"; options: ChipOption[]; single?: boolean; emptyMessage?: string })
  | (Base & { kind: "switch" })
  | (Base & { kind: "filters"; groups: FilterGroup[] })
  | (Base & { kind: "custom"; render: (value: unknown, set: (value: unknown) => void, values: FormValues) => ReactNode })
  | { kind: "row"; fields: FieldSpec[]; show?: (values: FormValues) => boolean };

export interface EntityFormProps {
  id: string;
  /** A field list, or a function of the current values for fields that depend on each other. */
  fields: FieldSpec[] | ((values: FormValues) => FieldSpec[]);
  initial: FormValues;
  onSubmit: (values: FormValues) => void | Promise<void>;
}

const INPUT_TYPE = { text: "text", email: "email", number: "number", datetime: "datetime-local" } as const;

/** Schema-driven form used by every create/edit modal in the admin. */
export function EntityForm({ id, fields, initial, onSubmit }: EntityFormProps) {
  const [values, setValues] = useState<FormValues>(initial);
  const set = (name: string) => (value: unknown) => setValues((current) => ({ ...current, [name]: value }));

  function render(field: FieldSpec, key: number | string): ReactNode {
    if (field.show && !field.show(values)) return null;
    if (field.kind === "row") return <FieldRow key={key}>{field.fields.map(render)}</FieldRow>;

    const value = values[field.name];
    if (field.kind === "filters") {
      const filters = (value ?? {}) as FilterValues;
      return field.groups.map((group) => (
        <FormField key={group.id} group label={group.name} hint={group.description}>
          <ChipPicker
            single={!group.multiple}
            options={group.options.filter((option) => option.active).map((option) => ({ id: option.id, label: option.label }))}
            selected={filters[group.id] ?? []}
            onChange={(selected) => set(field.name)({ ...filters, [group.id]: selected })}
            emptyMessage="No options yet — add some on the Filters page."
          />
        </FormField>
      ));
    }

    let control: ReactNode;
    switch (field.kind) {
      case "textarea":
        control = <Textarea required={field.required} placeholder={field.placeholder} value={String(value ?? "")} onChange={(event) => set(field.name)(event.target.value)} />;
        break;
      case "select":
        control = (
          <Select value={String(value ?? "")} onChange={(event) => set(field.name)(event.target.value)}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
        break;
      case "chips":
        control = <ChipPicker options={field.options} single={field.single} selected={(value as string[]) ?? []} onChange={set(field.name)} emptyMessage={field.emptyMessage} />;
        break;
      case "switch":
        return (
          <div key={field.name} className="inline">
            <Switch checked={Boolean(value)} onChange={set(field.name)} label={field.label} />
            <div className="grow">
              <div className="field-label">{field.label}</div>
              {field.hint && <div className="field-hint">{field.hint}</div>}
            </div>
          </div>
        );
      case "custom":
        control = field.render(value, set(field.name), values);
        break;
      default:
        control = (
          <Input
            type={INPUT_TYPE[field.kind]}
            required={field.required}
            disabled={field.disabled}
            placeholder={field.placeholder}
            value={String(value ?? "")}
            onChange={(event) => set(field.name)(field.kind === "number" ? Number(event.target.value) : event.target.value)}
          />
        );
    }
    return (
      <FormField key={field.name} group={field.kind === "chips" || field.kind === "custom"} label={field.label} hint={field.hint}>
        {control}
      </FormField>
    );
  }

  return (
    <form
      id={id}
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(values);
      }}
    >
      {(typeof fields === "function" ? fields(values) : fields).map(render)}
    </form>
  );
}
