export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#F1F0FB] dark:bg-[#262832] w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/50 animate-bounceDot [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/50 animate-bounceDot [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-black/40 dark:bg-white/50 animate-bounceDot [animation-delay:300ms]" />
    </div>
  );
}
