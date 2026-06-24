"use client";

import { CircleHelp } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  HintTooltipContent,
  Tooltip,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AgentFieldLabelProps {
  htmlFor?: string;
  label: string;
  hint?: string;
}

export function AgentFieldLabel({ htmlFor, label, hint }: AgentFieldLabelProps) {
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

export const AGENT_FIELD_HINTS = {
  key: "Định danh duy nhất của agent, dùng trong API và cấu hình nội bộ.",
  name: "Tên hiển thị trong giao diện quản trị.",
  enabled: "Bật để agent có thể nhận và xử lý hội thoại.",
  temperature: "Độ sáng tạo của mô hình. Giá trị cao hơn → câu trả lời đa dạng hơn.",
  maxTokens: "Giới hạn độ dài phản hồi tối đa.",
  lightragMode: "Chế độ truy vấn LightRAG, ví dụ hybrid, local hoặc global.",
  chunkTopK: "Số chunk tối đa lấy từ đồ thị tri thức mỗi lần truy vấn.",
  systemPrompt: "Hướng dẫn hệ thống định nghĩa vai trò và quy tắc trả lời.",
  responseLanguage: "Ngôn ngữ phản hồi, auto để tự nhận diện.",
  stylePreset: "Preset phong cách hội thoại, ví dụ consultative.",
  customInstructions: "Hướng dẫn bổ sung cho phong cách trả lời.",
  regulationPrompt: "Mô tả phạm vi nghiệp vụ agent được phép hỗ trợ.",
  refusalMessage: "Thông báo khi câu hỏi nằm ngoài phạm vi.",
  requiredContactFields: "Các trường liên hệ bắt buộc, phân tách bằng dấu phẩy.",
  serviceSuggestions: "Gợi ý dịch vụ, mỗi mục phân tách bằng dấu phẩy.",
} as const;
