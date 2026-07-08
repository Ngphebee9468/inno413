import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "inno413 Orders",
  description: "Custom apparel order management for inno413",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
