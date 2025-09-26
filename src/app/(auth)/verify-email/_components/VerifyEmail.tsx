"use client";

import { useEffect, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { auth } from "@/config/firebase.config";
import { Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      toast.error("Invalid verification link.");
      setLoading(false);
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        toast.success("Email verified successfully!", {
          id: "email-verified",
          description: "This window will close automatically.",
          position: "top-center",
          duration: 4000,
        });

        setTimeout(() => {
          window.close();
        }, 3000);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to verify email.", {
          id: "email-verify-failed",
          description: "The verification link may be invalid or expired.",
          position: "top-center",
          duration: Infinity,
        });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading)
    return (
      <div className="min-h-screen min-w-screen flex justify-center items-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  return null;
};

export default VerifyEmail;
