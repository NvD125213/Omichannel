import { KanbanBoard } from "@/features/kanban/components/kanban-board";

export default function KanbanTicketFlow() {
  return (
    <>
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Luồng hoạt động{" "}
          </h1>
          <p className="text-muted-foreground">
            Quản lý luồng dữ liệu hoạt động chi tiết của các ticket
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 pb-4 lg:px-6">
        <KanbanBoard />
      </div>
    </>
  );
}
