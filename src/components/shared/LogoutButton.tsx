import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/logout");
    router.push("/login");
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-sm h-9 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-none"
      onClick={handleLogout}
    >
      <LogOut size={16} />
      <span>Log out</span>
    </Button>
  );
}
