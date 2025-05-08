"use client";

import Splash from "@/components/shared/Splash";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  if (!user) {
    return <Splash />;
  }

  return <main>{children}</main>;
};

export default MainLayout;
