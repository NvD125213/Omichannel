import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Group } from "../utils/schema";
import { useGetGroups } from "@/hooks/group/use-get-group";
import { useListUser } from "@/hooks/user/use-list-user";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, X, Users, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  useAssignGroupUser,
  useRemoveGroupUser,
} from "@/hooks/group/use-assign-group-user";

interface GroupUserDetailProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GroupUserDetail = ({
  group,
  open,
  onOpenChange,
}: GroupUserDetailProps) => {
  const { data: groupDetail, isLoading } = useGetGroups({
    id: group?.id as string,
  });

  const detail = groupDetail as any;

  // Mutation for assigning users
  const { mutate: assignGroupUser, isPending: isAssigning } =
    useAssignGroupUser();

  // Mutation for removing users
  const { mutate: removeGroupUser } = useRemoveGroupUser();

  // Fetch all users for selection
  const { data: allUsersData, isLoading: isLoadingAllUsers } = useListUser({
    page: 1,
    page_size: 10,
  });

  const allUsers = allUsersData?.data.items || [];

  const [openUserSearch, setOpenUserSearch] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Initialize selected users from group detail
  useEffect(() => {
    if (detail?.members) {
      const memberIds = detail.members.map((m: any) => m.id);
      setSelectedUserIds(memberIds);
    }
  }, [detail]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const removeUser = (userId: string) => {
    // If the user belongs to the original list, call the remove API
    const isOriginalMember = detail?.members?.some((m: any) => m.id === userId);

    if (isOriginalMember && group?.id) {
      removeGroupUser({ user_id: userId, group_id: group.id });
    } else {
      // If just staged (not saved yet), simply update the local state
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSaveMembers = () => {
    if (!group?.id) return;

    // Filter to only new user IDs that are not already in the group
    const existingMemberIds = detail?.members?.map((m: any) => m.id) || [];
    const newMemberIds = selectedUserIds.filter(
      (id) => !existingMemberIds.includes(id),
    );

    if (newMemberIds.length === 0) {
      // If no new members but maybe some were removed?
      // For now, we only handle adding as per the assign-multiple API.
      onOpenChange(false);
      return;
    }

    const request = {
      items: newMemberIds.map((userId) => ({
        user_id: userId,
        group_id: group.id,
      })),
    };

    assignGroupUser(request, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Chi tiết nhóm {detail?.name || group?.name}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="flex-1 flex flex-col">
            <div className="px-6 border-b bg-muted/30">
              <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 gap-6">
                <TabsTrigger
                  value="info"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full flex items-center gap-2 px-1 text-sm font-semibold"
                >
                  <Info className="size-4" />
                  Thông tin nhóm
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full flex items-center gap-2 px-1 text-sm font-semibold"
                >
                  <Users className="size-4" />
                  Thành viên
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1 min-w-[20px] flex justify-center text-[10px]"
                  >
                    {selectedUserIds.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="info" className="m-0 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="group-name" className="text-sm font-bold">
                    Tên nhóm
                  </Label>
                  <Input
                    id="group-name"
                    value={detail?.name || ""}
                    readOnly
                    className="bg-muted/50 border-none h-11 focus-visible:ring-0 cursor-default font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="group-description"
                    className="text-sm font-bold"
                  >
                    Mô tả chi tiết
                  </Label>
                  <Textarea
                    id="group-description"
                    value={detail?.description || ""}
                    readOnly
                    rows={6}
                    className="bg-muted/50 border-none focus-visible:ring-0 cursor-default resize-none leading-relaxed"
                  />
                </div>
              </TabsContent>

              <TabsContent value="members" className="m-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">
                      Quản lý thành viên
                    </Label>
                    <span className="text-xs text-muted-foreground font-medium">
                      Đã chọn {selectedUserIds.length} người dùng
                    </span>
                  </div>

                  <Popover
                    open={openUserSearch}
                    onOpenChange={setOpenUserSearch}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-11 border-dashed hover:border-primary hover:text-primary transition-all rounded-lg"
                        disabled={isLoadingAllUsers}
                      >
                        <span className="flex items-center gap-2">
                          {isLoadingAllUsers ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Users className="size-4 opacity-50" />
                          )}
                          Thêm thành viên vào nhóm...
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[450px] p-0 shadow-2xl"
                      align="start"
                    >
                      <Command className="rounded-lg">
                        <CommandInput
                          placeholder="Tìm kiếm theo tên hoặc email..."
                          className="h-11"
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>
                            Không tìm thấy người dùng phù hợp.
                          </CommandEmpty>
                          <CommandGroup>
                            {allUsers
                              .filter(
                                (user) => !selectedUserIds.includes(user.id),
                              )
                              .map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.fullname} ${user.email} ${user.username}`}
                                  onSelect={() => toggleUser(user.id)}
                                  className="flex items-center gap-3 p-3 cursor-pointer"
                                >
                                  <div
                                    className={cn(
                                      "flex size-5 items-center justify-center rounded border transition-colors",
                                      selectedUserIds.includes(user.id)
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/30",
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "size-3.5 text-white",
                                        selectedUserIds.includes(user.id)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </div>
                                  <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="font-semibold truncate text-[13px]">
                                      {user.fullname || user.username}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate">
                                      {user.email}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Danh sách đã chọn
                    </Label>
                    {selectedUserIds.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedUserIds.map((userId) => {
                          const user =
                            allUsers.find((u) => u.id === userId) ||
                            detail?.members?.find((m: any) => m.id === userId);
                          if (!user) return null;
                          return (
                            <div
                              key={userId}
                              className="group flex items-center justify-between p-2 rounded-lg border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                  {(user.fullname ||
                                    user.username ||
                                    "?")[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[13px] font-bold truncate">
                                    {user.fullname || user.username}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground truncate">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => removeUser(userId)}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl gap-2 text-muted-foreground bg-muted/10">
                        <Users className="size-10 opacity-10" />
                        <p className="text-xs font-medium">
                          Chưa có thành viên nào được chọn
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}

        <div className="p-6 border-t bg-muted/30">
          <Button
            className="w-full h-11 font-bold shadow-lg shadow-primary/20"
            disabled={isLoading || isAssigning}
            onClick={handleSaveMembers}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi thành viên"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
