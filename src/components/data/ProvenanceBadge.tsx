import { cva } from "class-variance-authority";
import { Database, FlaskConical, Satellite, Sparkles } from "lucide-react";
import type { Provenance } from "@/lib/api/types";
import { PROVENANCE_META } from "@/lib/provenance";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const provenanceVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] whitespace-nowrap",
  {
    variants: {
      kind: {
        historical: "border-prov-historical/30 bg-prov-historical/10 text-prov-historical",
        satellite: "border-prov-satellite/35 bg-prov-satellite/10 text-prov-satellite",
        prediction: "border-prov-prediction/35 bg-prov-prediction/10 text-prov-prediction",
        demo: "border-dashed border-prov-demo/60 demo-stripes text-prov-demo",
      },
      tone: {
        light: "",
        dark: "",
      },
    },
    compoundVariants: [
      { kind: "historical", tone: "dark", className: "border-navy-foreground/30 bg-navy-foreground/10 text-navy-foreground" },
      { kind: "satellite", tone: "dark", className: "border-turquoise/40 bg-turquoise/10 text-turquoise" },
      { kind: "prediction", tone: "dark", className: "border-ocean/50 bg-ocean/20 text-navy-foreground" },
      { kind: "demo", tone: "dark", className: "border-prov-demo/70 text-risk-moderate" },
    ],
    defaultVariants: { tone: "light" },
  },
);

const ICONS = { historical: Database, satellite: Satellite, prediction: Sparkles, demo: FlaskConical };

export function ProvenanceBadge({
  kind,
  tone = "light",
  className,
}: {
  kind: Provenance;
  tone?: "light" | "dark";
  className?: string;
}) {
  const Icon = ICONS[kind];
  const meta = PROVENANCE_META[kind];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(provenanceVariants({ kind, tone }), className)}>
          <Icon className="size-3" aria-hidden />
          {meta.label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-xs">{meta.description}</TooltipContent>
    </Tooltip>
  );
}

export function ProvenanceRow({
  kinds,
  tone,
  className,
}: {
  kinds: Provenance[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {kinds.map((k) => (
        <ProvenanceBadge key={k} kind={k} {...(tone ? { tone } : {})} />
      ))}
    </div>
  );
}
