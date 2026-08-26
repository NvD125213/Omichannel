import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import {
  getPublicRatingApi,
  submitPublicRatingApi,
  type SubmitPublicRatingRequest,
} from "@/services/ratings/public-rating";

export const PUBLIC_RATING_QUERY_KEY = "public-rating" as const;

export function useGetPublicRating(token: string, enabled = true) {
  return useQuery({
    queryKey: [PUBLIC_RATING_QUERY_KEY, token],
    queryFn: () => getPublicRatingApi(token),
    staleTime: 0,
    retry: false,
    enabled: enabled && !!token,
    // assertPublicRatingSuccess đã đảm bảo data khác null
    select: (res) => res.data!,
  });
}

export function useSubmitPublicRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      token,
      data,
    }: {
      token: string;
      data: SubmitPublicRatingRequest;
    }) => submitPublicRatingApi(token, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PUBLIC_RATING_QUERY_KEY, variables.token],
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
            : "Có lỗi xảy ra khi gửi đánh giá";
      toast.error(message);
    },
  });
}
