"use client";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui2";
export function Providers({ children }: { children: React.ReactNode }) {
  return (<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><AuthProvider><StoreProvider>{children}<Toaster /></StoreProvider></AuthProvider></ThemeProvider>);
}

