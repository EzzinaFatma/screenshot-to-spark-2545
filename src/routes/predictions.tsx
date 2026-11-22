import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, History, Loader2, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Panel } from "@/components/layout/Panel";
import { ProvenanceBadge, ProvenanceRow } from "@/components/data/ProvenanceBadge";
import { RiskBadge } from "@/components/data/RiskBadge";
import { CoastalMapLazy } from "@/components/map/CoastalMapLazy";
import { ModelPerformanceSection, ModelStatusBadge } from "@/components/model/ModelPerformanceSection";
import { SegmentDetailsSheet, type SheetPrediction } from "@/components/segment/SegmentDetailsSheet";
import { AXIS, GRID, LegendItem } from "@/components/charts/chart-kit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { modelPerformanceQuery, segmentsQuery } from "@/lib/api/queries";
import type { LandCoverScenario, PredictionHorizon, PredictionRequest, RiskLevel } from "@/lib/api/types";
import { DEMO_MODEL_ID, REFERENCE_INPUTS } from "@/lib/prediction/demo-model";
import { HORIZONS } from "@/lib/prediction/horizons";
import { formatRate, formatRetreat } from "@/lib/format";
import { RISK_LEVELS, RISK_META } from "@/lib/risk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "AI Prediction Center — CoastGuard AI" },
      { name: "description", content: "Run one-year-ahead shoreline retreat predictions per Hammamet Bay segment and review model performance (demo model)." },
      { property: "og:title", content: "AI Prediction Center — CoastGuard AI" },
      { property: "og:description", content: "One-year-ahead shoreline retreat predictions per segment, with uncertainty and risk class (demo model)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(segmentsQuery), context.queryClient.ensureQueryData(modelPerformanceQuery)]),
  component: PredictionsPage,
});

type Inputs = Omit<PredictionRequest, "horizon" | "modelId" | "segmentIds">;
type NumericInput = Exclude<keyof Inputs, "landCover">;

const FIELDS: { key: NumericInput; label: string; unit: string; min: number; max: number; step: number; digits: number; source: string }[] = [
  { key: "waveHeight", label: "Significant wave height", unit: "m", min: 0.3, max: 3, step: 0.05, digits: 2, source: "Copernicus Marine" },
  { key: "waveDirection", label: "Wave direction (from)", unit: "°", min: 0, max: 355, step: 5, digits: 0, source: "Copernicus Marine" },
  { key: "wavePeriod", label: "Wave period", unit: "s", min: 3, max: 10, step: 0.1, digits: 1, source: "Copernicus Marine" },
  { key: "windSpeed", label: "Wind speed", unit: "m/s", min: 0, max: 15, step: 0.1, digits: 1, source: "ERA5" },
  { key: "seaLevelRise", label: "Sea level rise", unit: "mm/yr", min: 0, max: 10, step: 0.1, digits: 1, source: "Copernicus Marine" },
  { key: "ndwi", label: "NDWI", unit: "", min: 0, max: 0.6, step: 0.01, digits: 2, source: "Sentinel-2 / Landsat" },
  { key: "mndwi", label: "MNDWI", unit: "", min: 0, max: 0.7, step: 0.01, digits: 2, source: "Sentinel-2 / Landsat" },
];

const LAND_COVER: { value: LandCoverScenario; label: string }[] = [
  { value: "baseline", label: "Current land cover" },
  { value: "urbanisation", label: "Further urbanisation of the beach front" },
  { value: "dune_restoration", label: "Dune restoration" },
];

const BASE_REQUEST: PredictionRequest = { ...REFERENCE_INPUTS, horizon: 1, modelId: DEMO_MODEL_ID };

