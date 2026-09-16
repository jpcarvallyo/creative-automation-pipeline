import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creative Automation",
  description: "Operator console for campaign creative runs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body className={sans.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
