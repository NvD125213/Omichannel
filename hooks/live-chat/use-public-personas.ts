import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import {
  getLiveChatPersonasApi,
  selectLiveChatPersonaApi,
  type SelectLiveChatPersonaRequest,
} from "@/services/live-chat/public-personas";

export const liveChatPersonaKeys = {
  all: ["live-chat-personas"] as const,
  byWebsiteToken: (websiteToken: string) =>
    [...liveChatPersonaKeys.all, websiteToken] as const,
};

/** GET /public/live-chat/:website_token/personas */
export function useGetLiveChatPersonas(websiteToken: string, enabled = true) {
  return useQuery({
    queryKey: liveChatPersonaKeys.byWebsiteToken(websiteToken),
    queryFn: () => getLiveChatPersonasApi(websiteToken),
    enabled: enabled && !!websiteToken,
  });
}

/** POST /public/live-chat/:website_token/personas/select */
export function useSelectLiveChatPersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      websiteToken,
      data,
    }: {
      websiteToken: string;
      data: SelectLiveChatPersonaRequest;
    }) => selectLiveChatPersonaApi(websiteToken, data),
    onSuccess: (res, variables) => {
      const ok = toastApiMutation(
        res,
        "Chọn persona thành công",
        "Có lỗi xảy ra khi chọn persona",
      );
      if (!ok) return;

      queryClient.invalidateQueries({
        queryKey: liveChatPersonaKeys.byWebsiteToken(variables.websiteToken),
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as { response?: { data?: { message?: string } } })
                .response?.data?.message === "string"
            ? (error as { response: { data: { message: string } } }).response
                .data.message
            : "Có lỗi xảy ra khi chọn persona";
      toast.error(message);
    },
  });
}
