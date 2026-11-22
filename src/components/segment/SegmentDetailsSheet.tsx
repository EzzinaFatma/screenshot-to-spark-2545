import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, Compass, Database, MapPin, Waves, Wind } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvenanceBadge } from "@/components/data/ProvenanceBadge";
import { RiskBadge } from "@/components/data/RiskBadge";
import { CoastlineLocator } from "@/components/map/CoastlineLocator";
import { ShorelineHistoryChart, type Forecast } from "@/components/charts/ShorelineHistoryChart";
import { AnnualRateChart } from "@/components/charts/AnnualRateChart";
import { AXIS, TooltipCard } from "@/components/charts/chart-kit";
import { environmentQuery, historyQuery, segmentsQuery } from "@/lib/api/queries";
import type { CoastalSegment, RiskLevel } from "@/lib/api/types";
import { formatCoord, formatDate, formatMonth, formatRate, formatRetreat, rateLabel } from "@/lib/format";
import { RISK_META } from "@/lib/risk";
import { seriesMean } from "@/lib/analytics";

export interface SheetPrediction extends Forecast {
  risk: RiskLevel;
  experimental: boolean;
  modelName: string;
}

function Section({ title, badges, children }: { title: string; badges?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t px-6 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="eyebrow text-muted-foreground">{title}</h3>
        {badges ? <div className="flex flex-wrap gap-1.5">{badges}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, children, mono = true }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm font-medium tabular" : "text-sm font-medium"}>{children}</dd>
    </div>
  );
}

