import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import React, { Suspense } from "react";
import LoginForm from "./_components/LoginForm";
import { Loader2 } from "lucide-react";

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const page = () => {
  return (
    <AuthUiWrapper>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthUiWrapper>
  );
};

export default page;
