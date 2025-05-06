import { AppConfig } from "@/config/app.config";
import { fetchUser } from "@/services/api/user.service";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const user = await fetchUser();

  if (!user || user.onboarding_completed) {
    redirect(AppConfig.HOME_ROUTE);
  }

  return (
    <div className="flex items-center justify-center h-screen">
      Onbaording Page
    </div>
  );
};

export default page;
