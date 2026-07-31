import type { SidebarData } from "@/lib/types";
import {
  IconArrowsExchange,
  IconBrowserCheck,
  IconCalendar,
  IconChartBar,
  IconChecklist,
  IconCreditCard,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconMessages,
  IconNotification,
  IconPalette,
  IconReportMoney,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUsers,
  IconUserPlus,
  IconShieldCheck,
  IconBuilding,
  IconBuildingBroadcastTower,
  IconFingerprint,
  IconTag,
  IconSubtitles,
  IconRobot,
  IconBrain,
  IconUser,
  IconMessageCircle,
} from "@tabler/icons-react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Workflow,
  UserStar,
} from "lucide-react";
import { PERMISSIONS } from "@/constants/permission";

export const sidebarData: SidebarData = {
  teams: [
    {
      name: "Omichannel",
      logo: Command,
      plan: "Omichannel",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "Quản trị hệ thống",
      items: [
        {
          title: "Dashboard Overview",
          url: "/dashboard",
          icon: IconLayoutDashboard,
        },
        // {
        //   title: "Dashboard Business",
        //   url: "/dashboard2",
        //   icon: IconChartBar,
        // },
        // {
        //   title: "Báo cáo vận hành",
        //   icon: IconReportMoney,
        //   items: [
        //     {
        //       title: "Báo cáo vận hành",
        //       url: "/payment-dashboard",
        //       icon: IconCreditCard,
        //     },
        //     {
        //       title: "Báo cáo giao dịch",
        //       url: "/payment-transactions",
        //       icon: IconArrowsExchange,
        //     },
        //   ],
        // },
      ],
    },
    {
      title: "Quản lý hệ thống",
      items: [
        // {
        //   title: "Mail",
        //   url: "/mail",
        //   icon: MailIcon,
        //   // badge: "Coming Soon",
        //   badge: "New",
        //   badgeColor: "green",
        // },
        // {
        //   title: "Discord",
        //   url: "/discord",
        //   icon: Icons.discord,
        //   badge: "New",
        //   badgeColor: "green",
        // },
        // {
        //   title: "Tasks",
        //   url: "/tasks",
        //   icon: IconChecklist,
        // },
        {
          title: "Quản lý ticket",
          icon: IconReportMoney,
          items: [
            {
              title: "Quản lý ticket",
              url: "/tickets",
              icon: IconCreditCard,
              permissions: [PERMISSIONS.VIEW_TICKETS],
            },
            {
              title: "Quản lý luồng ticket",
              url: "/tickets/flows",
              icon: Workflow,
              permissions: [PERMISSIONS.VIEW_TICKET_FLOWS],
            },
            {
              title: "Quản lý tag",
              url: "/tickets/tags",
              icon: IconTag,
              permissions: [PERMISSIONS.VIEW_TAGS],
            },
            // {
            //   title: "Quản lý template",
            //   url: "/tickets/templates",
            //   icon: IconCategory2,
            //   permissions: [PERMISSIONS.VIEW_TICKET_TEMPLATES],
            // },
          ],
        },
        {
          title: "Quản lý khách hàng",
          icon: IconUsers,
          items: [
            {
              title: "Danh sách khách hàng",
              url: "/customers",
              icon: IconUsers,
              permissions: [PERMISSIONS.VIEW_CUSTOMERS],
            },
            {
              title: "Khách hàng tiềm năng",
              url: "/customers/leads",
              icon: UserStar,
            },
            {
              title: "Quản lý tag",
              url: "/customers/tags",
              icon: IconTag,
              permissions: [PERMISSIONS.VIEW_CUSTOMERS],
            },
          ],
        },
        {
          title: "Quản lý người dùng",
          icon: IconUserPlus,
          permissions: [PERMISSIONS.VIEW_USERS],
          items: [
            {
              title: "Quản lý người dùng",
              url: "/users",
              icon: IconUserPlus,
              permissions: [PERMISSIONS.VIEW_USERS],
            },
            {
              title: "Quản lý doanh nghiệp",
              url: "/tenants",
              icon: IconBuildingBroadcastTower,
              // permissions: [PERMISSIONS.VIEW_TENANTS],
            },
          ],
        },

        {
          title: "Quản lý phòng ban",
          url: "/departments",
          icon: IconBuilding,
          permissions: [PERMISSIONS.VIEW_DEPARTMENTS],
        },
        {
          title: "Danh sách Lead",
          url: "/lead",
          icon: IconUser,
          permissions: [PERMISSIONS.VIEW_CUSTOMERS],
        },
        {
          title: "Trò chuyện",
          url: "/chats",
          badgeColor: "green",
          icon: IconMessages,
        },
        // {
        //   title: "Calendar",
        //   url: "/calendar",
        //   icon: IconCalendar,
        // },
        // {
        //   title: "AI Chat",
        //   url: "/ai-chat",
        //   icon: IconBrain,
        //   badge: "New",
        //   badgeColor: "green",
        // },
        // {
        //   title: "Kanban",
        //   url: "/kanban",
        //   icon: KanbanIcon,
        //   badge: "New",
        //   badgeColor: "green",
        // },
      ],
    },
    // {
    //   title: "Pages",
    //   items: [
    //     {
    //       title: "Auth",
    //       icon: IconLockAccess,
    //       items: [
    //         {
    //           title: "Sign In",
    //           url: "/sign-in",
    //         },
    //         {
    //           title: "Sign Up",
    //           url: "/sign-up",
    //         },
    //         {
    //           title: "Reset Password 1",
    //           url: "/reset-password-1",
    //         },
    //         {
    //           title: "Reset Password 2",
    //           url: "/reset-password-2",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Pricing",
    //       icon: IconCreditCard,
    //       // badge: "Coming Soon",
    //       items: [
    //         {
    //           title: "Column Pricing",
    //           url: "/pricing/column",
    //           icon: IconColumns,
    //         },
    //         {
    //           title: "Table Pricing",
    //           url: "/pricing/table",
    //           icon: IconTable,
    //         },
    //         {
    //           title: "Single Pricing",
    //           url: "/pricing/single",
    //           icon: IconCoin,
    //         },
    //       ],
    //     },
    //     {
    //       title: "Errors",
    //       icon: IconBug,
    //       items: [
    //         {
    //           title: "Unauthorized",
    //           url: "/unauthorized",
    //           icon: IconLock,
    //         },
    //         {
    //           title: "Forbidden",
    //           url: "/forbidden",
    //           icon: IconUserOff,
    //         },
    //         {
    //           title: "Not Found",
    //           url: "/not-found",
    //           icon: IconError404,
    //         },
    //         {
    //           title: "Internal Server Error",
    //           url: "/internal-server-error",
    //           icon: IconServerOff,
    //         },
    //         {
    //           title: "Maintenance Error",
    //           url: "/maintenance-error",
    //           icon: IconBarrierBlock,
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      title: "Khác",
      items: [
        {
          title: "Quyền hạn",
          icon: IconFingerprint,
          items: [
            {
              title: "Quản lý vai trò",
              url: "/roles",
              icon: IconShieldCheck,
              permissions: [PERMISSIONS.VIEW_ROLES],
            },
            {
              title: "Phân quyền",
              url: "/permissions",
              icon: IconLock,
              permissions: [PERMISSIONS.VIEW_PERMISSIONS],
            },
          ],
        },
        {
          title: "Settings",
          icon: IconSettings,
          url: "/settings",
          // badge: "Coming Soon",
        },
        // {
        //   title: "Help Center",
        //   url: "/help-center",
        //   icon: IconHelp,
        // },
      ],
    },
  ],
};
