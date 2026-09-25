import { useEffect, useState, useCallback } from "react";
import ChatHeader from "./components/ChatHeader.jsx";
import MessageList from "./components/MessageList.jsx";
import ChatInput from "./components/ChatInput.jsx";
import SuggestedQuestions from "./components/SuggestedQuestions.jsx";

const MESSAGES_KEY = "chatbot_messages";
const THEME_KEY = "chatbot_theme";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = sessionStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  const [input, setInput] = useState("");
  const [isWaiting, setIsWaiting] = useState(false); // true until the first response chunk arrives

  // Persist messages for the current tab session only, as required by the task.
  useEffect(() => {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    sessionStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isWaiting) return;

      const userMessage = { id: makeId(), role: "user", content: trimmed };
      const assistantId = makeId();
      const assistantMessage = { id: assistantId, role: "assistant", content: "" };

      // Build the history the backend needs BEFORE state updates apply.
      const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setIsWaiting(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok) {
          let errText = "Something went wrong talking to the AI.";
          try {
            const errJson = await res.json();
            errText = errJson.error || errText;
          } catch {
            // ignore, keep default message
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: errText, isError: true } : m))
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let receivedAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;

          if (!receivedAny) {
            receivedAny = true;
            setIsWaiting(false);
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        }

        if (!receivedAny) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "The AI didn't return a response. Please try again.", isError: true }
                : m
            )
          );
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Couldn't reach the server. Is the backend running?", isError: true }
              : m
          )
        );
      } finally {
        setIsWaiting(false);
      }
    },
    [messages, isWaiting]
  );

  const handleClearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(MESSAGES_KEY);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto sm:my-4 sm:rounded-2xl sm:border border-black/10 dark:border-white/10 overflow-hidden bg-white/40 dark:bg-white/[0.02] sm:shadow-sm">
        <ChatHeader
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onClearChat={handleClearChat}
          hasMessages={messages.length > 0}
        />

        {messages.length === 0 ? (
          <SuggestedQuestions onPick={(q) => sendMessage(q)} />
        ) : (
          <MessageList messages={messages} isWaiting={isWaiting} />
        )}

        <ChatInput value={input} onChange={setInput} onSend={() => sendMessage(input)} disabled={isWaiting} />
      </div>
    </div>
  );
}
