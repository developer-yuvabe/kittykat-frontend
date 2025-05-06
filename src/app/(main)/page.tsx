"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/config/firebase.config";
import { useUserStore } from "@/store/user.store";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const { user } = useUserStore();

  async function handleLogout() {
    await signOut(auth);

    await fetch("/api/logout");

    router.push("/login");
  }

  return (
    <div className="flex items-center justify-center h-dvh flex-col gap-4">
      {user?.email}
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
}
