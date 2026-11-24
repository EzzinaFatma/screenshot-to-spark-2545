# CoastGuard AI — Coastal Erosion Monitoring & Forecasting

**Study area: Hammamet Bay, Tunisia** · 16 coastline segments · shoreline history 2000–2020

CoastGuard AI is a web application for tracking shoreline change and forecasting
short-term coastal retreat. It combines a satellite-style coastline map with
per-segment erosion statistics, environmental drivers, and a prediction interface
where wave, wind, sea-level and land-cover inputs can be adjusted and the result
read back on the map.

> **Important — every value in this repository is simulated demo data.**
> The dataset was generated for demonstration purposes, not measured. No forecast
> here is a scientific result, and the machine-learning models have **not** been
> trained yet. See [Status and limitations](#status-and-limitations).

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Overview: bay-wide statistics, hotspot summary, entry points |
| `/map` | Interactive coastline map — historical (2000) and predicted shorelines over risk-coloured segments |
| `/predictions` | Prediction centre: adjust environmental inputs, choose a 1 / 3 / 5-year horizon, read per-segment retreat with uncertainty |
| `/analytics` | Trend comparison across up to 5 segments, annual-rate charts, threshold-adjusted hotspot ranking |
| `/data-sources` | Environmental indicators (waves, direction, wind, sea-level anomaly, NDWI/MNDWI) and the source catalogue |
| `/about` | Method, provenance categories, risk thresholds, horizon reliability |

## Data provenance

Every displayed value carries a provenance badge, so measured numbers and
simulated ones never look alike:

- **historical** — from the historical shoreline record
- **satellite** — from the simulated satellite-derived series
- **prediction** — model output
- **demo** — simulated placeholder, not a scientific result

## Architecture

```
src/
  lib/api/types.ts      # response contracts, one per backend endpoint
  lib/api/client.ts     # switches between local demo data and a real API
  lib/api/local.ts      # reads src/data/*.json (simulated)
  lib/api/queries.ts    # TanStack Query options — the only way pages read data
  lib/prediction/       # demo heuristic + horizon reliability rules
  lib/risk.ts           # risk thresholds
  lib/analytics.ts      # circular means, bay averages, trend and hotspot helpers
  data/                 # simulated dataset (segments, history, environment, model)
  routes/               # one file per page
  components/           # map, charts, badges, layout
```

Two invariants hold the codebase together:

1. Pages read data **only** through the query options in `src/lib/api/queries.ts`.
   Swapping the demo dataset for the real backend requires no page changes.
2. Every displayed value carries a provenance badge, and measured and predicted
   values stay visually distinct.

## Running locally

Requires Node.js 20+ (or Bun).

```sh
npm install
npm run dev
```

Other scripts:

```sh
npm run build      # production build
npm run preview    # serve the build
npm run lint       # ESLint
npm run format     # Prettier
npm test           # Vitest
```

## Tests

```sh
npm test
```

Covered: risk classification boundaries, the rule that only the 1-year horizon is
a design horizon while 3- and 5-year are experimental, hotspot filtering and
ordering, and route wiring.

## Connecting a real backend

Set the environment variable and the whole app switches from the local dataset to
HTTP calls, with no UI changes:

```
VITE_COASTGUARD_API_URL=https://your-api.example.com
```

The backend must expose:

| Method | Path | Response contract |
| --- | --- | --- |
| GET | `/api/coastline/segments` | `SegmentsResponse` |
| GET | `/api/coastline/history/{segment_id}` | `SegmentHistory` |
| GET | `/api/environment/{segment_id}` | `SegmentEnvironment` |
| POST | `/api/predictions` | `PredictionResponse` |
| GET | `/api/model/performance` | `ModelPerformanceResponse` |

Contracts are in `src/lib/api/types.ts`. The demo dataset itself is produced by
`scripts/generate-demo-data.py` from the coastline trace in
`scripts/hammamet-coast-trace.json`.

## Model status

The prediction interface currently runs a transparent heuristic
(`src/lib/prediction/demo-model.ts`) that scales each segment's historical retreat
by simple forcing ratios. It is labelled **demo** everywhere.

Random Forest and XGBoost are listed as `awaiting_training` with `null` metrics.
No accuracy figure (MAE, RMSE, R²) is reported for them until they are actually
trained — the interface refuses to show a number that does not exist.

## Status and limitations

- Coastline geometry was traced approximately from satellite imagery, not
  extracted from a survey or an authoritative vector source.
- Shoreline positions, rates, environmental series and uncertainties are synthetic.
- Risk thresholds (critical ≥ 2 m/yr, high ≥ 1, moderate ≥ 0.5, otherwise low)
  are defaults for demonstration, not validated criteria.
- Only the 1-year horizon is presented as a design horizon; 3- and 5-year
  forecasts are flagged experimental.
- Real data (Copernicus/ERA5, Sentinel-2, Landsat, surveyed shorelines) and
  trained models must be connected before any output is used for decisions.

## Built with

TanStack Start (React 19) · TypeScript · Tailwind CSS v4 · Leaflet · Recharts ·
TanStack Query · Vitest
