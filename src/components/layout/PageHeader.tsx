import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-hero text-navy-foreground", className)}>
      <div className="survey-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-20 pt-10 sm:px-6 lg:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl animate-rise">
            <p className="eyebrow text-turquoise">{eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-muted sm:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Content container that overlaps the navy header band. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative mx-auto -mt-12 max-w-[1440px] px-4 pb-16 sm:px-6", className)}>{children}</div>;
}
