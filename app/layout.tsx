import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STRATIX – Collaborative Valorant Strategy Planner",
  description: "Build, share, and execute winning Valorant strategies with your team in real time.",
  icons: {
    icon: [{ url: '/stratix-mark.svg', type: 'image/svg+xml' }],
    shortcut: '/stratix-mark.svg',
  },
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-[#0B0D12] text-[#F5F5F5] antialiased">
        {children}
      </body>
    </html>
  );
}
