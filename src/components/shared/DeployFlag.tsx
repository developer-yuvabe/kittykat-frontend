"use client";
import React from "react";
import dynamic from "next/dynamic";
import { env } from "@/config/env";

const DeployFlag = () => {
  const environment = env.NEXT_PUBLIC_ENVIRONMENT;

  if (environment === "prod" || window?.location?.hostname == "localhost")
    return null;

  return (
    <div className="fixed  bg-primary text-white font-bold p-2 capitalize  bottom-6 -left-20 text-center rotate-45 w-64">
      {environment === "dev" && "Development"}
      {environment === "stg" && "Staging"}
    </div>
  );
};

export default dynamic(() => Promise.resolve(DeployFlag), {
  ssr: false,
});
