export default function Header() {
  return (
    <header className="relative overflow-hidden border-b border-glass-border bg-bg-secondary/60 backdrop-blur-xl">
      {/* Gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center md:py-10">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20 animate-pulse-glow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
          Fraud<span className="text-accent-light">Shield</span>
        </h1>

        <p className="max-w-lg text-sm text-text-secondary md:text-base">
          AI-powered credit card fraud detection using ensemble machine learning.
          Analyze transactions in real-time with confidence scores.
        </p>
      </div>
    </header>
  );
}
