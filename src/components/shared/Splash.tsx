"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";
import { ERROR_MESSAGES } from "@/lib/constants";
import Logo from "./Logo";

const Splash = ({
  showRetry,
}: {
  showRetry?: boolean;
  className?: string;
  showProgress?: boolean;
}) => {
  useEffect(() => {
    if (showRetry) {
      setTimeout(() => {
        toast.error(ERROR_MESSAGES.GENERAL_ERROR, {
          id: "retry",
          duration: Infinity,
          action: {
            label: "Retry",
            onClick: () => window.location.reload(),
          },
        });
      }, 500);
    }

    return () => {
      toast.dismiss("retry");
    };
  }, [showRetry]);

  return (
    <div className="h-dvh w-dvw flex flex-col gap-y-16 items-center justify-center">
      <Logo className="w-80 lg:100" />
      <div className="relative w-[20vw] h-1 overflow-hidden rounded-full bg-gray-300">
        <div className="absolute inset-0 w-1/2 bg-[#718BC0] animate-loader"></div>
        <div className="absolute inset-0 w-1/2 bg-[#D66E98] animate-loader delay-150"></div>
      </div>
    </div>
  );
};

export default Splash;
