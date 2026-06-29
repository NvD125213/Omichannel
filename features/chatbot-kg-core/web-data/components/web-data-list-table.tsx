"use client";

import { Globe, Home } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NumberParam, useQueryParams, withDefault } from "use-query-params";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { EmptyData } from "@/components/empty-data";
import {
  SidebarDetail,
  SidebarDetailMain,
  SidebarDetailPanel,
} from "@/components/sidebar-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListWebCrawls } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { useGraphId } from "@/hooks/use-graph-id";
import type { WebCrawlJob } from "@/services/chatbot-kg-core/interfaces";
import { IconMoodEmpty } from "@tabler/icons-react";
import { WebDataListItem } from "./web-data-list-item";
import { WebDataPagination } from "./web-data-pagination";
import { WebDataPagesPanel } from "./web-data-pages-panel";
import { WebDataToolbar } from "./web-data-toolbar";
import { getCrawlJobStatItems } from "../utils/web-crawl-page-meta";

function getCrawlTitle(crawl: WebCrawlJob) {
  const seedUrl = crawl.config?.seed_urls?.[0];
  if (!seedUrl) return "Chạy tiến trình thu thập dữ liệu";

  try {
    return new URL(seedUrl).hostname;
  } catch {
    return seedUrl;
  }
}

export function WebDataListTable() {
  const graphId = useGraphId();
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCrawl, setSelectedCrawl] = useState<WebCrawlJob | null>(null);
  const [crawlOverrides, setCrawlOverrides] = useState<
    Record<string, WebCrawlJob>
  >({});

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
  });

  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 10;

  const listParams = useMemo(
    () => ({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, pageSize],
  );

  const { data, isLoading, isFetching } = useListWebCrawls(graphId, listParams);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, total > 0 ? Math.ceil(total / pageSize) : 1);
  const crawls = useMemo(
    () => (data?.items ?? []).map((crawl) => crawlOverrides[crawl.id] ?? crawl),
    [crawlOverrides, data?.items],
  );

  const handleCrawlUpdate = useCallback((updatedCrawl: WebCrawlJob) => {
    setCrawlOverrides((current) => ({
      ...current,
      [updatedCrawl.id]: updatedCrawl,
    }));

    setSelectedCrawl((current) =>
      current?.id === updatedCrawl.id ? updatedCrawl : current,
    );
  }, []);

  const pagination = useMemo(
    () => ({
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    }),
    [total, page, pageSize, totalPages],
  );

  const handlePageChange = useCallback(
    (newPage: number | null | undefined) => {
      if (!newPage) return;
      setQuery({ page: newPage });
    },
    [setQuery],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number | null | undefined) => {
      if (!newPageSize) return;
      setQuery({ page: 1, page_size: newPageSize });
    },
    [setQuery],
  );

  useEffect(() => {
    if (isFetching || total === 0) return;
    if (page > totalPages) {
      setQuery({ page: totalPages });
    }
  }, [isFetching, total, page, totalPages, setQuery]);

  const handleViewCrawl = (crawl: WebCrawlJob) => {
    setSelectedCrawl(crawl);
    setPanelOpen(true);
  };

  const handlePanelOpenChange = (open: boolean) => {
    setPanelOpen(open);
    if (!open) {
      setSelectedCrawl(null);
    }
  };

  const panelTitle = selectedCrawl
    ? getCrawlTitle(selectedCrawl)
    : "Trang đã crawl";
  const panelDescription = selectedCrawl
    ? getCrawlJobStatItems(selectedCrawl.stats)
        .map((item) => `${item.label} ${item.value}`)
        .join(" · ")
    : "Danh sách trang thu thập từ job crawl";

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
          ]}
        />
      </div>

      <SidebarDetail
        open={panelOpen}
        onOpenChange={handlePanelOpenChange}
        width={42}
        side="right"
        className="h-full max-h-full min-h-0 flex-1 overflow-hidden dark:bg-transparent"
      >
        <SidebarDetailMain className="h-full max-h-full min-h-0 overflow-hidden px-2 pb-4 lg:pb-4 dark:bg-transparent">
          <div className="flex h-full max-h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className="shrink-0 px-2">
              <WebDataToolbar
                title="Web Data"
                description="Theo dõi và quản lý các job crawl web cho agent"
                href="/ai/web-data/actions"
                linkLabel="Dữ liệu web mới"
                linkIcon="plus"
              />
            </div>

            <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden px-2">
              <div className="h-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain thin-scroll">
                {isLoading && !data ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className={`space-y-2.5 px-4 py-4 sm:px-5 ${
                        index % 2 === 0
                          ? "bg-muted/15 dark:bg-white/[0.02]"
                          : "bg-transparent"
                      }`}
                    >
                      <Skeleton className="h-4 w-2/3 rounded-lg bg-zinc-200/90 shadow-sm ring-1 ring-zinc-300/40 dark:bg-white/10 dark:shadow-none dark:ring-white/10" />
                      <Skeleton className="h-3 w-full rounded-lg bg-zinc-200/75 shadow-sm ring-1 ring-zinc-300/30 dark:bg-white/[0.06] dark:shadow-none dark:ring-white/5" />
                    </div>
                  ))
                ) : crawls.length > 0 ? (
                  crawls.map((crawl, index) => (
                    <WebDataListItem
                      key={crawl.id}
                      graphId={graphId}
                      crawl={crawl}
                      index={index}
                      isActive={selectedCrawl?.id === crawl.id && panelOpen}
                      onView={handleViewCrawl}
                      onCrawlUpdate={handleCrawlUpdate}
                    />
                  ))
                ) : (
                  <div className="space-y-4 bg-transparent">
                    <EmptyData
                      icon={IconMoodEmpty}
                      title="Chưa có job crawl"
                      description="Tạo crawl mới để bắt đầu thu thập dữ liệu web"
                      showButton={false}
                      buttonText=""
                    />
                    <div className="flex justify-center px-4 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        asChild
                      >
                        <Link href="/ai/web-data/actions">Crawl mới</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="shrink-0 border-border/50 px-0 py-4 backdrop-blur-sm">
                <WebDataPagination
                  pagination={pagination}
                  currentPage={page}
                  currentPageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  itemLabel="job crawl"
                />
              </div>
            </div>
          </div>
        </SidebarDetailMain>

        <SidebarDetailPanel
          contentKey={selectedCrawl?.id ?? "empty"}
          eyebrow="Trang đã crawl"
          title={panelTitle}
          description={panelDescription}
        >
          {panelOpen ? (
            <WebDataPagesPanel graphId={graphId} crawlJob={selectedCrawl} />
          ) : null}
        </SidebarDetailPanel>
      </SidebarDetail>
    </div>
  );
}
