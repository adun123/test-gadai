// components/layout/PageHeader.tsx
type PageHeaderProps = {
  title: string;
  subtitle?: string;
  statusText?: string;
};

export default function PageHeader({
  title,
  subtitle,
  statusText = "System Operational",
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {subtitle ? <p className="text-base text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>
        <span className="font-semibold text-foreground/80">{statusText}</span>
      </div>
    </section>
  );
}
