"use client";

import React, { useEffect } from "react";
import LogoImg from "@/assets/kittykat-logo.svg";
import Image from "next/image";
import { toast } from "sonner";
import { ERROR_MESSAGES } from "@/lib/constants";

const Splash = ({ showRetry }: { showRetry?: boolean }) => {
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
    <div className="h-dvh w-dvw flex items-center justify-center">
      <Image src={LogoImg} alt="KittyKat Logo" />
    </div>
  );
};

export default Splash;
