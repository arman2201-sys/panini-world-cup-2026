import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panini FIFA World Cup 2026 Collection",
  description: "Danish/Bosnian sticker collection manager for Panini FIFA World Cup 2026."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
