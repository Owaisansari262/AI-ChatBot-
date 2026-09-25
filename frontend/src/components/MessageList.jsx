import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

export default function MessageList({ messages, isWaiting }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isWaiting]);

  return (
    <div className="chat-scroll flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} role={m.role} content={m.content} isError={m.isError} />
      ))}
      {isWaiting && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
