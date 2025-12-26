// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pricing Analytics",
  description: "Manage vehicle appraisals and credit documents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
