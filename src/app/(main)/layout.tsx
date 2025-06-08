import { fetchUser } from "@/services/api/server/user.service";
import React from "react";
import MainLayout from "./_components/MainLayout";
import { redirect } from "next/navigation";
import Splash from "@/components/shared/Splash";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const { error, user } = await fetchUser();

  if (error) {
    return <Splash showRetry={true} />;
  }

  if (!user) {
    /**
     * IMPORTANT:
     * The user has a valid Firebase account, but it's associated with a different platform
     * (we're using the same Firebase project across multiple platforms).
     * In this case, we need to:
     * 1. Log the user out.
     * 2. Redirect them to the unauthorized access page.
     */
    redirect("/unauthorized");
  }

  return <MainLayout userInfo={user}>{children}</MainLayout>;
};

export default layout;
