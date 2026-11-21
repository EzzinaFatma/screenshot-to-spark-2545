import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Panel } from "@/components/layout/Panel";
import { ProvenanceRow } from "@/components/data/ProvenanceBadge";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Historical Coastal Analysis — CoastGuard AI" },
      { name: "description", content: "Shoreline evolution and erosion/accretion rates 2000–2020 (demo data)." },
      { property: "og:title", content: "Historical Coastal Analysis — CoastGuard AI" },
      { property: "og:description", content: "Shoreline evolution and erosion/accretion rates 2000–2020 (demo data)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <>
      <PageHeader eyebrow="CoastGuard AI" title="Historical Coastal Analysis" description="Shoreline evolution and erosion/accretion rates 2000–2020 (demo data)." />
      <PageBody>
        <Panel title="Historical Coastal Analysis" badges={<ProvenanceRow kinds={["demo"]} />}>
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
