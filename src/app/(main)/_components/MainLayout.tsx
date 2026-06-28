"use client";

import Splash from "@/components/shared/Splash";
import { TopNavigation } from "@/components/shared/TopNavigation";
import { auth } from "@/config/firebase.config";
import { useUserBrands } from "@/hooks/sse/useUserBrands";
import { useUserCredits } from "@/hooks/sse/useUserCredits";
import { StreamProvider } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";
import { User } from "@/types/user.types";
import { User as FirebaeUser, signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useBrandUpdates } from "@/hooks/sse/useBrandUpdates";

const MainLayout = ({
  user: userProfile,
  children,
}: {
  children: React.ReactNode;
  user: User;
}) => {
  const { setUser } = useUserStore();
  const [firebaseUser, setFirebaseUser] = useState<FirebaeUser | null>(null);
  useUserBrands();
  useUserCredits();
  useBrandUpdates();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      const logout = async () => {
        await signOut(auth);
        await fetch("/api/logout");
        // reload the page to ensure the user is logged out
        window.location.href = "/login";
        window.location.reload();
      };

      if (!u) {
        logout();
      } else {
        setFirebaseUser(u);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setUser({
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      thread_id: userProfile.thread_id,
      role: userProfile.role,
      is_default_admin: userProfile.is_default_admin,
      user_preferences: userProfile.user_preferences,
      active_team_id: userProfile.active_team_id,
    });
  }, [userProfile]);

  if (!userProfile || !firebaseUser) {
    return <Splash />;
  }

  return (
    <StreamProvider>
      <main>
        <TopNavigation />
        {children}

        {/* Verify Email Modal */}
        {/* {!firebaseUser.emailVerified && (
          <VerifyEmailModal
            email={userProfile.email}
            setFirebaseUser={(u) => setFirebaseUser(u)}
          />
        )} */}
      </main>
    </StreamProvider>
  );
};

export default MainLayout;
