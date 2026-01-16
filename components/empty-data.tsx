import { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface EmptyDataProps {
  icon: ComponentType<any>;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
  variant?: "default" | "outline";
  className?: string;
}

export function EmptyData({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
  showButton = true,
  variant = "outline",
  className = "",
}: EmptyDataProps) {
  return (
    <Empty className={`border border-dashed ${className}`}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {showButton && buttonText && (
        <EmptyContent>
          <Button variant={variant} size="sm" onClick={onButtonClick}>
            {buttonText}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
