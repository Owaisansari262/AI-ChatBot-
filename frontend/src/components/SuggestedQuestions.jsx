const SUGGESTIONS = [
  "What can you help me with?",
  "Explore our products",
  "Explain recursion like I'm new to coding",
  "Show me available Wi-Fi 6 routers",
];

export default function SuggestedQuestions({ onPick }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white font-semibold mb-4">
        AI
      </div>
      <h2 className="text-base font-semibold mb-1">How can I help you today?</h2>
      <p className="text-sm text-black/50 dark:text-white/40 mb-6">
        Ask anything, or try one of these
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="text-sm px-3.5 py-2 rounded-full border border-black/10 dark:border-white/15 text-black/70 dark:text-white/70 hover:border-accent hover:text-accent transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
