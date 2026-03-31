import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lantbruket - Gårdssimulator",
  description: "En simulering av lantbruksekonomi för naturbrukselever",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
