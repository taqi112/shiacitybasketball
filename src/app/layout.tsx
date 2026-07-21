import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { BrandTexture } from "@/components/BrandTexture";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shia City Basketball",
  description: "Shia City Basketball league",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        <BrandTexture className="fixed inset-0 -z-10" />
        <NavBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Shia City Basketball
        </footer>
      </body>
    </html>
  );
}
