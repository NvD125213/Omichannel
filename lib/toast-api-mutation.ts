import { toast } from "sonner";

type ApiBody = {
  status_code?: number;
  message?: string;
};

function unwrapApiBody(response: unknown): ApiBody {
  if (!response || typeof response !== "object") return {};

  const value = response as {
    data?: unknown;
    status_code?: number;
    message?: string;
  };

  if (
    value.data &&
    typeof value.data === "object" &&
    "status_code" in (value.data as object)
  ) {
    return value.data as ApiBody;
  }

  return value;
}

/** Toast theo `status_code` 200/201 — dùng cho cả AxiosResponse và body API đã unwrap. */
export function toastApiMutation(
  response: unknown,
  fallbackSuccess: string,
  fallbackError: string,
) {
  const body = unwrapApiBody(response);

  if (body.status_code == 200 || body.status_code == 201) {
    toast.success(body.message || fallbackSuccess);
    return true;
  }

  toast.error(body.message || fallbackError);
  return false;
}
