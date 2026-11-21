import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, Panel } from "@/components/layout/Panel";
import { ProvenanceRow } from "@/components/data/ProvenanceBadge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CoastGuard AI — CoastGuard AI" },
      { name: "description", content: "Project concept, methodology and data integrity policy." },
      { property: "og:title", content: "About CoastGuard AI — CoastGuard AI" },
      { property: "og:description", content: "Project concept, methodology and data integrity policy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="CoastGuard AI" title="About CoastGuard AI" description="Project concept, methodology and data integrity policy." />
      <PageBody>
        <Panel title="About CoastGuard AI" badges={<ProvenanceRow kinds={["demo"]} />}>
          <div id="data-integrity">
            <EmptyState title="This section is being built">
              All values in CoastGuard AI are simulated demonstration data until the real Hammamet dataset and trained model are connected.
            </EmptyState>
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
