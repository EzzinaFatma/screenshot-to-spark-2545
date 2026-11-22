import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { BrainCircuit, Hourglass } from "lucide-react";
import { EmptyState, Panel } from "@/components/layout/Panel";
import { ProvenanceBadge } from "@/components/data/ProvenanceBadge";
import { AXIS, GRID, TooltipCard } from "@/components/charts/chart-kit";
import type { ModelEntry, ModelPerformanceResponse, ModelStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ModelStatus, string> = {
  awaiting_training: "Awaiting model training",
  training: "Training in progress",
  trained: "Trained",
};

export function ModelStatusBadge({ status }: { status: ModelStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
        status === "trained" ? "border-risk-low/40 bg-risk-low/10 text-foreground" : "border-dashed border-muted-foreground/40 text-muted-foreground",
      )}
    >
      <Hourglass className="size-3" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

function Metric({ label, hint, value }: { label: string; hint: string; value: string | null }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      <p className={cn("mt-1 font-mono text-xl tabular", value ? "font-semibold" : "text-muted-foreground")}>{value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground">{value ? hint : "Awaiting model training"}</p>
    </div>
  );
}

function ModelCard({ model }: { model: ModelEntry }) {
  const m = model.metrics;
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <BrainCircuit className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-display font-semibold">{model.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{model.library}</p>
          </div>
        </div>
        <ModelStatusBadge status={model.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="MAE" hint="metres" value={m ? `${m.mae.toFixed(2)} m` : null} />
        <Metric label="RMSE" hint="metres" value={m ? `${m.rmse.toFixed(2)} m` : null} />
        <Metric label="R²" hint="coefficient" value={m ? m.r2.toFixed(3) : null} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{model.trainedAt ? `Trained ${model.trainedAt}` : "No training run recorded. Scores appear here once the backend reports them."}</p>
    </div>
  );
}

/** Model evaluation block. Shows real metrics only when the backend reports a trained model. */
export function ModelPerformanceSection({ perf }: { perf: ModelPerformanceResponse }) {
  const trained = perf.models.filter((m) => m.status === "trained");
  const avp = trained.flatMap((m) => (m.actualVsPredicted ?? []).map((p) => ({ ...p, model: m.name })));
  const fi = trained.find((m) => m.featureImportance?.length)?.featureImportance ?? [];
  const max = Math.max(1, ...avp.flatMap((p) => [p.actual, p.predicted]));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {perf.models.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Actual vs predicted shoreline retreat" subtitle="Held-out validation segments" badges={<ProvenanceBadge kind="prediction" />}>
          {avp.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: -8 }}>
                  <CartesianGrid {...GRID} vertical />
                  <XAxis type="number" dataKey="actual" name="Actual" unit=" m" domain={[0, max]} {...AXIS} />
                  <YAxis type="number" dataKey="predicted" name="Predicted" unit=" m" domain={[0, max]} {...AXIS} width={56} />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: max, y: max }]} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <Tooltip content={<TooltipCard unit="m" />} />
                  <Scatter data={avp} fill="var(--prov-prediction)" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<Hourglass className="size-5" />} title="Awaiting model training">
              The scatter of actual vs predicted retreat appears once Random Forest or XGBoost has been trained and validated on
              the Hammamet dataset. No scores are invented in the meantime.
            </EmptyState>
          )}
        </Panel>
        <Panel title="Feature importance" subtitle="Contribution of each input to the prediction" badges={<ProvenanceBadge kind="prediction" />}>
          {fi.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fi} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 24 }}>
                  <CartesianGrid {...GRID} horizontal={false} vertical />
                  <XAxis type="number" {...AXIS} />
                  <YAxis type="category" dataKey="feature" {...AXIS} width={140} />
                  <Tooltip content={<TooltipCard digits={3} />} />
                  <Bar dataKey="importance" name="Importance" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<Hourglass className="size-5" />} title="Awaiting model training">
              <span className="mb-2 block">Features the models will be trained on:</span>
              <span className="flex flex-wrap justify-center gap-1">
                {perf.features.map((f) => (
                  <span key={f} className="rounded-full border bg-card px-2 py-0.5 text-[11px] text-foreground">{f}</span>
                ))}
              </span>
            </EmptyState>
          )}
        </Panel>
      </div>
      <dl className="grid gap-3 rounded-xl border bg-card p-4 text-sm shadow-card sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Target variable</dt><dd className="font-medium">{perf.target}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Training dataset</dt><dd className="font-medium">{perf.trainingDataset ?? "Not yet connected"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Validation</dt><dd className="font-medium">{perf.validation}</dd></div>
      </dl>
    </div>
  );
}
