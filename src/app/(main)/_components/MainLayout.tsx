"use client";

import Splash from "@/components/shared/Splash";
import { TopNavigation } from "@/components/shared/TopNavigation";
import { useUserStore } from "@/store/user.store";
import { User } from "@/types/types";
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
    setUser(userInfo);
  }, [userInfo]);

  if (!user) {
    return <Splash />;
  }

  return (
    <main>
      <TopNavigation />
      {children}
    </main>
  );
};

export default MainLayout;
