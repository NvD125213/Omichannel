import apiClient from "@/lib/api-client";

/** Điểm CSAT khách gửi — 1 đến 5. */
export type PublicRatingScore = 1 | 2 | 3 | 4 | 5;

/** Trạng thái form đánh giá công khai (GET /ratings/:token). */
export interface PublicRating {
  status?: string;
  channel?: string | null;
  score?: number | null;
  comment?: string | null;
  expires_at?: string | null;
  can_submit?: boolean;
  token?: string;
  inbox_name?: string | null;
  conversation_id?: number | string | null;
  [key: string]: unknown;
}

export interface PublicRatingResponse {
  status: string | number;
  status_code?: number;
  message: string;
  data: PublicRating | null;
}

/** POST /ratings/:token — khách gửi điểm 1–5 (+ comment). */
export interface SubmitPublicRatingRequest {
  score: number;
  comment?: string | null;
}

function assertPublicRatingSuccess(body: PublicRatingResponse) {
  const code = Number(body.status_code ?? 0);
  const failed =
    String(body.status).toLowerCase() === "error" ||
    (Number.isFinite(code) && code >= 400) ||
    body.data == null;

  if (failed) {
    throw new Error(body.message || "Link đánh giá không tồn tại");
  }

  return body;
}

/** GET /api/v1/ratings/:token — khách mở link đánh giá, lấy trạng thái form. */
export async function getPublicRatingApi(token: string) {
  try {
    const response = await apiClient.get<PublicRatingResponse>(
      `/ratings/${encodeURIComponent(token)}`,
    );
    return assertPublicRatingSuccess(response.data);
  } catch (error: unknown) {
    // HTTP 404 / envelope lỗi từ interceptor — luôn lấy message API nếu có.
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message === "string"
    ) {
      throw new Error(
        (error as { response: { data: { message: string } } }).response.data
          .message,
      );
    }
    if (error instanceof Error) throw error;
    throw new Error("Link đánh giá không tồn tại");
  }
}

/** POST /api/v1/ratings/:token */
export async function submitPublicRatingApi(
  token: string,
  data: SubmitPublicRatingRequest,
) {
  const response = await apiClient.post<PublicRatingResponse>(
    `/ratings/${encodeURIComponent(token)}`,
    data,
  );
  return response.data;
}
