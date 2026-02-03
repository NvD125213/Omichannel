# Hướng dẫn sử dụng hệ thống phân quyền (RBAC)

## 📚 Mục lục

- [Tổng quan](#tổng-quan)
- [Cách sử dụng](#cách-sử-dụng)
  - [1. Bảo vệ Routes](#1-bảo-vệ-routes)
  - [2. Ẩn/Hiện UI Components](#2-ẩnhiện-ui-components)
  - [3. Sử dụng Permission Hooks](#3-sử-dụng-permission-hooks)
  - [4. Thêm mới Permission](#4-thêm-mới-permission)
  - [5. Cấu hình Sidebar Items](#5-cấu-hình-sidebar-items)

## Tổng quan

Hệ thống phân quyền (RBAC - Role-Based Access Control) cho phép:

- ✅ Lưu trữ permissions từ API vào AuthContext
- ✅ Tự động ẩn/hiện menu items trong sidebar
- ✅ Bảo vệ routes với permission guard
- ✅ Kiểm soát hiển thị UI components

## Cách sử dụng

### 1. Bảo vệ Routes

#### Cách 1: Sử dụng ProtectedRoute component

```tsx
// app/(protected)/users/page.tsx
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS]}>
      <div>
        <h1>Danh sách người dùng</h1>
        {/* Page content */}
      </div>
    </ProtectedRoute>
  );
}
```

#### Cách 2: Sử dụng ở Layout level

```tsx
// app/(protected)/users/layout.tsx
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS]}>
      {children}
    </ProtectedRoute>
  );
}
```

**Lưu ý:**

- Nếu user không có permission → redirect đến `/forbidden`
- Nếu không truyền `requiredPermissions` → chỉ check authentication

### 2. Ẩn/Hiện UI Components

#### Sử dụng PermissionGuard Component

```tsx
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/constants/permission";
import { Button } from "@/components/ui/button";

function UserManagement() {
  return (
    <div>
      <h1>Quản lý người dùng</h1>

      {/* Chỉ hiện button nếu có quyền CREATE_USERS */}
      <PermissionGuard permission={PERMISSIONS.CREATE_USERS}>
        <Button>Tạo user mới</Button>
      </PermissionGuard>

      {/* Hiện button nếu có 1 trong 2 quyền */}
      <PermissionGuard
        anyPermissions={[PERMISSIONS.EDIT_USERS, PERMISSIONS.DELETE_USERS]}
      >
        <Button>Edit/Delete</Button>
      </PermissionGuard>

      {/* Hiện button nếu có tất cả các quyền */}
      <PermissionGuard
        allPermissions={[PERMISSIONS.VIEW_USERS, PERMISSIONS.EDIT_USERS]}
      >
        <Button>View & Edit</Button>
      </PermissionGuard>

      {/* Với fallback khi không có quyền */}
      <PermissionGuard
        permission={PERMISSIONS.CREATE_USERS}
        fallback={<p>Bạn không có quyền tạo user</p>}
      >
        <Button>Tạo user</Button>
      </PermissionGuard>
    </div>
  );
}
```

### 3. Sử dụng Permission Hooks

#### useHasPermission - Check 1 permission

```tsx
import { useHasPermission } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/constants/permission";

function UserList() {
  const canCreateUser = useHasPermission(PERMISSIONS.CREATE_USERS);

  return (
    <div>
      <h1>Danh sách user</h1>
      {canCreateUser && <Button>Tạo user mới</Button>}
    </div>
  );
}
```

#### useHasAnyPermission - Check ít nhất 1 permission

```tsx
import { useHasAnyPermission } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/constants/permission";

function UserActions() {
  const canModifyUser = useHasAnyPermission([
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
  ]);

  if (!canModifyUser) {
    return <p>Bạn không có quyền chỉnh sửa</p>;
  }

  return <Button>Chỉnh sửa</Button>;
}
```

#### useHasAllPermissions - Check tất cả permissions

```tsx
import { useHasAllPermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/constants/permission";

function SuperFeature() {
  const hasFullAccess = useHasAllPermissions([
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
  ]);

  return hasFullAccess ? <SuperAdminPanel /> : <LimitedPanel />;
}
```

#### usePermissions - Lấy tất cả helpers

```tsx
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/constants/permission";

function ComplexComponent() {
  const { permissions, hasPermission, hasAnyPermission, canAccessRoute } =
    usePermissions();

  console.log("All permissions:", permissions);

  return (
    <div>
      {hasPermission(PERMISSIONS.VIEW_USERS) && <UserTable />}
      {hasAnyPermission([PERMISSIONS.CREATE_USERS, PERMISSIONS.EDIT_USERS]) && (
        <EditButton />
      )}
    </div>
  );
}
```

### 4. Thêm mới Permission

**Bước 1:** Thêm permission constant vào `constants/permission.ts`

```typescript
export const PERMISSIONS = {
  // ... existing permissions

  // New Feature
  VIEW_NEW_FEATURE: "view_new_feature",
  CREATE_NEW_FEATURE: "create_new_feature",
  EDIT_NEW_FEATURE: "edit_new_feature",
  DELETE_NEW_FEATURE: "delete_new_feature",
} as const;
```

**Bước 2:** Thêm route permission mapping vào `constants/route-permissions.ts`

```typescript
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // ... existing routes
  "/new-feature": [PERMISSIONS.VIEW_NEW_FEATURE],
};
```

**Bước 3:** Sử dụng trong page/component

```tsx
<ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_NEW_FEATURE]}>
  <NewFeaturePage />
</ProtectedRoute>
```

### 5. Cấu hình Sidebar Items

Thêm `permissions` field vào sidebar items trong `constants/sidebar-data.ts`:

```typescript
export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "Quản lý hệ thống",
      items: [
        {
          title: "Quản lý người dùng",
          url: "/users",
          icon: IconUsers,
          permissions: [PERMISSIONS.VIEW_USERS], // Chỉ hiện khi có quyền
        },
        {
          title: "Quản lý ticket",
          icon: IconReportMoney,
          permissions: [PERMISSIONS.VIEW_TICKETS],
          items: [
            {
              title: "Danh sách ticket",
              url: "/tickets",
              icon: IconCreditCard,
              permissions: [PERMISSIONS.VIEW_TICKETS],
            },
            {
              title: "Luồng ticket",
              url: "/tickets/flows",
              icon: Workflow,
              permissions: [PERMISSIONS.VIEW_TICKET_FLOWS],
            },
          ],
        },
      ],
    },
  ],
};
```

**Lưu ý:**

- Menu items không có `permissions` field sẽ luôn hiển thị
- Nested items cũng sẽ được filter theo permissions
- Nếu tất cả nested items bị ẩn → parent item cũng sẽ bị ẩn

## 🔍 Debug Tips

### Check user permissions

```tsx
import { useAuth } from "@/contexts/auth-context";

function Debug() {
  const { permissions } = useAuth();

  console.log("Current user permissions:", permissions);

  return null;
}
```

### Check route permissions

```tsx
import { getRequiredPermissions } from "@/constants/route-permissions";
import { usePathname } from "next/navigation";

function RouteDebug() {
  const pathname = usePathname();
  const required = getRequiredPermissions(pathname);

  console.log("Current route:", pathname);
  console.log("Required permissions:", required);

  return null;
}
```

## 📋 Checklist triển khai permission cho feature mới

- [ ] Thêm permission constants vào `constants/permission.ts`
- [ ] Thêm route permissions vào `constants/route-permissions.ts`
- [ ] Thêm permissions vào sidebar items (nếu có)
- [ ] Wrap page/layout với `ProtectedRoute`
- [ ] Sử dụng `PermissionGuard` cho các UI elements
- [ ] Test với user có/không có quyền
- [ ] Test navigation từ sidebar
- [ ] Test direct URL access

## 🎯 Best Practices

1. **Luôn sử dụng PERMISSIONS constants** - Không hard-code permission strings
2. **Bảo vệ cả route và UI** - Route guard + UI guard để bảo mật toàn diện
3. **Có fallback UI** - Show message khi user không có quyền thay vì để trống
4. **Test thoroughly** - Test với nhiều roles khác nhau
5. **Document permissions** - Comment rõ ràng permissions cần thiết

## ❓ FAQ

**Q: API /me không trả về permissions?**
A: Đảm bảo backend API trả về field `permissions` trong response. Nếu chưa có, cần update backend.

**Q: Sidebar vẫn hiện items mặc dù không có quyền?**
A: Check xem sidebar item đã có field `permissions` chưa. Nếu không có field này, item sẽ luôn hiển thị.

**Q: Route guard không hoạt động?**
A: Ensure `ProtectedRoute` đã được wrap ở đúng vị trí (page hoặc layout level).

**Q: Làm sao để 1 route có nhiều permissions options?**
A: Sử dụng array permissions trong `ROUTE_PERMISSIONS`. User cần có ít nhất 1 permission trong array.
