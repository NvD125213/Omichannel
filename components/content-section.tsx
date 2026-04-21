import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ContentSectionProps = {
  title: string;
  desc: string;
  children: React.ReactNode;
  /** Override default width constraint for wider layouts (e.g. data lists). */
  innerClassName?: string;
};

export function ContentSection({
  title,
  desc,
  children,
  innerClassName,
}: ContentSectionProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{desc}</p>
        <Separator className="my-4" />
      </div>
      <div className="faded-bottom flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth">
        <div
          className={cn("-mx-1 px-1.5 pb-12 pe-4 lg:max-w-xl", innerClassName)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
