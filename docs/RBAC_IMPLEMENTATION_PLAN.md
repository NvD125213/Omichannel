# Implementation Plan: Hệ thống phân quyền RBAC

## ✅ Đã hoàn thành

### 1. Core Infrastructure ✅

- [x] Cập nhật `User` type để bao gồm `permissions` field
- [x] Cập nhật `BaseNavItem` type để hỗ trợ `permissions` field
- [x] Implement permission management trong `AuthContext`:
  - State `permissions` để lưu permissions
  - Helper functions: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`
  - Sync permissions từ API `/me` response
  - Clear permissions khi logout

### 2. Helper Hooks & Utilities ✅

- [x] Tạo `hooks/use-permissions.ts`:
  - `useHasPermission(permission)`
  - `useHasAnyPermission(permissions[])`
  - `useHasAllPermissions(permissions[])`
  - `useCanAccessRoute(permissions[])`
  - `usePermissions()` - all-in-one hook

### 3. Route Protection ✅

- [x] Cập nhật `ProtectedRoute` component:
  - Thêm prop `requiredPermissions`
  - Check permissions trước khi render
  - Redirect đến `/forbidden` nếu không có quyền
- [x] Tạo `constants/route-permissions.ts`:
  - Mapping routes → permissions
  - Helper `getRequiredPermissions(pathname)`
  - Helper `isProtectedRoute(pathname)`

### 4. UI Protection ✅

- [x] Tạo `PermissionGuard` component:
  - Support `permission` prop (single)
  - Support `anyPermissions` prop (OR logic)
  - Support `allPermissions` prop (AND logic)
  - Support `fallback` prop

### 5. Sidebar Filtering ✅

- [x] Tạo `lib/filter-nav-items.ts`:
  - `filterNavItemsByPermissions()` - filter nav items
  - `filterNavGroupsByPermissions()` - filter nav groups
  - `canAccessNavItem()` - check single item
- [x] Cập nhật `AppSidebar`:
  - Import `filterNavGroupsByPermissions`
  - Filter sidebar items dựa trên user permissions
  - Use `useMemo` để optimize performance

### 6. Documentation ✅

- [x] Tạo workflow: `.agent/workflows/rbac-implementation.md`
- [x] Tạo guide: `docs/RBAC_GUIDE.md` với examples đầy đủ

## 📋 Việc cần làm tiếp theo

### 1. API Integration

**Priority: HIGH**

- [ ] Verify API `/me` endpoint trả về `permissions` field
  - Check response structure
  - Xác nhận format của permissions (array of strings)
  - Test với nhiều users khác nhau

- [ ] Handle case API không trả về permissions:
  - Log warning
  - Set empty array
  - Display message cho user

### 2. Forbidden Page

**Priority: MEDIUM**

- [ ] Tạo page `/forbidden` (nếu chưa có):
  ```tsx
  // app/forbidden/page.tsx
  export default function ForbiddenPage() {
    return (
      <div>
        <h1>403 - Forbidden</h1>
        <p>Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }
  ```

### 3. Apply Protection cho các Pages hiện có

**Priority: HIGH**

Áp dụng `ProtectedRoute` cho các pages sau:

- [ ] `/users` - Wrap với `[PERMISSIONS.VIEW_USERS]`
- [ ] `/departments` - Wrap với `[PERMISSIONS.VIEW_DEPARTMENTS]`
- [ ] `/roles` - Wrap với `[PERMISSIONS.VIEW_ROLES]`
- [ ] `/permissions` - Wrap với `[PERMISSIONS.VIEW_PERMISSIONS]`
- [ ] `/tickets` - Wrap với `[PERMISSIONS.VIEW_TICKETS]`
- [ ] `/tickets/flows` - Wrap với `[PERMISSIONS.VIEW_TICKET_FLOWS]`

**Example:**

```tsx
// app/(protected)/users/page.tsx hoặc layout.tsx
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS]}>
      {/* Existing content */}
    </ProtectedRoute>
  );
}
```

### 4. Apply UI Guards cho Action Buttons

**Priority: MEDIUM**

Wrap các action buttons với `PermissionGuard`:

**Users Page:**

- [ ] "Tạo user" button → `PERMISSIONS.CREATE_USERS`
- [ ] "Edit" button → `PERMISSIONS.EDIT_USERS`
- [ ] "Delete" button → `PERMISSIONS.DELETE_USERS`

**Tickets Page:**

- [ ] "Tạo ticket" button → `PERMISSIONS.CREATE_TICKET`
- [ ] "Assign" button → `PERMISSIONS.ASSIGN_TICKET`
- [ ] "Edit" button → `PERMISSIONS.EDIT_TICKET`

**Example:**

```tsx
<PermissionGuard permission={PERMISSIONS.CREATE_USERS}>
  <Button onClick={handleCreateUser}>Tạo user mới</Button>
