"use client";

import {
  Activity,
  CircleHelp,
  Globe,
  Home,
  ListTree,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyData } from "@/components/empty-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxMultiple } from "@/components/ui/combobox-multiple";
import { Input } from "@/components/ui/input";
import {
  HintTooltipContent,
  Tooltip,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateWebCrawl,
  useWebCrawlDryRun,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { useGraphId } from "@/hooks/use-graph-id";
import type { WebCrawlDryRunItem } from "@/services/chatbot-kg-core/interfaces";
import { IconMoodEmpty } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { WebDataDryRunListItem } from "./web-data-dry-run-list-item";
import {
  WEB_CRAWL_FIELD_HINTS,
  WebCrawlFieldLabel,
} from "./web-crawl-field-label";
import {
  buildWebCrawlConfig,
  DEFAULT_BLOCK_PATH_OPTIONS,
  DEFAULT_INCLUDE_PATH_OPTIONS,
  extractDomainsFromSeedUrls,
  stripTrailingSlash,
  webCrawlFormDefaultValues,
  type WebCrawlFormState,
} from "../utils/web-crawl-form";

const fieldClass =
  "h-9 rounded-lg border-input/80 bg-white shadow-xs dark:bg-card";

const cardClass =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm";

const actionButtonClass = "h-9 rounded-lg";

function WebDataDryRunLoadingPanel() {
  return (
    <div className="w-full max-w-md space-y-3 px-6 text-center">
      <p className="text-sm font-medium text-foreground/85">
        Đang chạy thử để lấy dữ liệu...
      </p>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-400/30 shadow-[inset_0_1px_2px_rgba(15,23,42,0.14)] ring-1 ring-zinc-500/25 dark:bg-zinc-600/35 dark:ring-zinc-500/35">
        <div className="absolute inset-y-0 left-0 w-[38%] animate-dry-run-wave rounded-full bg-linear-to-r from-white/0 via-white/85 to-white/0 dark:via-white/35" />
      </div>
    </div>
  );
}

export function WebDataAction() {
  const router = useRouter();
  const graphId = useGraphId();

  const [form, setForm] = useState<WebCrawlFormState>(
    webCrawlFormDefaultValues,
  );
  const [dryRunItems, setDryRunItems] = useState<WebCrawlDryRunItem[]>([]);
  const [approvedUrlKeys, setApprovedUrlKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<WebCrawlDryRunItem | null>(
    null,
  );

  const { mutateAsync: runDryRun, isPending: isDryRunning } =
    useWebCrawlDryRun();
  const { mutateAsync: createWebCrawl, isPending: isQueueing } =
    useCreateWebCrawl();

  const dryRunCount = dryRunItems.length;
  const approvedCount = approvedUrlKeys.size;

  const dryRunItemKey = (item: WebCrawlDryRunItem) =>
    item.canonical_url || item.url;

  const getApprovedUrls = () =>
    dryRunItems
      .filter((item) => approvedUrlKeys.has(dryRunItemKey(item)))
      .map((item) => item.url);

  const allDryRunApproved =
    dryRunItems.length > 0 &&
    dryRunItems.every((item) => approvedUrlKeys.has(dryRunItemKey(item)));

  const updateForm = <K extends keyof WebCrawlFormState>(
    key: K,
    value: WebCrawlFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleResetForm = () => {
    setForm(webCrawlFormDefaultValues);
    setDryRunItems([]);
    setApprovedUrlKeys(new Set());
  };

  const handleDryRun = async () => {
    const config = buildWebCrawlConfig(form, getApprovedUrls());
    if (!config || !graphId) {
      toast.error("Vui lòng nhập ít nhất một Seed URL");
      return;
    }

    const result = await runDryRun({ graphId, data: config });
    const items = result.items ?? [];
    setDryRunItems(items);
    setApprovedUrlKeys(new Set(items.map(dryRunItemKey)));
    toast.success(`Chạy thử hoàn tất · ${result.total ?? 0} URL`);
  };

  const handleQueue = async () => {
    const config = buildWebCrawlConfig(form, getApprovedUrls());
    if (!config || !graphId) {
      toast.error("Vui lòng nhập ít nhất một Seed URL");
      return;
    }

    await createWebCrawl({ graphId, data: config });
    toast.success("Đã đưa job crawl vào hàng đợi");
    router.push("/ai/web-data");
  };

  const handleToggleAllApproved = (approved: boolean) => {
    if (approved) {
      setApprovedUrlKeys(new Set(dryRunItems.map(dryRunItemKey)));
      return;
    }

    setApprovedUrlKeys(new Set());
  };

  const handleToggleItemApproved = (
    item: WebCrawlDryRunItem,
    approved: boolean,
  ) => {
    const key = dryRunItemKey(item);
    setApprovedUrlKeys((current) => {
      const next = new Set(current);
      if (approved) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleDeleteDryRunItem = (item: WebCrawlDryRunItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;

    const key = dryRunItemKey(deletingItem);
    setDryRunItems((current) =>
      current.filter((item) => dryRunItemKey(item) !== key),
    );
    setApprovedUrlKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setDeleteDialogOpen(false);
    setDeletingItem(null);
    toast.success("Đã xóa URL khỏi dry-run");
  };

  const isSubmitting = isDryRunning || isQueueing;

  const listHeaderClass =
    "hidden px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto] sm:items-center sm:gap-3";

  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-2 pb-3">
        <AppBreadcrumb
          items={[
            {
              label: "Trang chủ",
              href: "/ai/dashboard",
              icon: <Home className="size-4" />,
            },
            {
              label: "Web Data",
              href: "/ai/web-data",
              icon: <Globe className="size-4" />,
            },
            {
              label: "Hành động",
              href: "/ai/web-data/actions",
              icon: <Activity className="size-4" />,
            },
          ]}
        />
      </div>

      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden px-4">
        <Card className={cardClass}>
          <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-2">
            <div className="flex min-h-0 flex-col border-border/60 xl:border-r">
              <div className="shrink-0 border-b border-border/60 bg-card px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Globe className="size-4 text-primary/70" />
                    Dữ liệu web mới
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    onClick={handleResetForm}
                    aria-label="Đặt lại form"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-card">
                <div className="flex h-0 min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-4 thin-scroll">
                  <div className="space-y-2">
                    <WebCrawlFieldLabel
                      htmlFor="seed-urls"
                      label="URL khởi tạo"
                      hint={WEB_CRAWL_FIELD_HINTS.seedUrls}
                    />
                    <Input
                      id="seed-urls"
                      type="url"
                      value={form.seedUrls}
                      onChange={(event) =>
                        updateForm(
                          "seedUrls",
                          stripTrailingSlash(event.target.value),
                        )
                      }
                      placeholder="https://example.com"
                      className={fieldClass}
                    />
                  </div>

                  <div className="space-y-3">
                    <ComboboxMultiple
                      id="allowed-domains"
                      label="Domain được phép"
                      hint={WEB_CRAWL_FIELD_HINTS.allowedDomains}
                      value={form.allowedDomains}
                      onValueChange={(value) =>
                        updateForm("allowedDomains", value)
                      }
                      options={extractDomainsFromSeedUrls(form.seedUrls)}
                      placeholder="Nhập domain rồi nhấn Enter..."
                    />
                    <ComboboxMultiple
                      id="include-paths"
                      label="Đường dẫn bao gồm"
                      hint={WEB_CRAWL_FIELD_HINTS.includePaths}
                      value={form.includePaths}
                      onValueChange={(value) =>
                        updateForm("includePaths", value)
                      }
                      options={DEFAULT_INCLUDE_PATH_OPTIONS}
                      placeholder="Nhập path rồi nhấn Enter, ví dụ /docs"
                      ensureLeadingSlash
                    />
                    <ComboboxMultiple
                      id="block-paths"
                      label="Đường dẫn chặn"
                      hint={WEB_CRAWL_FIELD_HINTS.blockPaths}
                      value={form.blockPaths}
                      onValueChange={(value) => updateForm("blockPaths", value)}
                      options={DEFAULT_BLOCK_PATH_OPTIONS}
                      placeholder="Nhập path rồi nhấn Enter, ví dụ /login"
                      ensureLeadingSlash
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <WebCrawlFieldLabel
                        htmlFor="max-pages"
                        label="Số trang tối đa"
                        hint={WEB_CRAWL_FIELD_HINTS.maxPages}
                      />
                      <Input
                        id="max-pages"
                        type="number"
                        min={1}
                        value={form.maxPages}
                        onChange={(event) =>
                          updateForm(
                            "maxPages",
                            Number(event.target.value) || 0,
                          )
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <WebCrawlFieldLabel
                        htmlFor="max-depth"
                        label="Độ sâu tối đa"
                        hint={WEB_CRAWL_FIELD_HINTS.maxDepth}
                      />
                      <Input
                        id="max-depth"
                        type="number"
                        min={0}
                        value={form.maxDepth}
                        onChange={(event) =>
                          updateForm(
                            "maxDepth",
                            Number(event.target.value) || 0,
                          )
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <WebCrawlFieldLabel
                        htmlFor="min-quality"
                        label="Chất lượng tối thiểu"
                        hint={WEB_CRAWL_FIELD_HINTS.minQuality}
                      />
                      <Input
                        id="min-quality"
                        type="number"
                        min={0}
                        value={form.minQuality}
                        onChange={(event) =>
                          updateForm(
                            "minQuality",
                            Number(event.target.value) || 0,
                          )
                        }
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <WebCrawlFieldLabel
                        htmlFor="chunk-tokens"
                        label="Token mỗi chunk"
                        hint={WEB_CRAWL_FIELD_HINTS.chunkTokens}
                      />
                      <Input
                        id="chunk-tokens"
                        type="number"
                        min={1}
                        value={form.chunkTokens}
                        onChange={(event) =>
                          updateForm(
                            "chunkTokens",
                            Number(event.target.value) || 0,
                          )
                        }
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <WebCrawlFieldLabel
                        htmlFor="overlap"
                        label="Token chồng lấn"
                        hint={WEB_CRAWL_FIELD_HINTS.overlap}
                      />
                      <Input
                        id="overlap"
                        type="number"
                        min={0}
                        value={form.overlap}
                        onChange={(event) =>
                          updateForm("overlap", Number(event.target.value) || 0)
                        }
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={form.respectRobots}
                        onCheckedChange={(checked) =>
                          updateForm("respectRobots", checked === true)
                        }
                      />
                      <span className="flex items-center gap-1.5">
                        Tuân thủ robots.txt
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                              aria-label="Giải thích robots.txt"
                            >
                              <CircleHelp className="size-3.5 text-destructive" />
                            </button>
                          </TooltipTrigger>
                          <HintTooltipContent>
                            {WEB_CRAWL_FIELD_HINTS.respectRobots}
                          </HintTooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Checkbox
                        checked={form.forceRecrawl}
                        onCheckedChange={(checked) =>
                          updateForm("forceRecrawl", checked === true)
                        }
                      />
                      <span className="flex items-center gap-1.5">
                        Chạy lại việc cào dữ liệu
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                              aria-label="Giải thích crawl lại bắt buộc"
                            >
                              <CircleHelp className="size-3.5 text-destructive" />
                            </button>
                          </TooltipTrigger>
                          <HintTooltipContent>
                            {WEB_CRAWL_FIELD_HINTS.forceRecrawl}
                          </HintTooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-2 border-t border-border/60 bg-card px-5 pt-4">
                  <Button
                    type="button"
                    className={cn(actionButtonClass, "min-w-[110px]")}
                    onClick={handleDryRun}
                    disabled={isSubmitting}
                  >
                    {isDryRunning ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ListTree className="size-4" />
                    )}
                    Chạy thử
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className={actionButtonClass}
                    onClick={handleQueue}
                    disabled={isSubmitting}
                  >
                    {isQueueing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Đưa vào hàng đợi
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(actionButtonClass, "ml-auto")}
                    asChild
                  >
                    <Link href="/ai/web-data">Quay lại danh sách</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col">
              <div className="shrink-0 border-b border-border/60 bg-card px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                    <ListTree className="size-4 text-primary/70" />
                    Danh sách URL được phát hiện sau khi chạy thử
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums bg-primary/10 text-primary/90"
                    >
                      {dryRunCount}
                    </Badge>
                  </CardTitle>
                </div>
              </div>

              <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-card">
                <div className="relative flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
                  <div
                    className={cn(
                      "flex h-0 min-h-0 flex-1 flex-col overflow-hidden transition-[filter,opacity]",
                      isDryRunning &&
                        "pointer-events-none select-none opacity-30 blur-[2px]",
                    )}
                  >
                    {dryRunItems.length > 0 ? (
                      <div className={listHeaderClass}>
                        <Checkbox
                          checked={allDryRunApproved}
                          onCheckedChange={(checked) =>
                            handleToggleAllApproved(checked === true)
                          }
                          aria-label="Chọn tất cả URL đã duyệt"
                        />
                        <span>URL</span>
                        <span>Miền</span>
                        <span>Nguồn</span>
                        <span>Cập nhật</span>
                        <span />
                      </div>
                    ) : null}

                    <div className="h-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-card thin-scroll">
                      {dryRunItems.length > 0 ? (
                        dryRunItems.map((item, index) => (
                          <WebDataDryRunListItem
                            key={dryRunItemKey(item)}
                            item={item}
                            index={index}
                            approved={approvedUrlKeys.has(dryRunItemKey(item))}
                            onApprovedChange={(approved) =>
                              handleToggleItemApproved(item, approved)
                            }
                            onDelete={handleDeleteDryRunItem}
                          />
                        ))
                      ) : (
                        <div className="px-2 py-4">
                          <EmptyData
                            icon={IconMoodEmpty}
                            title="Chưa có danh sách URL được phát hiện"
                            className="
                          min-h-[300px]
                          sm:min-h-[400px]
                          md:min-h-[500px]
                          lg:min-h-[calc(50vh-40px)]
                          xl:min-h-[calc(60vh-20px)]
                          2xl:min-h-[calc(70vh-40px)]
                        "
                            description="Chạy chạy thử để xem danh sách URL được phát hiện"
                            showButton={false}
                            buttonText=""
                            onButtonClick={() => {}}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {isDryRunning ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-400/45 backdrop-blur-[6px] dark:bg-zinc-950/60">
                      <WebDataDryRunLoadingPanel />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa URL này?"
        description={
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground/90">
              {deletingItem?.url}
            </span>{" "}
            sẽ bị gỡ khỏi danh sách chạy thử.
          </span>
        }
        confirmText="Xóa"
        cancelText="Giữ lại"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
      />
    </div>
  );
}
