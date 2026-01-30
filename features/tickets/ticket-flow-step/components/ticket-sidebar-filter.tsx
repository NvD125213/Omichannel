"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketFlow } from "../../ticket-flow/utils/ticket-flow-schema";

interface TicketSidebarFilterProps {
  selectedFlowId: string;
  setSelectedFlowId: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  ticketFlows: TicketFlow[];
  filteredFlows: TicketFlow[];
  isLoadingFlows: boolean;
  onAddStep?: () => void;
}

export default function TicketSidebarFilter({
  selectedFlowId,
  setSelectedFlowId,
  searchTerm,
  setSearchTerm,
  ticketFlows,
  filteredFlows,
  isLoadingFlows,
  onAddStep,
}: TicketSidebarFilterProps) {
  const handleClearFilter = () => {
    setSelectedFlowId("");
    setSearchTerm("");
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="size-5" />
          Bộ lọc
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Flow */}
        <div className="space-y-2">
          <Label htmlFor="search">Tìm kiếm luồng</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nhập tên luồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Select Flow */}
        <div className="space-y-2">
          <Label htmlFor="flow">Chọn luồng xử lý</Label>
          {isLoadingFlows ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
              <SelectTrigger id="flow">
                <SelectValue placeholder="Chọn một luồng" />
              </SelectTrigger>
              <SelectContent>
                {filteredFlows.map((flow) => (
                  <SelectItem key={flow.id} value={flow.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{flow.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Flow Info */}
        {selectedFlowId && (
          <div className="space-y-2 pt-4 border-t">
            <Label>Thông tin luồng</Label>
            <div className="text-sm space-y-1">
              {(() => {
                const selectedFlow = ticketFlows.find(
                  (f) => f.id === selectedFlowId,
                );
                if (!selectedFlow) return null;
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số bước:</span>
                      <span className="font-medium">
                        {selectedFlow.steps_count ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số ticket:</span>
                      <span className="font-medium">
                        {selectedFlow.tickets_count ?? 0}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 space-y-2">
          <Button
            className="w-full cursor-pointer"
            disabled={!selectedFlowId}
            onClick={onAddStep}
          >
            <Plus className="size-4" />
            Thêm bước mới
          </Button>
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={handleClearFilter}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
