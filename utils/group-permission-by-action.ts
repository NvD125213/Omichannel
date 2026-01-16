interface Permission {
  id: string;
  name: string;
  description: string;
}

type GroupedPermissions = Record<string, Permission[]>;

export function groupPermissionsByAction(
  permissions: Permission[],
): GroupedPermissions {
  return permissions.reduce((acc, permission) => {
    // Lấy prefix trước dấu _
    const [action] = permission.name.split("_");

    // Nếu chưa tồn tại group thì tạo
    if (!acc[action]) {
      acc[action] = [];
    }

    acc[action].push(permission);

    return acc;
  }, {} as GroupedPermissions);
}
