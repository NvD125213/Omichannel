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
  CREATE_GROUP: "create_group",
  EDIT_GROUP: "edit_group",
  DELETE_GROUP: "delete_group",
  ASSIGN_USER_TO_GROUP: "assign_user_to_group",
  DELETE_USER_GROUP: "delete_user_group",

  // Levels
  VIEW_LEVELS: "view_levels",
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
