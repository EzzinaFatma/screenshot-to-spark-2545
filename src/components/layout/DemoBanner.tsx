import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="demo-stripes border-b border-prov-demo/30 bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs text-foreground sm:px-6">
        <FlaskConical className="size-3.5 text-prov-demo" aria-hidden />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-prov-demo">
          Prototype
        </span>
        <span className="text-muted-foreground">
          All measurements, rates and predictions shown are <strong className="text-foreground">simulated demonstration data</strong> — not
          scientific results. The real Hammamet dataset and trained model are not yet connected.
        </span>
        <Link to="/about" hash="data-integrity" className="ml-auto font-medium text-primary hover:underline">
          Data integrity policy
        </Link>
      </div>
    </div>
  );
}
