"use client";

import AppSidebar from "@/components/app-sidebar";
import { chatbotSidebarData } from "@/constants/chatbot-sidebar-data";

export default function AppChatbotSidebar(
  props: React.ComponentProps<typeof AppSidebar>,
) {
  return <AppSidebar navGroups={chatbotSidebarData.navGroups} {...props} />;
}
