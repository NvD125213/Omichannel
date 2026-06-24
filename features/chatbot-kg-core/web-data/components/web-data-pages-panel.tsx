"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyData } from "@/components/empty-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useListWebCrawlPages } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type {
  WebCrawlJob,
  WebCrawlPage,
} from "@/services/chatbot-kg-core/interfaces";
import { IconMoodEmpty } from "@tabler/icons-react";
import { WebDataPageItem } from "./web-data-page-item";
import { WebDataPagination } from "./web-data-pagination";
import {
  getCrawlJobStatItems,
} from "../utils/web-crawl-page-meta";

interface WebDataPagesPanelProps {
  graphId: string;
  crawlJob: WebCrawlJob | null;
}

function getPageKey(page: WebCrawlPage, index: number) {
  return page.id ?? page.url ?? `page-${index}`;
}

export function WebDataPagesPanel({
  graphId,
  crawlJob,
}: WebDataPagesPanelProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const crawlJobId = crawlJob?.id ?? "";

  useEffect(() => {
    setPage(1);
  }, [crawlJobId]);

  const listParams = useMemo(
    () => ({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, pageSize],
  );

  const { data, isLoading, isFetching } = useListWebCrawlPages(
    graphId,
    crawlJobId,
    listParams,
  );

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, total > 0 ? Math.ceil(total / pageSize) : 1);
  const pages = data?.items ?? [];

  const pagination = useMemo(
    () => ({
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    }),
    [total, page, pageSize, totalPages],
  );

  const handlePageChange = useCallback((newPage: number | null | undefined) => {
    if (!newPage) return;
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback(
    (newPageSize: number | null | undefined) => {
      if (!newPageSize) return;
      setPage(1);
      setPageSize(newPageSize);
    },
    [],
  );

  useEffect(() => {
    if (isFetching || total === 0) return;
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [isFetching, total, page, totalPages]);

  if (!crawlJob) {
    return (
      <div className="py-10">
        <EmptyData
          icon={IconMoodEmpty}
          title="Chọn job crawl"
          description="Chọn một job ở danh sách để xem các trang đã thu thập"
          showButton={false}
          buttonText=""
          onButtonClick={() => {}}
        />
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-20 w-full rounded-xl bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="py-10">
        <EmptyData
          icon={IconMoodEmpty}
          title="Chưa có trang"
          description="Job crawl này chưa có trang nào hoặc đang được xử lý"
          showButton={false}
          buttonText=""
          onButtonClick={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {getCrawlJobStatItems(crawlJob.stats).map((item) => (
          <span key={item.key} className={item.pillClass}>
            {item.label} {item.value}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {pages.map((webPage, index) => (
          <WebDataPageItem
            key={getPageKey(webPage, index)}
            page={webPage}
            index={index}
          />
        ))}
      </div>

      <WebDataPagination
        pagination={pagination}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        itemLabel="trang"
      />
    </div>
  );
}
