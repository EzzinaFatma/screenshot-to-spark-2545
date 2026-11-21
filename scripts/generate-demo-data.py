"""
Generates the SIMULATED demonstration dataset used by CoastGuard AI.

Geometry: shoreline traced from satellite imagery of Hammamet Bay (approximate).
Every numeric value (rates, positions, environmental series) is synthetic and
seeded for reproducibility. Replace with real data / API responses later.

Run:  python3 scripts/generate-demo-data.py
"""
import json, math, random
from pathlib import Path

random.seed(42)
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data"
raw = json.load(open(Path(__file__).parent / "hammamet-coast-trace.json"))

# keep the study stretch: El Mrezga (NE) -> south of Yasmine (SW)
pts = [p for p in raw if p[1] <= 10.716 and p[0] >= 36.318 and not (p[1] > 10.75)]
# drop points from rays that hit the image edge
pts = [p for p in pts if 10.49 < p[1] < 10.76]

def hav(a, b):
    R = 6371000
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    d = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(d))

# remove spikes: drop points that jump too far from the previous kept point
clean = [pts[0]]
for p in pts[1:]:
    if hav(clean[-1], p) < 900:
        clean.append(p)

# smooth (moving average)
def smooth(arr, k=3):
    out = []
    for i in range(len(arr)):
        s = arr[max(0, i-k): i+k+1]
        out.append([sum(x[0] for x in s)/len(s), sum(x[1] for x in s)/len(s)])
    return out
line = smooth(clean, 2)

# resample every ~120 m
res = [line[0]]
acc = 0
for a, b in zip(line, line[1:]):
    acc += hav(a, b)
    if acc >= 120:
        res.append(b); acc = 0
if res[-1] != line[-1]:
    res.append(line[-1])
cum = [0]
for a, b in zip(res, res[1:]):
    cum.append(cum[-1] + hav(a, b))
total = cum[-1]

N = 16
zones_def = [
    ("El Mrezga", "MRZ"),
    ("Hammamet North", "HMN"),
    ("Hammamet South", "HMS"),
    ("Yasmine Hammamet Marina", "YSM"),
]
def zone_for(lat, lon):
    if lon > 10.665: return 0
    if lon > 10.612: return 1
    if lat > 36.378: return 2
    return 3

# designed (simulated) end-point rates, NE -> SW, m/yr (negative = erosion)
design = [-0.55, -0.8, -1.05, -0.7, -1.35, -1.75, -0.3, -1.1,
          -1.9, -2.4, 0.85, 1.1, -2.65, -1.6, -1.25, -0.9]
shore_types = ["Sandy beach", "Sandy beach", "Sandy beach / dunes", "Sandy beach",
               "Hotel frontage", "Hotel frontage", "Rocky / seawall (Medina)", "Hotel frontage",
               "Hotel frontage", "Sandy beach", "Updrift of marina breakwater", "Marina entrance",
               "Downdrift of marina", "Sandy beach / dunes", "Sandy beach / dunes", "Sandy beach"]
land_cover = ["Mixed residential", "Mixed residential", "Natural dune vegetation", "Urban",
              "Tourism infrastructure", "Tourism infrastructure", "Historic urban", "Tourism infrastructure",
              "Tourism infrastructure", "Tourism infrastructure", "Port infrastructure", "Port infrastructure",
              "Tourism infrastructure", "Natural dune vegetation", "Natural dune vegetation", "Agricultural / natural"]

segments, histories, envs = [], [], []
zone_counters = [0, 0, 0, 0]
months = [f"{y}-{m:02d}" for y in range(2018, 2021) for m in range(1, 13)]

def risk(pred):
    if pred >= 2.0: return "critical"
    if pred >= 1.0: return "high"
    if pred >= 0.5: return "moderate"
    return "low"

