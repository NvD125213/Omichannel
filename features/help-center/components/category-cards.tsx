"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  CreditCard,
  KeyRound,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

const categories = [
  {
    title: "Bắt đầu",
    description: "Mới sử dụng nền tảng? Bắt đầu tại đây",
    icon: Sparkles,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    articleCount: 12,
  },
  {
    title: "Tài khoản & Cài đặt",
    description: "Quản lý tài khoản và tùy chọn cá nhân",
    icon: Settings,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    articleCount: 8,
  },
  {
    title: "Thanh toán & Gói dịch vụ",
    description: "Câu hỏi về thanh toán và đăng ký gói",
    icon: CreditCard,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    articleCount: 15,
  },
  {
    title: "Bảo mật & Quyền riêng tư",
    description: "Giữ tài khoản của bạn an toàn",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    articleCount: 10,
  },
  {
    title: "API & Tích hợp",
    description: "Tài liệu dành cho nhà phát triển và API",
    icon: KeyRound,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    articleCount: 20,
  },
  {
    title: "Nhóm & Cộng tác",
    description: "Làm việc với nhóm và thành viên",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    articleCount: 14,
  },
  {
    title: "Hướng dẫn & Bài viết",
    description: "Hướng dẫn từng bước và bài viết chi tiết",
    icon: BookOpen,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    articleCount: 18,
  },
  {
    title: "Hỗ trợ & Liên hệ",
    description: "Liên hệ đội ngũ hỗ trợ của chúng tôi",
    icon: MessageSquare,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    articleCount: 5,
  },
];

export function CategoryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Card
            key={category.title}
            className="group h-full border transition-all hover:shadow-md"
          >
            <CardContent className="flex flex-col gap-4 p-6">
              <div
                className={`flex size-12 items-center justify-center rounded-lg ${category.bgColor} ${category.borderColor} border transition-transform group-hover:scale-110`}
              >
                <Icon className={`size-6 ${category.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold leading-tight">
                  {category.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {category.description}
                </p>
              </div>
              <div className="mt-auto">
                <Badge variant="outline" className="text-xs">
                  {category.articleCount} bài viết
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
