import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { AuthProvider } from "@/context/AuthContext";
import LoginModal from "@/components/auth/LoginModal";

export const metadata: Metadata = {
  title: "Empowered Indian | MPLADS Dashboard & Risk Analytics",
  description:
    "AI-assisted risk flagging dashboard and citizen transparency platform for MPLADS infrastructure works.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f2f4f7] text-slate-900 antialiased min-h-screen">
        <AuthProvider>
          <Sidebar />
          <TopBar />
          <main className="pl-28 pt-24 pr-8 pb-12 min-h-screen">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
