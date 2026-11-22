import type { ReactNode } from "react";

export const AXIS = { tickLine: false, axisLine: false, fontSize: 11 } as const;
export const GRID = { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false } as const;

export const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface TooltipItem {
  name?: string | number;
  value?: unknown;
  color?: string;
  dataKey?: string | number;
}

function fmtValue(v: unknown, digits: number) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "number" ? x.toFixed(digits) : String(x))).join(" – ");
  if (typeof v === "number") return v.toFixed(digits);
  return String(v ?? "");
}

/** Recharts tooltip body; pass as content={<TooltipCard … />}. */
export function TooltipCard({
  active,
  payload,
  label,
  labelFormat,
  unit = "",
  digits = 2,
  footer,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  labelFormat?: (label: string | number | undefined) => ReactNode;
  unit?: string;
  digits?: number;
  footer?: ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== undefined && p.value !== null && p.name !== "_hidden");
  if (!rows.length) return null;
  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-elevated">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {labelFormat ? labelFormat(label) : label}
      </p>
      <div className="space-y-1">
        {rows.map((p) => (
          <div key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
              {p.name}
            </span>
            <span className="font-mono font-medium tabular">
              {fmtValue(p.value, digits)}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
        ))}
      </div>
      {footer ? <div className="mt-1.5 border-t pt-1.5 text-muted-foreground">{footer}</div> : null}
    </div>
  );
}

export function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {swatch}
      {children}
    </span>
  );
}

export function LineSwatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="18" height="8" aria-hidden>
      <line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth="2.5" strokeDasharray={dashed ? "4 3" : undefined} />
    </svg>
  );
}