</PermissionGuard>
```

### 5. Testing

**Priority: HIGH**

- [ ] **Test Authentication Flow:**
  - Login với user có permissions
  - Login với user không có permissions
  - Logout và verify permissions cleared

- [ ] **Test Sidebar:**
  - Verify menu items ẩn/hiện đúng
  - Test với user có permissions khác nhau
  - Test nested menu items

- [ ] **Test Route Protection:**
  - Access protected route bằng URL trực tiếp (khi có quyền)
  - Access protected route bằng URL trực tiếp (khi không có quyền)
  - Verify redirect đến `/forbidden`

- [ ] **Test UI Guards:**
  - Verify buttons/components ẩn/hiện đúng
  - Test với nhiều permission scenarios

### 6. Error Handling

**Priority: MEDIUM**

- [ ] Xử lý case permissions = `null` hoặc `undefined`
- [ ] Xử lý case API trả về invalid permission format
- [ ] Add error boundary cho permission-related errors
- [ ] Log warnings cho debugging

### 7. Performance Optimization

**Priority: LOW**

- [x] Sử dụng `useMemo` trong `AppSidebar` (done)
- [ ] Consider caching permissions
- [ ] Optimize re-renders khi permissions thay đổi

### 8. Developer Experience

**Priority: LOW**

- [ ] Add DevTools để view current permissions
- [ ] Add console logging (development only)
- [ ] Create helper để test với mock permissions

## 🎯 Action Items theo thứ tự ưu tiên

1. **Verify API Integration** - Đảm bảo `/me` API trả về permissions
2. **Create Forbidden Page** - Tạo page 403
3. **Apply Protection cho Main Pages** - Protect users, tickets, roles, etc.
4. **Testing** - Test đầy đủ flow
5. **Apply UI Guards** - Protect action buttons
6. **Error Handling** - Handle edge cases
7. **Documentation Updates** - Update docs nếu cần

## 📊 Progress Tracking

- **Infrastructure**: 100% ✅
- **API Integration**: 0% ⏳
- **Page Protection**: 0% ⏳
- **UI Guards**: 0% ⏳
- **Testing**: 0% ⏳
- **Overall**: ~60%

## 🔗 Related Files

### Created Files:

- `f:\Omichannel\hooks\use-permissions.ts`
- `f:\Omichannel\constants\route-permissions.ts`
- `f:\Omichannel\lib\filter-nav-items.ts`
- `f:\Omichannel\components\permission-guard.tsx`
- `f:\Omichannel\.agent\workflows\rbac-implementation.md`
- `f:\Omichannel\docs\RBAC_GUIDE.md`

### Modified Files:

- `f:\Omichannel\lib\types.ts`
- `f:\Omichannel\contexts\auth-context.tsx`
- `f:\Omichannel\components\protected-route.tsx`
- `f:\Omichannel\components\app-sidebar.tsx`

### Existing Files (No changes needed):

- `f:\Omichannel\constants\permission.ts`
- `f:\Omichannel\constants\sidebar-data.ts` (already has permissions)
