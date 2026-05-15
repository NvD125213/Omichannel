"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicFavouriteChart } from "@/features/ai-dashboard/components/topic-favourite-chart";
import { DataTableTopicFavourites } from "@/features/ai-dashboard/components/data-table-topic-favourites";

const TAB_TOPIC_FAVOURITE = "topic-favourite";
const TAB_TOPIC_DETAIL = "topic-detail";

export function TopicFavouriteTabs() {
  const [activeTab, setActiveTab] = useState(TAB_TOPIC_FAVOURITE);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="rounded-lg border bg-transparent p-3 sm:p-4">
        <TabsList className="grid h-auto w-full grid-cols-2 bg-transparent">
          <TabsTrigger
            value={TAB_TOPIC_FAVOURITE}
            className="cursor-pointer bg-transparent"
          >
            Chủ đề yêu thích
          </TabsTrigger>
          <TabsTrigger
            value={TAB_TOPIC_DETAIL}
            className="cursor-pointer bg-transparent"
          >
            Chi tiết
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 overflow-hidden lg:overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === TAB_TOPIC_FAVOURITE ? (
              <motion.div
                key={TAB_TOPIC_FAVOURITE}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <TopicFavouriteChart />
              </motion.div>
            ) : (
              <motion.div
                key={TAB_TOPIC_DETAIL}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <DataTableTopicFavourites />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Tabs>
  );
}
