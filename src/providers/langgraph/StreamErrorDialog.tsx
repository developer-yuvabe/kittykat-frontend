"use client";

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

const DIALOG_CONTENT = {
  error: {
    title: "Connection Issue",
    description:
      "The connection to the assistant hit a snag. This is usually temporary — you can dismiss this and try again, or reset the chat to start fresh. Resetting will clear the current session but won't delete any of your saved work.",
  },
  manual: {
    title: "Reset Chat",
    description:
      "Starting fresh will clear your current conversation. Your saved work, brands, and campaigns won't be affected — only the chat history will be cleared.",
  },
} as const;

type StreamErrorDialogProps = {
  open: boolean;
  variant: "error" | "manual";
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
};

export const StreamErrorDialog = ({
  open,
  variant,
  onOpenChange,
  onReset,
}: StreamErrorDialogProps) => {
  const { title, description } = DIALOG_CONTENT[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>Reset Chat</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
