import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",  
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FacturaPro | MAJIA OS",
  description: "Bóveda Contable de MAJIA OS",
};

import { AuthProvider } from "@/components/AuthProvider";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { CommandPalette } from "@/components/CommandPalette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 print:bg-white print:text-black`}
      >
        <AuthProvider>
          <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50 h-full relative print:overflow-visible print:bg-white print:h-auto">
               {children}
               <WhatsAppWidget />
               <CommandPalette />
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
