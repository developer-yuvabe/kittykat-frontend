import { getSSEBaseUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";

export const useUserCredits = () => {
  const { setCredits, setKittykatExpertCredits, user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(
      `${getSSEBaseUrl()}/users/${user.id}/credits`
    );

    eventSource.addEventListener("credits", (event) => {
      const { credits, kittykat_expert_credits } = JSON.parse(event.data) as {
        credits: number;
        kittykat_expert_credits: number;
      };

      setCredits(credits);
      setKittykatExpertCredits(kittykat_expert_credits);
    });

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  return null;
};
