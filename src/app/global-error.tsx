"use client";

import "@/app/globals.css";
import { env } from "@/config/env";
import { logError } from "@/services/actions/log-error";
import { useUserStore } from "@/store/user.store";
import { motion } from "framer-motion";
import { useEffect } from "react";
import errorGif from "../assets/error.gif";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { user } = useUserStore();
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      (env.NEXT_PUBLIC_ENVIRONMENT === "prod" ||
        env.NEXT_PUBLIC_ENVIRONMENT === "beta")
    ) {
      logError(
        user?.id || "-",
        user?.email || "-",
        env.NEXT_PUBLIC_ENVIRONMENT,
        error.message
      );
    }
  }, [error]);

  return (
    <html>
      <body>
        <main className="min-h-screen bg-gradient-to-b from-gray-100 to-white-200 flex flex-col items-center justify-center text-center p-0 m-0 box-border">
          {/* Error Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <img
              src={errorGif.src}
              alt="Error Animation"
              className="w-64 h-64 object-contain scale-105"
            />
          </motion.div>

          {/* Animated Heading */}
          <motion.h1
            className="mt-6 text-[1.3rem] font-normal tracking-tight"
            style={{
              color: "oklch(0.54 0.1379 286.92)",
              fontFamily: "Georgia, 'Times New Roman', Times, serif",
              letterSpacing: "-0.022em",
              fontWeight: "400",
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Oops! Something broke. We couldn&apos;t load the necessary
            resources. Please try again later 🐾.
          </motion.h1>

          {/* Reset Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              onClick={reset}
              aria-label="Try again to recover from error"
              className="mt-8 inline-flex items-center px-6 py-3 bg-primary text-white text-base font-medium rounded-xl shadow-md transition-all hover:opacity-90 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H9m-5 7v5h.582m15.356-2A8.001 8.001 0 014.582 17H9"
                />
              </svg>
              Try again
            </button>
          </motion.div>
        </main>
      </body>
    </html>
  );
}
