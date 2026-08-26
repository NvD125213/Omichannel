"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useGetPublicRating,
  useSubmitPublicRating,
} from "@/hooks/ratings/use-public-rating";
import type { PublicRating } from "@/services/ratings/public-rating";
import { cn } from "@/lib/utils";

const EASE = [0.32, 0.72, 0, 1] as const;

const SCORE_LABELS = [
  "",
  "Rất không hài lòng",
  "Không hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng",
] as const;

function MoodIcon({ score }: { score: number }) {
  const mouth =
    score === 1
      ? "M8 16.2c1.6-1.8 6.4-1.8 8 0"
      : score === 2
        ? "M8.5 15.6c1.4-1 5.6-1 7 0"
        : score === 3
          ? "M8.2 15.4h7.6"
          : score === 4
            ? "M8 14.6c1.6 1.8 6.4 1.8 8 0"
            : "M7.4 14.2c1.9 2.6 7.3 2.6 9.2 0";

  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle cx="9" cy="10" r="0.85" fill="currentColor" />
      <circle cx="15" cy="10" r="0.85" fill="currentColor" />
      <path
        d={mouth}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function isAlreadySubmitted(rating: PublicRating | null | undefined) {
  if (!rating) return false;
  if (rating.can_submit === false) return true;
  const status = String(rating.status ?? "").toLowerCase();
  return ["submitted", "completed", "rated", "done"].includes(status);
}

function canSubmitRating(rating: PublicRating | null | undefined) {
  if (!rating) return false;
  if (typeof rating.can_submit === "boolean") return rating.can_submit;
  return !isAlreadySubmitted(rating);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-9 sm:size-11" aria-hidden>
      <motion.path
        d="M12 2.35 14.62 8l6.13.89-4.43 4.32 1.05 6.1L12 16.42 6.63 19.31l1.05-6.1L3.25 8.89 9.38 8 12 2.35Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.15"
        initial={false}
        animate={{
          fillOpacity: filled ? 1 : 0,
          scale: filled ? 1 : 0.88,
        }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path
        d="M3 8h9M8.5 4.5 12.5 8 8.5 11.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ServiceLottie({
  className,
  showThanks = true,
}: {
  className?: string;
  showThanks?: boolean;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-[min(88%,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f93ff]/10"
      />
      <DotLottieReact
        src="/customer-service-1.lottie"
        loop
        autoplay
        className="relative z-10 h-auto w-full"
      />
      {showThanks ? (
        <div className="relative z-10 mt-6 flex items-center justify-center text-[#0A4A8C]">
          <p className="font-(family-name:--font-rate-serif) text-[1.65rem] leading-tight font-medium tracking-tight sm:text-[1.95rem]">
            Cảm ơn vì đã liên hệ
          </p>
        </div>
      ) : null}
    </div>
  );
}

function NotFoundLottie({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-sm", className)}>
      <DotLottieReact
        src="/404-animation.lottie"
        loop
        autoplay
        className="relative z-10 h-auto w-full"
      />
    </div>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden text-[#0A3D78]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 10% 8%, rgba(255,255,255,0.7), transparent 56%)",
            "radial-gradient(ellipse 50% 40% at 92% 88%, rgba(31,147,255,0.18), transparent 52%)",
            "linear-gradient(155deg, #c5e4ff 0%, #e3f2ff 42%, #f3f9ff 72%, #d4ebff 100%)",
          ].join(", "),
        }}
      />
      <Grain />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StarRow({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (score: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div>
      <div
        className="flex items-center justify-center gap-1.5 sm:gap-3"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const filled = shown >= score;
          return (
            <motion.button
              key={score}
              type="button"
              disabled={disabled}
              aria-label={`${score} sao — ${SCORE_LABELS[score]}`}
              onMouseEnter={() => {
                if (!disabled) setHovered(score);
              }}
              onFocus={() => {
                if (!disabled) setHovered(score);
              }}
              onClick={() => onChange?.(score)}
              whileHover={disabled ? undefined : { y: -3, scale: 1.08 }}
              whileTap={disabled ? undefined : { scale: 0.9 }}
              transition={{ type: "spring", stiffness: 480, damping: 24 }}
              className={cn(
                "flex size-14 items-center justify-center rounded-full sm:size-16",
                filled
                  ? "text-[#E8B923] drop-shadow-[0_2px_8px_rgba(232,185,35,0.35)]"
                  : "text-[#E8B923]/45",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B923]/40",
                disabled && "cursor-default",
              )}
            >
              <motion.span
                animate={{ scale: filled ? 1 : 0.92 }}
                transition={{
                  duration: 0.4,
                  delay: filled ? (score - 1) * 0.035 : 0,
                  ease: EASE,
                }}
                className="inline-flex"
              >
                <StarIcon filled={filled} />
              </motion.span>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-1 flex min-h-5 items-center justify-center">
        <AnimatePresence mode="wait">
          {shown ? (
            <motion.p
              key={shown}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="inline-flex items-center gap-1.5 text-sm tracking-wide text-[#8A6A12]"
            >
              <MoodIcon score={shown} />
              {SCORE_LABELS[shown]}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultScreen({
  title,
  description,
  score,
  showThanksLine = true,
}: {
  title: string;
  description?: string;
  score?: number | null;
  showThanksLine?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-5 py-16 text-center"
    >
      <ServiceLottie className="mb-4 max-w-sm" showThanks={showThanksLine} />
      <h1 className="font-(family-name:--font-rate-serif) text-[2.15rem] leading-[1.15] font-medium tracking-tight text-[#0A3D78] sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#4A6A8A]">
          {description}
        </p>
      ) : null}
      {score ? (
        <div className="mt-8 w-full max-w-md rounded-[1.35rem] border border-[#1f93ff]/18 bg-white px-3 py-4 sm:px-5">
          <StarRow value={score} disabled />
        </div>
      ) : null}
    </motion.section>
  );
}

export function PublicRatePage({ token }: { token: string }) {
  const { data: rating, isLoading, isError, error } = useGetPublicRating(token);
  const submitRating = useSubmitPublicRating();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  const alreadySubmitted = !justSubmitted && isAlreadySubmitted(rating);
  const showForm = !justSubmitted && canSubmitRating(rating);
  const recapScore = useMemo(() => {
    if (score > 0) return score;
    if (typeof rating?.score === "number") return rating.score;
    return null;
  }, [rating?.score, score]);

  const errorMessage = getErrorMessage(error, "Link đánh giá không tồn tại");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!score || submitRating.isPending) return;
    submitRating.mutate(
      {
        token,
        data: {
          score,
          comment: comment.trim() || null,
        },
      },
      {
        onSuccess: (res) => {
          if (res.status_code === 200 || res.status_code === 201) {
            setJustSubmitted(true);
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div className="mx-auto size-64 animate-pulse rounded-full bg-[#1f93ff]/12 lg:size-80" />
          <div className="space-y-5">
            <div className="h-3 w-36 animate-pulse rounded-full bg-[#1f93ff]/12" />
            <div className="h-12 w-full max-w-md animate-pulse rounded-2xl bg-[#1f93ff]/12" />
            <div className="h-20 w-full animate-pulse rounded-full bg-[#1f93ff]/12" />
            <div className="h-28 w-full animate-pulse rounded-3xl bg-[#1f93ff]/12" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 text-center"
        >
          <NotFoundLottie className="mb-2 max-w-xs" />

          <h1 className="mt-2 font-(family-name:--font-rate-serif) text-3xl leading-tight font-medium tracking-tight text-[#0A3D78] sm:text-4xl">
            {errorMessage}
          </h1>
        </motion.section>
      </PageShell>
    );
  }

  if (justSubmitted) {
    return (
      <PageShell>
        <ResultScreen
          title="Cảm ơn vì những góp ý của bạn"
          description="Phản hồi của bạn giúp chúng tôi phục vụ tốt hơn."
          score={recapScore}
          showThanksLine={false}
        />
      </PageShell>
    );
  }

  if (alreadySubmitted) {
    return (
      <PageShell>
        <ResultScreen
          title="Bạn đã đánh giá trước đó rồi."
          description="Cảm ơn bạn đã dành thời gian phản hồi."
          score={recapScore}
        />
      </PageShell>
    );
  }

  if (!showForm) {
    return (
      <PageShell>
        <ResultScreen
          title="Không thể gửi đánh giá"
          description="Link này hiện không cho phép gửi đánh giá."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto grid min-h-dvh max-w-7xl items-center gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="order-1 lg:order-0"
        >
          <ServiceLottie />
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
          className="order-2 flex w-full flex-col lg:order-0"
        >
          <h1 className="mt-3 max-w-2xl font-(family-name:--font-rate-serif) text-[2rem] leading-[1.12] font-medium tracking-tight text-[#0A3D78] sm:text-[2.75rem]">
            Những góp ý của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn.
          </h1>

          <div className="mt-8">
            <p className="mb-2.5 text-sm text-[#4A6A8A]">Mức hài lòng</p>
            <div className="rounded-[1.35rem] border border-[#1f93ff]/18 bg-white px-3 py-4 sm:px-5 sm:py-5">
              <StarRow value={score} onChange={setScore} />
            </div>
          </div>

          <label className="mt-6 block">
            <span className="sr-only">Nhận xét</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Chia sẻ thêm cảm tưởng của bạn (không bắt buộc)"
              className={cn(
                "w-full resize-none rounded-[1.35rem] border border-[#1f93ff]/18 bg-white px-4 py-3.5",
                "text-[15px] leading-relaxed text-[#0A3D78] placeholder:text-[#4A6A8A]/55",
                "outline-none transition-[border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "focus-visible:border-[#1f93ff]/40",
              )}
              style={{ minHeight: 112, height: 112 }}
            />
          </label>

          <button
            type="submit"
            disabled={!score || submitRating.isPending}
            className={cn(
              "group relative mt-6 flex h-14 w-full items-center justify-center rounded-full",
              "bg-[#1f93ff] text-sm font-medium tracking-wide text-white",
              "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "hover:opacity-90 active:scale-[0.98]",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <span>
              {submitRating.isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </span>
            <span
              className={cn(
                "absolute top-1.5 right-1.5 flex size-11 items-center justify-center rounded-full",
                "bg-white/18 text-white",
                "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "group-hover:translate-x-0.5 group-hover:-translate-y-px",
              )}
            >
              <ArrowIcon />
            </span>
          </button>
        </motion.form>
      </div>
    </PageShell>
  );
}

function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-1 opacity-[0.04] mix-blend-multiply"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")",
      }}
    />
  );
}
