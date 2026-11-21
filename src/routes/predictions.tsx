import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Panel } from "@/components/layout/Panel";
import { ProvenanceRow } from "@/components/data/ProvenanceBadge";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "AI Prediction Center — CoastGuard AI" },
      { name: "description", content: "One-year-ahead shoreline retreat predictions per segment (demo model)." },
      { property: "og:title", content: "AI Prediction Center — CoastGuard AI" },
      { property: "og:description", content: "One-year-ahead shoreline retreat predictions per segment (demo model)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PredictionsPage,
});

function PredictionsPage() {
  return (
    <>
      <PageHeader eyebrow="CoastGuard AI" title="AI Prediction Center" description="One-year-ahead shoreline retreat predictions per segment (demo model)." />
      <PageBody>
        <Panel title="AI Prediction Center" badges={<ProvenanceRow kinds={["demo"]} />}>
          <div>
            <EmptyState title="This section is being built">
              All values in CoastGuard AI are simulated demonstration data until the real Hammamet dataset and trained model are connected.
            </EmptyState>
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
