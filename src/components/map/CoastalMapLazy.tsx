import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Satellite } from "lucide-react";
import type { CoastalMapProps } from "./map-types";

const CoastalMap = lazy(() => import("./CoastalMap"));

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-navy-deep text-navy-muted">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em]">
        <Satellite className="size-4 animate-scan text-turquoise" /> Loading coastal map…
      </div>
    </div>
  );
}

/** SSR-safe entry for the Leaflet map. Isolated so Leaflet's z-indexes stay inside. */
export function CoastalMapLazy(props: CoastalMapProps) {
  return (
    <div className="isolate h-full w-full">
      <ClientOnly fallback={<MapSkeleton />}>
        <Suspense fallback={<MapSkeleton />}>
          <CoastalMap {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
