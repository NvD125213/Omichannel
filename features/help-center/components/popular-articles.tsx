"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

const popularArticles = [
  {
    title: "Bắt đầu: Dự án đầu tiên của bạn",
    description:
      "Tìm hiểu cách thiết lập dự án đầu tiên và điều hướng bảng điều khiển",
    category: "Bắt đầu",
    readTime: "5 phút đọc",
    views: "12,5k",
    href: "#",
  },
  {
    title: "Hiểu về vai trò và quyền người dùng",
    description:
      "Hướng dẫn toàn diện về quản lý thành viên nhóm và mức truy cập",
    category: "Nhóm & Cộng tác",
    readTime: "8 phút đọc",
    views: "8,2k",
    href: "#",
  },
  {
    title: "Thiết lập xác thực hai yếu tố (2FA)",
    description:
      "Hướng dẫn từng bước để bảo mật tài khoản bằng xác thực hai yếu tố",
    category: "Bảo mật & Quyền riêng tư",
    readTime: "3 phút đọc",
    views: "15,3k",
    href: "#",
  },
  {
    title: "Xác thực API và thực hành tốt nhất",
    description:
      "Cách xác thực yêu cầu API và tuân thủ các nguyên tắc bảo mật",
    category: "API & Tích hợp",
    readTime: "12 phút đọc",
    views: "6,7k",
    href: "#",
  },
  {
    title: "Quản lý thanh toán và gói đăng ký",
    description: "Mọi thứ bạn cần biết về quản lý gói dịch vụ",
    category: "Thanh toán & Gói dịch vụ",
    readTime: "4 phút đọc",
    views: "9,1k",
    href: "#",
  },
  {
    title: "Tùy chỉnh không gian làm việc",
    description:
      "Cá nhân hóa bảng điều khiển và không gian làm việc theo quy trình của bạn",
    category: "Tài khoản & Cài đặt",
    readTime: "6 phút đọc",
    views: "7,4k",
    href: "#",
  },
];

export function PopularArticles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bài viết phổ biến</h2>
        <Link
          href="#"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Xem tất cả bài viết →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {popularArticles.map((article, index) => (
          <Link key={index} href={article.href}>
            <Card className="h-full border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    <h3 className="font-semibold leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {article.description}
                    </p>
                  </div>
                  <BookOpen className="text-muted-foreground size-5 shrink-0" />
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {article.readTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      {article.views} lượt xem
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
