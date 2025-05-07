import Splash from "@/components/shared/Splash";
import { tokenConfig } from "@/config/firebase.config";
import { createUser, fetchUser } from "@/services/api/user.service";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import React from "react";
import MainLayout from "./_components/MainLayout";

const layout = async ({ children }: { children: React.ReactNode }) => {
  // Fetch user details
  let user = await fetchUser();

  // If user not found, create a new user
  if (!user) {
    const _cookies = await cookies();
    const token = await getTokens(_cookies, tokenConfig);

    user = await createUser({
      name: token?.decodedToken?.name || "",
      email: token?.decodedToken?.email || "",
      id: token?.decodedToken?.uid || "",
    });
  }

  if (!user) {
    return <Splash showRetry />;
  }

  return <MainLayout user={user}>{children}</MainLayout>;
};

export default layout;
