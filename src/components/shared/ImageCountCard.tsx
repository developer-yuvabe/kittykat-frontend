"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ImageCountCard({
  imageCount,
  onRefresh,
  onChange,
  fieldName = "Images",
  textColor = "text-gray-500",
  borderColor = "border-[#7F55E0]",
  isRefreshing = false,
  hideRefresh = false,
  maxCount,
  disabled = false,
  hasUnsavedChanges,
}: {
  imageCount: number;
  onRefresh: () => void;
  onChange?: (value: number) => void;
  fieldName?: string;
  textColor?: string;
  borderColor?: string;
  isRefreshing?: boolean;
  hideRefresh?: boolean;
  maxCount: number;
  disabled?: boolean;
  hasUnsavedChanges?: boolean;
}) {
  const [value, setValue] = useState(imageCount.toString());

  useEffect(() => {
    setValue(imageCount.toString());
  }, [imageCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);

    const numeric = Number(val);
    if (!isNaN(numeric)) {
      const clamped = Math.min(Math.max(numeric, 1), maxCount);
      onChange?.(clamped);
    }
  };

  const isDisabled = disabled || isRefreshing || hasUnsavedChanges;

  return (
    <div className="flex flex-row">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={handleInputChange}
              id="image_count_input"
              placeholder=" "
              disabled={isDisabled}
              min={1}
              max={maxCount}
              className={clsx(
                "peer block w-20 appearance-none font-bold rounded-md border-2 bg-transparent px-2.5 pt-4 pb-2.5 text-sm focus:outline-none focus:ring-0",
                !hideRefresh && "rounded-r-none",
                textColor,
                borderColor,
                `border ${borderColor} focus:border-[#7F55E0]`,
                isDisabled && "cursor-not-allowed bg-gray-100"
              )}
            />

            <label
              htmlFor="image_count_input"
              className={clsx(
                "absolute start-1 top-1 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-1 text-sm transition-all",
                textColor,
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100",
                "peer-focus:top-1 peer-focus:-translate-y-4 font-bold text-xl peer-focus:scale-75 peer-focus:text-[#7F55E0]"
              )}
            >
              {fieldName}
            </label>
          </div>
        </TooltipTrigger>
        {hasUnsavedChanges && (
          <TooltipContent side="top">
            You have unsaved changes. Please save them before editing this
            field.
          </TooltipContent>
        )}
      </Tooltip>

      {!hideRefresh && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={clsx(
                "flex items-center justify-center px-2 border-2 border-l-0 rounded-md rounded-l-none",
                borderColor,
                hasUnsavedChanges && "bg-gray-100"
              )}
            >
              {isRefreshing ? (
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2 border-[#7F55E0] border-t-transparent"
                  title="Refreshing"
                />
              ) : (
                <RefreshCcw
                  className={clsx(
                    "h-5 w-5 text-[#7F55E0]",
                    hasUnsavedChanges
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  )}
                  onClick={() => {
                    if (!hasUnsavedChanges) onRefresh();
                  }}
                />
              )}
            </div>
          </TooltipTrigger>
          {hasUnsavedChanges && (
            <TooltipContent side="top">
              You have unsaved changes. Save them before refreshing.
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </div>
  );
}
