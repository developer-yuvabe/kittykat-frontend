import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Link, Upload } from "lucide-react";
import React, { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

type AddVersionProps = {
  children?: React.ReactNode;
  addVersion: (uploadedUrl: string) => void;
  brandId: string;
  campaignId?: string;
};

const AddVersion = ({
  children,
  addVersion,
  brandId,
  campaignId,
}: AddVersionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        toast.error(
          "Some files were rejected due to unsupported types or sizes. Please ensure you're uploading a single image that meets the required specifications for a version."
        );
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }
      try {
        setIsUploading(true);
        const file = acceptedFiles[0];
        console.log("brandId in add version", brandId);
        console.log("campaignId in add version", campaignId);
        const url = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "brands",
          file,
          brandId,
          campaignId
        );

        addVersion(url);
        setIsOpen(false);
        setShowUrlInput(false);
        setUrl("");
        setIsUploading(false);
      } catch {
        toast.error(
          "An error occurred while uploading the file. Please try again."
        );
      }
    },
    []
  );

  const [isUploading, setIsUploading] = useState(false);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [],
    },
    disabled: isUploading,
  });

  let borderColor = "border-gray-300";
  if (isDragActive) borderColor = "border-purple-500";
  if (isDragAccept) borderColor = "border-green-500";
  if (isDragReject) borderColor = "border-red-500";

  const uploadUrl = async (url: string) => {
    addVersion(url);

    setIsOpen(false);
    setShowUrlInput(false);
    setUrl("");
    setIsUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <AnimatePresence mode="wait">
          {showUrlInput ? (
            <motion.div
              key="urlInput"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.1 }}
              className="space-y-4 relative"
            >
              <Button
                variant="ghost"
                onClick={() => setShowUrlInput(false)}
                disabled={isUploading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="w-full max-w-md">
                <Input
                  type="text"
                  placeholder="Enter image URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                  disabled={isUploading || !url}
                  loading={isUploading}
                  className="mt-4 w-full"
                  onClick={() => {
                    uploadUrl(url);
                  }}
                >
                  Add URL
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.1 }}
              className="space-y-4 relative"
            >
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer ${borderColor} ${
                  isDragActive ? "bg-purple-50" : "bg-white"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div
                  className="flex z-20 justify-start absolute top-3 left-2"
                  onClick={(e) => e.stopPropagation()}
                ></div>
                <input {...getInputProps()} />

                <div className="flex gap-x-3">
                  <Button
                    variant="outline"
                    className="bg-[#636AE8] hover:bg-[#636AE8] hover:text-white text-white mb-2"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Files
                  </Button>

                  <Button
                    variant="outline"
                    disabled={isUploading}
                    className="mb-2 border-[#636AE8] text-[#636AE8] hover:bg-[#636AE8] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlInput(true);
                    }}
                  >
                    <Link className="mr-1 h-4 w-4" />
                    Add URL
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Drop your new version image here, or click to select files.{" "}
                  <br />
                  (PNG, JPG, JPEG, WEBP)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddVersion;
