import { z } from "zod";

export const refreshTokenSchema = z.object({
  refresh_token: z
    .string()
    .min(1, { message: "Refresh token không được để trống" }),
});

export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
