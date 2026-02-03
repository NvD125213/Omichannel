"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Globe, Server } from "lucide-react";
import { useSocket } from "@/contexts/socket-context";
import { useWSStatus } from "@/hooks/use-notification";

export function DashboardStatsCards() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const { data } = useWSStatus();

  useEffect(() => {
    if (!socket) return;

    const onWsStatus = (newData: any) => {
      queryClient.setQueryData(["ws-status"], newData);
    };

    socket.on("ws_status", onWsStatus);

    return () => {
      socket.off("ws_status", onWsStatus);
    };
  }, [socket, queryClient]);

  const stats = (data as any) || {
    status: "Unknown",
    total_connections: 0,
    unique_users_online: 0,
    tenants_with_users: 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Server Status */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Trạng thái Server
          </CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <Server className="text-blue-600 h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize text-slate-900">
            {stats.data?.status}
          </div>
          <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
            Socket:
            <span
              className={`font-semibold ${
                isConnected ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Connections */}
      <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Kết nối Active
          </CardTitle>
          <div className="p-2 bg-emerald-100 rounded-full">
            <Activity className="text-emerald-600 h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {stats.data?.total_connections}
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Connections đang mở
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Users */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            User Online
          </CardTitle>
          <div className="p-2 bg-purple-100 rounded-full">
            <Users className="text-purple-600 h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {stats.data?.unique_users_online}
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Người dùng đang online
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Tenants */}
      <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Tenants Active
          </CardTitle>
          <div className="p-2 bg-orange-100 rounded-full">
            <Globe className="text-orange-600 h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {stats.data?.tenants_with_users}
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Tenants có user online
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
