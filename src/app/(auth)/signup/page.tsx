import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import React from "react";
import SignUpForm from "./_components/SignUpForm";

const page = () => {
  return (
    <AuthUiWrapper>
      <SignUpForm />
    </AuthUiWrapper>
  );
};

export default page;