function SegmentDetails({ segment, prediction }: { segment: CoastalSegment; prediction?: SheetPrediction }) {
  const segments = useQuery(segmentsQuery).data?.segments ?? [segment];
  const history = useQuery(historyQuery(segment.id));
  const env = useQuery(environmentQuery(segment.id));

  const forecast: SheetPrediction = prediction ?? {
    horizon: 1,
    retreat: segment.predictedRetreat1y,
    lower: Math.round((segment.predictedRetreat1y - segment.uncertainty1y) * 100) / 100,
    upper: Math.round((segment.predictedRetreat1y + segment.uncertainty1y) * 100) / 100,
    risk: segment.risk,
    experimental: false,
    modelName: "Demonstration heuristic",
  };
  const series = env.data?.series ?? [];
  const latest = series.at(-1);
  const half = Math.round(((forecast.upper - forecast.lower) / 2) * 100) / 100;

  return (
    <>
      <div className="bg-hero px-6 pb-6 pt-7 text-navy-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-wider text-turquoise">{segment.id}</span>
          <span className="text-navy-muted">·</span>
          <span className="text-xs text-navy-muted">{segment.zone}</span>
        </div>
        <SheetTitle className="mt-1 font-display text-2xl font-semibold text-navy-foreground">{segment.name}</SheetTitle>
        <SheetDescription className="mt-1 text-sm text-navy-muted">
          {segment.shorelineType} · {segment.lengthKm.toFixed(2)} km of shoreline
        </SheetDescription>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <RiskBadge risk={forecast.risk} className="bg-navy-foreground/95" />
          <ProvenanceBadge kind="demo" tone="dark" />
        </div>
      </div>

      <Section title="Location">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_200px]">
          <div className="rounded-lg border bg-muted/40 p-2">
            <CoastlineLocator segments={segments} selectedId={segment.id} strokeWidth={4} showLabels />
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <Fact label="Centroid">
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-primary" aria-hidden />{formatCoord(segment.centroid)}</span>
            </Fact>
            <Fact label="Land cover" mono={false}>{segment.landCover}</Fact>
            <Fact label="Wave exposure index">{segment.exposure.toFixed(2)}</Fact>
          </dl>
        </div>
      </Section>

      <Section title="One-year prediction" badges={<><ProvenanceBadge kind="prediction" /><ProvenanceBadge kind="demo" /></>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-prov-prediction/30 bg-prov-prediction/5 p-3">
            <p className="text-xs text-muted-foreground">Predicted retreat ({forecast.horizon} yr)</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular">{formatRetreat(forecast.retreat)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Model uncertainty</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular">±{half.toFixed(2)} m</p>
            <p className="font-mono text-[11px] text-muted-foreground">{forecast.lower.toFixed(2)} to {forecast.upper.toFixed(2)} m</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Risk level</p>
            <div className="mt-1.5"><RiskBadge risk={forecast.risk} /></div>
            <p className="mt-1 text-[11px] text-muted-foreground">{RISK_META[forecast.risk].range}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {forecast.modelName}
          {forecast.experimental ? " · experimental horizon, not validated" : " · design horizon (1 year)"}. Not a trained model output.
        </p>
      </Section>

      <Section title="Historical shoreline evolution" badges={<><ProvenanceBadge kind="historical" /><ProvenanceBadge kind="satellite" /><ProvenanceBadge kind="demo" /></>}>
        <dl className="mb-4 grid grid-cols-2 gap-3">
          <Fact label="End-point rate 2000–2020">
            {formatRate(segment.historicalRate)} <span className="font-sans text-xs font-normal text-muted-foreground">({rateLabel(segment.historicalRate)})</span>
          </Fact>
          <Fact label="Net change since 2000">{history.data?.observations.at(-1)?.position.toFixed(2) ?? "…"} m</Fact>
        </dl>
        {history.data ? <ShorelineHistoryChart history={history.data} forecast={forecast} height={240} /> : <Skeleton className="h-60 w-full" />}
      </Section>

      <Section title="Annual erosion / accretion" badges={<ProvenanceBadge kind="satellite" />}>
        {history.data ? <AnnualRateChart rates={history.data.annualRates} height={180} /> : <Skeleton className="h-44 w-full" />}
      </Section>

      <Section title="Environmental conditions" badges={<><ProvenanceBadge kind="satellite" /><ProvenanceBadge kind="demo" /></>}>
        {latest ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">Latest record: {formatMonth(latest.month)} · 36-month mean in brackets</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact label="Wave height"><Waves className="mr-1 inline size-3.5 text-primary" aria-hidden />{latest.waveHeight.toFixed(2)} m <span className="text-muted-foreground">({seriesMean(series, "waveHeight").toFixed(2)})</span></Fact>
              <Fact label="Wave direction"><Compass className="mr-1 inline size-3.5 text-primary" aria-hidden />{latest.waveDirection}° <span className="text-muted-foreground">({Math.round(seriesMean(series, "waveDirection"))}°)</span></Fact>
              <Fact label="Wind speed"><Wind className="mr-1 inline size-3.5 text-primary" aria-hidden />{latest.windSpeed.toFixed(1)} m/s <span className="text-muted-foreground">({seriesMean(series, "windSpeed").toFixed(1)})</span></Fact>
              <Fact label="NDWI / MNDWI">{latest.ndwi.toFixed(2)} / {latest.mndwi.toFixed(2)}</Fact>
            </dl>
            <div className="mt-4 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="month" {...AXIS} tickFormatter={formatMonth} interval={11} />
                  <YAxis {...AXIS} width={44} />
                  <Tooltip content={<TooltipCard unit="m" labelFormat={(l) => formatMonth(String(l))} />} />
                  <Area dataKey="waveHeight" name="Wave height" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </Section>

      <Section title="Data source & last update">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Source" mono={false}><Database className="mr-1 inline size-3.5 text-muted-foreground" aria-hidden />{segment.dataSource}</Fact>
          <Fact label="Last observation" mono={false}><CalendarClock className="mr-1 inline size-3.5 text-muted-foreground" aria-hidden />{formatDate(segment.lastObservation)}</Fact>
        </dl>
      </Section>
    </>
  );
}

/** Right-hand panel with everything known about one coastal segment. */
export function SegmentDetailsSheet({
  segment,
  prediction,
  onClose,
}: {
  segment: CoastalSegment | null;
  prediction?: SheetPrediction;
  onClose: () => void;
}) {
  // Keep the last segment rendered while the sheet animates closed.
  const [shown, setShown] = useState(segment);
  useEffect(() => {
    if (segment) setShown(segment);
  }, [segment]);

  return (
    <Sheet open={Boolean(segment)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl [&>button]:text-navy-foreground">
        {shown ? <SegmentDetails segment={shown} {...(prediction ? { prediction } : {})} /> : null}
      </SheetContent>
    </Sheet>
  );
}
