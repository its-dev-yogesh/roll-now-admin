import { PermissionMatrix } from "@/components/content";
import { ResourcePage } from "@/components/layout";
import { Badge } from "@/components/ui";
import { useRoles, useUsers } from "@/hooks/useStores";
import { createId } from "@/lib/ids";
import { ACTIONS, RESOURCES, type Permission, type Role } from "@/types/catalog";

const TOTAL = RESOURCES.length * ACTIONS.length;

/** Roles bundle permissions ("area:action"); users get exactly one role. */
export function RolesPage() {
  const roles = useRoles();
  const users = useUsers().items;
  const members = (role: Role) => users.filter((user) => user.roleId === role.id).length;

  return (
    <ResourcePage<Role>
      title="Roles & permissions"
      noun="role"
      description="What each role can see and change. Permissions are area × action, e.g. “Review queue: publish”."
      items={roles.items}
      store={roles}
      searchText={(role) => `${role.name} ${role.description}`}
      columns={[
        {
          header: "Role",
          render: (row) => (
            <div>
              <div className="inline strong">
                {row.name}
                {row.system && <Badge>Built-in</Badge>}
              </div>
              <div className="muted small">{row.description}</div>
            </div>
          ),
        },
        { header: "Permissions", render: (row) => `${row.permissions.length} / ${TOTAL}`, align: "center" },
        { header: "Members", render: (row) => members(row), align: "center" },
      ]}
      canDelete={(role) => !role.system && members(role) === 0}
      deleteMessage={(role) => `Delete the ${role.name} role? No one is using it.`}
      form={{
        fields: [
          { kind: "text", name: "name", label: "Role name", required: true, placeholder: "Regional editor" },
          { kind: "textarea", name: "description", label: "Description" },
          {
            kind: "custom",
            name: "permissions",
            label: "Permissions",
            render: (value, set, values) => <PermissionMatrix value={value as Permission[]} onChange={set} disabled={Boolean(values.system)} />,
          },
        ],
        toValues: (role) => ({ name: role?.name ?? "", description: role?.description ?? "", permissions: role?.permissions ?? ["content:view"], system: role?.system }),
        fromValues: (values, existing) => ({
          ...existing,
          id: existing?.id ?? createId("role"),
          name: String(values.name),
          description: String(values.description),
          permissions: values.permissions as Permission[],
        }),
      }}
    />
  );
}
