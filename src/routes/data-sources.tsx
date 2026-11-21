import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Panel } from "@/components/layout/Panel";
import { ProvenanceRow } from "@/components/data/ProvenanceBadge";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: "Environmental Data & Sources — CoastGuard AI" },
      { name: "description", content: "Waves, wind, sea level and satellite water indices with their data sources." },
      { property: "og:title", content: "Environmental Data & Sources — CoastGuard AI" },
      { property: "og:description", content: "Waves, wind, sea level and satellite water indices with their data sources." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataSourcesPage,
});

function DataSourcesPage() {
  return (
    <>
      <PageHeader eyebrow="CoastGuard AI" title="Environmental Data & Sources" description="Waves, wind, sea level and satellite water indices with their data sources." />
      <PageBody>
        <Panel title="Environmental Data & Sources" badges={<ProvenanceRow kinds={["demo"]} />}>
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
