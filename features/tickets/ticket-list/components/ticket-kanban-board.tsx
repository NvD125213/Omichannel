"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { Ticket } from "../utils/ticket-schema";
import { TicketKanbanColumn } from "./ticket-kanban-column";
import { TicketKanbanCard } from "./ticket-kanban-card";

interface TicketKanbanBoardProps {
  tickets: Ticket[];
  onTicketUpdate: (ticket: Ticket, newStatus: string) => void;
  isLoading?: boolean;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (id: string) => void;
  visibleStatuses?: Record<string, boolean>;
}

// Các cột theo status (chuẩn theo TicketStatus ở tickets/page.tsx)
const statuses = [
  { id: "pending", title: "Đang chờ", color: "bg-yellow-500" },
  { id: "open", title: "Đang mở", color: "bg-blue-500" },
  { id: "in_progress", title: "Đang xử lý", color: "bg-purple-500" },
  { id: "on_hold", title: "Tạm dừng", color: "bg-orange-500" },
  { id: "resolved", title: "Đã giải quyết", color: "bg-emerald-500" },
  { id: "closed", title: "Đã đóng", color: "bg-gray-500" },
  { id: "cancelled", title: "Đã hủy", color: "bg-red-500" },
];

function TicketKanbanBoardComponent({
  tickets: initialTickets,
  onTicketUpdate,
  isLoading,
  onEditTicket,
  onDeleteTicket,
  visibleStatuses,
}: TicketKanbanBoardProps) {
  // We maintain local state for optimistic UI updates
  const [tickets, setTasks] = useState<Ticket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const activeStatuses = useMemo(
    () =>
      statuses.filter(
        (status) =>
          !visibleStatuses || visibleStatuses[status.id] !== false,
      ),
    [visibleStatuses],
  );

  // Sync with props, but don't override while dragging
  useEffect(() => {
    if (!activeTicket) {
      setTasks(initialTickets);
    }
  }, [initialTickets, activeTicket]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const getTicketsByStatus = useCallback(
    (status: string) => {
      // Chuẩn hóa status về lowercase để so sánh
      return tickets.filter(
        (ticket) => ticket.status?.toLowerCase() === status.toLowerCase(),
      );
    },
    [tickets],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find((t) => (t.id || t.code) === active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTicket = tickets.find((t) => (t.id || t.code) === activeId);
    if (!activeTicket) return;

    const overData = over.data.current;

    // Nếu kéo qua 1 cột => đổi status theo cột
    if (overData?.type === "column") {
      const newStatus = overData.status as string;
      const currentStatus = activeTicket.status?.toLowerCase();

      if (currentStatus !== newStatus.toLowerCase()) {
        setTasks((prev) =>
          prev.map((t) =>
            (t.id || t.code) === activeId ? { ...t, status: newStatus } : t,
          ),
        );
      }
      return;
    }

    // Nếu kéo lên một ticket khác trong cột status khác => đổi status theo ticket đó (chỉ đổi status, không reorder)
    const overTicket = tickets.find((t) => (t.id || t.code) === overId);
    if (!overTicket) return;

    const currentStatus = activeTicket.status?.toLowerCase();
    const overStatus = overTicket.status?.toLowerCase();

    if (currentStatus !== overStatus) {
      setTasks((prev) =>
        prev.map((t) =>
          (t.id || t.code) === activeId ? { ...t, status: overStatus } : t,
        ),
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the original ticket to check if status actually changed compared to server state?
    // Actually we should check our local optimistic state against logic.
    // Ideally, we compare where it started vs where it ended.
    // But `handleDragOver` already mutated `tickets` state to show preview.
    // We need to trigger the API update here if status changed.

    // We can find the ticket in our (already mutated) state
    const currentTicket = tickets.find((t) => (t.id || t.code) === activeId);

    if (currentTicket) {
      // Xác định status cuối cùng sau khi thả
      let targetStatus = "";

      if (over.data.current?.type === "column") {
        targetStatus = over.data.current.status;
      } else if (over.data.current?.type === "ticket") {
        targetStatus = (over.data.current.ticket as Ticket).status;
      }

      // Nếu có status mới thì so sánh với status ban đầu từ props
      if (targetStatus) {
        const originalTicket = initialTickets.find(
          (t) => (t.id || t.code) === activeId,
        );
        if (
          originalTicket &&
          originalTicket.status.toLowerCase() !== targetStatus.toLowerCase()
        ) {
          onTicketUpdate(originalTicket, targetStatus);
        }
      }
    }

    if (activeId === overId) return;

    // Sorting logic within the same column (giữ nguyên, nhưng tính theo status)
    // (This part is purely visual for reordering locally, if API doesn't support manual sort order, this will reset on refresh)
    const ticketInState = tickets.find((t) => (t.id || t.code) === activeId);
    const overTicketInState = tickets.find((t) => (t.id || t.code) === overId);

    if (
      ticketInState &&
      overTicketInState &&
      ticketInState.status === overTicketInState.status
    ) {
      setTasks((prev) => {
        const columnTickets = prev.filter(
          (t) => t.status === ticketInState.status,
        );
        const otherTickets = prev.filter(
          (t) => t.status !== ticketInState.status,
        );

        const activeIndex = columnTickets.findIndex(
          (t) => (t.id || t.code) === activeId,
        );
        const overIndex = columnTickets.findIndex(
          (t) => (t.id || t.code) === overId,
        );

        const reorderedColumnTickets = arrayMove(
          columnTickets,
          activeIndex,
          overIndex,
        );

        return [...otherTickets, ...reorderedColumnTickets];
      });
    }
  };

  return (
    <div className="kanban-board-root h-full w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full min-h-[600px] gap-4 overflow-x-auto pb-4 items-start">
          {activeStatuses.map((status) => (
            <TicketKanbanColumn
              key={status.id}
              id={status.id}
              title={status.title}
              color={status.color}
              tickets={isLoading ? [] : getTicketsByStatus(status.id)}
              loading={isLoading}
              onEditTicket={onEditTicket}
              onDeleteTicket={onDeleteTicket}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket && <TicketKanbanCard ticket={activeTicket} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export const TicketKanbanBoard = memo(TicketKanbanBoardComponent);