function PredictionsPage() {
  const { data } = useSuspenseQuery(segmentsQuery);
  const { data: perf } = useSuspenseQuery(modelPerformanceQuery);
  const [inputs, setInputs] = useState<Inputs>(REFERENCE_INPUTS);
  const [horizon, setHorizon] = useState<PredictionHorizon>(1);
  const [modelId, setModelId] = useState(DEMO_MODEL_ID);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: api.runPrediction,
    onSuccess: (r) => toast.success(`Prediction ${r.runId} complete`, { description: `${r.predictions.length} segments · ${r.horizon}-year horizon · demo calculation` }),
    onError: (e) => toast.error("Prediction failed", { description: e instanceof Error ? e.message : String(e) }),
  });
  const { mutate } = mutation;
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutate(BASE_REQUEST);
  }, [mutate]);

  const request: PredictionRequest = { ...inputs, horizon, modelId };
  const result = mutation.data;
  const dirty = Boolean(mutation.variables) && JSON.stringify(mutation.variables) !== JSON.stringify(request);
  const selectedHorizon = HORIZONS.find((h) => h.years === horizon);

  const segById = useMemo(() => new Map(data.segments.map((s) => [s.id, s])), [data.segments]);
  const rows = useMemo(
    () =>
      (result?.predictions ?? []).map((p) => ({
        ...p,
        segment: segById.get(p.segmentId),
        err: [Math.round((p.retreat - p.lower) * 100) / 100, Math.round((p.upper - p.retreat) * 100) / 100] as [number, number],
      })),
    [result, segById],
  );
  const mapSegments = useMemo(() => {
    if (!result) return data.segments;
    const byId = new Map(result.predictions.map((p) => [p.segmentId, p]));
    return data.segments.map((s) => {
      const p = byId.get(s.id);
      if (!p) return s;
      return result.horizon === 1
        ? { ...s, risk: p.risk, predictedRetreat1y: p.retreat, uncertainty1y: Math.round(((p.upper - p.lower) / 2) * 100) / 100 }
        : { ...s, risk: p.risk };
    });
  }, [data.segments, result]);
  const predictedShorelines = useMemo(
    () => (result ? Object.fromEntries(result.predictions.map((p) => [p.segmentId, p.predictedShoreline])) : undefined),
    [result],
  );

  const counts = RISK_LEVELS.map((r) => ({ risk: r, n: rows.filter((x) => x.risk === r).length }));
  const meanRetreat = rows.length ? rows.reduce((a, x) => a + x.retreat, 0) / rows.length : 0;
  const worst = [...rows].sort((a, b) => b.retreat - a.retreat)[0];

  const detailsRow = rows.find((r) => r.segmentId === detailsId);
  const sheetPrediction: SheetPrediction | undefined =
    detailsRow && result
      ? { horizon: result.horizon, retreat: detailsRow.retreat, lower: detailsRow.lower, upper: detailsRow.upper, risk: detailsRow.risk, experimental: result.experimental, modelName: result.modelName }
      : undefined;

  const setField = (k: NumericInput, v: number) => setInputs((prev) => ({ ...prev, [k]: v }));

  return (
    <>
      <PageHeader
        eyebrow="AI Prediction Center · one-year-ahead forecasting"
        title="Predict shoreline retreat, segment by segment"
        description="The system is designed to predict shoreline retreat one year ahead from previous retreat, wave climate, wind, sea level, water indices and land cover. Until the trained model is connected, runs use a clearly identified demonstration calculation."
      >
        <ProvenanceRow kinds={["prediction", "demo"]} tone="dark" className="mt-5" />
      </PageHeader>
      <PageBody>
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          {/* ---------- Inputs ---------- */}
          <Panel title="Model inputs" subtitle="Bay-wide forcing scenario applied to every segment" className="xl:sticky xl:top-20 xl:self-start">
            <div className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground">Model</Label>
                <div className="mt-1.5 grid gap-1.5">
                  <ModelOption id={DEMO_MODEL_ID} active={modelId === DEMO_MODEL_ID} onPick={setModelId} name="Demonstration heuristic" note="Transparent calculation, not trained" badge={<ProvenanceBadge kind="demo" />} />
                  {perf.models.map((m) => (
                    <ModelOption key={m.id} id={m.id} active={modelId === m.id} onPick={setModelId} disabled={m.status !== "trained"} name={m.name} note={m.library} badge={<ModelStatusBadge status={m.status} />} />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Prediction horizon</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Prediction horizon">
                  {HORIZONS.map((h) => (
                    <button
                      key={h.years}
                      type="button"
                      role="radio"
                      aria-checked={horizon === h.years}
                      onClick={() => setHorizon(h.years)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-left transition-colors",
                        horizon === h.years ? "border-primary bg-primary/8 ring-1 ring-primary" : "hover:bg-muted",
                      )}
                    >
                      <span className="block text-sm font-semibold">{h.label}</span>
                      <span className={cn("block font-mono text-[9px] uppercase tracking-wider", h.experimental ? "text-prov-demo" : "text-risk-low")}>
                        {h.experimental ? "Experimental" : "Validated design"}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedHorizon?.experimental ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded-md bg-prov-demo/10 px-2.5 py-2 text-xs text-foreground">
                    <AlertTriangle className="mt-px size-3.5 shrink-0 text-prov-demo" aria-hidden />
                    {selectedHorizon.label} is experimental: the model is built for one-year-ahead prediction and this horizon is not scientifically validated. Uncertainty is widened.
                  </p>
                ) : null}
              </div>

              <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium"><History className="size-3.5 text-primary" aria-hidden />Previous shoreline retreat</span>
                  <ProvenanceBadge kind="historical" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Taken per segment from its 2000–2020 shoreline history.</p>
              </div>

              {FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor={`in-${f.key}`} className="text-sm">{f.label}</Label>
                    <span className="font-mono text-sm font-medium tabular">
                      {inputs[f.key].toFixed(f.digits)}
                      {f.unit ? <span className="text-muted-foreground"> {f.unit}</span> : null}
                    </span>
                  </div>
                  <Slider id={`in-${f.key}`} className="mt-2" min={f.min} max={f.max} step={f.step} value={[inputs[f.key]]} onValueChange={(v) => setField(f.key, v[0] ?? inputs[f.key])} aria-label={f.label} />
                  <p className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{f.source}</span>
                    <span>ref. {REFERENCE_INPUTS[f.key].toFixed(f.digits)}</span>
                  </p>
                </div>
              ))}

              <div>
                <Label className="text-sm">Land cover characteristics</Label>
                <Select value={inputs.landCover} onValueChange={(v) => setInputs((p) => ({ ...p, landCover: v as LandCoverScenario }))}>
                  <SelectTrigger className="mt-1.5" aria-label="Land cover scenario"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAND_COVER.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button className="flex-1" onClick={() => mutate(request)} disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="animate-spin" /> : <Play />}
                  Run Prediction
                </Button>
                <Button variant="outline" onClick={() => { setInputs(REFERENCE_INPUTS); setHorizon(1); }} aria-label="Reset inputs to reference values" title="Reset to reference values">
                  <RotateCcw />
                </Button>
              </div>
              {dirty ? <p className="-mt-2 text-xs text-prov-demo">Inputs changed since the last run. Run again to update the results.</p> : null}
            </div>
          </Panel>

          {/* ---------- Results ---------- */}
          <div className={cn("min-w-0 space-y-6 transition-opacity", mutation.isPending && "opacity-60")}>
            {result ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label={`Mean retreat (${result.horizon} yr)`} value={formatRetreat(meanRetreat)} />
                  <Stat label="Most exposed segment" value={worst ? worst.segmentId : "—"} note={worst ? formatRetreat(worst.retreat) : undefined} />
                  <div className="rounded-xl border bg-card p-4 shadow-card">
                    <p className="text-xs text-muted-foreground">Risk classes</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {counts.map((c) => (
                        <span key={c.risk} className="inline-flex items-center gap-1 font-mono text-sm tabular">
                          <span className="size-2 rounded-full" style={{ background: RISK_META[c.risk].colorVar }} aria-hidden />{c.n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Stat label="Run" value={result.runId} note={new Date(result.generatedAt).toLocaleTimeString()} />
                </div>

                {result.experimental ? (
                  <div className="flex items-start gap-2 rounded-xl border border-prov-demo/40 demo-stripes bg-card px-4 py-3 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-prov-demo" aria-hidden />
                    <p><strong>Experimental horizon ({result.horizon} years).</strong> These values extrapolate beyond the one-year design horizon and are not validated.</p>
                  </div>
                ) : null}

                <Panel
                  title={`Predicted retreat per segment · ${result.horizon} year${result.horizon > 1 ? "s" : ""}`}
                  subtitle="Bars show the predicted retreat; whiskers show the uncertainty interval. Negative = seaward advance."
                  badges={<><ProvenanceBadge kind="prediction" /><ProvenanceBadge kind="demo" /></>}
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} onClick={(e) => { const id = e?.activeLabel; if (id) setDetailsId(String(id)); }}>
                        <CartesianGrid {...GRID} />
                        <XAxis dataKey="segmentId" {...AXIS} tickFormatter={(v: string) => v.replace("HMB-", "")} />
                        <YAxis {...AXIS} unit=" m" width={56} />
                        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                        <Tooltip cursor={{ fill: "var(--muted)" }} content={<RetreatTooltip />} />
                        <Bar dataKey="retreat" name="Predicted retreat" radius={[3, 3, 3, 3]} className="cursor-pointer" isAnimationActive={false}>
                          {rows.map((r) => (
                            <Cell key={r.segmentId} fill={RISK_META[r.risk].colorVar} />
                          ))}
                          <ErrorBar dataKey="err" width={4} strokeWidth={1.5} stroke="var(--foreground)" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {RISK_LEVELS.map((r) => (
                      <LegendItem key={r} swatch={<span className="size-2.5 rounded-sm" style={{ background: RISK_META[r].colorVar }} />}>{RISK_META[r].label}</LegendItem>
                    ))}
                    <span className="text-xs text-muted-foreground">· Click a bar for segment details</span>
                  </div>
                </Panel>

                <Panel title="Predicted shoreline position" subtitle="Dashed turquoise line: predicted shoreline. Segments coloured by predicted risk." badges={<><ProvenanceBadge kind="prediction" /><ProvenanceBadge kind="demo" /></>} bodyClassName="p-0">
                  <div className="h-[440px] overflow-hidden rounded-b-xl">
                    <CoastalMapLazy
                      key={`${result.runId}`}
                      segments={mapSegments}
                      onOpenDetails={setDetailsId}
                      {...(predictedShorelines ? { predictedShorelines } : {})}
                      predictedLabel={`Predicted shoreline (+${result.horizon} yr)`}
                    />
                  </div>
                </Panel>

                <Panel title="Segment results" badges={<><ProvenanceBadge kind="historical" /><ProvenanceBadge kind="prediction" /><ProvenanceBadge kind="demo" /></>} bodyClassName="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-5">Segment</TableHead>
                          <TableHead className="text-right">Historical rate</TableHead>
                          <TableHead className="text-right">Predicted retreat</TableHead>
                          <TableHead className="text-right">Interval</TableHead>
                          <TableHead className="text-right">Per year</TableHead>
                          <TableHead className="pr-5">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.segmentId} className="cursor-pointer" onClick={() => setDetailsId(r.segmentId)}>
                            <TableCell className="pl-5">
                              <span className="font-mono text-xs text-muted-foreground">{r.segmentId}</span>
                              <span className="block font-medium">{r.segment?.name}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular">{r.segment ? formatRate(r.segment.historicalRate) : "—"}</TableCell>
                            <TableCell className="text-right font-mono font-medium tabular">{formatRetreat(r.retreat)}</TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground tabular">{r.lower.toFixed(2)} – {r.upper.toFixed(2)} m</TableCell>
                            <TableCell className="text-right font-mono tabular">{r.annualRetreat.toFixed(2)} m</TableCell>
                            <TableCell className="pr-5"><RiskBadge risk={r.risk} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Panel>
              </>
            ) : (
              <Panel title="Results">
                <EmptyState icon={mutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />} title={mutation.isPending ? "Running demonstration calculation…" : "No prediction run yet"}>
                  Adjust the inputs and press Run Prediction.
                </EmptyState>
              </Panel>
            )}
          </div>
        </div>

        <div className="mt-12" id="model-performance">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-primary">Model evaluation</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">Model performance</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Random Forest and XGBoost regressors, evaluated on held-out segments. Scores are only shown once a real training run reports them.</p>
            </div>
          </div>
          <ModelPerformanceSection perf={perf} />
        </div>
      </PageBody>
      <SegmentDetailsSheet segment={detailsId ? (segById.get(detailsId) ?? null) : null} {...(sheetPrediction ? { prediction: sheetPrediction } : {})} onClose={() => setDetailsId(null)} />
    </>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-lg font-semibold tabular">{value}</p>
      {note ? <p className="font-mono text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function ModelOption({ id, name, note, badge, active, disabled, onPick }: { id: string; name: string; note: string; badge: React.ReactNode; active: boolean; disabled?: boolean; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(id)}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
        active ? "border-primary ring-1 ring-primary" : "hover:bg-muted",
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{name}</span>
        <span className="block truncate font-mono text-[10px] text-muted-foreground">{note}</span>
      </span>
      {badge}
    </button>
  );
}

function RetreatTooltip({ active, payload }: { active?: boolean; payload?: { payload?: { segmentId: string; retreat: number; lower: number; upper: number; risk: RiskLevel; segment?: { name: string } } }[] }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-elevated">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.segmentId}</p>
      <p className="font-medium">{p.segment?.name}</p>
      <p className="mt-1 font-mono">{formatRetreat(p.retreat)} <span className="text-muted-foreground">({p.lower.toFixed(2)} – {p.upper.toFixed(2)})</span></p>
      <p className="mt-0.5">{RISK_META[p.risk].label} risk</p>
    </div>
  );
}
