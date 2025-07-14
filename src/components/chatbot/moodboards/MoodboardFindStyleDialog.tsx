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
import { Loader } from "lucide-react";
import { MoodboardInformation, ThreadCampaign } from "@/types/types";
import { UploadedImage } from "@/types/moodboard.types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialOption {
  id: string;
  name: string;
  url: string;
  editValue?: string;
}

interface MoodboardFindStyleDialogProps {
  currentMoodboard: MoodboardInformation | null;
  currentCampaign: ThreadCampaign | null;
  uploadedImages: UploadedImage[];
  selectedOptions: string[];
  socialOptions: SocialOption[];
  isAnalysisInProgress: () => boolean;
  handleFindStyle: () => void;
  imageCount: number;
}

export function MoodboardFindStyleDialog({
  currentMoodboard,
  currentCampaign,
  uploadedImages,
  selectedOptions,
  socialOptions,
  isAnalysisInProgress,
  handleFindStyle,
  imageCount,
}: MoodboardFindStyleDialogProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);

  const isEligibleToShow =
    (!currentMoodboard || currentCampaign) &&
    currentMoodboard?.style_analysis_status !== "completed" &&
    currentMoodboard?.style_analysis_status !== "in_progress";

  if (!isEligibleToShow) return null;

  const isButtonDisabled =
    (uploadedImages.length === 0 && selectedOptions.length === 0) ||
    isAnalysisInProgress();

  return (
    <div className="mt-2">
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="w-full">
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full"
                    onClick={() => setShowVerifyDialog(true)}
                    disabled={isButtonDisabled || imageCount < 10}
                  >
                    {isAnalysisInProgress() ? (
                      <span className="flex items-center gap-2">
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Analyzing...
                      </span>
                    ) : (
                      "Find your style!"
                    )}
                  </Button>
                </AlertDialogTrigger>
              </div>
            </TooltipTrigger>
            {imageCount < 10 && (
              <TooltipContent side="top">
                At least 10 images are required for analysis and moodboard
                creation
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <AlertDialogContent>
          <AlertDialogHeader>
            {selectedOptions.length > 0 ? (
              <>
                <AlertDialogTitle>Verify your social handles</AlertDialogTitle>
                <AlertDialogDescription>
                  Please ensure that the following links are correct, public,
                  and the accounts have posts:
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
                            {opt.id.charAt(0).toUpperCase() + opt.id.slice(1)}
                          </a>
                        </li>
                      ))}
                  </ul>
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>Image upload analysis</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to find the style of your uploaded images?
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowVerifyDialog(false);
                handleFindStyle();
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
