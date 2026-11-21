export function signed(value: number, digits = 2) {
  const v = Math.abs(value) < 0.005 ? 0 : value;
  const s = Math.abs(v).toFixed(digits);
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

/** Shoreline change rate (negative = erosion). */
export function formatRate(rate: number) {
  return `${signed(rate)} m/yr`;
}

export function rateLabel(rate: number) {
  return rate < 0 ? "erosion" : rate > 0 ? "accretion" : "stable";
}

/** Retreat (positive = landward). */
export function formatRetreat(retreat: number) {
  if (retreat < 0) return `${Math.abs(retreat).toFixed(2)} m advance`;
  return `${retreat.toFixed(2)} m`;
}

export function formatCoord([lat, lng]: [number, number]) {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const mi = Number(m) - 1;
  return d ? `${Number(d)} ${MONTHS[mi] ?? ""} ${y}` : `${MONTHS[mi] ?? ""} ${y}`;
}

export function formatMonth(month: string) {
  const [y, m] = month.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""} ${y?.slice(2)}`;
}
