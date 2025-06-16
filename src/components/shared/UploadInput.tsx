"use client";

import { ChevronDown, Upload } from "lucide-react";
import React, { useRef } from "react";

export function UploadInput() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          console.log("Selected file:", file);
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center space-x-2 border-2 text-gray-700 rounded-md px-3 py-3 text-sm font-medium"
        style={{ borderColor: "#7F55E0" }}
      >
        <Upload className="h-4 w-4" />
        <span>Upload</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
