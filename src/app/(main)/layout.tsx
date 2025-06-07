import Splash from "@/components/shared/Splash";
import { tokenConfig } from "@/config/firebase.config";
import { createUser, fetchUser } from "@/services/api/server/user.service";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import React from "react";
import MainLayout from "./_components/MainLayout";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const _cookies = await cookies();
  const token = await getTokens(_cookies, tokenConfig);

  if (!token?.decodedToken?.uid) {
    return <Splash showRetry />;
  }

  let user = await fetchUser();

  if (!user) {
    // If user does not exist, create a new user
    user = await createUser({
      id: token.decodedToken.uid,
      name: token.decodedToken.name || "",
      email: token.decodedToken.email || "",
    });
  }

  if (!user) {
    return <Splash showRetry />;
  }

  return <MainLayout userInfo={user}>{children}</MainLayout>;
};

export default layout;
