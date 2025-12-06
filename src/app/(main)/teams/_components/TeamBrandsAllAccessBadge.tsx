"use client";

import { Globe } from "lucide-react";

export function TeamBrandsAllAccessBadge() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
      <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
      <span className="text-sm font-medium text-green-700 dark:text-green-300">
        Access to all brands
      </span>
    </div>
  );
}
