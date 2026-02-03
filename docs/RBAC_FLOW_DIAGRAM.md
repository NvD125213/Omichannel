# Luồng hoạt động hệ thống RBAC

## 🔄 Sequence Diagram

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌──────────┐
│  User   │         │ Frontend │         │  Auth   │         │ Backend  │
│         │         │   App    │         │ Context │         │   API    │
└────┬────┘         └────┬─────┘         └────┬────┘         └────┬─────┘
     │                   │                    │                   │
     │  1. Login         │                    │                   │
     ├──────────────────>│                    │                   │
     │                   │                    │                   │
     │                   │  2. loginApi()     │                   │
     │                   ├───────────────────────────────────────>│
     │                   │                    │                   │
     │                   │  3. tokens + data  │                   │
     │                   │<───────────────────────────────────────┤
     │                   │                    │                   │
     │                   │  4. setTokens()    │                   │
     │                   ├───────────────────>│                   │
     │                   │                    │                   │
     │                   │                    │  5. useMe()       │
     │                   │                    ├──────────────────>│
     │                   │                    │                   │
     │                   │                    │  6. user + perms  │
     │                   │                    │<──────────────────┤
     │                   │                    │                   │
     │                   │                    │  7. setUser()     │
     │                   │                    │  setPermissions() │
     │                   │                    │─┐                 │
     │                   │                    │ │                 │
     │                   │                    │<┘                 │
     │                   │                    │                   │
     │  8. Navigate      │                    │                   │
     ├──────────────────>│                    │                   │
     │                   │                    │                   │
     │                   │  9. Filter Sidebar │                   │
     │                   │<───────────────────┤                   │
     │                   │  (based on perms)  │                   │
     │                   │                    │                   │
     │ 10. View Sidebar  │                    │                   │
     │<──────────────────┤                    │                   │
     │ (only allowed)    │                    │                   │
     │                   │                    │                   │
     │ 11. Click Menu    │                    │                   │
     ├──────────────────>│                    │                   │
     │                   │                    │                   │
     │                   │ 12. Check Route    │                   │
     │                   │    Permission      │                   │
     │                   ├───────────────────>│                   │
     │                   │                    │                   │
     │                   │ 13. hasPermission  │                   │
     │                   │<───────────────────┤                   │
     │                   │    = true/false    │                   │
     │                   │                    │                   │
     │ 14a. Render Page  │                    │                   │
     │<──────────────────┤ (if allowed)       │                   │
     │                   │                    │                   │
     │ 14b. Redirect     │                    │                   │
     │     /forbidden    │ (if not allowed)   │                   │
     │<──────────────────┤                    │                   │
     │                   │                    │                   │
```

## 📊 Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        AuthProvider                         │
│                                                             │
│  State:                                                     │
│   - user: User | null                                       │
│   - permissions: Permission[]                               │
│   - isLoading: boolean                                      │
│                                                             │
│  Functions:                                                 │
│   - hasPermission(p)                                        │
│   - hasAnyPermission(ps)                                    │
│   - hasAllPermissions(ps)                                   │
│   - login()                                                 │
│   - logout()                                                │
└──┬──────────────────────────────────────────────────────┬───┘
   │                                                      │
   │ provides context                                     │
   │                                                      │
   ├──────────────┬───────────────┬──────────────────────┤
   │              │               │                      │
   ▼              ▼               ▼                      ▼
┌──────────┐  ┌─────────┐  ┌──────────────┐  ┌────────────────┐
│AppSidebar│  │Protected│  │ Permission   │  │ Permission     │
│          │  │ Route   │  │ Guard        │  │ Hooks          │
├──────────┤  ├─────────┤  ├──────────────┤  ├────────────────┤
│Filter    │  │Check    │  │Show/Hide     │  │useHasPermission│
│Menu Items│  │Before   │  │UI Elements   │  │usePermissions  │
│          │  │Render   │  │              │  │useCanAccessRoute│
└──────────┘  └─────────┘  └──────────────┘  └────────────────┘
```

## 🎯 Permission Check Decision Tree

