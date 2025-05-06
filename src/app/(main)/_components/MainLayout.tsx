"use client";

import { useUserStore } from "@/store/user.store";
import { User } from "@/types/types";
import React, { useEffect } from "react";

const MainLayout = ({
  user,
  children,
}: {
  children: React.ReactNode;
  user: User;
}) => {
  const { setUser } = useUserStore();

  useEffect(() => {
    setUser(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return <main>{children}</main>;
};

export default MainLayout;
