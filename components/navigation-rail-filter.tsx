"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Check,
  ChevronLeft,
  ListFilter,
  Layers,
  Tags,
  Settings2,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  type SpringOptions,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useRef,
  useEffect,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// ============================================
// DOCK COMPONENT (macOS-like effect)
// ============================================

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 100;
const DEFAULT_PANEL_WIDTH = 56;

interface DockContextType {
  mousePos: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  orientation: "vertical" | "horizontal";
}

const DockContext = createContext<DockContextType | undefined>(undefined);

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("useDock must be used within DockProvider");
  }
  return context;
}

interface DockProps {
  children: ReactNode;
  className?: string;
  distance?: number;
  panelWidth?: number;
  magnification?: number;
  spring?: SpringOptions;
  orientation?: "vertical" | "horizontal";
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelWidth = DEFAULT_PANEL_WIDTH,
  orientation = "vertical",
}: DockProps) {
  const mousePos = useMotionValue(Number.POSITIVE_INFINITY);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border/50 shadow-xl pointer-events-auto",
        orientation === "vertical"
          ? "flex-col h-fit py-3"
          : "flex-row w-fit px-3",
        className,
      )}
      style={
        orientation === "vertical"
          ? { width: panelWidth }
          : { height: panelWidth }
      }
      onMouseLeave={() => {
        mousePos.set(Number.POSITIVE_INFINITY);
      }}
      onMouseMove={(e) => {
        mousePos.set(orientation === "vertical" ? e.pageY : e.pageX);
      }}
      role="toolbar"
      aria-label="Filter dock"
    >
      <DockContext.Provider
        value={{ mousePos, spring, distance, magnification, orientation }}
      >
        {children}
      </DockContext.Provider>
    </div>
  );
}

interface DockItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: number;
}

function DockItem({
  children,
  className,
  onClick,
  isActive,
  badge,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { distance, magnification, mousePos, spring, orientation } = useDock();
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mousePos, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? {
      y: 0,
      x: 0,
      height: 0,
      width: 0,
    };
    if (orientation === "vertical") {
      return val - domRect.y - domRect.height / 2;
    }
    return val - domRect.x - domRect.width / 2;
  });

  const sizeTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [36, magnification, 36],
  );

  const size = useSpring(sizeTransform, spring);

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center cursor-pointer rounded-xl transition-colors",
        orientation === "vertical" ? "mx-auto" : "my-auto",
        isActive
          ? "bg-primary/20 text-primary"
          : "hover:bg-accent text-muted-foreground hover:text-foreground",
        className,
      )}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      style={{ width: size, height: size }}
    >
      {Children.map(children, (child) =>
        cloneElement(
          child as ReactElement<{
            size: MotionValue<number>;
            isHovered: MotionValue<number>;
          }>,
          { size, isHovered },
        ),
      )}
      {badge !== undefined && badge > 0 && (
        <motion.span
          className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full px-1 z-10 text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {badge > 99 ? "99+" : badge}
        </motion.span>
      )}
    </motion.div>
  );
}

