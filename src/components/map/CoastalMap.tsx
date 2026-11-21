/**
 * Leaflet map — browser only. Always load through CoastalMapLazy.
 */
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Polyline,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
} from "react-leaflet";
import { ArrowRight } from "lucide-react";
import { boundsOf, offsetLine } from "@/lib/geo";
import { formatCoord, formatDate, formatRate, formatRetreat } from "@/lib/format";
import { RISK_META, riskStrokeClass } from "@/lib/risk";
import type { CoastalSegment } from "@/lib/api/types";
import type { CoastalMapProps } from "./map-types";

const BAY_CENTER: [number, number] = [36.385, 10.605];

function FocusController({
  segments,
  focusRequest,
  refs,
}: {
  segments: CoastalSegment[];
  focusRequest: CoastalMapProps["focusRequest"];
  refs: React.RefObject<Record<string, L.Polyline | null>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusRequest) return;
    const seg = segments.find((s) => s.id === focusRequest.id);
    if (!seg) return;
    map.flyToBounds(L.latLngBounds(boundsOf(seg.coordinates)), { maxZoom: 15, padding: [60, 60], duration: 0.9 });
    const t = setTimeout(() => refs.current?.[seg.id]?.openPopup(L.latLng(seg.centroid[0], seg.centroid[1])), 950);
    return () => clearTimeout(t);
  }, [focusRequest, segments, map, refs]);
  return null;
}

function SegmentPopup({ s, onOpenDetails }: { s: CoastalSegment; onOpenDetails?: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-lg font-sans text-foreground">
      <div className="bg-navy px-4 py-3 text-navy-foreground">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] tracking-wider text-turquoise">{s.id}</span>
          <span className="rounded-full border border-prov-demo/70 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-risk-moderate">
            Demo data
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold">{s.name}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 text-xs">
        <div className="col-span-2">
          <dt className="text-muted-foreground">Coordinates</dt>
          <dd className="font-mono">{formatCoord(s.centroid)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Historical rate</dt>
          <dd className="font-mono font-medium">{formatRate(s.historicalRate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Predicted (1 yr)</dt>
          <dd className="font-mono font-medium">
            {formatRetreat(s.predictedRetreat1y)} <span className="text-muted-foreground">±{s.uncertainty1y}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Risk</dt>
          <dd className="flex items-center gap-1.5 font-medium">
            <svg width="10" height="10" aria-hidden>
              <line x1="0" y1="5" x2="10" y2="5" strokeWidth="6" className={riskStrokeClass(s.risk)} />
            </svg>
            {RISK_META[s.risk].label}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last observation</dt>
          <dd className="font-medium">{formatDate(s.lastObservation)}</dd>
        </div>
      </dl>
      {onOpenDetails ? (
        <button
          type="button"
          onClick={() => onOpenDetails(s.id)}
          className="flex w-full items-center justify-between border-t bg-muted px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
        >
          Open segment details <ArrowRight className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export default function CoastalMap({
  segments,
  selectedId,
  focusRequest,
  onSelect,
  onOpenDetails,
  exaggeration = 1,
  predictedShorelines,
  compact,
  className,
}: CoastalMapProps) {
  const refs = useRef<Record<string, L.Polyline | null>>({});
  const historical = useMemo(
    () =>
      segments.map((s) => ({
        id: s.id,
        // 2000 shoreline: undo 20 years of end-point rate (rate < 0 → old line was seaward).
        line: offsetLine(s.coordinates, -s.historicalRate * 20 * exaggeration),
      })),
    [segments, exaggeration],
  );
  const predicted = useMemo(
    () =>
      segments.map((s) => ({
        id: s.id,
        line:
          predictedShorelines?.[s.id] && exaggeration === 1
            ? predictedShorelines[s.id]!
            : offsetLine(s.coordinates, -s.predictedRetreat1y * exaggeration),
      })),
    [segments, exaggeration, predictedShorelines],
  );

  return (
    <div className={className ?? "h-full w-full"}>
      <MapContainer
        center={BAY_CENTER}
        zoom={compact ? 11 : 12}
        scrollWheelZoom={!compact}
        className="h-full w-full"
        zoomControl
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite imagery">
            <TileLayer
              attribution="Imagery © Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street map (OpenStreetMap)">
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Historical shoreline (2000)">
            <LayerGroup>
              {historical.map((h) => (
                <Polyline key={h.id} positions={h.line} pathOptions={{ weight: 2, className: "shore-historical", interactive: false }} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked={!compact} name="Predicted shoreline (+1 yr)">
            <LayerGroup>
              {predicted.map((p) => (
                <Polyline key={p.id} positions={p.line} pathOptions={{ weight: 2.5, className: "shore-predicted", interactive: false }} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Erosion risk segments">
            <LayerGroup>
              {segments.map((s) => (
                <Polyline
                  key={`halo-${s.id}`}
                  positions={s.coordinates}
                  pathOptions={{ weight: s.id === selectedId ? 13 : 9, className: "seg-halo", opacity: 0.55, interactive: false }}
                />
              ))}
              {segments.map((s) => (
                <Polyline
                  key={s.id}
                  ref={(r) => {
                    refs.current[s.id] = r;
                  }}
                  positions={s.coordinates}
                  pathOptions={{
                    weight: s.id === selectedId ? 8 : 5,
                    opacity: 1,
                    lineCap: "round",
                    className: riskStrokeClass(s.risk),
                  }}
                  eventHandlers={{ click: () => onSelect?.(s.id) }}
                >
                  <Popup closeButton={false} autoPanPadding={[40, 40]}>
                    <SegmentPopup s={s} {...(onOpenDetails ? { onOpenDetails } : {})} />
                  </Popup>
                </Polyline>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <ScaleControl position="bottomleft" imperial={false} />
        <FocusController segments={segments} focusRequest={focusRequest} refs={refs} />
      </MapContainer>
    </div>
  );
}
