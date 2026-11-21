import { Link } from "@tanstack/react-router";
import { Menu, Radio } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isLiveBackend } from "@/lib/api/client";

export const NAV_ITEMS = [
  { to: "/", label: "Overview" },
  { to: "/map", label: "Coastal Map" },
  { to: "/predictions", label: "Predictions" },
  { to: "/analytics", label: "Analytics" },
  { to: "/data-sources", label: "Data Sources" },
  { to: "/about", label: "About" },
] as const;

const linkBase =
  "rounded-md px-3 py-2 text-sm font-medium text-navy-muted transition-colors hover:bg-navy-soft hover:text-navy-foreground";
const linkActive = "bg-navy-soft text-navy-foreground shadow-[inset_0_-2px_0_var(--turquoise)]";

export function AppHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-navy-border bg-navy-deep/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
        <Link to="/" aria-label="CoastGuard AI home">
          <Logo />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkBase}
              activeProps={{ className: linkActive }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-navy-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-navy-muted sm:flex">
            <Radio className="size-3 animate-scan text-turquoise" aria-hidden />
            {isLiveBackend ? "Live API" : "Demo dataset"}
          </span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="rounded-md p-2 text-navy-foreground hover:bg-navy-soft lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-navy-border bg-navy-deep p-0 text-navy-foreground">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="border-b border-navy-border p-5">
                <Logo />
              </div>
              <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={linkBase}
                    activeProps={{ className: linkActive }}
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
