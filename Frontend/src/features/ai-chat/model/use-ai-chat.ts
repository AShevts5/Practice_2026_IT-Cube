import { aiChatService, type AiChatMessage } from "@/shared/api/services/ai_chat";
import { asFetchResult, getErrorMessage, parseApiError } from "@/shared/lib/errors";
import { useCallback, useEffect, useState } from "react";
import {
  clearStoredAiChatSessionId,
  getAiChatClientKey,
  getStoredAiChatSessionId,
  setStoredAiChatSessionId,
} from "./ai-chat-storage";

type SessionPayload = {
  session: { id: number };
  messages: AiChatMessage[];
  suggested_questions: string[];
};

type SendPayload = {
  user_message: AiChatMessage;
  assistant_message: AiChatMessage;
};

async function readFetchError(result: { response?: Response }, fallback: string) {
  if (!result.response) return fallback;
  const body = await parseApiError(result.response);
  return getErrorMessage(body, fallback);
}

export function useAiChat(isOpen: boolean) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const clientKey = getAiChatClientKey();

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const storedSessionId = getStoredAiChatSessionId();
      if (storedSessionId) {
        const restored = asFetchResult<SessionPayload>(
          await aiChatService.getSession(storedSessionId, clientKey),
        );
        if (!restored.error && restored.data) {
          setSessionId(restored.data.session.id);
          setMessages(restored.data.messages);
          setSuggestedQuestions(restored.data.suggested_questions);
          return;
        }
        clearStoredAiChatSessionId();
      }

      const created = asFetchResult<SessionPayload>(
        await aiChatService.startSession(clientKey),
      );
      if (created.error || !created.data) {
        setErrorMessage(await readFetchError(created, "Не удалось запустить AI-помощника"));
        return;
      }
      setSessionId(created.data.session.id);
      setStoredAiChatSessionId(created.data.session.id);
      setMessages(created.data.messages);
      setSuggestedQuestions(created.data.suggested_questions);
    } catch {
      setErrorMessage("Не удалось загрузить чат");
    } finally {
      setIsLoading(false);
    }
  }, [clientKey]);

  useEffect(() => {
    if (isOpen && sessionId === null && !isLoading) {
      void bootstrap();
    }
  }, [bootstrap, isLoading, isOpen, sessionId]);

  const sendText = useCallback(
    async (text: string) => {
      if (!sessionId || isSending || !text.trim()) return;
      setIsSending(true);
      setErrorMessage(undefined);
      try {
        const response = asFetchResult<SendPayload>(
          await aiChatService.sendMessage(sessionId, {
            client_key: clientKey,
            text: text.trim(),
          }),
        );
        if (response.error || !response.data) {
          setErrorMessage(await readFetchError(response, "Не удалось отправить сообщение"));
          return;
        }
        setMessages((prev) => [
          ...prev,
          response.data!.user_message,
          response.data!.assistant_message,
        ]);
      } catch {
        setErrorMessage("Не удалось отправить сообщение");
      } finally {
        setIsSending(false);
      }
    },
    [clientKey, isSending, sessionId],
  );

  const askSuggested = useCallback(
    async (question: string) => {
      await sendText(question);
    },
    [sendText],
  );

  const resetChat = useCallback(async () => {
    clearStoredAiChatSessionId();
    setSessionId(null);
    setMessages([]);
    setSuggestedQuestions([]);
    await bootstrap();
  }, [bootstrap]);

  return {
    messages,
    suggestedQuestions,
    isLoading,
    isSending,
    errorMessage,
    askSuggested,
    sendText,
    resetChat,
  };
}
