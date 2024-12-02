"use client";

import type { Metadata } from "next";
//import type {RootLayoutProps} from "next"
//import { Inter as FontSans } from "next/font/google";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from '@/lib/session';
import { cn } from "@/lib/utils"
import "./globals.css";
import TopBar from "@/components/top-bar";
import CssBaseline from "@mui/material/CssBaseline";
import ScrollTop from "@/components/scroll-top";
import Paper from "@mui/material/Paper";
import { UIContextProvider } from "@/lib/ui.context";
import ErrorBoundary from "@/components/error";
import { I18nProvider } from '@/lib/i18n';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body style={{ background: "black" }} className={cn(
        "min-h-screen bg-background font-sans antialiased",
        /*fontSans.className*/
      )}>
        <I18nProvider>
          <ErrorBoundary>
            <SessionProvider>
              <UIContextProvider>
                <ThemeProvider attribute="class" defaultTheme="white" enableSystem disableTransitionOnChange>
                  <CssBaseline />
                  <TopBar anchorId='scroll-to-top' />
                  <Paper variant="outlined" sx={{ mt: 0, mr: 24, ml: 24, background: "black" }} >
                    {children}
                  </Paper>
                  <ScrollTop anchorId='scroll-to-top' />
                </ThemeProvider>
              </UIContextProvider>
            </SessionProvider>
          </ErrorBoundary>
        </I18nProvider>
      </body>
    </html>
  );
}
