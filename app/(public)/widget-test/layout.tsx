import type { ReactNode } from "react";

export const metadata = {
  title: "Sandbox chat",
  description: "Trang demo chạy thử widget chat",
};

export default function WidgetTestLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-dvh">{children}</div>;
}
