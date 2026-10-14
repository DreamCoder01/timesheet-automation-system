import React from "react";
import type { Metadata, Viewport } from "next";

// Define explicit metadata descriptions for Sam's dashboard application layer
export const metadata: Metadata = {
  title: "Weekly Hours Automation Console",
  description:
    "Enterprise internal sanitization and payroll analysis panel for legacy till files.",
  robots: { index: false, follow: false }, // Enforce internal security privacy guidelines
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f59e0b", // Amber branding color anchor tint
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-neutral-50 text-neutral-900 font-sans">
        {/* Inject and execute core global child routing nodes */}
        {children}
      </body>
    </html>
  );
}
