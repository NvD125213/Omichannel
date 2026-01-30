"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { type HTMLMotionProps, type SpringOptions, motion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SlidingNumber,
  type SlidingNumberProps,
} from "@/packages/text/sliding-number";

export interface CounterProps extends Omit<HTMLMotionProps<"div">, "children"> {
  number: number;
  min?: number;
  max?: number;
  setNumber: (value: number) => void;
  transition?: SpringOptions;
  buttonProps?: any;
  slidingNumberProps?: Partial<SlidingNumberProps>;
  editable?: boolean;
}

export const Counter = React.forwardRef<HTMLDivElement, CounterProps>(
  (
    {
      number,
      setNumber,
      className,
      min,
      max,
      transition = { type: "spring", bounce: 0, stiffness: 300, damping: 30 },
      buttonProps,
      slidingNumberProps,
      editable = true,
      ...props
    },
    ref,
  ) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(String(number));
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (!isEditing) {
        setInputValue(String(number));
      }
    }, [number, isEditing]);

    const handleDecrement = () => {
      if (min !== undefined && number <= min) return;
      setNumber(number - 1);
    };

    const handleIncrement = () => {
      if (max !== undefined && number >= max) return;
      setNumber(number + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Allow empty string or valid numbers
      if (value === "" || /^\d+$/.test(value)) {
        setInputValue(value);
      }
    };

    const validateAndSetNumber = () => {
      let newNumber = parseInt(inputValue);

      // Handle empty or invalid input
      if (isNaN(newNumber)) {
        setInputValue(String(number));
        setIsEditing(false);
        return;
      }

      // Apply min/max constraints
      if (min !== undefined && newNumber < min) {
        newNumber = min;
      }
      if (max !== undefined && newNumber > max) {
        newNumber = max;
      }

      setNumber(newNumber);
      setInputValue(String(newNumber));
      setIsEditing(false);
    };

    const handleInputBlur = () => {
      validateAndSetNumber();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        validateAndSetNumber();
      } else if (e.key === "Escape") {
        setInputValue(String(number));
        setIsEditing(false);
      }
    };

    const handleNumberClick = () => {
      if (editable) {
        setIsEditing(true);
        setTimeout(() => {
          inputRef.current?.select();
        }, 0);
      }
    };

    const isMinDisabled = min !== undefined && number <= min;
    const isMaxDisabled = max !== undefined && number >= max;

    return (
      <motion.div
        ref={ref}
        layout={!isEditing}
        transition={transition}
        className={cn(
          "flex items-center gap-3 rounded-full border bg-background px-1.5 py-1",
          className,
        )}
        {...(props as any)}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={handleDecrement}
            disabled={isMinDisabled}
            aria-label="Decrease"
            {...buttonProps}
          >
            <MinusIcon className="size-4" />
          </Button>
        </motion.div>

        <div className="w-8 flex items-center justify-center">
          {isEditing ? (
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="h-6 w-full border-0 shadow-none bg-transparent p-0 text-center font-medium tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          ) : (
            <div
              onClick={handleNumberClick}
              className={cn(
                "w-full text-center font-medium tabular-nums",
                editable &&
                  "cursor-pointer hover:text-primary transition-colors",
                slidingNumberProps?.className,
              )}
            >
              <SlidingNumber
                number={number}
                className="inline-block"
                {...slidingNumberProps}
              />
            </div>
          )}
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={handleIncrement}
            disabled={isMaxDisabled}
            aria-label="Increase"
            {...buttonProps}
          >
            <PlusIcon className="size-4" />
          </Button>
        </motion.div>
      </motion.div>
    );
  },
);

Counter.displayName = "Counter";
