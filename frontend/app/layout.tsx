import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "MPLADS Intelligence & Risk Analytics",
  description:
    "AI-assisted risk flagging dashboard for MPLADS infrastructure works. For authorized government review only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-14 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
