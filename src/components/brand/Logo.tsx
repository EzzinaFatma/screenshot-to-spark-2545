import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="cg-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--turquoise)" />
          <stop offset="1" stopColor="var(--ocean)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--navy-soft)" stroke="var(--navy-border)" />
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="url(#cg-mark)" strokeWidth="1.2" strokeDasharray="2 2.4" />
      <path
        d="M6 18.5c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2 2.2-2 2.4-2"
        fill="none"
        stroke="url(#cg-mark)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="21.5" cy="11" r="1.8" fill="var(--turquoise)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[15px] font-semibold tracking-tight text-navy-foreground">
          CoastGuard <span className="text-turquoise">AI</span>
        </span>
        <span className="eyebrow mt-1 block text-[9px] text-navy-muted">Hammamet Bay Observatory</span>
      </span>
    </span>
  );
}
