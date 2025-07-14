import type { Metadata } from "next";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppConfig } from "@/config/app.config";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import ReactQueryProvider from "@/providers/react-query-provider";
import NextTopLoader from "nextjs-toploader";
import DeployFlag from "@/components/shared/DeployFlag";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: AppConfig.APP_NAME,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <NuqsAdapter>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </NuqsAdapter>
        <NextTopLoader color="#7C3AED" showSpinner={false} />
        <Toaster richColors />
        <DeployFlag />
      </body>
    </html>
  );
}
