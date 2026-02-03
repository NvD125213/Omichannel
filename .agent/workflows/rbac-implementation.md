---
description: Hướng dẫn triển khai hệ thống phân quyền RBAC
---

# Luồng triển khai hệ thống phân quyền (RBAC)

## 📋 Tổng quan

Xây dựng hệ thống Role-Based Access Control (RBAC) hoàn chỉnh để:

- Lưu trữ permissions từ API vào auth context
- Ẩn/hiện các menu items trong sidebar dựa trên permissions
- Bảo vệ routes với permission guard
- Kiểm soát hiển thị UI components dựa trên permissions

## 🔄 Luồng hoạt động

```
1. User đăng nhập
   ↓
2. Call API /me để lấy thông tin user + permissions
   ↓
3. Lưu permissions vào AuthContext
   ↓
4. Sidebar tự động filter items dựa trên permissions
   ↓
5. Protected routes check permissions trước khi render
   ↓
6. UI components sử dụng permission hooks để show/hide
```

## ✅ Các bước cần thực hiện

### Bước 1: Cập nhật User type để bao gồm permissions

**File**: `f:\Omichannel\lib\types.ts`

Thêm field `permissions` vào `User` interface:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
  permissions?: string[]; // Thêm field này
}
```

### Bước 2: Cập nhật NavItem types để hỗ trợ permissions

**File**: `f:\Omichannel\lib\types.ts`

Thêm field `permissions` vào `BaseNavItem`:

```typescript
interface BaseNavItem {
  title: string;
  badge?: string;
  badgeColor?: "violet" | "green";
  icon?: React.ElementType;
  permissions?: string[]; // Thêm field này để check quyền
}
```

### Bước 3: Implement permission functions trong AuthContext

**File**: `f:\Omichannel\contexts\auth-context.tsx`

- Thêm state để lưu permissions
- Implement các helper functions: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`
- Lấy permissions từ API response khi login hoặc khi useMe trả về data
- Export các functions qua context

### Bước 4: Cập nhật API response handling

**File**: `f:\Omichannel\hooks\user\use-me.ts` (nếu cần)

Đảm bảo API `/me` trả về permissions trong response:

```typescript
interface MeResponse {
  id: string;
  username: string;
  fullname: string;
  email: string;
  role: string;
  tenant_id: string;
  permissions: string[]; // Cần field này
}
```

### Bước 5: Tạo helper component để filter sidebar items

**File**: `f:\Omichannel\components\nav-group.tsx` hoặc tạo mới

Tạo helper function `filterNavItemsByPermissions` để:

- Nhận vào array of nav items và user permissions
- Filter ra các items mà user có quyền xem
- Xử lý nested items (collapsible items)

### Bước 6: Cập nhật ProtectedRoute với permission checking

**File**: `f:\Omichannel\components\protected-route.tsx`

Thêm props `requiredPermissions` và logic check:

- Nếu không có permissions → cho phép truy cập (optional guard)
- Nếu có permissions → check user có đủ quyền không
- Nếu không đủ quyền → redirect đến `/forbidden` hoặc `/not-found`

### Bước 7: Tạo route config với permissions mapping

**File**: `f:\Omichannel\constants\route-permissions.ts` (mới)

Tạo mapping giữa routes và permissions cần thiết:

```typescript
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/users": [PERMISSIONS.VIEW_USERS],
  "/roles": [PERMISSIONS.VIEW_ROLES],
  "/permissions": [PERMISSIONS.VIEW_PERMISSIONS],
  "/departments": [PERMISSIONS.VIEW_DEPARTMENTS],
  "/tickets": [PERMISSIONS.VIEW_TICKETS],
  "/tickets/flows": [PERMISSIONS.VIEW_TICKET_FLOWS],
  // ... etc
};
```

### Bước 8: Tạo custom hooks để sử dụng permissions

**File**: `f:\Omichannel\hooks\use-permissions.ts` (mới)

Tạo các hooks tiện lợi:

- `useHasPermission(permission: string)` → boolean
- `useHasAnyPermission(permissions: string[])` → boolean
- `useHasAllPermissions(permissions: string[])` → boolean
- `useCanAccess(route: string)` → boolean

### Bước 9: Áp dụng permission guard cho từng page

**Ví dụ**: `f:\Omichannel\app\(protected)\users\page.tsx`

Wrap page content với ProtectedRoute:

```typescript
<ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS]}>
  {/* Page content */}
</ProtectedRoute>
```

Hoặc sử dụng layout-level protection trong `layout.tsx`.

### Bước 10: Cập nhật sidebar để filter items

**File**: `f:\Omichannel\components\app-sidebar.tsx` (hoặc tương tự)

Sử dụng helper function để filter sidebar items trước khi render:

```typescript
const filteredNavGroups = filterNavGroupsByPermissions(
  sidebarData.navGroups,
  user?.permissions || [],
);
```

### Bước 11: Tạo UI guards cho components

Tạo component `PermissionGuard` để wrap các phần UI:

```typescript
<PermissionGuard permission={PERMISSIONS.CREATE_USERS}>
  <Button>Tạo user mới</Button>
</PermissionGuard>
```

### Bước 12: Testing

- Test login flow để đảm bảo permissions được lưu đúng
- Test sidebar items hiển thị đúng theo permissions
- Test route guards hoạt động chính xác
- Test UI components show/hide đúng

## 🎯 Kết quả mong đợi

Sau khi hoàn thành:

1. ✅ Permissions được lưu trong AuthContext sau khi login
2. ✅ Sidebar tự động ẩn/hiện menu items dựa trên permissions
3. ✅ Routes được bảo vệ - user không thể truy cập trực tiếp qua URL nếu thiếu quyền
4. ✅ UI components có thể sử dụng hooks để kiểm tra permissions
5. ✅ Code dễ maintain và mở rộng

## 📚 Files liên quan

- `f:\Omichannel\constants\permission.ts` - Permission constants
- `f:\Omichannel\contexts\auth-context.tsx` - Auth context
- `f:\Omichannel\components\protected-route.tsx` - Route guard
- `f:\Omichannel\constants\sidebar-data.ts` - Sidebar configuration
- `f:\Omichannel\lib\types.ts` - Type definitions
