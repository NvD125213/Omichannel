"use client";

import React from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

type BreadcrumbItemType = {
  label: string;
  href?: string;
  icon?: ReactNode;
};

type AppBreadcrumbProps = {
  items: BreadcrumbItemType[];
};

export function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  // Lấy link trước link hiện tại (item trước item cuối cùng)
  const previousItem = items.length > 1 ? items[items.length - 2] : null;
  const backHref = previousItem?.href ?? "#";

  return (
    <div className="flex items-center justify-between w-full">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-1">
                      {item.icon && (
                        <span className="text-muted-foreground">
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href ?? "#"}
                        className="flex items-center gap-1"
                      >
                        {item.icon && (
                          <span className="text-muted-foreground">
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && (
                  <BreadcrumbSeparator className="size-4 text-muted-foreground" />
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {previousItem && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref} className="flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
      )}
    </div>
  );
}
