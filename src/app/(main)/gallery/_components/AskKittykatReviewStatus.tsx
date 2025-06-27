// components/AskKittykatReviewStatus.tsx
import { Lock, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

interface AskKittykatReviewStatusProps {
  sentToHumanQueue: boolean | undefined;
  onAskKittykat: () => void;
}

export function AskKittykatReviewStatus({
  sentToHumanQueue,
  onAskKittykat,
}: AskKittykatReviewStatusProps) {
  const { user } = useUserStore();
  const isAdmin = user?.role?.id === UserRoleId.ADMIN;

  return (
    <div className="pt-2 border-t">
      {isAdmin ? (
        <div className="bg-muted rounded-lg p-3 text-center border space-y-2">
          <ShieldCheck className="mx-auto text-muted-foreground w-5 h-5" />
          <p className="text-sm font-medium text-muted-foreground">
            <p className="text-sm font-medium text-muted-foreground">
              {sentToHumanQueue
                ? "✅ Request has been sent to the KittyKat team for review."
                : "❌ No request has been made to the KittyKat team yet."}
            </p>
          </p>

          {sentToHumanQueue && (
            <Button
              className="w-full"
              size="lg"
              variant="default"
              onClick={() => {
                // handleAcceptAndStart logic here
                console.log("✅ Admin accepted and started editing");
              }}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Accept and Start
            </Button>
          )}
        </div>
      ) : sentToHumanQueue !== true ? (
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
          <CheckCircle2 className="mx-auto text-green-600 w-5 h-5 mb-1" />
          <p className="text-sm text-green-700 font-medium">
            ✅ Request sent to KittyKat team
          </p>
          <p className="text-xs text-green-600 mt-1">
            Our human editors will review your request and begin editing
            shortly.
          </p>
        </div>
      )}
    </div>
  );
}
