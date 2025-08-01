"use client";

import InsufficientCreditsModal from "@/components/shared/InsufficientCreditsModal";
import Splash from "@/components/shared/Splash";
import { TopNavigation } from "@/components/shared/TopNavigation";
import { useUserBrands } from "@/hooks/sse/useUserBrands";
import { useUserCredits } from "@/hooks/sse/useUserCredits";
import { useUserStore } from "@/store/user.store";
import { User } from "@/types/user.types";
import React, { useEffect } from "react";

const MainLayout = ({
  userInfo,
  children,
}: {
  children: React.ReactNode;
  userInfo: User;
}) => {
  const { setUser, user } = useUserStore();

  useEffect(() => {
    setUser({
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      thread_id: userInfo.thread_id,
      role: userInfo.role,
    });
  }, [userInfo]);

  useUserBrands(user?.id);
  useUserCredits(user?.id);

  if (!user) {
    return <Splash />;
  }

  return (
    <main>
      <TopNavigation />
      {children}
      <InsufficientCreditsModal />
    </main>
  );
};

export default MainLayout;
