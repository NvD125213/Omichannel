# Cấu trúc mã nguồn CGV Omichannel

```text
F:/Omichannel
├─ app/                          # App Router (page/layout/route)
│  ├─ (auth)/                    # Nhóm trang xác thực
│  ├─ (dashboard)/               # Nhóm trang nghiệp vụ chính
│  │  ├─ customers/
│  │  │  └─ tags/
│  │  ├─ users/
│  │  ├─ tickets/
│  │  │  ├─ flows/
│  │  │  ├─ tags/
│  │  │  ├─ templates/
│  │  │  └─ [ticketId]/
│  │  ├─ departments/
│  │  │  └─ [departmentId]/
│  │  ├─ settings/
│  │  │  ├─ account/
│  │  │  ├─ appearance/
│  │  │  ├─ display/
│  │  │  └─ notifications/
│  │  ├─ dashboard/
│  │  ├─ dashboard2/
│  │  ├─ payment-dashboard/
│  │  ├─ payment-transactions/
│  │  └─ pricing/
│  ├─ (errors)/                  # Trang lỗi chuẩn
│  └─ api/
│     └─ chat/                   # API route nội bộ Next.js
│
├─ features/                     # Module theo domain nghiệp vụ
│  ├─ customers/
│  ├─ users/
│  ├─ roles/
│  ├─ permissions/
│  ├─ departments/
│  ├─ groups/
│  ├─ tenants/
│  ├─ tickets/
│  │  ├─ ticket-list/
│  │  ├─ ticket-detail/
│  │  ├─ ticket-tag/
│  │  ├─ ticket-flow/
│  │  ├─ ticket-flow-instance/
│  │  ├─ ticket-flow-step/
│  │  ├─ ticket-template/
│  │  ├─ ticket-context/
│  │  └─ ticket-event/
│  ├─ chats/
│  ├─ auth/
│  ├─ dashboard/
│  ├─ dashboard2/
│  ├─ payment-dashboard/
│  ├─ payment-transactions/
│  ├─ levels/
│  └─ help-center/
│
├─ hooks/                        # Custom hooks (query/mutation/state)
│  ├─ customer/
│  ├─ user/
│  ├─ role/
│  ├─ permission/
│  ├─ department/
│  ├─ group/
│  ├─ tenant/
│  ├─ level/
│  ├─ tag/
│  ├─ ticket/
│  ├─ chatwoot/
│  └─ chatwoots/
│
├─ services/                     # Tầng gọi API theo domain
│  ├─ auth/
│  ├─ customer/
│  ├─ user/
│  ├─ role/
│  ├─ permission/
│  ├─ department/
│  ├─ group/
│  ├─ tenant/
│  ├─ level/
│  ├─ ticket/
│  ├─ chatwoot/
│  ├─ chatwoots/
│  └─ notification/
│
├─ components/                   # Shared components dùng xuyên dự án
│  ├─ ui/
│  ├─ ai-elements/
│  ├─ softphone/
│  └─ theme-customizer/
│
├─ lib/                          # API client, auth, socket, type dùng chung
├─ constants/                    # Hằng số, permission, sidebar, route config
├─ contexts/                     # React context providers
├─ helpers/                      # Helper functions
├─ utils/                        # Utility functions dùng chung
├─ config/                       # Cấu hình hệ thống
├─ packages/                     # Mã dùng chung theo package nội bộ
├─ scripts/                      # Script tiện ích
├─ docs/                         # Tài liệu dự án
├─ public/                       # Static assets
│
├─ package.json
├─ next.config.ts
├─ tsconfig.json
├─ eslint.config.mjs
├─ postcss.config.mjs
├─ proxy.ts
└─ components.json
```

## Ghi chú

- Cấu trúc trên tập trung vào mã nguồn nghiệp vụ và thành phần kỹ thuật chính.
- Không liệt kê thư mục build/tạm như `.next`, `node_modules`.
