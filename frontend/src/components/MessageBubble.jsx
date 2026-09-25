import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({ role, content, isError }) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] bg-accent text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed ${
          isError
            ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/50"
            : "bg-[#F1F0FB] text-[#1B1D23] dark:bg-[#262832] dark:text-[#EDEDF0]"
        }`}
      >
        {isError ? (
          <p>{content}</p>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
