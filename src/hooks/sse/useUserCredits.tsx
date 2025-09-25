import { getSSEBaseUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";

export const useUserCredits = () => {
  const { setCredits, user } = useUserStore();
  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/users/${user.id}/credits`
    );

    eventSource.addEventListener("credits", (event) => {
      const { credits } = JSON.parse(event.data) as { credits: number };

      setCredits(credits);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };
  }, [user]);

  return null;
};
