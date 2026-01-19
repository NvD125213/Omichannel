import { useState } from "react";
import {
  Home,
  Archive,
  User,
  Settings,
  Info,
  Mail,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeleteTicketContext } from "@/hooks/ticket/ticket-contexts/use-ticket-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TicketContext {
  id: string;
  context_type: string;
  source_type: string;
  context_id: string;
  created_at: string;
  context_metadata: Record<string, string>;
  tenant_id: string;
}

interface TicketContextDisplayProps {
  context: TicketContext;
}

export default function TicketContextDisplay({
  context,
}: TicketContextDisplayProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteContext, isPending: isDeleting } =
    useDeleteTicketContext();

  const handleDelete = () => {
    deleteContext(context.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const formatDateMin = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  const items = [
    {
      icon: <Home size={18} />,
      label: "Home",
      onClick: () => alert("Home!"),
    },
    {
      icon: <Archive size={18} />,
      label: "Archive",
      onClick: () => alert("Archive!"),
    },
    {
      icon: <User size={18} />,
      label: "Profile",
      onClick: () => alert("Profile!"),
    },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      onClick: () => alert("Settings!"),
    },
  ];

  return (
    <div className="relative rounded-lg p-4 group hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer">
      {/* Header with User Info */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
          <AvatarImage
            src="https://cdn-icons-png.flaticon.com/512/219/219969.png"
            alt="User"
          />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
            NL
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                Người dùng 1
              </h3>

              {/* Online status */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Online
              </span>

              {/* Context ID */}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                #{context.context_id}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDateMin(context.created_at)}
            </div>
          </div>

          {/* Sub info */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              Đã trả lời qua{" "}
              <span className="font-semibold text-gray-700">Chat</span>
            </span>

            <span className="h-1 w-1 rounded-full bg-gray-300" />

            <span className="capitalize">
              Ngữ cảnh:{" "}
              <span className="font-medium">{context.context_type}</span>
            </span>

            <span className="h-1 w-1 rounded-full bg-gray-300" />

            <span className="capitalize">
              Nguồn: <span className="font-medium">{context.source_type}</span>
            </span>
          </div>
        </div>
      </div>
      {/* Context Info Box */}
      <div className="rounded-md flex gap-2 px-13">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-900 mb-1">
            Dữ liệu metadata mã bối cảnh {context.context_id}
          </div>
          <div className="text-xs text-blue-700 space-y-0.5">
            {Object.entries(context.context_metadata).map(([key, value]) => (
              <p key={key}>
                <span className="font-medium">{key}:</span> {value as string}
              </p>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom-right actions */}
      <div className="absolute bottom-5 right-4 flex items-center gap-4 text-xs">
        {/* Send mail */}
        <button
          onClick={() => alert("Gửi mail")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition"
        >
          <Mail className="h-3.5 w-3.5" />
          Gửi mail
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteDialogOpen(true);
          }}
          className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa
        </button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa context</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa context này? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
