import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import { ActiveAuditProvider } from '../lib/ActiveAuditContext';

export const metadata: Metadata = {
  title: 'LexPort — Cross-Border Compliance Co-Pilot',
  description: 'Check product compliance across countries, identify missing requirements, fix violations, and generate a verified compliance dossier — all from one workspace.',
  keywords: 'compliance, cross-border, export, customs, HS code, product compliance, trade',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-lexport-bg font-sans antialiased">
        <AuthProvider>
          <ActiveAuditProvider>
            {children}
          </ActiveAuditProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
