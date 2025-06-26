// components/AskKittykatReviewStatus.tsx
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AskKittykatReviewStatusProps {
  sentToHumanQueue: boolean | undefined;
  onAskKittykat: () => void;
}

export function AskKittykatReviewStatus({
  sentToHumanQueue,
  onAskKittykat,
}: AskKittykatReviewStatusProps) {
  return (
    <div className="pt-2 border-t">
      {sentToHumanQueue !== true ? (
        <Button
          onClick={onAskKittykat}
          className="w-full"
          size="lg"
          variant="default"
        >
          <Lock className="w-5 h-5 mr-2" />
          Ask KittyKat
        </Button>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm text-green-700 font-medium">
            ✅ Request sent to KittyKat team
          </p>
          <p className="text-xs text-green-600 mt-1">
            Our human editors will review your request and provide feedback.
          </p>
        </div>
      )}
    </div>
  );
}
