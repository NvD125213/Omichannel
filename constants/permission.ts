/**
 * Permission Constants
 * Đồng bộ với `constants/permission-omni.json`
 */

export const PERMISSIONS = {
  // Customers
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

  // Tenants
  VIEW_TENANTS: "view_tenants",
  CREATE_TENANT: "create_tenant",
  EDIT_TENANT: "edit_tenant",
  DELETE_TENANT: "delete_tenant",
  VIEW_OWN_TENANT_SETTINGS: "view_own_tenant_settings",
  EDIT_OWN_TENANT_SETTINGS: "edit_own_tenant_settings",

  // Logs
  VIEW_LOGS: "view_logs",

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

/**
 * Type helper for Permission values
 */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Helper to check if a permission is a valid one
 */
export const isValidPermission = (
  permission: string,
): permission is Permission => {
  return Object.values(PERMISSIONS).includes(permission as Permission);
};
