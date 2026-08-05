/**
 * Permission Constants
 * Danh sách toàn bộ permission key trong hệ thống
 */

export const PERMISSIONS = {
  // Users
  VIEW_USERS: "view_users",
  CREATE_USERS: "create_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  CURRENT_USER: "current_user",
  VIEW_USER_GROUPS: "view_user_groups",

  // Roles
  VIEW_ROLES: "view_roles",
  CREATE_ROLES: "create_roles",
  EDIT_ROLES: "edit_roles",
  DELETE_ROLES: "delete_roles",
  ASSIGN_PERMISSIONS_TO_ROLE: "assign_permissions_to_role",
  DELETE_PERMISSION_FROM_ROLE: "delete_permission_from_role",

  // Permissions
  VIEW_PERMISSIONS: "view_permissions",
  CREATE_PERMISSIONS: "create_permissions",
  EDIT_PERMISSIONS: "edit_permissions",
  DELETE_PERMISSIONS: "delete_permissions",
  VIEW_ROLE_PERMISSIONS_BY_ROLE_ID: "view_role_permissions_by_role_id",

  // Tickets
  VIEW_TICKETS: "view_tickets",
  CREATE_TICKET: "create_ticket",
  EDIT_TICKET: "edit_ticket",
  DELETE_TICKET: "delete_ticket",
  ASSIGN_TICKET: "assign_ticket",

  // Ticket Events
  VIEW_TICKET_EVENTS: "view_ticket_events",
  CREATE_TICKET_EVENT: "create_ticket_event",
  EDIT_TICKET_EVENT: "edit_ticket_event",
  DELETE_TICKET_EVENT: "delete_ticket_event",

  // Ticket Templates
  VIEW_TICKET_TEMPLATES: "view_ticket_templates",
  CREATE_TICKET_TEMPLATE: "create_ticket_template",
  EDIT_TICKET_TEMPLATE: "edit_ticket_template",
  DELETE_TICKET_TEMPLATE: "delete_ticket_template",

  // Ticket Contexts
  VIEW_TICKET_CONTEXTS: "view_ticket_contexts",
  CREATE_TICKET_CONTEXT: "create_ticket_context",
  EDIT_TICKET_CONTEXT: "edit_ticket_context",
  DELETE_TICKET_CONTEXT: "delete_ticket_context",

  // Ticket Extensions
  VIEW_TICKET_EXTENSIONS: "view_ticket_extensions",
  CREATE_TICKET_EXTENSION: "create_ticket_extension",
  EDIT_TICKET_EXTENSION: "edit_ticket_extension",
  DELETE_TICKET_EXTENSION: "delete_ticket_extension",

  // Ticket Flows
  VIEW_TICKET_FLOWS: "view_ticket_flows",
  VIEW_TICKET_FLOW_BY_ID: "view_ticket_flow_by_id",
  CREATE_TICKET_FLOW: "create_ticket_flow",
  EDIT_TICKET_FLOW: "edit_ticket_flow",
  DELETE_TICKET_FLOW: "delete_ticket_flow",

  // Ticket Flow Instances
  VIEW_TICKET_FLOW_INSTANCES: "view_ticket_flow_instances",
  VIEW_TICKET_FLOW_INSTANCE_BY_ID: "view_ticket_flow_instance_by_id",
  CREATE_TICKET_FLOW_INSTANCE: "create_ticket_flow_instance",
  EDIT_TICKET_FLOW_INSTANCE: "edit_ticket_flow_instance",
  DELETE_TICKET_FLOW_INSTANCE: "delete_ticket_flow_instance",

  // Ticket Flow Steps
  VIEW_TICKET_FLOW_STEPS: "view_ticket_flow_steps",
  VIEW_TICKET_FLOW_STEP_BY_ID: "view_ticket_flow_step_by_id",
  CREATE_TICKET_FLOW_STEP: "create_ticket_flow_step",
  EDIT_TICKET_FLOW_STEP: "edit_ticket_flow_step",
  DELETE_TICKET_FLOW_STEP: "delete_ticket_flow_step",

  // Departments
  VIEW_DEPARTMENTS: "view_departments",
  VIEW_DEPARTMENT_BY_ID: "view_department_by_id",
  CREATE_DEPARTMENT: "create_department",
  EDIT_DEPARTMENT: "edit_department",
  DELETE_DEPARTMENT: "delete_department",

  // Groups
  VIEW_GROUPS: "view_groups",
  VIEW_GROUP_BY_ID: "view_group_by_id",
  VIEW_GROUP_DETAIL_BY_ID: "view_group_detail_by_id",
  CREATE_GROUP: "create_group",
  EDIT_GROUP: "edit_group",
  DELETE_GROUP: "delete_group",
  ASSIGN_USER_TO_GROUP: "assign_user_to_group",
  DELETE_USER_GROUP: "delete_user_group",

  // Levels
  VIEW_LEVELS: "view_levels",
  VIEW_LEVEL_BY_ID: "view_level_by_id",
  CREATE_LEVEL: "create_level",
  EDIT_LEVEL: "edit_level",
  DELETE_LEVEL: "delete_level",

  // Tags
  VIEW_TAGS: "view_tags",
  VIEW_TAG_BY_ID: "view_tag_by_id",
  CREATE_TAG: "create_tag",
  EDIT_TAG: "edit_tag",
  DELETE_TAG: "delete_tag",

  // Logs
  VIEW_LOGS: "view_logs",

  // Faqs
  VIEW_FAQS: "view_faqs",
  VIEW_FAQ_BY_ID: "view_faq_by_id",
  CREATE_FAQ: "create_faq",
  EDIT_FAQ: "edit_faq",
  DELETE_FAQ: "delete_faq",
  SEARCH_FAQS: "search_faqs",
  IMPORT_FAQS: "import_faqs",

  // AI Configs
  VIEW_AI_CONFIGS: "view_ai_configs",
  VIEW_AI_CONFIG_BY_ID: "view_ai_config_by_id",
  CREATE_AI_CONFIG: "create_ai_config",
  EDIT_AI_CONFIG: "edit_ai_config",
  DELETE_AI_CONFIG: "delete_ai_config",

  // Sources
  VIEW_SOURCES: "view_sources",
  VIEW_SOURCE_BY_ID: "view_source_by_id",
  CREATE_SOURCE: "create_source",
  EDIT_SOURCE: "edit_source",
  DELETE_SOURCE: "delete_source",

  // Customers (NEW)
  VIEW_CUSTOMERS: "view_customers",
  VIEW_CUSTOMER_BY_ID: "view_customer_by_id",
  CREATE_CUSTOMER: "create_customer",
  EDIT_CUSTOMER: "edit_customer",
  DELETE_CUSTOMER: "delete_customer",

  // Customer provided info
  VIEW_CUSTOMER_PROVIDED_INFO: "view_customer_provided_info",
  CREATE_CUSTOMER_PROVIDED_INFO: "create_customer_provided_info",
  EDIT_CUSTOMER_PROVIDED_INFO: "edit_customer_provided_info",
  DELETE_CUSTOMER_PROVIDED_INFO: "delete_customer_provided_info",

  // Tenants (NEW)
  VIEW_TENANTS: "view_tenants",
  CREATE_TENANT: "create_tenant",
  EDIT_TENANT: "edit_tenant",
  DELETE_TENANT: "delete_tenant",

  // Messaging — accounts
  VIEW_MESSAGING_ACCOUNTS: "view_messaging_accounts",
  CREATE_MESSAGING_ACCOUNT: "create_messaging_account",
  EDIT_MESSAGING_ACCOUNT: "edit_messaging_account",
  DELETE_MESSAGING_ACCOUNT: "delete_messaging_account",
  SYNC_MESSAGING_INTEGRATION: "sync_messaging_integration",

  // Messaging — conversations
  VIEW_MESSAGING_CONVERSATIONS: "view_messaging_conversations",
  CREATE_MESSAGING_CONVERSATION: "create_messaging_conversation",
  EDIT_MESSAGING_CONVERSATION: "edit_messaging_conversation",
  DELETE_MESSAGING_CONVERSATION: "delete_messaging_conversation",
  ASSIGN_MESSAGING_CONVERSATION: "assign_messaging_conversation",
  BULK_MESSAGING_ACTIONS: "bulk_messaging_actions",

  // Messaging — messages
  SEND_MESSAGING_MESSAGE: "send_messaging_message",
  DELETE_MESSAGING_MESSAGE: "delete_messaging_message",

  // Messaging — inboxes
  VIEW_MESSAGING_INBOXES: "view_messaging_inboxes",
  CREATE_MESSAGING_INBOX: "create_messaging_inbox",
  EDIT_MESSAGING_INBOX: "edit_messaging_inbox",
  MANAGE_MESSAGING_INBOX_MEMBERS: "manage_messaging_inbox_members",

  // Messaging — labels
  VIEW_MESSAGING_LABELS: "view_messaging_labels",
  CREATE_MESSAGING_LABEL: "create_messaging_label",
  DELETE_MESSAGING_LABEL: "delete_messaging_label",

  // Messaging — custom filters
  VIEW_MESSAGING_CUSTOM_FILTERS: "view_messaging_custom_filters",
  CREATE_MESSAGING_CUSTOM_FILTER: "create_messaging_custom_filter",
  EDIT_MESSAGING_CUSTOM_FILTER: "edit_messaging_custom_filter",
  DELETE_MESSAGING_CUSTOM_FILTER: "delete_messaging_custom_filter",

  // Messaging — agents
  VIEW_MESSAGING_AGENTS: "view_messaging_agents",
  CREATE_MESSAGING_AGENT: "create_messaging_agent",
  EDIT_MESSAGING_AGENT: "edit_messaging_agent",
  DELETE_MESSAGING_AGENT: "delete_messaging_agent",

  // Messaging — teams
  VIEW_MESSAGING_TEAMS: "view_messaging_teams",
  CREATE_MESSAGING_TEAM: "create_messaging_team",
  EDIT_MESSAGING_TEAM: "edit_messaging_team",
  DELETE_MESSAGING_TEAM: "delete_messaging_team",
  MANAGE_MESSAGING_TEAM_MEMBERS: "manage_messaging_team_members",

  // Messaging — agent bots
  VIEW_MESSAGING_AGENT_BOTS: "view_messaging_agent_bots",
  CREATE_MESSAGING_AGENT_BOT: "create_messaging_agent_bot",
  EDIT_MESSAGING_AGENT_BOT: "edit_messaging_agent_bot",
  DELETE_MESSAGING_AGENT_BOT: "delete_messaging_agent_bot",

  // Messaging — users
  VIEW_MESSAGING_USERS: "view_messaging_users",
  CREATE_MESSAGING_USER: "create_messaging_user",
  EDIT_MESSAGING_USER: "edit_messaging_user",
  DELETE_MESSAGING_USER: "delete_messaging_user",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const isValidPermission = (
  permission: string,
): permission is Permission => {
  return Object.values(PERMISSIONS).includes(permission as Permission);
};

// ---------------------------------------------------------------------------
// DẠNG 1: PERMISSIONS_META — mỗi permission kèm { value, icon, label }
// Sử dụng Lucide React icon names (string). Import icon khi dùng:
//   import { iconName } from "lucide-react"
// ---------------------------------------------------------------------------

export type PermissionMeta = {
  value: Permission;
  icon: string; // tên icon Lucide React
  label: string; // nhãn hiển thị tiếng Việt
};

export const PERMISSIONS_META: Record<
  keyof typeof PERMISSIONS,
  PermissionMeta
> = {
  // Users
  VIEW_USERS: { value: "view_users", icon: "Users", label: "Xem người dùng" },
  CREATE_USERS: {
    value: "create_users",
    icon: "UserPlus",
    label: "Tạo người dùng",
  },
  EDIT_USERS: { value: "edit_users", icon: "UserPen", label: "Sửa người dùng" },
  DELETE_USERS: {
    value: "delete_users",
    icon: "UserMinus",
    label: "Xoá người dùng",
  },
  CURRENT_USER: {
    value: "current_user",
    icon: "CircleUser",
    label: "Người dùng hiện tại",
  },
  VIEW_USER_GROUPS: {
    value: "view_user_groups",
    icon: "UsersRound",
    label: "Xem nhóm người dùng",
  },

  // Roles
  VIEW_ROLES: {
    value: "view_roles",
    icon: "ShieldCheck",
    label: "Xem vai trò",
  },
  CREATE_ROLES: {
    value: "create_roles",
    icon: "ShieldPlus",
    label: "Tạo vai trò",
  },
  EDIT_ROLES: {
    value: "edit_roles",
    icon: "ShieldEllipsis",
    label: "Sửa vai trò",
  },
  DELETE_ROLES: {
    value: "delete_roles",
    icon: "ShieldMinus",
    label: "Xoá vai trò",
  },
  ASSIGN_PERMISSIONS_TO_ROLE: {
    value: "assign_permissions_to_role",
    icon: "ShieldPlus",
    label: "Gán quyền vào vai trò",
  },
  DELETE_PERMISSION_FROM_ROLE: {
    value: "delete_permission_from_role",
    icon: "ShieldMinus",
    label: "Xoá quyền khỏi vai trò",
  },

  // Permissions
  VIEW_PERMISSIONS: {
    value: "view_permissions",
    icon: "KeyRound",
    label: "Xem quyền",
  },
  CREATE_PERMISSIONS: {
    value: "create_permissions",
    icon: "KeyRound",
    label: "Tạo quyền",
  },
  EDIT_PERMISSIONS: {
    value: "edit_permissions",
    icon: "KeyRound",
    label: "Sửa quyền",
  },
  DELETE_PERMISSIONS: {
    value: "delete_permissions",
    icon: "KeyRound",
    label: "Xoá quyền",
  },
  VIEW_ROLE_PERMISSIONS_BY_ROLE_ID: {
    value: "view_role_permissions_by_role_id",
    icon: "KeyRound",
    label: "Xem quyền theo vai trò",
  },

  // Tickets
  VIEW_TICKETS: { value: "view_tickets", icon: "Ticket", label: "Xem ticket" },
  CREATE_TICKET: {
    value: "create_ticket",
    icon: "TicketPlus",
    label: "Tạo ticket",
  },
  EDIT_TICKET: {
    value: "edit_ticket",
    icon: "TicketCheck",
    label: "Sửa ticket",
  },
  DELETE_TICKET: {
    value: "delete_ticket",
    icon: "TicketX",
    label: "Xoá ticket",
  },
  ASSIGN_TICKET: {
    value: "assign_ticket",
    icon: "TicketSlash",
    label: "Gán ticket",
  },

  // Ticket Events
  VIEW_TICKET_EVENTS: {
    value: "view_ticket_events",
    icon: "CalendarSearch",
    label: "Xem sự kiện ticket",
  },
  CREATE_TICKET_EVENT: {
    value: "create_ticket_event",
    icon: "CalendarPlus",
    label: "Tạo sự kiện ticket",
  },
  EDIT_TICKET_EVENT: {
    value: "edit_ticket_event",
    icon: "CalendarCog",
    label: "Sửa sự kiện ticket",
  },
  DELETE_TICKET_EVENT: {
    value: "delete_ticket_event",
    icon: "CalendarMinus",
    label: "Xoá sự kiện ticket",
  },

  // Ticket Templates
  VIEW_TICKET_TEMPLATES: {
    value: "view_ticket_templates",
    icon: "FileText",
    label: "Xem mẫu ticket",
  },
  CREATE_TICKET_TEMPLATE: {
    value: "create_ticket_template",
    icon: "FilePlus",
    label: "Tạo mẫu ticket",
  },
  EDIT_TICKET_TEMPLATE: {
    value: "edit_ticket_template",
    icon: "FilePen",
    label: "Sửa mẫu ticket",
  },
  DELETE_TICKET_TEMPLATE: {
    value: "delete_ticket_template",
    icon: "FileX",
    label: "Xoá mẫu ticket",
  },

  // Ticket Contexts
  VIEW_TICKET_CONTEXTS: {
    value: "view_ticket_contexts",
    icon: "FileSearch",
    label: "Xem ngữ cảnh ticket",
  },
  CREATE_TICKET_CONTEXT: {
    value: "create_ticket_context",
    icon: "FilePlus2",
    label: "Tạo ngữ cảnh ticket",
  },
  EDIT_TICKET_CONTEXT: {
    value: "edit_ticket_context",
    icon: "FileEdit",
    label: "Sửa ngữ cảnh ticket",
  },
  DELETE_TICKET_CONTEXT: {
    value: "delete_ticket_context",
    icon: "FileX2",
    label: "Xoá ngữ cảnh ticket",
  },

  // Ticket Extensions
  VIEW_TICKET_EXTENSIONS: {
    value: "view_ticket_extensions",
    icon: "Puzzle",
    label: "Xem mở rộng ticket",
  },
  CREATE_TICKET_EXTENSION: {
    value: "create_ticket_extension",
    icon: "PuzzlePlus",
    label: "Tạo mở rộng ticket",
  }, // alias nếu không có dùng "PlugZap"
  EDIT_TICKET_EXTENSION: {
    value: "edit_ticket_extension",
    icon: "Settings2",
    label: "Sửa mở rộng ticket",
  },
  DELETE_TICKET_EXTENSION: {
    value: "delete_ticket_extension",
    icon: "Trash2",
    label: "Xoá mở rộng ticket",
  },

  // Ticket Flows
  VIEW_TICKET_FLOWS: {
    value: "view_ticket_flows",
    icon: "GitBranch",
    label: "Xem luồng ticket",
  },
  VIEW_TICKET_FLOW_BY_ID: {
    value: "view_ticket_flow_by_id",
    icon: "GitBranch",
    label: "Xem luồng ticket theo ID",
  },
  CREATE_TICKET_FLOW: {
    value: "create_ticket_flow",
    icon: "GitPullRequestCreate",
    label: "Tạo luồng ticket",
  },
  EDIT_TICKET_FLOW: {
    value: "edit_ticket_flow",
    icon: "GitPullRequestDraft",
    label: "Sửa luồng ticket",
  },
  DELETE_TICKET_FLOW: {
    value: "delete_ticket_flow",
    icon: "GitBranchPlus",
    label: "Xoá luồng ticket",
  },

  // Ticket Flow Instances
  VIEW_TICKET_FLOW_INSTANCES: {
    value: "view_ticket_flow_instances",
    icon: "Layers",
    label: "Xem phiên luồng ticket",
  },
  VIEW_TICKET_FLOW_INSTANCE_BY_ID: {
    value: "view_ticket_flow_instance_by_id",
    icon: "Layers",
    label: "Xem phiên luồng theo ID",
  },
  CREATE_TICKET_FLOW_INSTANCE: {
    value: "create_ticket_flow_instance",
    icon: "LayersPlus",
    label: "Tạo phiên luồng ticket",
  },
  EDIT_TICKET_FLOW_INSTANCE: {
    value: "edit_ticket_flow_instance",
    icon: "Pencil",
    label: "Sửa phiên luồng ticket",
  },
  DELETE_TICKET_FLOW_INSTANCE: {
    value: "delete_ticket_flow_instance",
    icon: "Trash2",
    label: "Xoá phiên luồng ticket",
  },

  // Ticket Flow Steps
  VIEW_TICKET_FLOW_STEPS: {
    value: "view_ticket_flow_steps",
    icon: "ListOrdered",
    label: "Xem bước luồng ticket",
  },
  VIEW_TICKET_FLOW_STEP_BY_ID: {
    value: "view_ticket_flow_step_by_id",
    icon: "ListOrdered",
    label: "Xem bước luồng theo ID",
  },
  CREATE_TICKET_FLOW_STEP: {
    value: "create_ticket_flow_step",
    icon: "ListPlus",
    label: "Tạo bước luồng ticket",
  },
  EDIT_TICKET_FLOW_STEP: {
    value: "edit_ticket_flow_step",
    icon: "ListCheck",
    label: "Sửa bước luồng ticket",
  },
  DELETE_TICKET_FLOW_STEP: {
    value: "delete_ticket_flow_step",
    icon: "ListMinus",
    label: "Xoá bước luồng ticket",
  },

  // Departments
  VIEW_DEPARTMENTS: {
    value: "view_departments",
    icon: "Building2",
    label: "Xem phòng ban",
  },
  VIEW_DEPARTMENT_BY_ID: {
    value: "view_department_by_id",
    icon: "Building2",
    label: "Xem phòng ban theo ID",
  },
  CREATE_DEPARTMENT: {
    value: "create_department",
    icon: "BuildingPlus",
    label: "Tạo phòng ban",
  },
  EDIT_DEPARTMENT: {
    value: "edit_department",
    icon: "Pencil",
    label: "Sửa phòng ban",
  },
  DELETE_DEPARTMENT: {
    value: "delete_department",
    icon: "Trash2",
    label: "Xoá phòng ban",
  },

  // Groups
  VIEW_GROUPS: { value: "view_groups", icon: "UsersRound", label: "Xem nhóm" },
  VIEW_GROUP_BY_ID: {
    value: "view_group_by_id",
    icon: "UserSearch",
    label: "Xem nhóm theo ID",
  },
  VIEW_GROUP_DETAIL_BY_ID: {
    value: "view_group_detail_by_id",
    icon: "UsersRound",
    label: "Xem chi tiết nhóm",
  },
  CREATE_GROUP: {
    value: "create_group",
    icon: "UserRoundPlus",
    label: "Tạo nhóm",
  },
  EDIT_GROUP: { value: "edit_group", icon: "UserRoundCog", label: "Sửa nhóm" },
  DELETE_GROUP: {
    value: "delete_group",
    icon: "UserRoundMinus",
    label: "Xoá nhóm",
  },
  ASSIGN_USER_TO_GROUP: {
    value: "assign_user_to_group",
    icon: "UserRoundCheck",
    label: "Gán người dùng vào nhóm",
  },
  DELETE_USER_GROUP: {
    value: "delete_user_group",
    icon: "UserRoundX",
    label: "Xoá người dùng khỏi nhóm",
  },

  // Levels
  VIEW_LEVELS: { value: "view_levels", icon: "BarChart2", label: "Xem cấp độ" },
  VIEW_LEVEL_BY_ID: {
    value: "view_level_by_id",
    icon: "BarChart2",
    label: "Xem cấp độ theo ID",
  },
  CREATE_LEVEL: {
    value: "create_level",
    icon: "BarChartPlus",
    label: "Tạo cấp độ",
  }, // alias "TrendingUp"
  EDIT_LEVEL: { value: "edit_level", icon: "Pencil", label: "Sửa cấp độ" },
  DELETE_LEVEL: { value: "delete_level", icon: "Trash2", label: "Xoá cấp độ" },

  // Tags
  VIEW_TAGS: { value: "view_tags", icon: "Tag", label: "Xem nhãn" },
  VIEW_TAG_BY_ID: {
    value: "view_tag_by_id",
    icon: "Tag",
    label: "Xem nhãn theo ID",
  },
  CREATE_TAG: { value: "create_tag", icon: "TagPlus", label: "Tạo nhãn" }, // alias "Tags"
  EDIT_TAG: { value: "edit_tag", icon: "Pencil", label: "Sửa nhãn" },
  DELETE_TAG: { value: "delete_tag", icon: "TagX", label: "Xoá nhãn" }, // alias "Trash2"

  // Logs
  VIEW_LOGS: { value: "view_logs", icon: "ScrollText", label: "Xem nhật ký" },

  // Faqs
  VIEW_FAQS: {
    value: "view_faqs",
    icon: "MessageCircleQuestion",
    label: "Xem FAQ",
  },
  VIEW_FAQ_BY_ID: {
    value: "view_faq_by_id",
    icon: "MessageCircleQuestion",
    label: "Xem FAQ theo ID",
  },
  CREATE_FAQ: {
    value: "create_faq",
    icon: "MessageCirclePlus",
    label: "Tạo FAQ",
  },
  EDIT_FAQ: { value: "edit_faq", icon: "MessageCircle", label: "Sửa FAQ" },
  DELETE_FAQ: { value: "delete_faq", icon: "MessageCircleX", label: "Xoá FAQ" },
  SEARCH_FAQS: { value: "search_faqs", icon: "Search", label: "Tìm kiếm FAQ" },
  IMPORT_FAQS: { value: "import_faqs", icon: "FileInput", label: "Nhập FAQ" },

  // AI Configs
  VIEW_AI_CONFIGS: {
    value: "view_ai_configs",
    icon: "Bot",
    label: "Xem cấu hình AI",
  },
  VIEW_AI_CONFIG_BY_ID: {
    value: "view_ai_config_by_id",
    icon: "Bot",
    label: "Xem cấu hình AI theo ID",
  },
  CREATE_AI_CONFIG: {
    value: "create_ai_config",
    icon: "BotMessageSquare",
    label: "Tạo cấu hình AI",
  },
  EDIT_AI_CONFIG: {
    value: "edit_ai_config",
    icon: "BotOff",
    label: "Sửa cấu hình AI",
  }, // alias "Settings"
  DELETE_AI_CONFIG: {
    value: "delete_ai_config",
    icon: "Trash2",
    label: "Xoá cấu hình AI",
  },

  // Sources
  VIEW_SOURCES: {
    value: "view_sources",
    icon: "Database",
    label: "Xem nguồn dữ liệu",
  },
  VIEW_SOURCE_BY_ID: {
    value: "view_source_by_id",
    icon: "Database",
    label: "Xem nguồn theo ID",
  },
  CREATE_SOURCE: {
    value: "create_source",
    icon: "DatabaseZap",
    label: "Tạo nguồn dữ liệu",
  },
  EDIT_SOURCE: {
    value: "edit_source",
    icon: "DatabaseBackup",
    label: "Sửa nguồn dữ liệu",
  },
  DELETE_SOURCE: {
    value: "delete_source",
    icon: "DatabaseX",
    label: "Xoá nguồn dữ liệu",
  },

  // Customers
  VIEW_CUSTOMERS: {
    value: "view_customers",
    icon: "Users",
    label: "Xem khách hàng",
  },
  VIEW_CUSTOMER_BY_ID: {
    value: "view_customer_by_id",
    icon: "UserSearch",
    label: "Xem khách hàng theo ID",
  },
  CREATE_CUSTOMER: {
    value: "create_customer",
    icon: "UserPlus",
    label: "Tạo khách hàng",
  },
  EDIT_CUSTOMER: {
    value: "edit_customer",
    icon: "UserPen",
    label: "Sửa khách hàng",
  },
  DELETE_CUSTOMER: {
    value: "delete_customer",
    icon: "UserMinus",
    label: "Xoá khách hàng",
  },

  // Customer provided info
  VIEW_CUSTOMER_PROVIDED_INFO: {
    value: "view_customer_provided_info",
    icon: "Contact",
    label: "Xem thông tin khách cung cấp",
  },
  CREATE_CUSTOMER_PROVIDED_INFO: {
    value: "create_customer_provided_info",
    icon: "ContactRound",
    label: "Tạo thông tin khách cung cấp",
  },
  EDIT_CUSTOMER_PROVIDED_INFO: {
    value: "edit_customer_provided_info",
    icon: "Contact",
    label: "Sửa thông tin khách cung cấp",
  },
  DELETE_CUSTOMER_PROVIDED_INFO: {
    value: "delete_customer_provided_info",
    icon: "ContactRound",
    label: "Xoá thông tin khách cung cấp",
  },

  // Tenants
  VIEW_TENANTS: {
    value: "view_tenants",
    icon: "Building2",
    label: "Xem tenant",
  },
  CREATE_TENANT: {
    value: "create_tenant",
    icon: "Building",
    label: "Tạo tenant",
  },
  EDIT_TENANT: {
    value: "edit_tenant",
    icon: "Pencil",
    label: "Sửa tenant",
  },
  DELETE_TENANT: {
    value: "delete_tenant",
    icon: "Building2",
    label: "Xoá tenant",
  },

  // Messaging — accounts
  VIEW_MESSAGING_ACCOUNTS: {
    value: "view_messaging_accounts",
    icon: "MessagesSquare",
    label: "Xem tài khoản messaging",
  },
  CREATE_MESSAGING_ACCOUNT: {
    value: "create_messaging_account",
    icon: "MessageSquarePlus",
    label: "Tạo tài khoản messaging",
  },
  EDIT_MESSAGING_ACCOUNT: {
    value: "edit_messaging_account",
    icon: "MessageSquare",
    label: "Sửa tài khoản messaging",
  },
  DELETE_MESSAGING_ACCOUNT: {
    value: "delete_messaging_account",
    icon: "MessageSquareOff",
    label: "Xoá tài khoản messaging",
  },
  SYNC_MESSAGING_INTEGRATION: {
    value: "sync_messaging_integration",
    icon: "RefreshCw",
    label: "Đồng bộ tích hợp messaging",
  },

  // Messaging — conversations
  VIEW_MESSAGING_CONVERSATIONS: {
    value: "view_messaging_conversations",
    icon: "MessageCircle",
    label: "Xem hội thoại messaging",
  },
  CREATE_MESSAGING_CONVERSATION: {
    value: "create_messaging_conversation",
    icon: "MessageCirclePlus",
    label: "Tạo hội thoại messaging",
  },
  EDIT_MESSAGING_CONVERSATION: {
    value: "edit_messaging_conversation",
    icon: "MessageCircle",
    label: "Sửa hội thoại messaging",
  },
  DELETE_MESSAGING_CONVERSATION: {
    value: "delete_messaging_conversation",
    icon: "MessageCircleX",
    label: "Xoá hội thoại messaging",
  },
  ASSIGN_MESSAGING_CONVERSATION: {
    value: "assign_messaging_conversation",
    icon: "UserCheck",
    label: "Gán hội thoại messaging",
  },
  BULK_MESSAGING_ACTIONS: {
    value: "bulk_messaging_actions",
    icon: "ListChecks",
    label: "Thao tác hàng loạt messaging",
  },

  // Messaging — messages
  SEND_MESSAGING_MESSAGE: {
    value: "send_messaging_message",
    icon: "Send",
    label: "Gửi tin nhắn messaging",
  },
  DELETE_MESSAGING_MESSAGE: {
    value: "delete_messaging_message",
    icon: "Trash2",
    label: "Xoá tin nhắn messaging",
  },

  // Messaging — inboxes
  VIEW_MESSAGING_INBOXES: {
    value: "view_messaging_inboxes",
    icon: "Inbox",
    label: "Xem hộp thư messaging",
  },
  CREATE_MESSAGING_INBOX: {
    value: "create_messaging_inbox",
    icon: "Inbox",
    label: "Tạo hộp thư messaging",
  },
  EDIT_MESSAGING_INBOX: {
    value: "edit_messaging_inbox",
    icon: "Pencil",
    label: "Sửa hộp thư messaging",
  },
  MANAGE_MESSAGING_INBOX_MEMBERS: {
    value: "manage_messaging_inbox_members",
    icon: "UserCog",
    label: "Quản lý thành viên hộp thư",
  },

  // Messaging — labels
  VIEW_MESSAGING_LABELS: {
    value: "view_messaging_labels",
    icon: "Tags",
    label: "Xem nhãn messaging",
  },
  CREATE_MESSAGING_LABEL: {
    value: "create_messaging_label",
    icon: "Tag",
    label: "Tạo nhãn messaging",
  },
  DELETE_MESSAGING_LABEL: {
    value: "delete_messaging_label",
    icon: "Tag",
    label: "Xoá nhãn messaging",
  },

  // Messaging — custom filters
  VIEW_MESSAGING_CUSTOM_FILTERS: {
    value: "view_messaging_custom_filters",
    icon: "Filter",
    label: "Xem bộ lọc messaging",
  },
  CREATE_MESSAGING_CUSTOM_FILTER: {
    value: "create_messaging_custom_filter",
    icon: "Filter",
    label: "Tạo bộ lọc messaging",
  },
  EDIT_MESSAGING_CUSTOM_FILTER: {
    value: "edit_messaging_custom_filter",
    icon: "Filter",
    label: "Sửa bộ lọc messaging",
  },
  DELETE_MESSAGING_CUSTOM_FILTER: {
    value: "delete_messaging_custom_filter",
    icon: "FilterX",
    label: "Xoá bộ lọc messaging",
  },

  // Messaging — agents
  VIEW_MESSAGING_AGENTS: {
    value: "view_messaging_agents",
    icon: "Headset",
    label: "Xem agent messaging",
  },
  CREATE_MESSAGING_AGENT: {
    value: "create_messaging_agent",
    icon: "UserPlus",
    label: "Tạo agent messaging",
  },
  EDIT_MESSAGING_AGENT: {
    value: "edit_messaging_agent",
    icon: "UserCog",
    label: "Sửa agent messaging",
  },
  DELETE_MESSAGING_AGENT: {
    value: "delete_messaging_agent",
    icon: "UserMinus",
    label: "Xoá agent messaging",
  },

  // Messaging — teams
  VIEW_MESSAGING_TEAMS: {
    value: "view_messaging_teams",
    icon: "UsersRound",
    label: "Xem team messaging",
  },
  CREATE_MESSAGING_TEAM: {
    value: "create_messaging_team",
    icon: "Users",
    label: "Tạo team messaging",
  },
  EDIT_MESSAGING_TEAM: {
    value: "edit_messaging_team",
    icon: "UsersRound",
    label: "Sửa team messaging",
  },
  DELETE_MESSAGING_TEAM: {
    value: "delete_messaging_team",
    icon: "Users",
    label: "Xoá team messaging",
  },
  MANAGE_MESSAGING_TEAM_MEMBERS: {
    value: "manage_messaging_team_members",
    icon: "UserCog",
    label: "Quản lý thành viên team",
  },

  // Messaging — agent bots
  VIEW_MESSAGING_AGENT_BOTS: {
    value: "view_messaging_agent_bots",
    icon: "Bot",
    label: "Xem agent bot messaging",
  },
  CREATE_MESSAGING_AGENT_BOT: {
    value: "create_messaging_agent_bot",
    icon: "Bot",
    label: "Tạo agent bot messaging",
  },
  EDIT_MESSAGING_AGENT_BOT: {
    value: "edit_messaging_agent_bot",
    icon: "Bot",
    label: "Sửa agent bot messaging",
  },
  DELETE_MESSAGING_AGENT_BOT: {
    value: "delete_messaging_agent_bot",
    icon: "BotOff",
    label: "Xoá agent bot messaging",
  },

  // Messaging — users
  VIEW_MESSAGING_USERS: {
    value: "view_messaging_users",
    icon: "Users",
    label: "Xem user messaging",
  },
  CREATE_MESSAGING_USER: {
    value: "create_messaging_user",
    icon: "UserPlus",
    label: "Tạo user messaging",
  },
  EDIT_MESSAGING_USER: {
    value: "edit_messaging_user",
    icon: "UserPen",
    label: "Sửa user messaging",
  },
  DELETE_MESSAGING_USER: {
    value: "delete_messaging_user",
    icon: "UserMinus",
    label: "Xoá user messaging",
  },
};

// ---------------------------------------------------------------------------
// DẠNG 2: PERMISSION_CATEGORIES — nhóm theo category, mỗi nhóm có icon riêng
// Tiện dùng để render sidebar / permission group UI
// ---------------------------------------------------------------------------

export type PermissionCategory = {
  label: string;
  icon: string; // icon đại diện cho cả nhóm (Lucide React)
  permissions: (keyof typeof PERMISSIONS)[];
};

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    label: "Người dùng",
    icon: "Users",
    permissions: [
      "VIEW_USERS",
      "CREATE_USERS",
      "EDIT_USERS",
      "DELETE_USERS",
      "CURRENT_USER",
      "VIEW_USER_GROUPS",
    ],
  },
  {
    label: "Vai trò",
    icon: "ShieldCheck",
    permissions: [
      "VIEW_ROLES",
      "CREATE_ROLES",
      "EDIT_ROLES",
      "DELETE_ROLES",
      "ASSIGN_PERMISSIONS_TO_ROLE",
      "DELETE_PERMISSION_FROM_ROLE",
    ],
  },
  {
    label: "Quyền hạn",
    icon: "KeyRound",
    permissions: [
      "VIEW_PERMISSIONS",
      "CREATE_PERMISSIONS",
      "EDIT_PERMISSIONS",
      "DELETE_PERMISSIONS",
      "VIEW_ROLE_PERMISSIONS_BY_ROLE_ID",
    ],
  },
  {
    label: "Ticket",
    icon: "Ticket",
    permissions: [
      "VIEW_TICKETS",
      "CREATE_TICKET",
      "EDIT_TICKET",
      "DELETE_TICKET",
      "ASSIGN_TICKET",
    ],
  },
  {
    label: "Sự kiện Ticket",
    icon: "CalendarDays",
    permissions: [
      "VIEW_TICKET_EVENTS",
      "CREATE_TICKET_EVENT",
      "EDIT_TICKET_EVENT",
      "DELETE_TICKET_EVENT",
    ],
  },
  {
    label: "Mẫu Ticket",
    icon: "FileText",
    permissions: [
      "VIEW_TICKET_TEMPLATES",
      "CREATE_TICKET_TEMPLATE",
      "EDIT_TICKET_TEMPLATE",
      "DELETE_TICKET_TEMPLATE",
    ],
  },
  {
    label: "Ngữ cảnh Ticket",
    icon: "FileSearch",
    permissions: [
      "VIEW_TICKET_CONTEXTS",
      "CREATE_TICKET_CONTEXT",
      "EDIT_TICKET_CONTEXT",
      "DELETE_TICKET_CONTEXT",
    ],
  },
  {
    label: "Mở rộng Ticket",
    icon: "Puzzle",
    permissions: [
      "VIEW_TICKET_EXTENSIONS",
      "CREATE_TICKET_EXTENSION",
      "EDIT_TICKET_EXTENSION",
      "DELETE_TICKET_EXTENSION",
    ],
  },
  {
    label: "Luồng Ticket",
    icon: "GitBranch",
    permissions: [
      "VIEW_TICKET_FLOWS",
      "VIEW_TICKET_FLOW_BY_ID",
      "CREATE_TICKET_FLOW",
      "EDIT_TICKET_FLOW",
      "DELETE_TICKET_FLOW",
    ],
  },
  {
    label: "Phiên Luồng Ticket",
    icon: "Layers",
    permissions: [
      "VIEW_TICKET_FLOW_INSTANCES",
      "VIEW_TICKET_FLOW_INSTANCE_BY_ID",
      "CREATE_TICKET_FLOW_INSTANCE",
      "EDIT_TICKET_FLOW_INSTANCE",
      "DELETE_TICKET_FLOW_INSTANCE",
    ],
  },
  {
    label: "Bước Luồng Ticket",
    icon: "ListOrdered",
    permissions: [
      "VIEW_TICKET_FLOW_STEPS",
      "VIEW_TICKET_FLOW_STEP_BY_ID",
      "CREATE_TICKET_FLOW_STEP",
      "EDIT_TICKET_FLOW_STEP",
      "DELETE_TICKET_FLOW_STEP",
    ],
  },
  {
    label: "Phòng ban",
    icon: "Building2",
    permissions: [
      "VIEW_DEPARTMENTS",
      "VIEW_DEPARTMENT_BY_ID",
      "CREATE_DEPARTMENT",
      "EDIT_DEPARTMENT",
      "DELETE_DEPARTMENT",
    ],
  },
  {
    label: "Nhóm",
    icon: "UsersRound",
    permissions: [
      "VIEW_GROUPS",
      "VIEW_GROUP_BY_ID",
      "VIEW_GROUP_DETAIL_BY_ID",
      "CREATE_GROUP",
      "EDIT_GROUP",
      "DELETE_GROUP",
      "ASSIGN_USER_TO_GROUP",
      "DELETE_USER_GROUP",
    ],
  },
  {
    label: "Cấp độ",
    icon: "BarChart2",
    permissions: [
      "VIEW_LEVELS",
      "VIEW_LEVEL_BY_ID",
      "CREATE_LEVEL",
      "EDIT_LEVEL",
      "DELETE_LEVEL",
    ],
  },
  {
    label: "Nhãn",
    icon: "Tag",
    permissions: [
      "VIEW_TAGS",
      "VIEW_TAG_BY_ID",
      "CREATE_TAG",
      "EDIT_TAG",
      "DELETE_TAG",
    ],
  },
  {
    label: "Nhật ký",
    icon: "ScrollText",
    permissions: ["VIEW_LOGS"],
  },
  {
    label: "Khách hàng",
    icon: "Users",
    permissions: [
      "VIEW_CUSTOMERS",
      "VIEW_CUSTOMER_BY_ID",
      "CREATE_CUSTOMER",
      "EDIT_CUSTOMER",
      "DELETE_CUSTOMER",
    ],
  },
  {
    label: "Thông tin khách cung cấp",
    icon: "Contact",
    permissions: [
      "VIEW_CUSTOMER_PROVIDED_INFO",
      "CREATE_CUSTOMER_PROVIDED_INFO",
      "EDIT_CUSTOMER_PROVIDED_INFO",
      "DELETE_CUSTOMER_PROVIDED_INFO",
    ],
  },
  {
    label: "Tenant",
    icon: "Building2",
    permissions: [
      "VIEW_TENANTS",
      "CREATE_TENANT",
      "EDIT_TENANT",
      "DELETE_TENANT",
    ],
  },
  {
    label: "Messaging",
    icon: "MessagesSquare",
    permissions: [
      "VIEW_MESSAGING_ACCOUNTS",
      "CREATE_MESSAGING_ACCOUNT",
      "EDIT_MESSAGING_ACCOUNT",
      "DELETE_MESSAGING_ACCOUNT",
      "SYNC_MESSAGING_INTEGRATION",
      "VIEW_MESSAGING_CONVERSATIONS",
      "CREATE_MESSAGING_CONVERSATION",
      "EDIT_MESSAGING_CONVERSATION",
      "DELETE_MESSAGING_CONVERSATION",
      "ASSIGN_MESSAGING_CONVERSATION",
      "BULK_MESSAGING_ACTIONS",
      "SEND_MESSAGING_MESSAGE",
      "DELETE_MESSAGING_MESSAGE",
      "VIEW_MESSAGING_INBOXES",
      "CREATE_MESSAGING_INBOX",
      "EDIT_MESSAGING_INBOX",
      "MANAGE_MESSAGING_INBOX_MEMBERS",
      "VIEW_MESSAGING_LABELS",
      "CREATE_MESSAGING_LABEL",
      "DELETE_MESSAGING_LABEL",
      "VIEW_MESSAGING_CUSTOM_FILTERS",
      "CREATE_MESSAGING_CUSTOM_FILTER",
      "EDIT_MESSAGING_CUSTOM_FILTER",
      "DELETE_MESSAGING_CUSTOM_FILTER",
      "VIEW_MESSAGING_AGENTS",
      "CREATE_MESSAGING_AGENT",
      "EDIT_MESSAGING_AGENT",
      "DELETE_MESSAGING_AGENT",
      "VIEW_MESSAGING_TEAMS",
      "CREATE_MESSAGING_TEAM",
      "EDIT_MESSAGING_TEAM",
      "DELETE_MESSAGING_TEAM",
      "MANAGE_MESSAGING_TEAM_MEMBERS",
      "VIEW_MESSAGING_AGENT_BOTS",
      "CREATE_MESSAGING_AGENT_BOT",
      "EDIT_MESSAGING_AGENT_BOT",
      "DELETE_MESSAGING_AGENT_BOT",
      "VIEW_MESSAGING_USERS",
      "CREATE_MESSAGING_USER",
      "EDIT_MESSAGING_USER",
      "DELETE_MESSAGING_USER",
    ],
  },
  {
    label: "FAQ",
    icon: "MessageCircleQuestion",
    permissions: [
      "VIEW_FAQS",
      "VIEW_FAQ_BY_ID",
      "CREATE_FAQ",
      "EDIT_FAQ",
      "DELETE_FAQ",
      "SEARCH_FAQS",
      "IMPORT_FAQS",
    ],
  },
  {
    label: "Cấu hình AI",
    icon: "Bot",
    permissions: [
      "VIEW_AI_CONFIGS",
      "VIEW_AI_CONFIG_BY_ID",
      "CREATE_AI_CONFIG",
      "EDIT_AI_CONFIG",
      "DELETE_AI_CONFIG",
    ],
  },
  {
    label: "Nguồn dữ liệu",
    icon: "Database",
    permissions: [
      "VIEW_SOURCES",
      "VIEW_SOURCE_BY_ID",
      "CREATE_SOURCE",
      "EDIT_SOURCE",
      "DELETE_SOURCE",
    ],
  },
];

// ---------------------------------------------------------------------------
// USAGE EXAMPLE
// ---------------------------------------------------------------------------
//
// import { Users } from "lucide-react";
// import { PERMISSIONS_META, PERMISSION_CATEGORIES } from "./permissions";
//
// // Lấy icon & label của 1 permission cụ thể:
// const meta = PERMISSIONS_META["VIEW_USERS"];
// // meta.icon === "Users", meta.label === "Xem người dùng"
//
// // Render danh sách permission theo category:
// PERMISSION_CATEGORIES.forEach(cat => {
//   console.log(cat.label, cat.icon, cat.permissions);
// });
