import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Compass, Droplets, ExternalLink, Waves, Wind } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { ProvenanceBadge, ProvenanceRow } from "@/components/data/ProvenanceBadge";
import { AXIS, GRID, LegendItem, LineSwatch, TooltipCard } from "@/components/charts/chart-kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allEnvironmentQuery, segmentsQuery } from "@/lib/api/queries";
import type { Provenance } from "@/lib/api/types";
import { directionRose, meanSeries, seriesMean, trendPerYear } from "@/lib/analytics";
import { formatMonth, signed } from "@/lib/format";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: "Environmental Data & Sources — CoastGuard AI" },
      { name: "description", content: "Wave height, wave direction, wind, sea level anomaly and NDWI/MNDWI water indices for Hammamet Bay, with the data sources behind them." },
      { property: "og:title", content: "Environmental Data & Sources — CoastGuard AI" },
      { property: "og:description", content: "Waves, wind, sea level and satellite water indices for Hammamet Bay, and where each dataset comes from." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(segmentsQuery), context.queryClient.ensureQueryData(allEnvironmentQuery)]),
  component: DataSourcesPage,
});

const BAY = "bay";

interface Source {
  name: string;
  provider: string;
  variables: string[];
  resolution: string;
  coverage: string;
  provenance: Provenance;
  status: "Simulated in demo" | "Planned connection";
  url?: string;
}

const SOURCES: Source[] = [
  {
    name: "Copernicus Marine Service",
    provider: "Mercator Ocean International · EU Copernicus",
    variables: ["Significant wave height", "Wave period & direction", "Sea level anomaly"],
    resolution: "≈ 4 km (Mediterranean), hourly → monthly means",
    coverage: "1993 – present",
    provenance: "satellite",
    status: "Simulated in demo",
    url: "https://marine.copernicus.eu",
  },
  {
    name: "ERA5 reanalysis",
    provider: "ECMWF · Copernicus Climate Change Service",
    variables: ["10 m wind speed", "Wind direction", "Mean sea level pressure"],
    resolution: "0.25° (≈ 28 km), hourly",
    coverage: "1940 – present",
    provenance: "satellite",
    status: "Simulated in demo",
    url: "https://cds.climate.copernicus.eu",
  },
  {
    name: "Sentinel-2 MSI",
    provider: "ESA · Copernicus Data Space Ecosystem",
    variables: ["NDWI", "MNDWI", "Shoreline extraction"],
    resolution: "10 – 20 m, ≈ 5-day revisit",
    coverage: "2015 – present",
    provenance: "satellite",
    status: "Simulated in demo",
    url: "https://dataspace.copernicus.eu",
  },
  {
    name: "Landsat 5 / 7 / 8 / 9",
    provider: "USGS · NASA",
    variables: ["Historical shorelines", "NDWI", "MNDWI"],
    resolution: "30 m, 16-day revisit",
    coverage: "1984 – present",
    provenance: "satellite",
    status: "Simulated in demo",
    url: "https://earthexplorer.usgs.gov",
  },
  {
    name: "Tunisia shoreline dataset",
    provider: "World Bank · coastal erosion studies",
    variables: ["Reference shorelines", "Shoreline change rates"],
    resolution: "Transect-based",
    coverage: "Selected reference years",
    provenance: "historical",
    status: "Planned connection",
  },
];

