import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { StudioProvider } from "@/components/studio-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERD Studio",
  description: "Design your database visually.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider>
          <TooltipProvider delayDuration={250}>
            <Suspense fallback={<div className="grid h-screen place-items-center bg-background text-sm text-muted-foreground">Loading studio…</div>}>
              <StudioProvider>
                <AppShell>{children}</AppShell>
                <Toaster />
              </StudioProvider>
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
