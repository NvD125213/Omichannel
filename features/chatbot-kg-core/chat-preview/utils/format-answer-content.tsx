import type { ReactNode } from "react";

export function formatAnswerContent(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, (_, inner: string) =>
    `**${inner.toUpperCase()}**`,
  );
}

export function renderFormattedAnswer(text: string): ReactNode[] {
  const formatted = formatAnswerContent(text);
  const parts = formatted
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
