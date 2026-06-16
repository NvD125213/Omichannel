"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useListChatwootAgents,
  useListTenantInboxes,
  useListTenantLabels,
} from "@/hooks/chatwoot/use-chatwoot";
import { cn } from "@/lib/utils";
import {
  CHAT_CONVERSATION_STATUS_OPTIONS,
  type ChatConversationFilterDraft,
} from "../utils/conversation-filter";

type TenantInboxItem = {
  id?: number | string;
  name?: string;
};

const coerceStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;

const coerceObjectArray = (
  value: unknown,
): Array<Record<string, unknown>> | null =>
  Array.isArray(value) &&
  value.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  )
    ? (value as Array<Record<string, unknown>>)
    : null;

function extractRawLabels(
  response: unknown,
): Array<string | Record<string, unknown>> {
  if (!response || typeof response !== "object") return [];
  const root = response as Record<string, unknown>;
  const fromData = root.data as Record<string, unknown> | undefined;
  const chatwoot = fromData?.chatwoot as Record<string, unknown> | undefined;

  const chatwootPayloadObjects = coerceObjectArray(chatwoot?.payload);
  if (chatwootPayloadObjects) return chatwootPayloadObjects;

  const chatwootPayloadStrings = coerceStringArray(chatwoot?.payload);
  if (chatwootPayloadStrings) return chatwootPayloadStrings;

  const dataLabelStrings = coerceStringArray(fromData?.labels);
  if (dataLabelStrings) return dataLabelStrings;

  return [];
}

function extractAgentRecords(
  response: unknown,
): Record<string, unknown>[] | null {
  const coerceRecords = (value: unknown) => {
    if (!Array.isArray(value)) return null;
    return value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  };

  const directArray = coerceRecords(response);
  if (directArray) return directArray;
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;

  return (
    coerceRecords(data?.payload) ??
    coerceRecords(data?.agents) ??
    coerceRecords(
      (data?.chatwoot as Record<string, unknown> | undefined)?.payload,
    ) ??
    null
  );
}

type FilterComboboxFieldProps = {
  label: string;
  values: string[];
  placeholder: string;
  searchPlaceholder: string;
  options: Array<{ value: string; label: string }>;
  onValuesChange: (values: string[]) => void;
  showSeparator?: boolean;
};

function FilterComboboxField({
  label,
  values,
  placeholder,
  searchPlaceholder,
  options,
  onValuesChange,
  showSeparator = false,
}: FilterComboboxFieldProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: string) => {
    onValuesChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  return (
    <>
      {showSeparator && <Separator />}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-10 w-full justify-between border-input bg-transparent hover:bg-accent/50"
            >
              {values.length > 0 ? `${values.length} đã chọn` : placeholder}
              <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                          values.includes(option.value)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50",
                        )}
                      >
                        {values.includes(option.value) && (
                          <Check className="size-3 text-white" />
                        )}
                      </div>
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {values.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {values.map((value) => {
              const option = options.find((item) => item.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="gap-1 border-primary/20 bg-primary/10 py-1 pr-1 pl-2 text-xs text-primary hover:bg-primary/20"
                >
                  {option?.label || value}
                  <button
                    type="button"
                    onClick={() => toggleValue(value)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Xóa ${option?.label || value}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

type FilterSelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
  showSeparator?: boolean;
};

function FilterSelectField({
  label,
  value,
  placeholder,
  options,
  onValueChange,
  showSeparator = false,
}: FilterSelectFieldProps) {
  return (
    <>
      {showSeparator && <Separator />}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <Select value={value || undefined} onValueChange={onValueChange}>
          <SelectTrigger className="h-10 w-full border-input bg-transparent focus:ring-2 focus:ring-primary/20">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export type ChatConversationFilterFormProps = {
  tenantId: string;
  value: ChatConversationFilterDraft;
  onChange: (next: ChatConversationFilterDraft) => void;
  className?: string;
};

export function ChatConversationFilterForm({
  tenantId,
  value,
  onChange,
  className,
}: ChatConversationFilterFormProps) {
  const { data: inboxData } = useListTenantInboxes(tenantId);
  const { data: labelData } = useListTenantLabels(tenantId);
  const { data: agentsData } = useListChatwootAgents(tenantId);

  const inboxOptions = useMemo(() => {
    const inboxPayload = (
      inboxData?.data as { chatwoot?: { payload?: unknown } } | undefined
    )?.chatwoot?.payload;
    const inboxes: TenantInboxItem[] = Array.isArray(inboxPayload)
      ? (inboxPayload as TenantInboxItem[])
      : [];

    return inboxes
      .map((inbox) => {
        const id =
          typeof inbox.id === "number"
            ? inbox.id
            : typeof inbox.id === "string"
              ? Number(inbox.id)
              : Number.NaN;
        if (!Number.isFinite(id)) return null;
        const name =
          typeof inbox.name === "string" && inbox.name.length > 0
            ? inbox.name
            : `Inbox #${id}`;
        return { value: String(id), label: name };
      })
      .filter(
        (item): item is { value: string; label: string } => item !== null,
      );
  }, [inboxData]);

  const labelOptions = useMemo(() => {
    return extractRawLabels(labelData)
      .map((raw, index) => {
        if (typeof raw === "string") {
          return { value: raw, label: raw };
        }
        const title =
          typeof raw.title === "string"
            ? raw.title
            : typeof raw.name === "string"
              ? raw.name
              : typeof raw.label === "string"
                ? raw.label
                : `Label ${index + 1}`;
        return { value: title, label: title };
      })
      .filter((item) => item.value.length > 0);
  }, [labelData]);

  const assigneeOptions = useMemo(() => {
    const records = extractAgentRecords(agentsData) ?? [];
    return records
      .map((record, index) => {
        const id = String(record.id ?? record.user_id ?? "").trim();
        if (!id) return null;
        const name = String(
          record.name ??
            record.available_name ??
            record.email ??
            `Agent ${index + 1}`,
        ).trim();
        return { value: id, label: name };
      })
      .filter(
        (item): item is { value: string; label: string } => item !== null,
      );
  }, [agentsData]);

  const patch = (partial: Partial<ChatConversationFilterDraft>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className={cn("space-y-5", className)}>
      <FilterComboboxField
        label="Trạng thái"
        values={value.status}
        placeholder="Chọn trạng thái"
        searchPlaceholder="Tìm trạng thái..."
        options={[...CHAT_CONVERSATION_STATUS_OPTIONS]}
        onValuesChange={(status) => patch({ status })}
      />
      <FilterSelectField
        label="Người phụ trách"
        value={value.assigneeId}
        placeholder="Chọn người phụ trách"
        options={assigneeOptions}
        onValueChange={(assigneeId) => patch({ assigneeId })}
        showSeparator
      />
      <FilterSelectField
        label="Inbox"
        value={value.inboxId}
        placeholder="Chọn inbox"
        options={inboxOptions}
        onValueChange={(inboxId) => patch({ inboxId })}
        showSeparator
      />
      <FilterComboboxField
        label="Nhãn"
        values={value.labels}
        placeholder="Chọn nhãn"
        searchPlaceholder="Tìm nhãn..."
        options={labelOptions}
        onValuesChange={(labels) => patch({ labels })}
        showSeparator
      />
    </div>
  );
}
