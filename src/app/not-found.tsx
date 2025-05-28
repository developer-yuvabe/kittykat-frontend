"use client";

import React from "react";
import Logo from "@/components/shared/Logo";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F9FAFB] to-[#E5E7EB] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Logo
          className="mx-auto drop-shadow-md"
          width={220}
          height={220}
          aria-label="Company logo"
        />
      </motion.div>

      <motion.h1
        className="text-5xl sm:text-6xl font-extrabold text-primary mt-6 tracking-tight"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        404
      </motion.h1>

      <motion.p
        className="text-xl sm:text-2xl text-gray-800 mt-4 max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Oops! Kitty got lost in space. 🐾
      </motion.p>

      <motion.p
        className="text-base sm:text-lg text-gray-600 mt-2 max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        The page you're looking for doesn’t exist or has moved.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Link
          href="/"
          className="mt-8 inline-flex items-center px-6 py-3 bg-primary text-white text-base font-medium rounded-xl shadow-lg hover:bg-[#452d7a] focus:outline-none focus:ring-2 focus:ring-[#5C3B94] focus:ring-offset-2 transition-all duration-300"
          aria-label="Return to homepage"
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go Home
        </Link>
      </motion.div>
    </main>
  );
}
