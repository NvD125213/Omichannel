"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal } from "lucide-react";

const transactions = [
  {
    id: "TXN-001",
    customer: {
      name: "Tập đoàn Vingroup",
      email: "contact@vingroup.vn",
      avatar:
        "https://upload.wikimedia.org/wikipedia/vi/thumb/9/98/Vingroup_logo.svg/1280px-Vingroup_logo.svg.png",
    },
    amount: "$1,999.00",
    status: "completed",
    date: "2 giờ trước",
  },
  {
    id: "TXN-002",
    customer: {
      name: "Viettel Telecom",
      email: "support@viettel.com.vn",
      avatar:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Logo_Viettel.svg/1280px-Logo_Viettel.svg.png",
    },
    amount: "$2,999.00",
    status: "pending",
    date: "5 giờ trước",
  },
  {
    id: "TXN-003",
    customer: {
      name: "FPT Corporation",
      email: "fpt@fpt.com",
      avatar:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo_2010.svg/1280px-FPT_logo_2010.svg.png",
    },
    amount: "$39.00",
    status: "completed",
    date: "1 ngày trước",
  },
  {
    id: "TXN-004",
    customer: {
      name: "Masan Group",
      email: "info@masangroup.com",
      avatar:
        "https://cdn.brvn.vn/news/480px/2013/MasanConsumer-ID2317_1374652469.jpg",
    },
    amount: "$299.00",
    status: "failed",
    date: "2 ngày trước",
  },
  {
    id: "TXN-005",
    customer: {
      name: "Vinamilk",
      email: "vinamilk@vinamilk.com.vn",
      avatar:
        "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_Vinamilk_%282023%29.png",
    },
    amount: "$99.00",
    status: "completed",
    date: "3 ngày trước",
  },
];

export function RecentTransactions() {
  const statusLabel: Record<string, string> = {
    completed: "Hoàn thành",
    pending: "Đang xử lý",
    failed: "Thất bại",
  };

  return (
    <Card className="cursor-pointer bg-linear-to-br from-violet-500/5 border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:space-y-0 pb-4">
        <div>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <CardDescription>
            Các giao dịch mới nhất của khách hàng
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto cursor-pointer"
        >
          <Eye className="size-4" />
          Xem tất cả
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id}>
            <div className="flex flex-col sm:flex-row p-3 rounded-lg border gap-3 sm:gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage
                    src={transaction.customer.avatar}
                    alt={transaction.customer.name}
                  />
                  <AvatarFallback>
                    {transaction.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {transaction.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {transaction.customer.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <Badge
                    variant={
                      transaction.status === "completed"
                        ? "default"
                        : transaction.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="cursor-pointer shrink-0"
                  >
                    {statusLabel[transaction.status] ?? transaction.status}
                  </Badge>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium">{transaction.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 cursor-pointer shrink-0"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Tải biên lai
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      Liên hệ khách hàng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
