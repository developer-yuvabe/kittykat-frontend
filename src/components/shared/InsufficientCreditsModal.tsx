import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserStore } from "@/store/user.store";

const InsufficientCreditsModal = () => {
  const { showInsufficientCreditsModal, setShowInsufficientCreditsModal } =
    useUserStore();
  return (
    <AlertDialog
      open={showInsufficientCreditsModal}
      onOpenChange={(open) => {
        setShowInsufficientCreditsModal(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <p className="text-6xl">⚠️</p>
          <AlertDialogTitle className="text-center">
            You’ve run out of credits!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            To continue generating images and using AI features, please top up
            your credits.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-2">
          <p className="text-center text-sm text-muted-foreground italic">
            <span className="text-foreground">Why do I need credits?</span>{" "}
            Credits are used to access AI-powered image generation, remixing,
            and virtual try-on. Each action consumes a small amount of credits
            based on the complexity of the task.
          </p>
        </div>
        <AlertDialogFooter className="flex flex-col sm:flex-col ">
          <AlertDialogCancel className="w-full">Back</AlertDialogCancel>
          <AlertDialogAction className="w-full">
            Purchase Credits
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InsufficientCreditsModal;
