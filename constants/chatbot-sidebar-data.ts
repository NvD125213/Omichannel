import type { SidebarData } from "@/lib/types";
import {
  IconBrain,
  IconLayoutDashboard,
  IconMessages,
  IconRobot,
} from "@tabler/icons-react";

export const chatbotSidebarData: SidebarData = {
  teams: [],
  navGroups: [
    {
      title: "Hệ thống A.I Agent",
      items: [
        {
          title: "Báo cáo thống kê",
          url: "/ai-dashboard",
          icon: IconBrain,
        },
      ],
    },
    {
      title: "Cấu hình",
      items: [],
    },
  ],
};
