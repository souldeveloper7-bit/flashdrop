import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FlashDrop — File Transfer",
  description: "Send files with a simple 6-digit code."
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}