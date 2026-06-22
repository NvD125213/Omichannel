import { chatbotSidebarData } from "./chatbot-sidebar-data";

/** URL prefixes thuộc workspace (chatbot) — dùng cho layout & TeamSwitcher */

function collectChatbotSidebarUrls(): string[] {
  const urls: string[] = [];

  for (const group of chatbotSidebarData.navGroups) {
    for (const item of group.items) {
      if ("url" in item && typeof item.url === "string") {
        urls.push(item.url);
      }

      if ("items" in item && item.items) {
        for (const subItem of item.items) {
          if (typeof subItem.url === "string") {
            urls.push(subItem.url);
          }
        }
      }
    }
  }

  return urls;
}

const CHATBOT_SIDEBAR_URLS = collectChatbotSidebarUrls();

export const CHATBOT_ROUTE_PREFIXES = [...CHATBOT_SIDEBAR_URLS, "/ai"] as const;

export function isChatbotPath(pathname: string) {
  if (pathname === "/ai" || pathname.startsWith("/ai/")) {
    return true;
  }

  return CHATBOT_SIDEBAR_URLS.some(
    (url) => pathname === url || pathname.startsWith(`${url}/`),
  );
}
