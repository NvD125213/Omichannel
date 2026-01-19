"use client";

import { motion } from "motion/react";

const sampleEvents = [
  {
    id: 1,
    type: "created",
    title: "Ticket được tạo",
    description: "Ticket mới được tạo bởi khách hàng",
    timestamp: "10:30 AM",
    date: "19/01/2026",
    icon: "🎫",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    type: "assigned",
    title: "Phân công xử lý",
    description: "Ticket được phân công cho Agent Nguyễn Văn A",
    timestamp: "10:45 AM",
    date: "19/01/2026",
    icon: "👤",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    type: "updated",
    title: "Cập nhật trạng thái",
    description: "Trạng thái chuyển từ 'Mới' sang 'Đang xử lý'",
    timestamp: "11:15 AM",
    date: "19/01/2026",
    icon: "🔄",
    color: "from-orange-500 to-red-500",
  },
  {
    id: 4,
    type: "comment",
    title: "Thêm ghi chú",
    description: "Agent đã thêm ghi chú về tiến độ xử lý",
    timestamp: "02:30 PM",
    date: "19/01/2026",
    icon: "💬",
    color: "from-green-500 to-emerald-500",
  },
];

export default function TicketDetailEvent() {
  return <div className="p-6 space-y-6">Luồng event</div>;
}
