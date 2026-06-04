import { useAiChat } from "../model/use-ai-chat";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { cn } from "@/shared/lib/css";
import { BotIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    suggestedQuestions,
    isLoading,
    isSending,
    errorMessage,
    askSuggested,
    sendText,
    resetChat,
  } = useAiChat(isOpen);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendText(draft).then(() => setDraft(""));
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="border-border bg-card flex h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl">
          <div className="border-border bg-primary text-primary-foreground flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <BotIcon className="size-5" />
              <div>
                <p className="font-semibold">AI-помощник</p>
                <p className="text-primary-foreground/80 text-xs">Ответы о платформе IT-Cube</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 px-2 text-xs"
                onClick={() => void resetChat()}
              >
                Новый диалог
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-8"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть чат"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-4 py-4">
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Загрузка…</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                      message.role === "assistant"
                        ? "bg-muted text-foreground self-start"
                        : "bg-primary text-primary-foreground self-end",
                    )}
                  >
                    {message.content}
                  </div>
                ))
              )}
              {isSending ? (
                <p className="text-muted-foreground self-start text-xs">AI думает…</p>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-border space-y-3 border-t px-4 py-3">
            {errorMessage ? (
              <p className="text-destructive text-xs">{errorMessage}</p>
            ) : null}

            {suggestedQuestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-auto whitespace-normal px-2 py-1 text-left text-xs"
                    disabled={isLoading || isSending}
                    onClick={() => void askSuggested(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            ) : null}

            <form className="flex gap-2" onSubmit={onSubmit}>
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Задайте вопрос о платформе…"
                disabled={isLoading || isSending}
              />
              <Button type="submit" disabled={isLoading || isSending || !draft.trim()}>
                →
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="size-14 rounded-full shadow-lg"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? "Закрыть чат" : "Открыть AI-чат"}
      >
        {isOpen ? <XIcon className="size-6" /> : <MessageCircleIcon className="size-6" />}
      </Button>
    </div>
  );
}
