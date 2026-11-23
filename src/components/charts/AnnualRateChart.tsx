import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, GRID, LegendItem, TooltipCard } from "./chart-kit";
import { signed } from "@/lib/format";

/** Year-on-year shoreline change. Red = erosion (landward), teal = accretion. */
export function AnnualRateChart({ rates, height = 200 }: { rates: { year: number; rate: number }[]; height?: number }) {
  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rates} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="year" {...AXIS} interval="preserveStartEnd" />
            <YAxis {...AXIS} width={60} tickFormatter={(v: number) => `${signed(v, 1)} m`} />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
            <Tooltip cursor={{ fill: "var(--muted)" }} content={<TooltipCard unit="m/yr" labelFormat={(l) => `Year ${l}`} />} />
            <Bar dataKey="rate" name="Shoreline change" radius={[3, 3, 3, 3]} isAnimationActive={false}>
              {rates.map((d) => (
                <Cell key={d.year} fill={d.rate < 0 ? "var(--erosion)" : "var(--accretion)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex gap-4">
        <LegendItem swatch={<span className="size-2.5 rounded-sm bg-erosion" />}>Erosion</LegendItem>
        <LegendItem swatch={<span className="size-2.5 rounded-sm bg-accretion" />}>Accretion</LegendItem>
      </div>
    </div>
  );
}
