import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CalendarClock, Ruler, TrendingDown } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { ProvenanceBadge } from "@/components/data/ProvenanceBadge";
import { RiskBadge } from "@/components/data/RiskBadge";
import { CoastalMapLazy } from "@/components/map/CoastalMapLazy";
import { CoastlineLocator } from "@/components/map/CoastlineLocator";
import { Button } from "@/components/ui/button";
import { SegmentDetailsSheet } from "@/components/segment/SegmentDetailsSheet";
import { useState } from "react";
import { segmentsQuery } from "@/lib/api/queries";
import { formatDate, formatRate, formatRetreat } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoastGuard AI — Hammamet Bay Coastal Erosion Overview" },
      { name: "description", content: "Monitoring overview of shoreline erosion hotspots along Hammamet Bay, Tunisia (demo data)." },
      { property: "og:title", content: "CoastGuard AI — Hammamet Bay Overview" },
      { property: "og:description", content: "Coastal erosion monitoring indicators and hotspots for Hammamet Bay, Tunisia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(segmentsQuery),
  component: Overview,
});

function Overview() {
  const { data } = useSuspenseQuery(segmentsQuery);
  const segs = data.segments;
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const total = segs.reduce((a, s) => a + s.lengthKm, 0);
  const meanRate = segs.reduce((a, s) => a + s.historicalRate, 0) / segs.length;
  const critical = segs.filter((s) => s.risk === "critical").length;
  const meanPred = segs.reduce((a, s) => a + s.predictedRetreat1y, 0) / segs.length;
  const last = segs.map((s) => s.lastObservation).sort().at(-1) ?? "";
  const kpis = [
    { icon: Ruler, value: total.toFixed(1), unit: "km", label: "Coastline monitored", note: "16 segments, traced geometry" },
    { icon: TrendingDown, value: formatRate(meanRate), unit: "", label: "Mean historical rate", note: "End-point rate 2000–2020" },
    { icon: AlertTriangle, value: String(critical), unit: "", label: "Critical hotspots", note: "Segments ≥ 2 m/yr retreat" },
    { icon: Activity, value: meanPred.toFixed(2), unit: "m", label: "Predicted retreat (1 yr)", note: "Bay average, demo model" },
    { icon: CalendarClock, value: formatDate(last), unit: "", label: "Last satellite observation", note: "Sentinel-2 style scene" },
  ];
  const hotspots = [...segs].sort((a, b) => b.predictedRetreat1y - a.predictedRetreat1y).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Hammamet Bay · Tunisia · 36.40°N 10.61°E"
        title={<>Coastal erosion intelligence for <span className="text-ocean-gradient">Hammamet Bay</span></>}
        description="Satellite imagery, shoreline history and machine learning to locate erosion hotspots and anticipate shoreline retreat."
        actions={
          <>
            <Button asChild><Link to="/map">Open coastal map</Link></Button>
            <Button asChild variant="secondary"><Link to="/predictions">AI Prediction Center</Link></Button>
          </>
        }
      >
        <div className="mt-8 hidden max-w-xl lg:block">
          <CoastlineLocator segments={segs} tone="dark" showLabels />
        </div>
      </PageHeader>
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="animate-rise rounded-xl border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <k.icon className="size-5 text-primary" aria-hidden />
                <ProvenanceBadge kind="demo" />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold tabular">{k.value} <span className="text-sm text-muted-foreground">{k.unit}</span></p>
              <p className="text-sm font-medium">{k.label}</p>
              <p className="text-xs text-muted-foreground">{k.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel title="Erosion risk map" subtitle="Click a segment for details" className="lg:col-span-2" bodyClassName="p-0">
            <div className="h-[420px] overflow-hidden rounded-b-xl">
              <CoastalMapLazy segments={segs} compact onOpenDetails={setDetailsId} />
            </div>
          </Panel>
          <Panel title="Top erosion hotspots" badges={<><ProvenanceBadge kind="prediction" /><ProvenanceBadge kind="demo" /></>}>
            <ul className="divide-y">
              {hotspots.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setDetailsId(s.id)} className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-2.5 text-left text-sm transition-colors hover:bg-muted">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{s.id} · {formatRetreat(s.predictedRetreat1y)} / yr</p>
                    </div>
                    <RiskBadge risk={s.risk} />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/map" as const, title: "Coastal Map", text: "Satellite basemap, risk segments, historical and predicted shorelines." },
            { to: "/analytics" as const, title: "Historical Analysis", text: "Shoreline evolution 2000–2020, annual rates and hotspot detection." },
            { to: "/predictions" as const, title: "AI Prediction Center", text: "Run one-year-ahead retreat scenarios and review model performance." },
            { to: "/data-sources" as const, title: "Environmental Data", text: "Waves, wind, sea level and water indices with their data sources." },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="group rounded-xl border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated">
              <p className="font-display text-sm font-semibold">{c.title} <span className="inline-block text-primary transition-transform group-hover:translate-x-0.5">→</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{c.text}</p>
            </Link>
          ))}
        </div>
      </PageBody>
      <SegmentDetailsSheet segment={segs.find((s) => s.id === detailsId) ?? null} onClose={() => setDetailsId(null)} />
    </>
  );
}
