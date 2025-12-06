import { getSSEBaseUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";
import { refetchTeamData } from "../useTeams";

export const useUserCredits = () => {
  const { setCredits, setKittykatExpertCredits, user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    // Always use the team SSE flow (expected that active_team_id is present).
    const activeTeamId = user.active_team_id;
    if (!activeTeamId) {
      console.warn("Active team id missing; skipping team SSE subscription.");
      return;
    }

    const url = `${getSSEBaseUrl()}/teams/${activeTeamId}/credits`;
    const eventSource = new EventSource(url);

    const teamListener = (event: MessageEvent) => {
      try {
        const { credits: teamCredits, tokens } = JSON.parse(event.data) as {
          credits: number;
          tokens: number;
        };

        setCredits(tokens);
        setKittykatExpertCredits(teamCredits);

        refetchTeamData(activeTeamId);
      } catch (err) {
        console.error("Error parsing team credits SSE event:", err);
      }
    };

    // Always listen for team_credits events
    eventSource.addEventListener("team_credits", teamListener);

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  return null;
};
