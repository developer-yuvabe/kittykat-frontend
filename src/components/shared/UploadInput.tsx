"use client";

import { ChevronDown, Upload, Loader2 } from "lucide-react";
import React, { useRef, useState } from "react";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { CampaignResponse } from "@/types/campaign.types";
import { addVisualImageToCampaign } from "@/services/api/campaign.service";
import { toast } from "sonner";

export function UploadInput({
  brandId,
  campaignId,
  onUploaded,
}: {
  brandId: string;
  campaignId: string;
  onUploaded?: (res: CampaignResponse) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      await toast.promise(
        (async () => {
          const url = await uploadFileAndReturnUrl(
            file.name,
            file.type,
            "threads",
            file
          );

          const response = await addVisualImageToCampaign(brandId, campaignId, {
            url,
          });

          onUploaded?.(response);
          return response;
        })(),
        {
          loading: "Uploading image...",
          success: "Upload successful!",
          error: "Upload failed. Please try again.",
        }
      );
    } catch (err) {
      // Error already handled in toast
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center space-x-2 border-2 text-gray-700 rounded-md px-3 py-3 text-sm font-medium disabled:opacity-50"
        style={{ borderColor: "#7F55E0" }}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>Upload</span>
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
