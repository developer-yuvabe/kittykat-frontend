"use client";

import Splash from "@/components/shared/Splash";
import { TopNavigation } from "@/components/shared/TopNavigation";
import { useUserBrands } from "@/hooks/sse/useUserBrands";
import { useBrandStore } from "@/store/brand.store";
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
  const { setBrands } = useBrandStore();

  useEffect(() => {
    const brands = userInfo.brand_access || [];

    setUser({
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      thread_id: userInfo.thread_id,
      role: userInfo.role,
    });
    setBrands(brands);
  }, [userInfo]);

  useUserBrands(user?.id);

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
