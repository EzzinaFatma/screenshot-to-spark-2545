import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SegmentHistory } from "@/lib/api/types";
import { AXIS, GRID, LegendItem, LineSwatch, TooltipCard } from "./chart-kit";

export interface Forecast {
  horizon: number;
  /** Total retreat over the horizon, m (positive = landward). */
  retreat: number;
  lower: number;
  upper: number;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  value?: unknown;
}

function SquareDot({ cx, cy, index, value }: DotProps) {
  if (cx === undefined || cy === undefined || value === undefined || value === null) return <g key={`sq-${index}`} />;
  return <rect key={`sq-${index}`} x={cx - 4} y={cy - 4} width={8} height={8} fill="var(--prov-historical)" stroke="var(--card)" strokeWidth={1.5} />;
}

/**
 * Shoreline position over time. Historical reference shorelines (squares), satellite
 * observations (line + dots) and the model forecast (dashed + uncertainty band) are
 * drawn with distinct styles so measured and predicted values are never confused.
 */
export function ShorelineHistoryChart({
  history,
  forecast,
  height = 260,
}: {
  history: SegmentHistory;
  forecast?: Forecast;
  height?: number;
}) {
  const obs = history.observations;
  const last = obs.at(-1);
  type Row = { year: number; observed?: number; reference?: number; forecast?: number; band?: [number, number] };
  const data: Row[] = obs.map((o) => ({
    year: o.year,
    observed: o.position,
    ...(o.source === "historical" ? { reference: o.position } : {}),
  }));
  if (forecast && last) {
    const row = data[data.length - 1];
    if (row) {
      row.forecast = last.position;
      row.band = [last.position, last.position];
    }
    data.push({
      year: last.year + forecast.horizon,
      forecast: Math.round((last.position - forecast.retreat) * 100) / 100,
      band: [Math.round((last.position - forecast.upper) * 100) / 100, Math.round((last.position - forecast.lower) * 100) / 100],
    });
  }

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} allowDecimals={false} {...AXIS} />
            <YAxis {...AXIS} unit=" m" width={56} />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.4} />
            {forecast && last ? (
              <ReferenceLine x={last.year} stroke="var(--prov-prediction)" strokeDasharray="2 4" label={{ value: "Forecast →", position: "insideTopRight", fontSize: 10, fill: "var(--prov-prediction)" }} />
            ) : null}
            <Tooltip
              content={
                <TooltipCard
                  unit="m"
                  labelFormat={(l) => `Year ${l}`}
                  footer="Position relative to the 2000 baseline (negative = landward)"
                />
              }
            />
            <Area dataKey="band" name="Uncertainty interval" stroke="none" fill="var(--prov-prediction)" fillOpacity={0.16} isAnimationActive={false} />
            <Line dataKey="observed" name="Satellite observation" stroke="var(--prov-satellite)" strokeWidth={2} dot={{ r: 2.5, fill: "var(--prov-satellite)", strokeWidth: 0 }} isAnimationActive={false} />
            <Line dataKey="reference" name="Historical reference" stroke="none" dot={SquareDot} activeDot={false} legendType="rect" isAnimationActive={false} />
            <Line dataKey="forecast" name="AI prediction" stroke="var(--prov-prediction)" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: "var(--prov-prediction)", strokeWidth: 0 }} connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <LegendItem swatch={<span className="size-2.5 bg-prov-historical" />}>Historical reference shoreline</LegendItem>
        <LegendItem swatch={<LineSwatch color="var(--prov-satellite)" />}>Satellite observation</LegendItem>
        {forecast ? (
          <>
            <LegendItem swatch={<LineSwatch color="var(--prov-prediction)" dashed />}>AI prediction</LegendItem>
            <LegendItem swatch={<span className="h-2.5 w-4 rounded-sm bg-prov-prediction/20" />}>Uncertainty interval</LegendItem>
          </>
        ) : null}
      </div>
    </div>
  );
}
