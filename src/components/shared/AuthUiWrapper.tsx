"use client";

import React from "react";

type AuthUiWrapperProps = {
  children: React.ReactNode;
};

const AuthUiWrapper = ({ children }: AuthUiWrapperProps) => {
  return (
    <div className="relative h-dvh w-dvw flex gap-4">
      <div className="w-0 lg:w-1/2 h-full">
        <div className="p-3 w-full h-full">
          <div className="w-full h-full bg-gradient-to-tl from-primary via-primary/50 to-primary/90 rounded-2xl"></div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 my-auto">{children}</div>
    </div>
  );
};

export default AuthUiWrapper;
