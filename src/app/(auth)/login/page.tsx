import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import React from "react";
import LoginForm from "./_components/LoginForm";

const page = () => {
  return (
    <AuthUiWrapper>
      <LoginForm />
    </AuthUiWrapper>
  );
};

export default page;
