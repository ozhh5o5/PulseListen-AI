import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {
  Activity,
  LayoutDashboard,
  FolderKanban,
  Map,
  FileText,
  Share2,
  Shield,
  HeartPulse,
} from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PulseListen AI — Pharmacovigilance & Outbreak Detection",
  description:
    "Zero-shot pharmacovigilance and outbreak signal detection platform. Real-time social listening for patient experience and safety signals with privacy-first architecture.",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/heatmap", label: "Geo Heatmap", icon: Map },
  { href: "/icsr", label: "ICSR Reports", icon: FileText },
  { href: "/diffusion", label: "Diffusion Graph", icon: Share2 },
  { href: "/admin", label: "Admin", icon: Shield },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex bg-[#0f172a]">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 glass border-r border-slate-700/50 flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-slate-700/50">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-shadow">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  PulseListen
                </h1>
                <p className="text-[10px] font-medium text-sky-400 tracking-wider uppercase">
                  AI Pharma Intelligence
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
              >
                <item.icon className="w-4.5 h-4.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>System Online</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              PanIIT AI for Bharat — Theme 6
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
