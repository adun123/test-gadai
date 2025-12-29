// components/layout/PageHeader.tsx
type PageHeaderProps = {
  title: string;
  subtitle?: string;
  statusText?: string;
};

export default function PageHeader({
  title,
  subtitle,
  statusText = "Online • Last updated: just now",
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-full border bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm sm:self-auto">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        <span>{statusText}</span>
      </div>
    </section>
  );
}
