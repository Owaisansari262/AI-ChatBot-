import { useRef } from "react";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    // auto-resize the textarea up to a max height
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 140) + "px";
    }
  };

  return (
    <div className="border-t border-black/10 dark:border-white/10 px-4 sm:px-6 py-3 bg-white/70 dark:bg-[#1D1F26]/70 backdrop-blur-sm">
      <div className="flex items-end gap-2 max-w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Type your message..."
          className="flex-1 resize-none max-h-[140px] rounded-xl border border-black/10 dark:border-white/15 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors placeholder:text-black/35 dark:placeholder:text-white/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          title="Send message"
          className="shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-dark transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12l16-8-6 8 6 8-16-8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="text-[11px] text-black/35 dark:text-white/25 mt-1.5 text-center">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
}
