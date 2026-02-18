import type { ReactNode } from "react";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} min-h-screen`}>{children}</body>
    </html>
  );
}
