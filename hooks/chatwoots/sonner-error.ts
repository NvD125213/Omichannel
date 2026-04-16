import { toast } from "sonner";

export function toastError(error: unknown, fallback: string) {
  const err = error as {
    response?: {
      data?: {
        description?: string;
        message?: string;
        errors?: Array<{ message?: string }>;
      };
    };
  };
  const d = err?.response?.data;
  const msg =
    d?.description ?? d?.message ?? d?.errors?.[0]?.message ?? fallback;
  toast.error(msg);
}
