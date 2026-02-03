import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notification/services";

export const useWSStatus = () => {
  return useQuery({
    queryKey: ["ws-status"],
    queryFn: notificationService.getWSStatus,
  });
};
