import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Activity } from "lucide-react";
import { SocialOption } from "@/types/campaign.types";
import { UploadedImage } from "@/types/moodboard.types";

interface BrandSocialVerifyDialogProps {
  uploadedImages: UploadedImage[];
  selectedOptions: string[];
  socialOptions: SocialOption[];
  isProcessing: boolean;
  handleBulkUpload: () => void;
  getButtonText: () => string;
}

export function BrandSocialVerifyDialog({
  uploadedImages,
  selectedOptions,
  socialOptions,
  isProcessing,
  handleBulkUpload,
  getButtonText,
}: BrandSocialVerifyDialogProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  const isButtonDisabled =
    (uploadedImages.length === 0 && selectedOptions.length === 0) ||
    isProcessing;

  const hasSocialOptions = selectedOptions.length > 0;
  const hasUploadedImages = uploadedImages.length > 0;

  return (
    <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
      <AlertDialogTrigger asChild>
        <Button
          onClick={() => setShowVerifyDialog(true)}
          disabled={isButtonDisabled}
          className="min-w-[200px]"
        >
          {isProcessing && <Activity className="w-4 h-4 mr-2 animate-spin" />}
          {getButtonText()}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          {hasSocialOptions ? (
            <>
              <AlertDialogTitle>Verify your social handles</AlertDialogTitle>
              <AlertDialogDescription>
                Please ensure that the following links are correct, public, and
                the accounts have posts:
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-700">
                  {socialOptions
                    .filter((opt) => selectedOptions.includes(opt.id))
                    .map((opt) => (
                      <li key={opt.id}>
                        Check{" "}
                        <a
                          href={opt.editValue || opt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {opt.name.replace("Use ", "").replace(" Images", "")}
                        </a>
                      </li>
                    ))}
                </ul>
                {hasUploadedImages && (
                  <p className="mt-2 text-sm text-gray-600">
                    Additionally, {uploadedImages.length} image(s) will be
                    uploaded to your gallery.
                  </p>
                )}
              </AlertDialogDescription>
            </>
          ) : (
            <>
              <AlertDialogTitle>Upload brand images</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to upload {uploadedImages.length} image(s) to your
                brand gallery?
              </AlertDialogDescription>
            </>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setShowVerifyDialog(false);
              handleBulkUpload();
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
