import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexPort — Agentic Compliance Co-Pilot for Cross-Border Sellers",
  description: "Reviews e-commerce listings against destination-market regulations. 3-Tier Multi-Agent compliance audit with SHA-256 EU AI Act cryptographic verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