interface DockLabelProps {
  children: ReactNode;
  className?: string;
  isHovered?: MotionValue<number>;
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps.isHovered as MotionValue<number>;
  const [isVisible, setIsVisible] = useState(false);
  const { orientation } = useDock();

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: 1,
            x: orientation === "vertical" ? 10 : 0,
            y: orientation === "vertical" ? 0 : -10,
          }}
          exit={{ opacity: 0, x: 0, y: 0 }}
          className={cn(
            "absolute whitespace-nowrap z-50",
            orientation === "vertical"
              ? "left-full ml-3 top-1/2 -translate-y-1/2"
              : "bottom-full mb-3 left-1/2 -translate-x-1/2",
            "rounded-lg border border-border bg-popover px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-lg",
            className,
          )}
          role="tooltip"
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DockIconProps {
  children: ReactNode;
  className?: string;
  size?: MotionValue<number>;
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const size = restProps.size as MotionValue<number>;
  const iconSize = useTransform(size, (val) => val * 0.5);

  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      style={{ width: iconSize, height: iconSize }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// TYPES & EXPORTS
// ============================================

export type FilterOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type TagItem = {
  id: string;
  label: string;
  color?: string;
};

export type ColumnOption = {
  id: string;
  label: string;
};

export type NavigationRailFilterProps = {
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchDebounceMs?: number;
  selectLabel?: string;
  selectPlaceholder?: string;
  selectOptions?: FilterOption[];
  selectValue?: string;
  onSelectChange?: (value: string) => void;
  // Second select for priority or other single-select filters
  select2Label?: string;
  select2Placeholder?: string;
  select2Options?: FilterOption[];
  select2Value?: string;
  onSelect2Change?: (value: string) => void;
  comboboxLabel?: string;
  comboboxOptions?: FilterOption[];
  comboboxValues?: string[];
  onComboboxChange?: (values: string[]) => void;
  tags?: TagItem[];
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagRemove?: (tagId: string) => void;
  onClearAll?: () => void;
  onApplyFilters?: () => void;
  className?: string;
  defaultExpanded?: boolean;
  toolbarActions?: ReactNode;
  // Column visibility props
  columnOptions?: ColumnOption[];
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  verticalDockPositionClassName?: string;
  orientation?: "vertical" | "horizontal";

  searchIcon?: ReactNode;
  selectIcon?: ReactNode;
  select2Icon?: ReactNode;
  comboboxIcon?: ReactNode;
  tagsIcon?: ReactNode;
  columnIcon?: ReactNode;
  filterIcon?: ReactNode;
  viewMode?: "list" | "kanban";
  onViewModeChange?: (mode: "list" | "kanban") => void;
};

// Tag color mapping
const tagColors: Record<string, string> = {
  red: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  green:
    "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  yellow:
    "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  purple:
    "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  orange:
    "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  pink: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  indigo:
    "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  default: "bg-muted text-muted-foreground border-border hover:bg-accent",
};

// ============================================
// MAIN COMPONENT
// ============================================

export function NavigationRailFilter({
  searchPlaceholder = "Tìm kiếm...",
  onSearchChange,
  searchDebounceMs = 500,
  selectLabel = "Trạng thái",
  selectPlaceholder = "Chọn giá trị bất kỳ",
  selectOptions = [],
  selectValue,
  onSelectChange,
  select2Label = "Độ ưu tiên",
  select2Placeholder = "Chọn độ ưu tiên",
  select2Options = [],
  select2Value,
  onSelect2Change,
  comboboxLabel = "Danh mục",
  comboboxOptions = [],
  comboboxValues = [],
  onComboboxChange,
  tags = [],
  selectedTags = [],
  onTagSelect,
  onTagRemove,
  onClearAll,
  className,
  defaultExpanded = false,
  toolbarActions,
  columnOptions = [],
  columnVisibility = {},
  onColumnVisibilityChange,
  verticalDockPositionClassName = "-translate-y-[20%]",
  orientation = "vertical",
  searchIcon,
  selectIcon,
  select2Icon,
  comboboxIcon,
  tagsIcon,
  columnIcon,
  filterIcon,
  viewMode,
  onViewModeChange,
}: NavigationRailFilterProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchValue, setSearchValue] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Refs for each section
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const select2TriggerRef = useRef<HTMLButtonElement>(null);
  const comboboxTriggerRef = useRef<HTMLButtonElement>(null);
  const tagsTriggerRef = useRef<HTMLButtonElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearchChange = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onSearchChange?.(value);
      }, searchDebounceMs);
    },
    [onSearchChange, searchDebounceMs],
  );

  // Handle focus when section changes
  useEffect(() => {
    if (!isExpanded || !focusSection) return;

    const timer = setTimeout(() => {
      switch (focusSection) {
        case "search":
          searchInputRef.current?.focus();
          searchInputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          break;
        case "select":
          selectTriggerRef.current?.focus();
          selectTriggerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          break;
        case "select2":
          select2TriggerRef.current?.focus();
          select2TriggerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          break;
        case "combobox":
          comboboxTriggerRef.current?.focus();
          comboboxTriggerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          break;
        case "tags":
          tagsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          break;
        case "columns":
          columnsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          break;
      }
      setFocusSection(null);
    }, 300);

    return () => clearTimeout(timer);
  }, [isExpanded, focusSection]);

  // Handle click focus - expand and set section
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleClickFocus = useCallback((section: string) => {
    setFocusSection(section);
    setActiveSection(section);
    setIsExpanded(true);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      debouncedSearchChange(value);
    },
    [debouncedSearchChange],
  );

  const handleComboboxToggle = useCallback(
    (value: string) => {
      const newValues = comboboxValues.includes(value)
        ? comboboxValues.filter((v) => v !== value)
        : [...comboboxValues, value];
      onComboboxChange?.(newValues);
    },
    [comboboxValues, onComboboxChange],
  );

  const handleTagToggle = useCallback(
    (tagId: string) => {
      if (selectedTags.includes(tagId)) {
        onTagRemove?.(tagId);
      } else {
        onTagSelect?.(tagId);
      }
    },
    [selectedTags, onTagRemove, onTagSelect],
  );

  // Handle clear all - reset internal state and call parent callback
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleClearAll = useCallback(() => {
    setSearchValue("");
    onClearAll?.();
  }, [onClearAll]);

  const hasActiveFilters = !!(
    searchValue ||
    selectValue ||
    select2Value ||
    comboboxValues.length > 0 ||
    selectedTags.length > 0
  );

  const totalActiveFilters = [
    searchValue ? 1 : 0,
    selectValue ? 1 : 0,
    select2Value ? 1 : 0,
    comboboxValues.length,
    selectedTags.length,
  ].reduce((a, b) => a + b, 0);

  const getHeaderIcon = () => {
    let icon: ReactNode = null;
    let defaultIcon: ReactNode = null;

    switch (activeSection) {
      case "search":
        icon = searchIcon;
        defaultIcon = <Search className="size-5 text-primary" />;
        break;
      case "select":
        icon = selectIcon;
        defaultIcon = <ListFilter className="size-5 text-primary" />;
        break;
      case "select2":
        icon = select2Icon;
        defaultIcon = <ListFilter className="size-5 text-primary" />;
        break;
      case "combobox":
        icon = comboboxIcon;
        defaultIcon = <Layers className="size-5 text-primary" />;
        break;
      case "tags":
        icon = tagsIcon;
        defaultIcon = <Tags className="size-5 text-primary" />;
        break;
      case "columns":
        icon = columnIcon;
        defaultIcon = <Settings2 className="size-5 text-primary" />;
        break;
      default:
        icon = filterIcon;
        defaultIcon = <Filter className="size-5 text-primary" />;
    }

    if (icon && isValidElement(icon)) {
      return cloneElement(icon as ReactElement<{ className?: string }>, {
        className: "size-5 text-primary",
      });
    }

    return icon || defaultIcon;
  };

  const renderLabelIcon = (icon: ReactNode, defaultIconKey: string) => {
    if (icon && isValidElement(icon)) {
      return cloneElement(icon as ReactElement<{ className?: string }>, {
        className: "size-4 text-muted-foreground",
      });
    }

    switch (defaultIconKey) {
      case "search":
        return <Search className="size-4 text-muted-foreground" />;
      case "select":
      case "select2":
        return <ListFilter className="size-4 text-muted-foreground" />;
      case "combobox":
        return <Layers className="size-4 text-muted-foreground" />;
      case "tags":
        return <Tags className="size-4 text-muted-foreground" />;
      case "columns":
        return <Settings2 className="size-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative flex h-full", className)}>
      {/* Collapsed Dock (macOS-like) */}
      <AnimatePresence mode="wait">
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex items-center z-[10]",
              orientation === "vertical" ? "h-full" : "w-full justify-center",
              verticalDockPositionClassName,
            )}
          >
            <Dock
              magnification={56}
              distance={100}
              panelWidth={56}
              orientation={orientation}
            >
              {/* Main Filter Button */}
              <DockItem
                onClick={() => {
                  setIsExpanded(true);
                  setActiveSection(null);
                }}
                isActive={hasActiveFilters}
                badge={hasActiveFilters ? totalActiveFilters : undefined}
              >
                <DockLabel>Bộ lọc</DockLabel>
                <DockIcon>
                  {filterIcon || <Filter className="size-full" />}
                </DockIcon>
              </DockItem>

              {/* View Mode Toggle */}
              {viewMode && onViewModeChange && (
                <DockItem
                  onClick={() =>
                    onViewModeChange(viewMode === "list" ? "kanban" : "list")
                  }
                >
                  <DockLabel>
                    {viewMode === "list" ? "Chế độ Kanban" : "Chế độ Danh sách"}
                  </DockLabel>
                  <DockIcon>
                    {viewMode === "list" ? (
                      <LayoutGrid className="size-full" />
                    ) : (
                      <List className="size-full" />
                    )}
                  </DockIcon>
                </DockItem>
              )}

              <div
                className={cn(
                  "bg-border/50",
                  orientation === "vertical" ? "w-6 h-px" : "h-6 w-px",
                )}
              />

              {/* Search */}
              <DockItem
                onClick={() => handleClickFocus("search")}
                isActive={!!searchValue}
                badge={searchValue ? 1 : undefined}
              >
                <DockLabel>Tìm kiếm</DockLabel>
                <DockIcon>
                  {searchIcon || <Search className="size-full" />}
                </DockIcon>
              </DockItem>

              {/* Select */}
              {selectOptions.length > 0 && (
                <DockItem
                  onClick={() => handleClickFocus("select")}
                  isActive={!!selectValue}
                  badge={selectValue ? 1 : undefined}
                >
                  <DockLabel>
                    {selectValue
                      ? selectOptions.find((o) => o.value === selectValue)
                          ?.label || selectLabel
                      : selectPlaceholder}
                  </DockLabel>
                  <DockIcon>
                    {selectIcon || <ListFilter className="size-full" />}
                  </DockIcon>
                </DockItem>
              )}

              {/* Select 2 (Priority) */}
              {select2Options.length > 0 && (
                <DockItem
                  onClick={() => handleClickFocus("select2")}
                  isActive={!!select2Value}
                  badge={select2Value ? 1 : undefined}
                >
                  <DockLabel>
                    {select2Value
                      ? select2Options.find((o) => o.value === select2Value)
                          ?.label || select2Label
                      : select2Placeholder}
                  </DockLabel>
                  <DockIcon>
                    {select2Icon || <ListFilter className="size-full" />}
                  </DockIcon>
                </DockItem>
              )}

              {/* Combobox */}
              {comboboxOptions.length > 0 && (
                <DockItem
                  onClick={() => handleClickFocus("combobox")}
                  isActive={comboboxValues.length > 0}
                  badge={comboboxValues.length || undefined}
                >
                  <DockLabel>{comboboxLabel}</DockLabel>
                  <DockIcon>
                    {comboboxIcon || <Layers className="size-full" />}
                  </DockIcon>
                </DockItem>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <DockItem
                  onClick={() => handleClickFocus("tags")}
                  isActive={selectedTags.length > 0}
                  badge={selectedTags.length || undefined}
                >
                  <DockLabel>Tags</DockLabel>
                  <DockIcon>
                    {tagsIcon || <Tags className="size-full" />}
                  </DockIcon>
                </DockItem>
              )}

              {/* Columns (Display Options) */}
              {columnOptions.length > 0 && (
                <DockItem onClick={() => handleClickFocus("columns")}>
                  <DockLabel>Hiển thị cột</DockLabel>
                  <DockIcon>
                    {columnIcon || <Settings2 className="size-full" />}
                  </DockIcon>
                </DockItem>
              )}

              {/* Clear All */}
              {hasActiveFilters && (
                <>
                  <div
                    className={cn(
                      "bg-border/50",
                      orientation === "vertical" ? "w-6 h-px" : "h-6 w-px",
                    )}
                  />
                  <DockItem onClick={handleClearAll}>
                    <DockLabel>Xóa tất cả</DockLabel>
                    <DockIcon>
                      <X className="size-full" />
                    </DockIcon>
                  </DockItem>
                </>
              )}
            </Dock>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 320 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 30,
              mass: 1,
            }}
            className="flex flex-col bg-card border-r border-border overflow-hidden h-full pointer-events-auto"
          >
            {/* Header */}
            <motion.div
              className="p-4 border-b border-border flex-shrink-0"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    key={activeSection || "default"}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {getHeaderIcon()}
                  </motion.div>
                  <div>
                    <h2 className="font-semibold text-base">Bộ lọc</h2>
                    {hasActiveFilters && (
                      <p className="text-xs text-muted-foreground">
                        {totalActiveFilters} đang hoạt động
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-muted-foreground hover:text-destructive h-8 px-2"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Filter Content */}
            <ScrollArea className="flex-1">
              <motion.div
                className="p-4 space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: 0.15,
                }}
              >
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    {renderLabelIcon(searchIcon, "search")}
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Input
                      ref={searchInputRef}
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={handleSearchChange}
                      className="h-10 bg-background border-input focus-visible:ring-2 focus-visible:ring-primary/20 pr-8"
                    />
                    {searchValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchValue("");
                          onSearchChange?.("");
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Select Option */}
                {selectOptions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {renderLabelIcon(selectIcon, "select")}
                        {selectLabel}
                      </label>
                      <Select
                        value={selectValue}
                        onValueChange={onSelectChange}
                      >
                        <SelectTrigger
                          ref={selectTriggerRef}
                          className="w-full h-10 bg-background border-input focus:ring-2 focus:ring-primary/20"
                        >
                          <SelectValue placeholder={selectPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Select 2 Option (Priority) */}
                {select2Options.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {renderLabelIcon(select2Icon, "select2")}
                        {select2Label}
                      </label>
                      <Select
                        value={select2Value}
                        onValueChange={onSelect2Change}
                      >
                        <SelectTrigger
                          ref={select2TriggerRef}
                          className="w-full h-10 bg-background border-input focus:ring-2 focus:ring-primary/20"
                        >
                          <SelectValue placeholder={select2Placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {select2Options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Combobox (Multi-select) */}
                {comboboxOptions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {renderLabelIcon(comboboxIcon, "combobox")}
                        {comboboxLabel}
                      </label>
                      <Popover
                        open={comboboxOpen}
                        onOpenChange={setComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            ref={comboboxTriggerRef}
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-full justify-between h-10 bg-background border-input hover:bg-accent/50"
                          >
                            {comboboxValues.length > 0
                              ? `${comboboxValues.length} đã chọn`
                              : `Chọn ${comboboxLabel.toLowerCase()}`}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder={`Tìm ${comboboxLabel.toLowerCase()}...`}
                            />
                            <CommandList>
                              <CommandEmpty>
                                Không tìm thấy kết quả.
                              </CommandEmpty>
                              <CommandGroup>
                                {comboboxOptions.map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() =>
                                      handleComboboxToggle(option.value)
                                    }
                                  >
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        comboboxValues.includes(option.value)
                                          ? "bg-primary text-primary-foreground"
                                          : "opacity-50",
                                      )}
                                    >
                                      {comboboxValues.includes(
                                        option.value,
                                      ) && <Check className="h-3 w-3" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {option.icon}
                                      {option.label}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {comboboxValues.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {comboboxValues.map((value) => {
                            const option = comboboxOptions.find(
                              (o) => o.value === value,
                            );
                            return (
                              <Badge
                                key={value}
                                variant="secondary"
                                className="pl-2 pr-1 py-1 gap-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                              >
                                {option?.label || value}
                                <button
                                  onClick={() => handleComboboxToggle(value)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <>
                    <Separator />
                    <div ref={tagsRef} className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {renderLabelIcon(tagsIcon, "tags")}
                        Tags
                      </label>
                      <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            ref={tagsTriggerRef}
                            variant="outline"
                            role="combobox"
                            aria-expanded={tagsOpen}
                            className="w-full justify-between h-10 bg-background border-input hover:bg-accent/50"
                          >
                            {selectedTags.length > 0
                              ? `${selectedTags.length} tag đã chọn`
                              : "Chọn tags..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Tìm tags..." />
                            <CommandList>
                              <CommandEmpty>
                                Không tìm thấy kết quả.
                              </CommandEmpty>
                              <CommandGroup>
                                {tags.map((tag) => {
                                  const isSelected = selectedTags.includes(
                                    tag.id,
                                  );
                                  const colorClass =
                                    tagColors[tag.color || "default"] ||
                                    tagColors.default;

                                  return (
                                    <CommandItem
                                      key={tag.id}
                                      value={tag.label}
                                      onSelect={() => handleTagToggle(tag.id)}
                                    >
                                      <div
                                        className={cn(
                                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                          isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "opacity-50",
                                        )}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-xs font-medium px-2 py-0.5",
                                          colorClass,
                                        )}
                                      >
                                        {tag.label}
                                      </Badge>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedTags.map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            if (!tag) return null;
                            const colorClass =
                              tagColors[tag.color || "default"] ||
                              tagColors.default;

                            return (
                              <Badge
                                key={tagId}
                                variant="outline"
                                className={cn(
                                  "pl-2 pr-1 py-1 gap-1 text-xs font-medium",
                                  colorClass,
                                )}
                              >
                                {tag.label}
                                <button
                                  onClick={() => onTagRemove?.(tagId)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Columns (Display Options) */}
                {columnOptions.length > 0 && (
                  <>
                    <Separator />
                    <div ref={columnsRef} className="space-y-3">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        {renderLabelIcon(columnIcon, "columns")}
                        Hiển thị cột
                      </label>
                      <div className="space-y-2">
                        {columnOptions.map((column) => {
                          const isVisible =
                            columnVisibility[column.id] !== false;
                          return (
                            <div
                              key={column.id}
                              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                              onClick={() =>
                                onColumnVisibilityChange?.(
                                  column.id,
                                  !isVisible,
                                )
                              }
                            >
                              <span className="text-sm">{column.label}</span>
                              <div
                                className={cn(
                                  "flex items-center justify-center w-5 h-5 rounded border transition-colors",
                                  isVisible
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-input bg-background",
                                )}
                              >
                                {isVisible && <Check className="size-3" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </ScrollArea>

            {/* Footer Actions */}
            <motion.div
              className="p-4 border-t border-border bg-muted/30 flex-shrink-0 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: 0.2,
              }}
            >
              {/* Toolbar Actions Slot */}
              {toolbarActions && (
                <div className="flex items-center gap-2 flex-wrap">
                  {toolbarActions}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9"
                  onClick={handleClearAll}
                  disabled={!hasActiveFilters}
                >
                  Đặt lại
                </Button>
                {/* <Button
                  className="flex-1 h-9 bg-primary hover:bg-primary/90"
                  onClick={onApplyFilters}
                >
                  Áp dụng
                </Button> */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Demo component
export function NavigationRailFilterDemo() {
  const [selectValue, setSelectValue] = useState<string>();
  const [comboboxValues, setComboboxValues] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const selectOptions: FilterOption[] = [
    { value: "open", label: "Đang mở" },
    { value: "in-progress", label: "Đang xử lý" },
    { value: "resolved", label: "Đã giải quyết" },
    { value: "closed", label: "Đã đóng" },
  ];

  const comboboxOptions: FilterOption[] = [
    { value: "support", label: "Hỗ trợ kỹ thuật" },
    { value: "billing", label: "Thanh toán" },
    { value: "sales", label: "Bán hàng" },
    { value: "feedback", label: "Phản hồi" },
    { value: "complaint", label: "Khiếu nại" },
  ];

  const tags: TagItem[] = [
    { id: "urgent", label: "Khẩn cấp", color: "red" },
    { id: "important", label: "Quan trọng", color: "orange" },
    { id: "pending", label: "Chờ xử lý", color: "yellow" },
    { id: "new", label: "Mới", color: "blue" },
    { id: "vip", label: "VIP", color: "purple" },
    { id: "follow-up", label: "Theo dõi", color: "green" },
  ];

  const handleClearAll = () => {
    setSelectValue(undefined);
    setComboboxValues([]);
    setSelectedTags([]);
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTags((prev) => [...prev, tagId]);
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((id) => id !== tagId));
  };

  return (
    <NavigationRailFilter
      searchPlaceholder="Tìm kiếm ticket..."
      selectLabel="Trạng thái"
      selectOptions={selectOptions}
      selectValue={selectValue}
      onSelectChange={setSelectValue}
      comboboxLabel="Danh mục"
      comboboxOptions={comboboxOptions}
      comboboxValues={comboboxValues}
      onComboboxChange={setComboboxValues}
      tags={tags}
      selectedTags={selectedTags}
      onTagSelect={handleTagSelect}
      onTagRemove={handleTagRemove}
      onClearAll={handleClearAll}
      onApplyFilters={() => console.log("Apply filters")}
    />
  );
}