```
                    ┌────────────────┐
                    │ User Action    │
                    │ (navigate/view)│
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Authenticated? │
                    └───────┬────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
              YES                       NO
                │                        │
                ▼                        ▼
        ┌───────────────┐       ┌──────────────┐
        │ Has Permissions│       │ Redirect to  │
        │ Requirement?  │       │  /not-found  │
        └───────┬───────┘       └──────────────┘
                │
        ┌───────┴────────┐
        │                │
       YES              NO
        │                │
        ▼                ▼
┌────────────────┐  ┌──────────┐
│ Check User     │  │  Allow   │
│ Permissions    │  │  Access  │
└───────┬────────┘  └──────────┘
        │
        ▼
┌─────────────────┐
│ hasAnyPermission│
│ (required)      │
└───────┬─────────┘
        │
    ┌───┴────┐
    │        │
  TRUE     FALSE
    │        │
    ▼        ▼
┌────────┐ ┌────────────┐
│ Allow  │ │ Redirect to│
│ Access │ │ /forbidden │
└────────┘ └────────────┘
```

## 📁 File Structure & Dependencies

```
f:\Omichannel\
│
├── constants\
│   ├── permission.ts              ← Permission constants
│   ├── route-permissions.ts       ← Route → Permissions mapping
│   └── sidebar-data.ts            ← Sidebar with permissions
│
├── contexts\
│   └── auth-context.tsx           ← Core permission management
│
├── components\
│   ├── app-sidebar.tsx            ← Uses: filterNavGroupsByPermissions
│   ├── protected-route.tsx        ← Route guard component
│   └── permission-guard.tsx       ← UI element guard
│
├── hooks\
│   └── use-permissions.ts         ← Hooks: useHasPermission, etc.
│
├── lib\
│   ├── types.ts                   ← User & NavItem with permissions
│   └── filter-nav-items.ts        ← Filter utilities
│
└── docs\
    ├── RBAC_GUIDE.md              ← Usage guide
    └── RBAC_IMPLEMENTATION_PLAN.md ← Implementation plan
```

## 🔑 Key Components Explained

### 1. AuthContext

- **Trách nhiệm**: Quản lý authentication và permissions state
- **Exports**: user, permissions, hasPermission functions
- **Data source**: API `/me` endpoint

### 2. ProtectedRoute

- **Trách nhiệm**: Guard routes dựa trên permissions
- **Input**: requiredPermissions
- **Output**: Render children hoặc redirect

### 3. PermissionGuard

- **Trách nhiệm**: Show/hide UI elements
- **Input**: permission(s) + fallback
- **Output**: Render children hoặc fallback

### 4. filterNavGroupsByPermissions

- **Trách nhiệm**: Filter sidebar items
- **Input**: navGroups + userPermissions
- **Output**: Filtered navGroups

### 5. Permission Hooks

- **Trách nhiệm**: Provide easy access to permission checks
- **Examples**: useHasPermission, useHasAnyPermission
- **Return**: boolean hoặc functions

## 🚀 Data Flow Example

**Scenario**: User với permissions = `['view_users', 'create_users']` truy cập `/users`

```
1. User navigates to /users
   ↓
2. ProtectedRoute checks requiredPermissions = ['view_users']
   ↓
3. Calls hasAnyPermission(['view_users'])
   ↓
4. Returns true (user has 'view_users')
   ↓
5. Renders page content
   ↓
6. Page renders "Create User" button wrapped in PermissionGuard
   ↓
7. PermissionGuard checks permission = 'create_users'
   ↓
8. Returns true (user has 'create_users')
   ↓
9. Button is rendered
```

**Scenario 2**: User không có permissions truy cập `/roles`

```
1. User navigates to /roles
   ↓
2. ProtectedRoute checks requiredPermissions = ['view_roles']
   ↓
3. Calls hasAnyPermission(['view_roles'])
   ↓
4. Returns false (user doesn't have 'view_roles')
   ↓
5. Redirects to /forbidden
   ↓
6. Shows 403 error page
```
