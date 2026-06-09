import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Footprint — Travel Photo Memories",
  description: "A personal travel photo memory space. Turn trips into archived journeys.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
