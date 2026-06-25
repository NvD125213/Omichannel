import type { ChatCompletionRequest } from "@/services/chatbot-kg-core/interfaces";

function extractContentFromSseLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;

  try {
    const parsed = JSON.parse(payload) as { content?: string };
    if (typeof parsed.content === "string" && parsed.content.length > 0) {
      return parsed.content;
    }
  } catch {
    // ignore malformed chunks
  }

  return null;
}

export async function streamChatCompletions(
  data: ChatCompletionRequest,
  onChunk: (content: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const baseURL = process.env.NEXT_PUBLIC_CHATBOT_CORE_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_CHATBOT_CORE_API_KEY;

  if (!baseURL) {
    throw new Error("Missing NEXT_PUBLIC_CHATBOT_CORE_API_URL");
  }

  const response = await fetch(`${baseURL}/v1/chat/completions/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const content = extractContentFromSseLine(line);
      if (!content) continue;
      answer += content;
      onChunk(content);
    }
  }

  const trailing = extractContentFromSseLine(buffer);
  if (trailing) {
    answer += trailing;
    onChunk(trailing);
  }

  return answer;
}
