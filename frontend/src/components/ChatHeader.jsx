export default function ChatHeader({ isDark, onToggleTheme, onClearChat, hasMessages }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1D1F26]/70 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-semibold text-sm">
          AI
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">Chat Assistant</h1>
          {/* <p className="text-xs text-black/50 dark:text-white/40 leading-tight">Gemini 3.6 Flash</p> */}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onClearChat}
          disabled={!hasMessages}
          title="Clear chat"
          className="p-2 rounded-md text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-md text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
