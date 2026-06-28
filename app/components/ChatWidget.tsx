"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "안녕하세요. 제 이력과 클라우드 보안 준비 과정에 대해 궁금한 점을 물어봐 주세요.",
  },
];

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

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

    try {
      const response = await fetch("/api/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data.reply ??
          data.error ??
          "응답을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "네트워크 오류가 발생했습니다. 서버 상태를 확인해 주세요.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
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

            {isSending ? (
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
        </div>
      </div>
    </section>
  );
}
