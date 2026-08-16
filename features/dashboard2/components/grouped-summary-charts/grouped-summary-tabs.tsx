"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDefaultLast7DaysRange,
  StartAndEndDateTimePicker,
  toStartEndDateTimeFormats,
  type StartEndDateTimeValue,
} from "@/components/start-and-end-datetime-picker";
import { AgentHorizontalBarChart } from "@/features/dashboard2/components/agent-charts/agent-horizontal-bar-chart";
import { InboxHorizontalBarChart } from "@/features/dashboard2/components/inbox-charts/inbox-horizontal-bar-chart";
import { LabelHorizontalBarChart } from "@/features/dashboard2/components/label-charts/label-horizontal-bar-chart";
import { TeamHorizontalBarChart } from "@/features/dashboard2/components/team-charts/team-horizontal-bar-chart";

function toUnixRange(value: StartEndDateTimeValue) {
  const formats = toStartEndDateTimeFormats(value);
  return {
    since: formats.since ?? 0,
    until: formats.until ?? 0,
  };
}

export function GroupedSummaryTabs({ className }: { className?: string }) {
  const [tab, setTab] = useState("agent");
  const [rangeValue, setRangeValue] = useState<StartEndDateTimeValue>(
    getDefaultLast7DaysRange,
  );
  const range = useMemo(() => toUnixRange(rangeValue), [rangeValue]);
  const hasRange = range.since > 0 && range.until >= range.since;

  return (
    <Tabs value={tab} onValueChange={setTab} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="agent" className="cursor-pointer px-4">
            Agent
          </TabsTrigger>
          <TabsTrigger value="label" className="cursor-pointer px-4">
            Label
          </TabsTrigger>
          <TabsTrigger value="inbox" className="cursor-pointer px-4">
            Inbox
          </TabsTrigger>
          <TabsTrigger value="team" className="cursor-pointer px-4">
            Team
          </TabsTrigger>
        </TabsList>
        <StartAndEndDateTimePicker
          value={rangeValue}
          onChange={setRangeValue}
          numberOfMonths={2}
          placeholder="Chọn khoảng thời gian"
          align="end"
          className="shrink-0"
        />
      </div>

      <TabsContent value="agent" className="mt-4">
        {hasRange ? (
          <AgentHorizontalBarChart
            since={range.since}
            until={range.until}
            hideDatePicker
          />
        ) : null}
      </TabsContent>
      <TabsContent value="label" className="mt-4">
        {hasRange ? (
          <LabelHorizontalBarChart
            since={range.since}
            until={range.until}
            hideDatePicker
          />
        ) : null}
      </TabsContent>
      <TabsContent value="inbox" className="mt-4">
        {hasRange ? (
          <InboxHorizontalBarChart
            since={range.since}
            until={range.until}
            hideDatePicker
          />
        ) : null}
      </TabsContent>
      <TabsContent value="team" className="mt-4">
        {hasRange ? (
          <TeamHorizontalBarChart
            since={range.since}
            until={range.until}
            hideDatePicker
          />
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
