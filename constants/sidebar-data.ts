import { Icons } from "@/features/discord/components/icons";
import type { SidebarData } from "@/lib/types";
import {
  IconArrowsExchange,
  IconBarrierBlock,
  IconBrain,
  IconBrowserCheck,
  IconBug,
  IconCalendar,
  IconChartBar,
  IconChecklist,
  IconCoin,
  IconColumns,
  IconCreditCard,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconNotification,
  IconPalette,
  IconReportMoney,
  IconServerOff,
  IconSettings,
  IconTable,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
  IconShieldCheck,
  IconBuilding,
  IconTicket,
  IconTemplate,
  IconTimelineEvent,
  IconArrowAutofitContent,
} from "@tabler/icons-react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  KanbanIcon,
  MailIcon,
} from "lucide-react";

export const sidebarData: SidebarData = {
  teams: [
    {
      name: "Shadcn Admin",
      logo: Command,
      plan: "NextJs + ShadcnUI",
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
          title: "Dashboard",
          url: "/dashboard",
          icon: IconLayoutDashboard,
        },
        {
          title: "Business Dashboard",
          url: "/dashboard2",
          icon: IconChartBar,
        },
        {
          title: "Payment Dashboard",
          icon: IconReportMoney,
          items: [
            {
              title: "Payment Dashboard",
              url: "/payment-dashboard",
              icon: IconCreditCard,
            },
            {
              title: "Payment Transactions",
              url: "/payment-transactions",
              icon: IconArrowsExchange,
            },
          ],
        },
      ],
    },
    {
      title: "Quản lý hệ thống",
      items: [
        {
          title: "Mail",
          url: "/mail",
          icon: MailIcon,
          // badge: "Coming Soon",
          badge: "New",
          badgeColor: "green",
        },
        // {
        //   title: "Discord",
        //   url: "/discord",
        //   icon: Icons.discord,
        //   badge: "New",
        //   badgeColor: "green",
        // },
        {
          title: "Tasks",
          url: "/tasks",
          icon: IconChecklist,
        },
        {
          title: "Quản lý ticket",
          icon: IconReportMoney,
          items: [
            {
              title: "Danh sách ticket",
              url: "/tickets/ticket-list",
              icon: IconTicket,
            },
            {
              title: "Danh sách event",
              url: "/tickets/ticket-event",
              icon: IconTimelineEvent,
            },
            {
              title: "Mẫu ticket",
              url: "/tickets/ticket-template",
              icon: IconTemplate,
            },
            {
              title: "Luồng xử lý ticket",
              url: "/tickets/ticket-flow",
              icon: IconArrowAutofitContent,
            },
          ],
        },
        {
          title: "Quản lý người dùng",
          url: "/users",
          icon: IconUsers,
        },
        {
          title: "Quản lý vai trò",
          url: "/roles",
          icon: IconShieldCheck,
        },
        {
          title: "Quản lý phòng ban",
          url: "/departments",
          icon: IconBuilding,
        },
        {
          title: "Chats",
          url: "/chats",
          badge: "3",
          icon: IconMessages,
        },
        {
          title: "Calendar",
          url: "/calendar",
          icon: IconCalendar,
        },
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
          title: "Phân quyền",
          url: "/permissions",
          icon: IconLock,
        },
        {
          title: "Settings",
          icon: IconSettings,
          // badge: "Coming Soon",
          items: [
            {
              title: "Profile",
              url: "/settings",
              icon: IconUserCog,
            },
            {
              title: "Account",
              url: "/settings/account",
              icon: IconTool,
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
              icon: IconPalette,
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
              icon: IconNotification,
            },
            {
              title: "Display",
              url: "/settings/display",
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: "Help Center",
          url: "/help-center",
          icon: IconHelp,
          badge: "Coming Soon",
        },
      ],
    },
  ],
};
