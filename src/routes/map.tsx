import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CoastalMapLazy } from "@/components/map/CoastalMapLazy";
import { RiskBadge, RiskDot } from "@/components/data/RiskBadge";
import { Input } from "@/components/ui/input";
import { segmentsQuery } from "@/lib/api/queries";
import { GAZETTEER } from "@/lib/geo";
import { formatRate } from "@/lib/format";
import { RISK_LEVELS, RISK_META } from "@/lib/risk";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Coastal Map — CoastGuard AI" },
      { name: "description", content: "Interactive erosion risk map of Hammamet Bay coastal segments (demo data)." },
      { property: "og:title", content: "Coastal Map — CoastGuard AI" },
      { property: "og:description", content: "Explore erosion risk segments along Hammamet Bay, Tunisia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(segmentsQuery),
  component: MapPage,
});

function MapPage() {
  const { data } = useSuspenseQuery(segmentsQuery);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [exaggeration, setExaggeration] = useState(1);
  const term = q.trim().toLowerCase();
  const places = term ? GAZETTEER.filter((p) => p.name.toLowerCase().includes(term)) : [];
  const list = useMemo(
    () => data.segments.filter((s) => !term || `${s.id} ${s.name} ${s.zone}`.toLowerCase().includes(term)),
    [data.segments, term],
  );
  const go = (id: string) => {
    setSelected(id);
    setFocus({ id, nonce: Date.now() });
  };

  return (
    <div className="flex flex-col lg:h-[calc(100vh-6.5rem)] lg:flex-row">
      <aside className="flex w-full flex-col border-r border-navy-border bg-navy text-navy-foreground lg:w-80">
        <div className="space-y-3 border-b border-navy-border p-4">
          <p className="eyebrow text-turquoise">Search segment or place</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-navy-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="HMB-13, Medina, Yasmine…" className="border-navy-border bg-navy-deep pl-8 text-navy-foreground" />
          </div>
          {places.map((p) => (
            <button key={p.name} onClick={() => go(p.segmentId)} className="block w-full rounded-md bg-navy-soft px-3 py-2 text-left text-sm hover:bg-navy-border">
              {p.name} <span className="block text-xs text-navy-muted">{p.hint}</span>
            </button>
          ))}
          <label className="flex items-center justify-between text-xs text-navy-muted">
            Shoreline offset exaggeration
            <select value={exaggeration} onChange={(e) => setExaggeration(Number(e.target.value))} className="rounded bg-navy-deep px-2 py-1 text-navy-foreground">
              <option value={1}>×1 (true)</option>
              <option value={5}>×5</option>
              <option value={10}>×10</option>
            </select>
          </label>
        </div>
        <ul className="max-h-72 flex-1 overflow-y-auto lg:max-h-none">
          {list.map((s) => (
            <li key={s.id}>
              <button onClick={() => go(s.id)} className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-navy-soft ${selected === s.id ? "bg-navy-soft" : ""}`}>
                <span className="flex items-center gap-2"><RiskDot risk={s.risk} />{s.name}</span>
                <span className="font-mono text-xs text-navy-muted">{formatRate(s.historicalRate)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2 border-t border-navy-border p-4 text-xs">
          {RISK_LEVELS.map((r) => (
            <div key={r} title={RISK_META[r].range}><RiskBadge risk={r} className="bg-navy-deep text-navy-foreground" /></div>
          ))}
        </div>
      </aside>
      <div className="h-[70vh] flex-1 lg:h-auto">
        <CoastalMapLazy segments={data.segments} selectedId={selected} focusRequest={focus} onSelect={setSelected} exaggeration={exaggeration} />
      </div>
    </div>
  );
}
