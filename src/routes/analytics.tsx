import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Ruler, TrendingDown, TrendingUp } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { ProvenanceBadge, ProvenanceRow } from "@/components/data/ProvenanceBadge";
import { RiskBadge } from "@/components/data/RiskBadge";
import { AnnualRateChart } from "@/components/charts/AnnualRateChart";
import { ShorelineHistoryChart } from "@/components/charts/ShorelineHistoryChart";
import { AXIS, GRID, SERIES_COLORS, TooltipCard } from "@/components/charts/chart-kit";
import { SegmentDetailsSheet } from "@/components/segment/SegmentDetailsSheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { allHistoriesQuery, segmentsQuery } from "@/lib/api/queries";
import { bayAnnualRates, findHotspots } from "@/lib/analytics";
import { formatRate, signed } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Historical Coastal Analysis — CoastGuard AI" },
      { name: "description", content: "Shoreline evolution and erosion/accretion rates 2000–2020 for each Hammamet Bay segment, with hotspot ranking (demo data)." },
      { property: "og:title", content: "Historical Coastal Analysis — CoastGuard AI" },
      { property: "og:description", content: "Compare shoreline evolution 2000–2020, annual erosion and accretion rates, and erosion hotspots in Hammamet Bay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(segmentsQuery), context.queryClient.ensureQueryData(allHistoriesQuery)]),
  component: AnalyticsPage,
});

const MAX_COMPARE = 5;

