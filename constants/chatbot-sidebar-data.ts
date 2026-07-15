import type { SidebarData } from "@/lib/types";
import {
  IconAlertCircle,
  IconBrain,
  IconFileText,
  IconGlobe,
  IconHelp,
  IconLayoutDashboard,
  IconMessageCircle,
  IconMessageCircleQuestion,
  IconMessages,
  IconRobot,
  IconUser,
  IconWorld,
} from "@tabler/icons-react";

export const chatbotSidebarData: SidebarData = {
  teams: [],
  navGroups: [
    {
      title: "Hệ thống A.I Agent",
      items: [
        {
          title: "Báo cáo thống kê",
          url: "/ai/dashboard",
          icon: IconBrain,
        },
      ],
    },
    {
      title: "Thiết lập cấu hình",
      items: [
        {
          title: "Quản lý tài liệu",
          url: "/ai/document",
          icon: IconFileText,
        },
        {
          title: "Quản lý danh sách FAQ",
          url: "/ai/faq",
          icon: IconMessageCircleQuestion,
        },
        {
          title: "Quản lý dữ liệu web",
          url: "/ai/web-data",
          icon: IconWorld,
        },
        {
          title: "Quản lý agent",
          url: "/ai/agent",
          icon: IconRobot,
        },
        // {
        //   title: "Lịch sử hệ thống",
        //   url: "/ai/system-history",
        //   icon: IconAlertCircle,
        // },
        {
          title: "Thử nghiệm Agent",
          url: "/ai/chat-preview",
          icon: IconMessageCircle,
        },
      ],
    },
  ],
};
