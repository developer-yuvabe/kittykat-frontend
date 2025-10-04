"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import { toast } from "sonner";
import { sendEmailVerificationLink } from "@/services/api/user.service";
import { Mail } from "lucide-react";
import { reload, User } from "firebase/auth";
import { auth } from "@/config/firebase.config";

const VerifyEmailModal = ({
  email,
  setFirebaseUser,
}: {
  email: string;
  setFirebaseUser: (user: User) => void;
}) => {
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSendEmailVerification = async () => {
    try {
      setIsSending(true);
      await sendEmailVerificationLink(email);
      toast.success("Verification email sent. Please check your inbox.");
      setCooldown(60); // start 1-minute cooldown
    } catch (error) {
      console.error("Error resending email verification link:", error);
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    const handleFocus = async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        setFirebaseUser({ ...auth.currentUser! });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <Dialog open={true} modal>
      <DialogContent
        hideCloseIcon
        className="min-w-3xl min-h-[40vh] rounded-2xl py-10 flex flex-col items-center justify-center gap-y-4"
      >
        <Logo />
        <DialogTitle className="text-2xl text-center">
          Please verify your email to continue
        </DialogTitle>
        <DialogDescription className="text-center text-black/70 max-w-md">
          We need to verify your email address{" "}
          <span className="font-bold">{email}</span>. Please click the button
          below to receive a verification link.
        </DialogDescription>

        <div className="flex flex-col gap-4 w-full justify-center items-center">
          <Button
            variant={cooldown > 0 || isSending ? "outline" : "default"}
            onClick={handleSendEmailVerification}
            disabled={isSending || cooldown > 0}
            className="w-full max-w-xs"
          >
            {isSending ? (
              "Sending..."
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                Send Verification Email
                <Mail />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyEmailModal;
