// app/(dashboard)/layout.tsx
import TopBar from "../../components/layout/TopBar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto w-full max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