function DataSourcesPage() {
  const { data } = useSuspenseQuery(segmentsQuery);
  const { data: envs } = useSuspenseQuery(allEnvironmentQuery);
  const [selected, setSelected] = useState(BAY);

  const series = useMemo(
    () => (selected === BAY ? meanSeries(envs) : envs.find((e) => e.segmentId === selected)?.series ?? []),
    [envs, selected],
  );
  const rose = useMemo(() => directionRose(series), [series]);
  const label = selected === BAY ? "Bay average (16 segments)" : `${selected} · ${data.segments.find((s) => s.id === selected)?.name ?? ""}`;
  const [m0, m1] = data.meta.environmentPeriod;

  const maxWave = series.reduce((a, s) => Math.max(a, s.waveHeight), 0);
  const slaTrend = trendPerYear(series.map((s) => s.seaLevelAnomaly));
  const dominant = [...rose].sort((a, b) => b.share - a.share)[0];

  const indicators = [
    { icon: Waves, label: "Mean wave height", value: `${seriesMean(series, "waveHeight").toFixed(2)} m`, note: `Peak monthly mean ${maxWave.toFixed(2)} m` },
    { icon: Compass, label: "Dominant wave direction", value: dominant?.sector ?? "—", note: `${Math.round(seriesMean(series, "waveDirection"))}° mean · ${dominant?.share ?? 0}% of months` },
    { icon: Wind, label: "Mean wind speed", value: `${seriesMean(series, "windSpeed").toFixed(1)} m/s`, note: "10 m above sea level" },
    { icon: Droplets, label: "Sea level anomaly trend", value: `${signed(slaTrend, 1)} cm/yr`, note: `${formatMonth(m0)} – ${formatMonth(m1)}` },
  ];

  const chartData = series.map((s) => ({ ...s, label: formatMonth(s.month), slaCm: s.seaLevelAnomaly }));

  return (
    <>
      <PageHeader
        eyebrow={`Environmental drivers · ${formatMonth(m0)} – ${formatMonth(m1)}`}
        title="Environmental Data & Sources"
        description="The sea and weather conditions that push and pull the shoreline, and the satellite and model datasets they come from."
        actions={<ProvenanceRow kinds={["satellite", "demo"]} tone="dark" />}
      />
      <PageBody>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-card">
          <div>
            <p className="text-sm font-medium">Showing: {label}</p>
            <p className="text-xs text-muted-foreground">Monthly means. Pick one segment to see its local exposure.</p>
          </div>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-64" aria-label="Area">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BAY}>Bay average (all segments)</SelectItem>
              {data.segments.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.id} · {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((k) => (
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

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Waves" subtitle="Significant wave height and mean period" badges={<Badges source="Copernicus Marine" />}>
            <ChartBox>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} interval={5} />
                <YAxis yAxisId="h" {...AXIS} unit=" m" width={52} />
                <YAxis yAxisId="p" orientation="right" {...AXIS} unit=" s" width={44} />
                <Tooltip content={<TooltipCard />} />
                <Line yAxisId="h" dataKey="waveHeight" name="Wave height (m)" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="p" dataKey="wavePeriod" name="Wave period (s)" stroke="var(--chart-3)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartBox>
            <div className="mt-2 flex gap-4">
              <LegendItem swatch={<LineSwatch color="var(--chart-1)" />}>Wave height</LegendItem>
              <LegendItem swatch={<LineSwatch color="var(--chart-3)" dashed />}>Wave period</LegendItem>
            </div>
          </Panel>
          <Panel title="Wave direction" subtitle="Share of months by direction waves come from" badges={<Badges source="Copernicus Marine" />}>
            <ChartBox>
              <RadarChart data={rose} outerRadius="75%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="sector" fontSize={11} />
                <Tooltip content={<TooltipCard unit="%" digits={1} />} />
                <Radar dataKey="share" name="Months" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.35} isAnimationActive={false} />
              </RadarChart>
            </ChartBox>
          </Panel>

          <Panel title="Wind" subtitle="Mean 10 m wind speed" badges={<Badges source="ERA5" />}>
            <ChartBox>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} interval={8} />
                <YAxis {...AXIS} width={44} />
                <Tooltip content={<TooltipCard unit="m/s" digits={1} />} />
                <Area dataKey="windSpeed" name="Wind speed" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ChartBox>
          </Panel>
          <Panel title="Sea level anomaly" subtitle="Difference from the long-term mean, cm" badges={<Badges source="Copernicus Marine" />}>
            <ChartBox>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} interval={8} />
                <YAxis {...AXIS} width={44} />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                <Tooltip cursor={{ fill: "var(--muted)" }} content={<TooltipCard unit="cm" digits={1} />} />
                <Bar dataKey="slaCm" name="Sea level anomaly" isAnimationActive={false}>
                  {chartData.map((d) => (
                    <Cell key={d.month} fill={d.slaCm >= 0 ? "var(--chart-1)" : "var(--chart-5)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartBox>
          </Panel>
          <Panel title="Water indices" subtitle="NDWI and MNDWI near the shoreline" badges={<Badges source="Sentinel-2 / Landsat" />}>
            <ChartBox>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} interval={8} />
                <YAxis {...AXIS} width={44} domain={["auto", "auto"]} />
                <Tooltip content={<TooltipCard digits={3} />} />
                <Line dataKey="ndwi" name="NDWI" stroke="var(--chart-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="mndwi" name="MNDWI" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ChartBox>
            <div className="mt-2 flex gap-4">
              <LegendItem swatch={<LineSwatch color="var(--chart-2)" />}>NDWI</LegendItem>
              <LegendItem swatch={<LineSwatch color="var(--chart-1)" />}>MNDWI</LegendItem>
            </div>
          </Panel>
        </div>

        <div className="mt-10">
          <p className="eyebrow text-primary">Data catalogue</p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">Where the data comes from</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            These are the datasets CoastGuard AI is designed to use. In this demo every value is simulated with the same structure, so the
            pages work today and switch to real data once the sources are connected.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SOURCES.map((s) => (
              <article key={s.name} className="flex flex-col rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-[15px] font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.provider}</p>
                  </div>
                  <ProvenanceBadge kind={s.provenance} />
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {s.variables.map((v) => (
                    <li key={v} className="rounded-md bg-muted px-2 py-0.5 text-xs">{v}</li>
                  ))}
                </ul>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Resolution</dt>
                  <dd>{s.resolution}</dd>
                  <dt className="text-muted-foreground">Coverage</dt>
                  <dd>{s.coverage}</dd>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium">{s.status}</dd>
                </dl>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    Visit data portal <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Dataset in use:</span> {data.meta.generated}. Shoreline history {data.meta.historyPeriod[0]}–
            {data.meta.historyPeriod[1]}, environmental series {formatMonth(m0)} – {formatMonth(m1)}. {data.meta.notice}
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Badges({ source }: { source: string }) {
  return (
    <>
      <ProvenanceBadge kind="demo" />
      <span className="text-[11px] text-muted-foreground">Source: {source}</span>
    </>
  );
}

function ChartBox({ children }: { children: ReactElement }) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
