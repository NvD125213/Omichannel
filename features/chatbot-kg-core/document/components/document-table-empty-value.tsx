import { cn } from "@/lib/utils";

export const documentTableEmptyValueClass =
  "text-xs italic text-muted-foreground/65";

export function DocumentTableEmptyValue({
  className,
}: {
  className?: string;
}) {
  return (
    <span className={cn(documentTableEmptyValueClass, className)}>
      không có dữ liệu
    </span>
  );
}
