import { cva } from "class-variance-authority";
import type { RiskLevel } from "@/lib/api/types";
import { RISK_META } from "@/lib/risk";
import { cn } from "@/lib/utils";

const riskVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      risk: {
        low: "border-risk-low/35 bg-risk-low/12 text-foreground",
        moderate: "border-risk-moderate/50 bg-risk-moderate/18 text-foreground",
        high: "border-risk-high/45 bg-risk-high/15 text-foreground",
        critical: "border-risk-critical/45 bg-risk-critical/12 text-risk-critical",
      },
    },
  },
);

const dotVariants = cva("size-2 rounded-full", {
  variants: {
    risk: {
      low: "bg-risk-low",
      moderate: "bg-risk-moderate",
      high: "bg-risk-high",
      critical: "bg-risk-critical",
    },
  },
});

export function RiskDot({ risk, className }: { risk: RiskLevel; className?: string }) {
  return <span className={cn(dotVariants({ risk }), className)} aria-hidden />;
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return (
    <span className={cn(riskVariants({ risk }), className)}>
      <RiskDot risk={risk} />
      {RISK_META[risk].label}
    </span>
  );
}

export function riskBgClass(risk: RiskLevel) {
  return dotVariants({ risk });
}
