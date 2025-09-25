import React, { Suspense } from "react";
import VerifyEmail from "./_components/VerifyEmail";

const page = () => {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
};

export default page;
