import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type RouteLoadingScreenProps = {
  className?: string;
  message?: string;
};

export function RouteLoadingScreen({
  className,
  message = "Đang tải...",
}: RouteLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex h-svh w-full flex-col items-center justify-center gap-3 bg-background",
        className,
      )}
    >
      <Spinner className="size-8 text-primary" />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
