"use client";

import { CircleHelp } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  HintTooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WebCrawlFieldLabelProps {
  htmlFor?: string;
  label: string;
  hint?: string;
}

export function WebCrawlFieldLabel({
  htmlFor,
  label,
  hint,
}: WebCrawlFieldLabelProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`Giải thích: ${label}`}
            >
              <CircleHelp className="size-3.5 text-destructive" />
            </button>
          </TooltipTrigger>
          <HintTooltipContent>{hint}</HintTooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export const WEB_CRAWL_FIELD_HINTS = {
  seedUrls: "URL gốc để bắt đầu crawl, ví dụ https://example.com.",
  allowedDomains:
    "Chỉ crawl các domain được liệt kê. Nhập domain rồi nhấn Enter để thêm, ví dụ example.com.",
  includePaths:
    "Chỉ crawl các đường dẫn khớp danh sách này. Nhập path rồi nhấn Enter, ví dụ /docs.",
  blockPaths:
    "Bỏ qua các đường dẫn khớp danh sách này. Nhập path rồi nhấn Enter, ví dụ /login.",
  maxPages: "Giới hạn số trang tối đa sẽ được thu thập trong một job crawl.",
  maxDepth:
    "Độ sâu liên kết tối đa tính từ seed URL. 0 nghĩa là chỉ crawl các URL được chỉ định.",
  minQuality:
    "Điểm chất lượng tối thiểu để chấp nhận nội dung trang sau khi crawl.",
  chunkTokens: "Số token tối đa cho mỗi chunk khi chia nhỏ nội dung trang.",
  overlap:
    "Số token chồng lấn giữa các chunk liền kề để giữ ngữ cảnh khi embedding.",
  respectRobots:
    "Tuân thủ quy tắc trong file robots.txt của website khi crawl.",
  forceRecrawl:
    "Chạy lại việc cào dữ liệu ngay cả khi nội dung trang đã tồn tại trong hệ thống.",
  approvedUrls:
    "Danh sách URL đã duyệt sẽ được ưu tiên crawl. Mỗi dòng một URL.",
} as const;
