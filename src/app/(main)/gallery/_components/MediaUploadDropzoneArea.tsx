import React from "react";

interface MediaUploadDropzoneAreaProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  isUploading: boolean;
  children: React.ReactNode;
}

export function MediaUploadDropzoneArea({
  getRootProps,
  getInputProps,
  isDragActive,
  isDragAccept,
  isDragReject,
  isUploading,
  children,
}: MediaUploadDropzoneAreaProps) {
  let borderColor = "border-gray-300";
  if (isDragActive) borderColor = "border-purple-500";
  if (isDragAccept) borderColor = "border-green-500";
  if (isDragReject) borderColor = "border-red-500";

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer ${borderColor} ${
        isDragActive ? "bg-purple-50" : "bg-white"
      } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      {children}
    </div>
  );
}
