import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Learning Tutor',
  description: 'Track learning activities and earn rewards',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tutor Bot',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
