import { Newsreader } from "next/font/google";
import type { ReactNode } from "react";

const newsreader = Newsreader({
  subsets: ["latin", "vietnamese"],
  variable: "--font-rate-serif",
  display: "swap",
});

export const metadata = {
  title: "Đánh giá dịch vụ",
  description: "Chia sẻ trải nghiệm hỗ trợ của bạn",
};

export default function RateLayout({ children }: { children: ReactNode }) {
  return <div className={newsreader.variable}>{children}</div>;
}
