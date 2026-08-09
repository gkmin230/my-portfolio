"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type Timings = {
  aiResponseTimeMs?: number;
  mongoSaveTimeMs?: number;
  totalResponseTimeMs?: number;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "안녕하세요. 제 이력과 클라우드 보안 준비 과정에 대해 궁금한 점을 물어봐 주세요.",
  },
];

function getOrCreateSessionId() {
  const storageKey = "portfolio-chat-session-id";
  const savedSessionId = window.localStorage.getItem(storageKey);

  if (savedSessionId) {
    return savedSessionId;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, sessionId);

  return sessionId;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatMs(value?: number) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${value.toLocaleString()}ms`;
}

function removeBoldMarkdown(text: string) {
  return text.replaceAll("**", "");
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [timings, setTimings] = useState<Timings | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function showTypingMessage(content: string) {
    const assistantMessageId = Date.now() + 1;
    const plainContent = removeBoldMarkdown(content);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    for (let index = 0; index < plainContent.length; index += 2) {
      await wait(12);
      const visibleContent = plainContent.slice(0, index + 2);

      setMessages((currentMessages) =>
        currentMessages.map((chatMessage) =>
          chatMessage.id === assistantMessageId
            ? { ...chatMessage, content: visibleContent }
            : chatMessage,
        ),
      );
    }
  }

  async function sendMessage(nextMessage: string) {
    const trimmedMessage = nextMessage.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setMessage("");
    setIsSending(true);
    setTimings(null);

    try {
      const response = await fetch("/api/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        suggestedQuestions?: string[];
        timings?: Timings;
      };

      const assistantMessage =
        data.reply ??
        data.error ??
        "응답을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.";

      if (data.suggestedQuestions?.length) {
        setSuggestedQuestions(data.suggestedQuestions);
      }

      if (data.timings) {
        setTimings(data.timings);
      }

      await showTypingMessage(assistantMessage);
    } catch {
      await showTypingMessage(
        "네트워크 오류가 발생했습니다. 서버 상태를 확인해 주세요.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(message);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-180px)] max-w-4xl flex-col px-6 py-10">
      <div className="flex flex-1">
        <div className="flex min-h-[680px] w-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Chat</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              예: AWS 보안 실습은 어떤 걸 해봤나요?
            </p>
          </div>

          <div
            className="flex-1 space-y-4 overflow-y-auto bg-background p-5"
            aria-live="polite"
          >
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`flex ${
                  chatMessage.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-6 ${
                    chatMessage.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-border bg-surface-muted text-foreground"
                  }`}
                >
                  {chatMessage.content}
                </div>
              </div>
            ))}

            {isSending && messages.at(-1)?.role === "user" ? (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  답변 생성 중...
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-3 border-t border-border bg-surface p-4"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-blue-500"
              placeholder="메시지를 입력하세요"
            />
            <button
              type="submit"
              disabled={isSending}
              className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              전송
            </button>
          </form>

          {suggestedQuestions.length || timings ? (
            <div className="border-t border-border bg-surface px-4 py-3">
              {suggestedQuestions.length ? (
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      disabled={isSending}
                      onClick={() => void sendMessage(question)}
                      className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs font-medium text-foreground hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-blue-400"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              ) : null}

              {timings ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  속도: 전체 {formatMs(timings.totalResponseTimeMs)} · AI{" "}
                  {formatMs(timings.aiResponseTimeMs)} · DB{" "}
                  {formatMs(timings.mongoSaveTimeMs)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
