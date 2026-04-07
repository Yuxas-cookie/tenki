import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { WeatherModeProvider } from "@/providers/weather-mode-provider";
import { ScheduleProvider } from "@/providers/schedule-provider";
import { ExpenseProvider } from "@/providers/expense-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const notoSansJP = Noto_Sans_JP({ variable: "--font-noto-sans-jp", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "PaintAI Scheduler | AI工程最適化システム",
  description: "天気予報と連動してAIが塗装工事の工程を自動最適化するスケジューリングシステム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable} h-full`}>
      <body className="h-full font-sans antialiased" style={{ fontFamily: "var(--font-noto-sans-jp), var(--font-inter), sans-serif" }}>
        <WeatherModeProvider>
          <ScheduleProvider>
            <ExpenseProvider>
              <TooltipProvider>
                <AppShell>{children}</AppShell>
              </TooltipProvider>
            </ExpenseProvider>
          </ScheduleProvider>
        </WeatherModeProvider>
      </body>
    </html>
  );
}
