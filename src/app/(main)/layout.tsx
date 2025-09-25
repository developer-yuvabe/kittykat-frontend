import { fetchUser } from "@/services/api/server/user.service";
import React from "react";
import MainLayout from "./_components/MainLayout";
import { redirect } from "next/navigation";
import Splash from "@/components/shared/Splash";
import { getServerSideToken } from "@/config/axios/api-server.config";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const { error, user } = await fetchUser();
  const tokens = await getServerSideToken();

  if (error || !tokens) {
    return <Splash showRetry={true} />;
  }

  if (!user) {
    redirect("/unauthorized");
  }

  return (
    <MainLayout user={user} session={tokens.decodedToken}>
      {children}
    </MainLayout>
  );
};

export default layout;
