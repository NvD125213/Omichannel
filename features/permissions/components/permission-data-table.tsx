"use client";

import React, { useState, useMemo } from "react";
import { Filter, FingerprintIcon, Home, LockIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionTableToolbar } from "./permission-data-table-toolbar";
import rolePermission from "@/constants/role-permission.json";
import { useGetRoles } from "@/hooks/role/use-get-role";
import {
  useGetPermissions,
  useGetPermissionsByRole,
} from "@/hooks/permission/use-get-permisison";
import { useAssignRolePermission } from "@/hooks/permission/use-action-permission";
import { useMe } from "@/hooks/user/use-me";
import { Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { IconBuilding, IconLock } from "@tabler/icons-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  model?: string | null;
  belong_to?: string | null;
}

// Helper function to get the model/belong_to field
const getPermissionModel = (p: Permission): string | null => {
  return p.belong_to || p.model || null;
};

type PermissionRow = {
  model: string;
  [key: string]: Permission | string | null;
};

export default function PermissionsMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(),
  );

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );

  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [debouncedRoleSearch, setDebouncedRoleSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRoleSearch(roleSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [roleSearchTerm]);

  const { data: roles } = useGetRoles({
    page: 1,
    page_size: 100,
    search: debouncedRoleSearch,
  });

  // Get current user for tenant_id
  const { data: currentUser } = useMe();

  // Get all available permissions
  const { data: allPermissionsData } = useGetPermissions();

  // Get mutation for assigning permissions
  const assignRolePermissionMutation = useAssignRolePermission();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (roles?.roles && roles.roles.length > 0 && !selectedRole) {
      const firstRoleId = roles.roles[0].id;
      setSelectedRole(firstRoleId);
      setSelectedRoles(new Set([firstRoleId]));
    }
  }, [roles, selectedRole]);

  // Sync selectedRoles with selectedRole for permission fetching
  React.useEffect(() => {
    const rolesArray = Array.from(selectedRoles);
    if (rolesArray.length > 0 && rolesArray[0] !== selectedRole) {
      // Take the first selected role
      setSelectedRole(rolesArray[0]);
    }
  }, [selectedRoles, selectedRole]);

  // Get permissions for selected role
  const { data: rolePermissionsData } = useGetPermissionsByRole(
    selectedRole || "",
  );

  // Use allPermissionsData as rawData if available, otherwise fall back to static data
  const rawData = React.useMemo(() => {
    if (allPermissionsData) {
      return allPermissionsData as unknown as Record<string, Permission[]>;
    }
    return rolePermission.data as unknown as Record<string, Permission[]>;
  }, [allPermissionsData]);

  // Update selected permissions when role permissions change
  React.useEffect(() => {
    if (rolePermissionsData) {
      const rolePerms = rolePermissionsData as unknown as Record<
        string,
        Permission[]
      >;
      const newSelected = new Set<string>();

      // Iterate through all actions and collect permission IDs
      Object.values(rolePerms).forEach((perms) => {
        if (Array.isArray(perms)) {
          perms.forEach((p) => {
            if (p.id) {
              newSelected.add(p.id);
            }
          });
        }
      });

      setSelectedPermissions(newSelected);
    }
  }, [rolePermissionsData]);

  const actions = useMemo(() => {
    return Object.keys(rawData);
  }, [rawData]);

  const actionOptions = useMemo(() => {
    return actions.map((action) => ({
      label: action.charAt(0).toUpperCase() + action.slice(1),
      value: action,
    }));
  }, [actions]);

  const models = useMemo(() => {
    const modelSet = new Set<string>();
    Object.values(rawData).forEach((perms) => {
      perms.forEach((p) => {
        const model = getPermissionModel(p);
        if (model) {
          modelSet.add(model);
        }
      });
    });
    const modelArray = Array.from(modelSet).sort();
    return modelArray;
  }, [rawData]);

  const matrixData = useMemo(() => {
    return models.map((model) => {
      const row: PermissionRow = { model };

      actions.forEach((action) => {
        const actionPerms = rawData[action] || [];
        const permission = actionPerms.find(
          (p) => getPermissionModel(p) === model,
        );
        row[action] = permission || null;
      });

      return row;
    });
  }, [models, actions, rawData]);

  const filteredData = useMemo(() => {
    let filtered = matrixData;

    if (searchTerm) {
      filtered = filtered.filter((row) =>
        row.model.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedActions.size > 0) {
      filtered = filtered.filter((row) => {
        return Array.from(selectedActions).some(
          (action) => row[action] !== null,
        );
      });
    }

    return filtered;
  }, [matrixData, searchTerm, selectedActions]);

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const toggleAll = () => {
    if (selectedPermissions.size > 0) {
      setSelectedPermissions(new Set());
    } else {
      const allIds = new Set<string>();
      Object.values(rawData).forEach((perms) => {
        perms.forEach((p) => allIds.add(p.id));
      });
      setSelectedPermissions(allIds);
    }
  };

  const roleOptions = useMemo(() => {
    return (
      roles?.roles?.map((role) => ({
        label: role.name,
        value: role.id,
      })) ?? []
    );
  }, [roles]);

  const handleSave = () => {
    if (!selectedRole) {
      console.error("No role selected");
      return;
    }

    if (!currentUser?.tenant_id) {
      console.error("No tenant_id available");
      return;
    }

    const payload = {
      role_id: selectedRole,
      permission_ids: Array.from(selectedPermissions),
      tenant_id: currentUser.tenant_id,
    };

    assignRolePermissionMutation.mutate(payload, {
      onSuccess: () => {
        console.log("✅ Successfully saved permissions");
      },
    });
  };

  return (
    <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
      <AppBreadcrumb
        items={[
          {
            label: "Home",
            href: "/dashboard",
            icon: <Home className="size-4" />,
          },
          {
            label: "Phân quyền",
            href: "/permissions",
            icon: <FingerprintIcon className="size-4" />,
          },
          {
            label: "Quản lý vai trò",
            href: "/permissions",
            icon: <IconLock className="size-4" />,
          },
        ]}
      />

      <PermissionTableToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        actionOptions={actionOptions}
        roleOptions={roleOptions}
        selectedActions={selectedActions}
        selectedRoles={selectedRoles}
        setSelectedActions={setSelectedActions}
        setSelectedRoles={setSelectedRoles}
        onRoleSearch={setRoleSearchTerm}
        onToggleAll={toggleAll}
        selectedCount={selectedPermissions.size}
        onSave={handleSave}
        isSaving={assignRolePermissionMutation.isPending}
      />

      <div className="rounded-md border max-h-[calc(100vh-12rem)] overflow-auto relative">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-20">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[200px] sticky left-0 z-20 bg-background font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                Quyền hạn
              </TableHead>
              {actions.map((action) => (
                <TableHead
                  key={action}
                  className="text-center min-w-[100px] h-10 bg-background/95 backdrop-blur-sm"
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow
                key={row.model}
                className="hover:bg-muted/50 border-b last:border-0"
              >
                <TableCell className="font-medium sticky left-0 z-10 bg-background shadow-[1px_0_0_0_rgba(0,0,0,0.1)] py-2">
                  {row.model
                    .replace(/_/g, " ")
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </TableCell>

                {actions.map((action) => {
                  const permission = row[action] as Permission | null;

                  return (
                    <TableCell key={action} className="text-center p-2">
                      <div className="flex justify-center">
                        {permission ? (
                          <Checkbox
                            checked={selectedPermissions.has(permission.id)}
                            onCheckedChange={() =>
                              togglePermission(permission.id)
                            }
                            aria-label={`Select ${action} for ${row.model}`}
                            className="h-4 w-4"
                          />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="h-4 w-4 ml-2 rounded border border-dashed border-muted-foreground/40
                                inline-flex items-center justify-center text-muted-foreground/60 cursor-default"
                              >
                                <Minus className="h-3 w-3" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Không áp dụng quyền này
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Filter className="w-6 h-6 mb-2 opacity-20" />
            <p className="text-sm">Không tìm thấy quyền hạn</p>
          </div>
        )}
      </div>
    </div>
  );
}
