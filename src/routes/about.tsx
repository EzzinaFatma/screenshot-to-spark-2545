import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Database, Layers, LineChart, Satellite, ShieldAlert } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { ProvenanceBadge } from "@/components/data/ProvenanceBadge";
import { RiskBadge } from "@/components/data/RiskBadge";
import { Button } from "@/components/ui/button";
import type { Provenance } from "@/lib/api/types";
import { HORIZONS } from "@/lib/prediction/horizons";
import { PROVENANCE_META } from "@/lib/provenance";
import { RISK_LEVELS, RISK_META } from "@/lib/risk";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CoastGuard AI — Method & Data Integrity" },
      { name: "description", content: "Why CoastGuard AI monitors Hammamet Bay, how the erosion model works, and how every value is labelled as historical, satellite, AI prediction or demo data." },
      { property: "og:title", content: "About CoastGuard AI — Method & Data Integrity" },
      { property: "og:description", content: "The project, the machine-learning method and the data labelling policy behind CoastGuard AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const PROVENANCE_ORDER: Provenance[] = ["historical", "satellite", "prediction", "demo"];

const PROVENANCE_EXAMPLES: Record<Provenance, string> = {
  historical: "Reference shorelines from field surveys, archive maps and the World Bank Tunisia dataset.",
  satellite: "Shorelines and water indices extracted from Landsat and Sentinel-2 images; waves and wind from Copernicus and ERA5.",
  prediction: "Future shoreline positions estimated by the model, always shown with an uncertainty range.",
  demo: "Simulated values with the right structure but no scientific meaning. Shown with a striped badge.",
};

const PIPELINE = [
  { icon: Satellite, title: "Collect", text: "Satellite shorelines, wave, wind and sea level data for each 1.6 km segment of the bay." },
  { icon: Layers, title: "Prepare", text: "Monthly series are averaged per year and joined with the previous year's shoreline change." },
  { icon: BrainCircuit, title: "Train", text: "Random Forest and XGBoost models learn how conditions in one year relate to retreat the next year." },
  { icon: LineChart, title: "Predict", text: "The model estimates next year's retreat per segment with an uncertainty range." },
  { icon: ShieldAlert, title: "Classify", text: "Each segment receives a risk level from its expected retreat per year." },
];

function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About the project"
        title="Watching Hammamet Bay's shoreline, honestly"
        description="CoastGuard AI combines satellite observation, shoreline history and machine learning to show where the coast is retreating and where it may retreat next, while making clear what is measured, what is predicted and what is simulated."
        actions={
          <Button asChild variant="secondary">
            <Link to="/map">Open the coastal map</Link>
          </Button>
        }
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Why Hammamet Bay" className="lg:col-span-2">
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Hammamet Bay, on Tunisia's north-east coast, is one of the country's busiest tourist shores. Hotels, roads and marinas built
                close to the beach have reduced the sand supply, while winter storms from the east keep pulling sand offshore. Several stretches
                have lost metres of beach since 2000.
              </p>
              <p>
                The pilot covers about 25 km of coast from El Mrezga to Yasmine Hammamet, divided into 16 segments. For each one CoastGuard AI
                tracks past shoreline positions, the sea and weather conditions acting on it, and a one-year-ahead estimate of retreat.
              </p>
              <p>The goal is a simple, transparent tool that helps planners decide where protection, dune restoration or closer monitoring is needed first.</p>
            </div>
          </Panel>
          <Panel title="Pilot at a glance">
            <dl className="grid grid-cols-2 gap-4">
              {[
                ["16", "coastal segments"],
                ["≈ 25.6 km", "of shoreline"],
                ["2000–2020", "shoreline history"],
                ["1 year", "prediction horizon"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-mono text-xl font-semibold tabular">{v}</dt>
                  <dd className="text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <section className="mt-10">
          <p className="eyebrow text-primary">Data integrity</p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Every value carries a label</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Measured and predicted values are never mixed without saying so. Each number, chart and map layer shows one or more of these four badges.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROVENANCE_ORDER.map((k) => (
              <article key={k} className="rounded-xl border bg-card p-5 shadow-card">
                <ProvenanceBadge kind={k} />
                <p className="mt-3 text-sm font-medium">{PROVENANCE_META[k].description}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{PROVENANCE_EXAMPLES[k]}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <p className="eyebrow text-primary">Method</p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">From satellite images to a risk level</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-5">
            {PIPELINE.map((s, i) => (
              <li key={s.title} className="relative rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <s.icon className="size-5 text-primary" aria-hidden />
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <p className="mt-3 font-display text-sm font-semibold">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
                {i < PIPELINE.length - 1 ? (
                  <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground md:block" aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Risk levels" subtitle="Based on expected shoreline retreat per year">
            <ul className="divide-y">
              {RISK_LEVELS.map((r) => (
                <li key={r} className="flex items-center justify-between gap-3 py-2.5">
                  <RiskBadge risk={r} />
                  <span className="font-mono text-xs text-muted-foreground">{RISK_META[r].range}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Prediction horizons" subtitle="How far ahead the model can be trusted">
            <ul className="divide-y">
              {HORIZONS.map((h) => (
                <li key={h.years} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{h.label}</span>
                  <span className={h.experimental ? "text-xs text-risk-high" : "text-xs text-muted-foreground"}>{h.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              The model is built for one year ahead. Three- and five-year results are shown only as experiments, with wider uncertainty and a warning.
            </p>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Current status" badges={<ProvenanceBadge kind="demo" />}>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>• All figures come from a seeded, simulated dataset that mimics the real data structure.</li>
              <li>• Segment outlines follow the real bay, traced approximately from satellite imagery.</li>
              <li>• Predictions use a transparent demo calculation until the Random Forest and XGBoost models are trained.</li>
              <li>• No result shown here should be used for planning decisions yet.</li>
            </ul>
          </Panel>
          <Panel title="Next steps">
            <ul className="space-y-2 text-sm leading-relaxed">
              <li className="flex gap-2"><Database className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Connect Copernicus, ERA5 and Sentinel-2 / Landsat data for the bay.</li>
              <li className="flex gap-2"><BrainCircuit className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Train and validate both models on 2000–2020 shorelines, then publish their accuracy.</li>
              <li className="flex gap-2"><Satellite className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Add new satellite shorelines automatically as images arrive.</li>
            </ul>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