for i in range(N):
    s0, s1 = total*i/N, total*(i+1)/N
    coords = [res[j] for j in range(len(res)) if s0 - 1 <= cum[j] <= s1 + 121]
    coords = [[round(c[0], 5), round(c[1], 5)] for c in coords]
    mid = coords[len(coords)//2]
    z = zone_for(*mid)
    zone_counters[z] += 1
    zname, zcode = zones_def[z]
    seg_id = f"HMB-{i+1:02d}"
    rate = design[i]
    # history 2000-2020 (positions relative to 2000 baseline, m; negative = landward)
    obs = []
    for y in range(2000, 2021):
        noise = random.gauss(0, 1.6) if y != 2000 else 0
        pos = rate*(y-2000) + noise
        src = "historical" if y in (2000, 2005, 2010, 2015, 2020) else "satellite"
        sensor = ("Reference shoreline" if src == "historical"
                  else ("Landsat 5/7" if y < 2013 else ("Landsat 8" if y < 2016 else "Sentinel-2")))
        obs.append({"year": y, "position": round(pos, 2), "source": src, "sensor": sensor})
    ann = [{"year": obs[k]["year"], "rate": round(obs[k]["position"]-obs[k-1]["position"], 2)}
           for k in range(1, len(obs))]
    epr = round((obs[-1]["position"] - obs[0]["position"]) / 20, 2)
    exposure = round(0.85 + 0.3*random.random() + (0.1 if z >= 2 else 0), 2)
    pred = round(max(-1.5, -epr * (0.9 + 0.2*random.random()) * (0.95 + 0.1*exposure)), 2)
    unc = round(0.3 + 0.22*abs(epr) + 0.1*random.random(), 2)
    day = 3 + (i * 5) % 25
    last = f"2020-{8 + (i % 2):02d}-{day:02d}"
    segments.append({
        "id": seg_id,
        "name": f"{zname} {zone_counters[z]}",
        "zone": zname,
        "zoneCode": zcode,
        "coordinates": coords,
        "centroid": mid,
        "lengthKm": round((s1-s0)/1000, 2),
        "historicalRate": epr,
        "predictedRetreat1y": pred,
        "uncertainty1y": unc,
        "risk": risk(pred),
        "lastObservation": last,
        "shorelineType": shore_types[i],
        "landCover": land_cover[i],
        "exposure": exposure,
        "dataSource": "Simulated (demo) — Landsat / Sentinel-2 style shoreline extraction",
        "provenance": "demo",
    })
    histories.append({"segmentId": seg_id, "baselineYear": 2000, "observations": obs,
                      "annualRates": ann, "provenance": "demo"})
    # environment snapshot + monthly series (scaled from bay series)
    series = []
    for k, mth in enumerate(months):
        m = int(mth[-2:])
        winter = math.cos((m-1)/12*2*math.pi)  # 1 in Jan, -1 in Jul
        hs = max(0.2, (0.75 + 0.35*winter)*exposure + random.gauss(0, 0.08))
        tp = 5.2 + 1.1*winter + random.gauss(0, 0.25)
        wd = (85 + 25*winter + random.gauss(0, 12)) % 360
        ws = max(1, 5.6 + 1.6*winter + random.gauss(0, 0.6))
        sl = 3.1*(k/12) + 40*(-winter)*0.25 + random.gauss(0, 6)
        ndwi = 0.32 + 0.05*winter + random.gauss(0, 0.02) - 0.004*abs(rate)
        mndwi = ndwi + 0.08 + random.gauss(0, 0.015)
        series.append({"month": mth, "waveHeight": round(hs, 2), "wavePeriod": round(tp, 2),
                       "waveDirection": round(wd), "windSpeed": round(ws, 2),
                       "seaLevelAnomaly": round(sl, 1), "ndwi": round(ndwi, 3), "mndwi": round(mndwi, 3)})
    envs.append({"segmentId": seg_id, "exposure": exposure, "series": series, "provenance": "demo"})

meta = {
    "studyArea": "Hammamet Bay, Tunisia",
    "generated": "seeded synthetic dataset (seed=42)",
    "provenance": "demo",
    "notice": "All values are SIMULATED for demonstration. Geometry is an approximate trace from satellite imagery.",
    "historyPeriod": [2000, 2020],
    "environmentPeriod": [months[0], months[-1]],
}
OUT.mkdir(parents=True, exist_ok=True)
json.dump({"meta": meta, "segments": segments}, open(OUT/"segments.json", "w"), indent=1)
json.dump(histories, open(OUT/"history.json", "w"))
json.dump(envs, open(OUT/"environment.json", "w"))
print("total km", round(total/1000, 2), "points", len(res))
for s in segments: print(s["id"], s["name"], s["lengthKm"], s["historicalRate"], s["predictedRetreat1y"], s["risk"], len(s["coordinates"]))
