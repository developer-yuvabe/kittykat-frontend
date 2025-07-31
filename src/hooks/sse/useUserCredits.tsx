import { getSSEBaseUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";

export const useUserCredits = (userId?: string) => {
  const { setCredits } = useUserStore();
  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/users/${userId}/credits`
    );

    eventSource.addEventListener("credits", (event) => {
      const { credits } = JSON.parse(event.data) as { credits: number };

      setCredits(credits);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };
  }, [userId]);

  return null;
};
