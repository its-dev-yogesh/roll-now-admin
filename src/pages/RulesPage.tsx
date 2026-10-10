import { ResourcePage } from "@/components/layout";
import { Badge, Switch } from "@/components/ui";
import { useRules } from "@/hooks/useStores";
import { capitalize, CONTENT_PLURAL, SEVERITY_TONE } from "@/lib/content";
import { createId } from "@/lib/ids";
import type { ContentType, Rule, RuleSeverity } from "@/types/catalog";

const SEVERITIES: RuleSeverity[] = ["critical", "high", "medium", "low"];
const CONTENT_TYPES = Object.keys(CONTENT_PLURAL) as ContentType[];

/** Media-verification rules. Reviewers confirm every active rule before content is approved. */
export function RulesPage() {
  const rules = useRules();

  return (
    <ResourcePage<Rule>
      title="Rule book"
      noun="rule"
      description="What media must not contain. Every active rule is a checklist item in the review queue; a critical failure means reject."
      items={rules.items}
      store={rules}
      searchText={(rule) => `${rule.title} ${rule.description}`}
      tabs={SEVERITIES.map((severity) => ({ label: capitalize(severity), match: (rule) => rule.severity === severity }))}
      columns={[
        {
          header: "Rule",
          render: (row) => (
            <div>
              <div className="font-semibold">{row.title}</div>
              <div className="muted text-xs">{row.description}</div>
            </div>
          ),
        },
        { header: "Severity", render: (row) => <Badge tone={SEVERITY_TONE[row.severity]}>{capitalize(row.severity)}</Badge> },
        {
          header: "Applies to",
          render: (row) => (row.appliesTo.length === CONTENT_TYPES.length ? "Everything" : row.appliesTo.map((type) => CONTENT_PLURAL[type]).join(", ")),
        },
        { header: "Active", render: (row) => <Switch label={`${row.title} active`} checked={row.active} onChange={(active) => rules.update(row.id, { active })} />, align: "center" },
      ]}
      form={{
        fields: [
          { kind: "text", name: "title", label: "Rule", required: true, placeholder: "No hate speech" },
          { kind: "textarea", name: "description", label: "What reviewers check", required: true },
          { kind: "select", name: "severity", label: "Severity", options: SEVERITIES.map((value) => ({ value, label: capitalize(value) })) },
          { kind: "chips", name: "appliesTo", label: "Applies to", options: CONTENT_TYPES.map((type) => ({ id: type, label: CONTENT_PLURAL[type] })) },
          { kind: "switch", name: "active", label: "Active" },
        ],
        toValues: (rule) => ({
          title: rule?.title ?? "",
          description: rule?.description ?? "",
          severity: rule?.severity ?? "medium",
          appliesTo: rule?.appliesTo ?? CONTENT_TYPES,
          active: rule?.active ?? true,
        }),
        fromValues: (values, existing) => ({
          ...existing,
          id: existing?.id ?? createId("rule"),
          title: String(values.title),
          description: String(values.description),
          severity: values.severity as RuleSeverity,
          appliesTo: values.appliesTo as ContentType[],
          active: Boolean(values.active),
        }),
      }}
    />
  );
}
