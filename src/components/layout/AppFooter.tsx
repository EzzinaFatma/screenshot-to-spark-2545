import { LogoMark } from "@/components/brand/Logo";

export function AppFooter() {
  return (
    <footer className="border-t border-navy-border bg-navy-deep text-navy-muted">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark className="size-6" />
          <span>CoastGuard AI · Coastal erosion monitoring prototype · Hammamet Bay, Tunisia</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
          Basemaps © OpenStreetMap contributors · Imagery © Esri · Values simulated
        </span>
      </div>
    </footer>
  );
}
