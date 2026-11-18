import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STRATIX – Collaborative Valorant Strategy Planner",
  description: "Build, share, and execute winning Valorant strategies with your team in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body bg-[#0B0D12] text-[#F5F5F5] antialiased">
        {children}
      </body>
    </html>
  );
}
