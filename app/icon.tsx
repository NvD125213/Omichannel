import { createBrandIconImageResponse } from "@/lib/app-brand-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return createBrandIconImageResponse(32, 0.94);
}
