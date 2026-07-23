"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyData } from "@/components/empty-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  EllipsisVertical,
  Inbox,
  PanelLeft,
  Pencil,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useDeleteTenantLabel,
  useListTenantLabels,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import { AddLabelDialog, type LabelItemPayload } from "./add-label-form";

type LabelItem = {
  id: string;
  title: string;
  description: string;
  color: string;
  show_on_sidebar: boolean;
};

const FALLBACK_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#16A34A",
  "#0891B2",
];

function coerceStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const strings = value.filter((v): v is string => typeof v === "string");
  return strings.length === value.length ? strings : null;
}

function coerceObjectArray(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

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

  const stringLabels = coerceStringArray(fromData?.labels);
  if (stringLabels) return stringLabels;

  const objectLabels = coerceObjectArray(fromData?.labels);
  if (objectLabels) return objectLabels;

  const directStrings = coerceStringArray(root.data);
  if (directStrings) return directStrings;

  const payloadStrings = coerceStringArray(
    (fromData?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (payloadStrings) return payloadStrings;

  const payloadObjects = coerceObjectArray(
    (fromData?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (payloadObjects) return payloadObjects;

  return [];
}

function normalizeLabel(
  raw: string | Record<string, unknown>,
  index: number,
): LabelItem {
  if (typeof raw === "string") {
    return {
      id: raw,
      title: raw,
      description: "",
      color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      show_on_sidebar: true,
    };
  }

  const title = String(raw.title ?? raw.label ?? raw.name ?? "").trim();
  const description = String(raw.description ?? "").trim();
  const color = String(raw.color ?? "").trim();

  return {
    id: String(
      raw.id !== null && raw.id !== undefined
        ? raw.id
        : title
          ? title
          : `label-${index + 1}`,
    ),
    title: title || `Label ${index + 1}`,
    description,
    color: color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    show_on_sidebar: Boolean(raw.show_on_sidebar ?? true),
  };
}

export default function LabelList() {
  const [query, setQuery] = useState("");
  const [editingLabel, setEditingLabel] = useState<LabelItemPayload | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [pendingDeleteLabel, setPendingDeleteLabel] =
    useState<LabelItem | null>(null);
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";

  const { data, isLoading, isFetching } = useListTenantLabels(tenantId);
  const deleteLabelMutation = useDeleteTenantLabel();

  const labels = useMemo(() => {
    return extractRawLabels(data).map(normalizeLabel);
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return labels;
    return labels.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }, [labels, query]);

  return (
    <div className="w-full space-y-4 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Label htmlFor="label-search" className="sr-only">
            Tìm kiếm label
          </Label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="label-search"
            type="search"
            placeholder="Tìm kiếm label…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full pl-9"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <AddLabelDialog />
          <AddLabelDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) setEditingLabel(null);
            }}
            editLabel={editingLabel}
          />
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border py-2">
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Skeleton className="size-9 shrink-0 rounded-lg" />
                      <Skeleton className="h-4 w-28 max-w-full" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="size-7 rounded-md" />
                      <Skeleton className="size-7 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full" />
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border py-6">
            <EmptyData
              icon={Inbox}
              title="Không có label"
              description="Chưa có label nào trong hệ thống."
              showButton={false}
            />
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Card key={item.id} className="relative overflow-hidden border py-2">
                <div className="space-y-2.5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className="size-9 shrink-0 rounded-lg border"
                        style={{ backgroundColor: item.color }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-semibold">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditingLabel({
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            color: item.color,
                            show_on_sidebar: item.show_on_sidebar,
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Sửa</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <EllipsisVertical className="size-3.5" />
                            <span className="sr-only">Hành động</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            disabled={deleteLabelMutation.isPending || !tenantId}
                            onClick={() => setPendingDeleteLabel(item)}
                          >
                            <Trash2 className="size-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlignLeft className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.description || "Không có mô tả"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 border border-border/70 bg-background text-[11px] font-medium text-foreground",
                      )}
                    >
                      <Tag className="size-3" />
                      {item.title}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {item.color}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="gap-1 text-[11px] font-medium"
                    >
                      <PanelLeft className="size-3" />
                      {item.show_on_sidebar
                        ? "Hiển thị sidebar"
                        : "Ẩn sidebar"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isFetching && !isLoading ? (
        <p className="text-xs text-muted-foreground">Đang đồng bộ dữ liệu...</p>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteLabel)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteLabel(null);
        }}
        title="Xác nhận xóa label"
        description={`Xóa label “${pendingDeleteLabel?.title ?? ""}”? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="destructive"
        loading={deleteLabelMutation.isPending}
        onConfirm={() => {
          if (!pendingDeleteLabel || !tenantId) return;
          deleteLabelMutation.mutate(
            {
              tenantId,
              label: pendingDeleteLabel.title,
            },
            {
              onSuccess: () => setPendingDeleteLabel(null),
            },
          );
        }}
      />
    </div>
  );
}
