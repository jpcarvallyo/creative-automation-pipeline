import type { Metadata } from "next";
import { Figtree, Roboto, Syne } from "next/font/google";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const brand = Roboto({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-brand",
  display: "swap",
});

const sans = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creative Automation",
  description: "Operator console for campaign creative runs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${brand.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className={sans.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
