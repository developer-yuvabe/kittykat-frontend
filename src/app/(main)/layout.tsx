import { fetchUser } from "@/services/api/server/user.service";
import React from "react";
import MainLayout from "./_components/MainLayout";
import { redirect } from "next/navigation";
import Splash from "@/components/shared/Splash";

export const dynamic = "force-dynamic";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const { error, user } = await fetchUser();

  if (error) {
    return <Splash showRetry={true} />;
  }

  if (!user) {
    redirect("/unauthorized");
  }

  return <MainLayout user={user}>{children}</MainLayout>;
};

export default layout;
