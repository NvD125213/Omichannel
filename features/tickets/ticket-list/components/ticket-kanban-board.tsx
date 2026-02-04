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
import { useCallback, useEffect, useState } from "react";
import type { Ticket } from "../utils/ticket-schema";
import { TicketKanbanColumn } from "./ticket-kanban-column";
import { TicketKanbanCard } from "./ticket-kanban-card";

interface TicketKanbanBoardProps {
  tickets: Ticket[];
  onTicketUpdate: (ticket: Ticket, newPriority: string) => void;
  isLoading?: boolean;
  onEditTicket?: (ticket: Ticket) => void;
  onDeleteTicket?: (id: string) => void;
}

const priorities = [
  { id: "low", title: "Thấp", color: "bg-blue-500" },
  { id: "medium", title: "Trung bình", color: "bg-cyan-500" },
  { id: "high", title: "Cao", color: "bg-orange-500" },
  { id: "urgent", title: "Khẩn cấp", color: "bg-red-500" },
  { id: "critical", title: "Nghiêm trọng", color: "bg-purple-600" },
];

export function TicketKanbanBoard({
  tickets: initialTickets,
  onTicketUpdate,
  isLoading,
  onEditTicket,
  onDeleteTicket,
}: TicketKanbanBoardProps) {
  // We maintain local state for optimistic UI updates
  const [tickets, setTasks] = useState<Ticket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

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

  const getTicketsByPriority = useCallback(
    (priority: string) => {
      // Normalize priority check
      return tickets.filter(
        (ticket) => (ticket.priority?.toLowerCase() || "low") === priority,
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

    // If dragging over a column
    if (overData?.type === "column") {
      const newPriority = overData.priority as string;
      const currentPriority = activeTicket.priority?.toLowerCase() || "low";

      if (currentPriority !== newPriority) {
        setTasks((prev) =>
          prev.map((t) =>
            (t.id || t.code) === activeId ? { ...t, priority: newPriority } : t,
          ),
        );
      }
      return;
    }

    // If dragging over another ticket
    const overTicket = tickets.find((t) => (t.id || t.code) === overId);
    if (!overTicket) return;

    const currentPriority = activeTicket.priority?.toLowerCase() || "low";
    const overPriority = overTicket.priority?.toLowerCase() || "low";

    if (currentPriority !== overPriority) {
      setTasks((prev) =>
        prev.map((t) =>
          (t.id || t.code) === activeId ? { ...t, priority: overPriority } : t,
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

    // Find the original ticket to check if priority actually changed compared to server state?
    // Actually we should check our local optimistic state against logic.
    // Ideally, we compare where it started vs where it ended.
    // But `handleDragOver` already mutated `tickets` state to show preview.
    // We need to trigger the API update here if priority changed.

    // We can find the ticket in our (already mutated) state
    const currentTicket = tickets.find((t) => (t.id || t.code) === activeId);

    if (currentTicket) {
      // Compare with the logic of where it dropped?
      // Actually, we need to know if the Final Priority is different from the Prop ticket priority?
      // Or we just call the update handler and let the parent decide?
      // But `handleDragOver` runs continuously.
      // Let's rely on finding what column it ended up in.

      // However, `over` can be a column or a task.
      let targetPriority = "";

      if (over.data.current?.type === "column") {
        targetPriority = over.data.current.priority;
      } else if (over.data.current?.type === "ticket") {
        targetPriority = (
          over.data.current.ticket as Ticket
        ).priority.toLowerCase();
      }

      // If we found a target priority
      if (targetPriority) {
        // Check against the ORIGINAL ticket priority from `initialTickets` to see if we need to call API
        // Wait, `initialTickets` might have changed if parent re-renders?
        // It's safer to just look at the ticket we have in state vs what we think it should be.
        // Actually, `handleDragOver` updates the state `tickets`. So `currentTicket.priority` IS `targetPriority`.
        // We need to compare it with the server state. But we don't have easy access to "server state" of this specific ticket unless we look at `initialTickets`.

        const originalTicket = initialTickets.find(
          (t) => (t.id || t.code) === activeId,
        );
        if (
          originalTicket &&
          originalTicket.priority.toLowerCase() !== targetPriority
        ) {
          onTicketUpdate(originalTicket, targetPriority);
        }
      }
    }

    if (activeId === overId) return;

    // Sorting logic within the same column
    // (This part is purely visual for reordering locally, if API doesn't support manual sort order, this will reset on refresh)
    const ticketInState = tickets.find((t) => (t.id || t.code) === activeId);
    const overTicketInState = tickets.find((t) => (t.id || t.code) === overId);

    if (
      ticketInState &&
      overTicketInState &&
      ticketInState.priority === overTicketInState.priority
    ) {
      setTasks((prev) => {
        const columnTickets = prev.filter(
          (t) => t.priority === ticketInState.priority,
        );
        const otherTickets = prev.filter(
          (t) => t.priority !== ticketInState.priority,
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
    <div className="h-full w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full min-h-[600px] gap-4 overflow-x-auto pb-4 items-start">
          {priorities.map((priority) => (
            <TicketKanbanColumn
              key={priority.id}
              id={priority.id}
              title={priority.title}
              color={priority.color}
              tickets={isLoading ? [] : getTicketsByPriority(priority.id)}
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
