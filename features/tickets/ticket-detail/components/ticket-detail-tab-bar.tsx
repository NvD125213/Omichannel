"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import TicketDetailLiveChatContext from "./ticket-detail-live-chat-tab";
import TicketDetailEvent from "./ticket-detail-event";
import KabanTicketFlow from "./ticket-flow-chart-tab";
import { TicketTagMain } from "../../ticket-tag/components/ticket-tag-main";

type TabValue = "context" | "task" | "event" | "note" | "tag";

interface Tab {
  name: string;
  value: TabValue;
}

const tabs: Tab[] = [
  { name: "Bối cảnh", value: "context" },
  { name: "Luồng xử lý", value: "task" },
  { name: "Sự kiện", value: "event" },
  { name: "Ghi chú", value: "note" },
  { name: "Tag", value: "tag" },
];

const TabsTicketDetail = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("context");

  const renderTabContent = () => {
    switch (activeTab) {
      case "context":
        return <TicketDetailLiveChatContext />;
      case "event":
        return <TicketDetailEvent />;
      case "task":
        return <KabanTicketFlow />;
      case "note":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">Ghi Chú</h2>
            <p className="text-gray-600">
              Nội dung xử lý task sẽ được hiển thị ở đây
            </p>
          </div>
        );
      case "tag":
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">Quản lý Tag</h2>
            <TicketTagMain />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Tab Navigation - Minimal Style */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8 justify-center px-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="relative py-4 text-sm font-medium transition-colors focus:outline-none"
              >
                <span
                  className={`${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.name}
                </span>

                {/* Simple underline indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - Simple Fade Animation */}
      <div className="min-h-[400px] px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabsTicketDetail;
