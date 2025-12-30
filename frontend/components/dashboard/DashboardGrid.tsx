// components/dashboard/DashboardGrid.tsx
type DashboardGridProps = {
  children: React.ReactNode;
};

export default function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {children}
    </section>
  );
}
