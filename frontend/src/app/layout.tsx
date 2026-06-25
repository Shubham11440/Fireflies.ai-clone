import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MainNav } from "@/components/nav/MainNav";
import { Sidebar } from "@/components/nav/Sidebar";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Fireflies Clone",
  description: "AI-powered meeting notes and transcription platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <MainNav />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
