import { ResourcePage } from "@/components/layout";
import { Badge, type BadgeTone } from "@/components/ui";
import { useRoles, useUsers } from "@/hooks/useStores";
import { capitalize, formatDate } from "@/lib/content";
import { createId } from "@/lib/ids";
import type { AdminUser, UserStatus } from "@/types/catalog";

const STATUS_TONE: Record<UserStatus, BadgeTone> = { active: "success", invited: "warning", suspended: "danger" };
const STATUSES: UserStatus[] = ["active", "invited", "suspended"];

/** The admin team: who can sign in and with which role. */
export function UsersPage() {
  const users = useUsers();
  const roles = useRoles().items;
  const roleName = (id: string) => roles.find((role) => role.id === id)?.name ?? "—";

  return (
    <ResourcePage<AdminUser & { password?: string }>
      title="Users"
      noun="user"
      description="Team members with access to this admin. What each can do comes from their role."
      items={users.items}
      store={users}
      searchText={(user) => `${user.name} ${user.email} ${roleName(user.roleId)}`}
      tabs={STATUSES.map((status) => ({ label: capitalize(status), match: (user) => user.status === status }))}
      columns={[
        {
          header: "User",
          render: (row) => (
            <div className="media">
              <span className="avatar avatar-sm">{row.name[0]}</span>
              <div>
                <div className="media-title">{row.name}</div>
                <div className="media-meta">{row.email}</div>
              </div>
            </div>
          ),
        },
        { header: "Role", render: (row) => <Badge tone="accent">{roleName(row.roleId)}</Badge> },
        { header: "Status", render: (row) => <Badge tone={STATUS_TONE[row.status]}>{capitalize(row.status)}</Badge> },
        { header: "Last active", render: (row) => <span className="muted">{formatDate(row.lastActiveAt)}</span> },
      ]}
      canDelete={(user) => user.roleId !== "super-admin" || users.items.filter((other) => other.roleId === "super-admin").length > 1}
      form={{
        fields: [
          {
            kind: "text",
            name: "password",
            label: "Password",
            hint: "Needed for new active users; leave empty to keep the current one",
          },
          {
            kind: "row",
            fields: [
              { kind: "text", name: "name", label: "Name", required: true },
              { kind: "email", name: "email", label: "Email", required: true, placeholder: "name@rollnow.studio" },
            ],
          },
          {
            kind: "row",
            fields: [
              { kind: "select", name: "roleId", label: "Role", options: roles.map((role) => ({ value: role.id, label: role.name })) },
              { kind: "select", name: "status", label: "Status", options: STATUSES.map((value) => ({ value, label: capitalize(value) })) },
            ],
          },
        ],
        toValues: (user) => ({ name: user?.name ?? "", email: user?.email ?? "", roleId: user?.roleId ?? roles[1]?.id ?? "", status: user?.status ?? "invited", password: "" }),
        fromValues: (values, existing) => ({
          ...existing,
          id: existing?.id ?? createId("u"),
          name: String(values.name),
          email: String(values.email),
          roleId: String(values.roleId),
          status: values.status as UserStatus,
          password: String(values.password ?? ""),
        }),
      }}
    />
  );
}
