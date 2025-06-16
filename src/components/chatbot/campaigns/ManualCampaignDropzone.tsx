// components/ManualCampaignDropzone.tsx
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ManualCampaignDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
}

export const ManualCampaignDropzone = ({
  onDrop,
}: ManualCampaignDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
  });

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer ${
            isDragActive ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-xl font-medium text-gray-900 mb-2">
                Drop files here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported format: PNG, JPG
              </p>
              <p className="text-sm text-gray-400 mb-4">OR</p>
              <Button
                variant="link"
                className="text-blue-600 hover:text-blue-700"
              >
                Browse files
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