function AnalyticsPage() {
  const { data } = useSuspenseQuery(segmentsQuery);
  const { data: histories } = useSuspenseQuery(allHistoriesQuery);
  const segs = data.segments;
  const [compare, setCompare] = useState<string[]>(["HMB-03", "HMB-10", "HMB-13"]);
  const [focusId, setFocusId] = useState("HMB-10");
  const [threshold, setThreshold] = useState(1);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const nameOf = (id: string) => segs.find((s) => s.id === id)?.name ?? id;
  const focusHistory = histories.find((h) => h.segmentId === focusId);
  const focusSeg = segs.find((s) => s.id === focusId);
  const bayRates = useMemo(() => bayAnnualRates(histories), [histories]);
  const hotspots = useMemo(() => findHotspots(segs, threshold), [segs, threshold]);

  const compareData = useMemo(() => {
    const years = histories[0]?.observations.map((o) => o.year) ?? [];
    return years.map((year) => {
      const row: Record<string, number> = { year };
      for (const id of compare) {
        const pos = histories.find((h) => h.segmentId === id)?.observations.find((o) => o.year === year)?.position;
        if (pos !== undefined) row[id] = pos;
      }
      return row;
    });
  }, [histories, compare]);

  const eroding = segs.filter((s) => s.historicalRate < 0);
  const meanRate = segs.reduce((a, s) => a + s.historicalRate, 0) / segs.length;
  const worst = [...segs].sort((a, b) => a.historicalRate - b.historicalRate)[0];
  const best = [...segs].sort((a, b) => b.historicalRate - a.historicalRate)[0];
  const [y0, y1] = data.meta.historyPeriod;

  const kpis = [
    { icon: TrendingDown, value: formatRate(meanRate), label: "Bay-wide mean rate", note: `End-point rate ${y0}–${y1}` },
    { icon: Ruler, value: `${eroding.length} / ${segs.length}`, label: "Segments eroding", note: "Net landward retreat since 2000" },
    { icon: AlertTriangle, value: worst ? formatRate(worst.historicalRate) : "—", label: "Fastest retreat", note: worst?.name ?? "" },
    { icon: TrendingUp, value: best ? formatRate(best.historicalRate) : "—", label: "Strongest accretion", note: best?.name ?? "" },
  ];

  const toggle = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= MAX_COMPARE ? c : [...c, id]));

  return (
    <>
      <PageHeader
        eyebrow={`Shoreline history · ${y0}–${y1}`}
        title="Historical Coastal Analysis"
        description="How each stretch of Hammamet Bay has moved since 2000: shoreline positions, year-on-year change and the segments retreating fastest."
        actions={<ProvenanceRow kinds={["historical", "satellite", "demo"]} tone="dark" />}
      />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="animate-rise rounded-xl border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <k.icon className="size-5 text-primary" aria-hidden />
                <ProvenanceBadge kind="demo" />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold tabular">{k.value}</p>
              <p className="text-sm font-medium">{k.label}</p>
              <p className="text-xs text-muted-foreground">{k.note}</p>
            </div>
          ))}
        </div>

        <Panel
          className="mt-6"
          title="Shoreline evolution — segment comparison"
          subtitle={`Position relative to the ${y0} baseline. Negative = landward retreat. Select up to ${MAX_COMPARE} segments.`}
          badges={<ProvenanceRow kinds={["historical", "satellite", "demo"]} />}
        >
          <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Segments to compare">
            {segs.map((s) => {
              const idx = compare.indexOf(s.id);
              const on = idx >= 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  disabled={!on && compare.length >= MAX_COMPARE}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors disabled:opacity-40",
                    on ? "border-primary/40 bg-primary/10 text-foreground" : "bg-card text-muted-foreground hover:bg-muted",
                  )}
                  title={s.name}
                >
                  {on ? <span className="size-2 rounded-full" style={{ background: SERIES_COLORS[idx % SERIES_COLORS.length] }} aria-hidden /> : null}
                  {s.id}
                </button>
              );
            })}
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compareData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="year" {...AXIS} interval="preserveStartEnd" />
                <YAxis {...AXIS} unit=" m" width={56} />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.4} />
                <Tooltip content={<TooltipCard unit="m" labelFormat={(l) => `Year ${l}`} />} />
                {compare.map((id, i) => (
                  <Line
                    key={id}
                    dataKey={id}
                    name={`${id} · ${nameOf(id)}`}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {compare.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Pick at least one segment above.</p> : null}
        </Panel>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <Panel
            className="lg:col-span-3"
            title="Segment detail"
            subtitle={focusSeg ? `${focusSeg.zone} · end-point rate ${formatRate(focusSeg.historicalRate)}` : undefined}
            badges={<ProvenanceRow kinds={["historical", "satellite", "demo"]} />}
            actions={
              <Select value={focusId} onValueChange={setFocusId}>
                <SelectTrigger className="w-56" aria-label="Segment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id} · {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {focusHistory ? (
              <div className="space-y-6">
                <ShorelineHistoryChart history={focusHistory} height={240} />
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Year-on-year shoreline change</p>
                  <AnnualRateChart rates={focusHistory.annualRates} height={180} />
                </div>
              </div>
            ) : null}
          </Panel>
          <Panel
            className="lg:col-span-2"
            title="Bay-wide annual change"
            subtitle="Mean year-on-year change across all 16 segments"
            badges={<ProvenanceRow kinds={["satellite", "demo"]} />}
          >
            <AnnualRateChart rates={bayRates} height={260} />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Erosion years usually follow winters with frequent easterly storms; accretion years follow calmer seasons when sand returns to the beach.
            </p>
          </Panel>
        </div>

        <Panel
          className="mt-6"
          title="Erosion hotspots"
          subtitle="Segments whose 2000–2020 retreat rate meets the threshold, fastest first. Click a row for details."
          badges={<ProvenanceRow kinds={["historical", "demo"]} />}
          actions={
            <div className="flex w-64 items-center gap-3">
              <Label htmlFor="hotspot-threshold" className="shrink-0 text-xs">
                Retreat ≥ <span className="font-mono">{threshold.toFixed(1)} m/yr</span>
              </Label>
              <Slider id="hotspot-threshold" min={0.2} max={2.6} step={0.1} value={[threshold]} onValueChange={([v]) => v !== undefined && setThreshold(v)} />
            </div>
          }
          bodyClassName="p-0"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 pl-5">#</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-right">Rate 2000–2020</TableHead>
                <TableHead className="text-right">Net change</TableHead>
                <TableHead className="pr-5">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotspots.map((s, i) => {
                const last = histories.find((h) => h.segmentId === s.id)?.observations.at(-1)?.position ?? 0;
                return (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setDetailsId(s.id)}>
                    <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium">{s.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.id}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.zone}</TableCell>
                    <TableCell className="text-right font-mono tabular text-erosion">{formatRate(s.historicalRate)}</TableCell>
                    <TableCell className="text-right font-mono tabular">{signed(last, 1)} m</TableCell>
                    <TableCell className="pr-5">
                      <RiskBadge risk={s.risk} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {hotspots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No segment retreats this fast. Lower the threshold.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Panel>
      </PageBody>
      <SegmentDetailsSheet segment={segs.find((s) => s.id === detailsId) ?? null} onClose={() => setDetailsId(null)} />
    </>
  );
}
