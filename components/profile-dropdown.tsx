"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useMe } from "@/hooks/user/use-me";

export function ProfileDropdown() {
  const { user: authUser, logout } = useAuth();
  const { data: userProfile } = useMe();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đã đăng xuất thành công", {
        description: "Bạn đã được đăng xuất khỏi tài khoản của mình.",
      });
      router.push("/sign-in");
    } catch {
      toast.error("Đăng xuất thất bại", {
        description: "Đã xảy ra lỗi khi đăng xuất.",
      });
    }
  };

  // Ưu tiên sử dụng thông tin từ API mới nhất, fallback về thông tin trong token (authUser)
  const displayUser = userProfile
    ? {
        name: userProfile.fullname || userProfile.username,
        email: userProfile.email,
        avatar: "", // API chưa trả về avatar
      }
    : authUser
      ? {
          name: authUser.name,
          email: authUser.email,
          avatar: authUser.avatar,
        }
      : null;

  if (!displayUser) return null;

  const initials = displayUser.name
    ? displayUser.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {displayUser.name}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {displayUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="#">
              Thông tin người dùng
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="#">
              Thanh toán
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="#">
              Cài đặt
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>New Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Đăng xuất
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
