"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UploadDropzoneProps {
  activeTab: string;
}

export function UploadDropzone({ activeTab }: UploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const getAcceptedFileTypes = () => {
    switch (activeTab) {
      case "images":
        return {
          "image/png": [".png"],
          "image/jpeg": [".jpg", ".jpeg"],
          "image/svg+xml": [".svg"],
        };
      case "videos":
        return {
          "video/mp4": [".mp4"],
          "video/quicktime": [".mov"],
          "video/x-msvideo": [".avi"],
        };
      case "models":
        return { "image/*": [] };
      case "products":
        return { "image/*": [], "model/gltf-binary": [".glb"] };
      case "moodboards":
        return { "image/*": [] };
      default:
        return {
          "image/*": [],
          "video/*": [],
          "model/gltf-binary": [".glb"],
        };
    }
  };

  const getPlaceholderText = () => {
    switch (activeTab) {
      case "images":
        return "Drop images here to upload";
      case "videos":
        return "Drop videos here to upload";
      case "models":
        return "Drop models here to upload";
      case "products":
        return "Drop product images or models here";
      case "moodboards":
        return "Drop moodboard images here";
      default:
        return "Drop media here to upload";
    }
  };

  const getAcceptedFileTypesText = () => {
    switch (activeTab) {
      case "images":
        return "PNG, JPEG, JPG, SVG";
      case "videos":
        return "MP4, MOV, AVI";
      case "models":
        return "IMAGES";
      case "products":
        return "JPG, PNG, GLB";
      case "moodboards":
        return "Images only";
      default:
        return "PNG, JPEG, XXX";
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);

    if (acceptedFiles.length > 0) {
      toast.success(
        `${acceptedFiles.length} file${
          acceptedFiles.length > 1 ? "s" : ""
        } uploaded successfully`,
        {
          description: `${acceptedFiles.map((file) => file.name).join(", ")}`,
          duration: 3000,
        }
      );
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,

    multiple: true,
  });

  let borderColor = "border-gray-300";
  if (isDragActive) borderColor = "border-purple-500";
  if (isDragAccept) borderColor = "border-green-500";
  if (isDragReject) borderColor = "border-red-500";

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 mb-6 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer ${borderColor} ${
        isDragActive ? "bg-purple-50" : "bg-white"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex gap-x-3">
        <Button
          variant="outline"
          className="bg-[#636AE8] hover:bg-[#636AE8] text-white mb-2"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>

        <p className="text-sm pt-2 text-gray-500">
          {isDragActive ? "or drop media here to upload" : getPlaceholderText()}{" "}
          ({getAcceptedFileTypesText()})
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <p className="text-xs font-medium text-gray-700 mb-1">
            Uploaded files:
          </p>
          <div className="max-h-20 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center text-xs text-gray-600 py-1"
              >
                <File className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
