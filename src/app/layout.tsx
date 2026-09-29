import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = { title: "CampusFlow EPR — Smart Education Management", description: "Smart Education Management for a Smarter Campus" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>);
}
