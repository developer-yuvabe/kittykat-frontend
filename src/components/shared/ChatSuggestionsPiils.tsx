import { Suggestion } from "@/types/util.types";
import React from "react";
import {
  CircleUserRound,
  GalleryHorizontal,
  Image,
  Layers,
  Megaphone,
  Palette,
  Play,
  Users,
  Wand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useThreadStore } from "@/store/thread.store";
import { useModelsStore } from "@/store/models.store";
import { auth } from "@/config/firebase.config";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";

export const SUGGESTIONS: Suggestion[] = [
  {
    title: "View brand",
    icon: Palette,
    prompt: "Show me an overview of my brand including tone and visuals.",
    redirectTo: {
      type: "brand",
    },
  },
  {
    title: "Create campaign",
    icon: Megaphone,
    prompt:
      "Create a new marketing campaign aligned with this brand’s goals and audience.",
    redirectTo: {
      type: "campaign",
    },
  },
  {
    title: "Create moodboard",
    icon: Layers,
    prompt:
      "Generate a visual moodboard that represents the brand’s style and identity.",
    redirectTo: {
      type: "moodboard",
    },
  },
  {
    title: "Generate image",
    icon: Image,
    prompt:
      "Generate high-quality brand visuals for marketing or social media.",
    redirectTo: {
      type: "a2i-input",
    },
  },
  {
    title: "Generate video",
    icon: Play,
    redirectTo: {
      type: "a2i-input",
    },
  },
  {
    title: "Edit image",
    icon: Wand,
    redirectTo: {
      type: "a2i-input",
    },
  },
  {
    title: "View gallery",
    icon: GalleryHorizontal,
    redirectTo: {
      type: "link",
      link: "/gallery",
    },
  },
  {
    title: "Discover your audience",
    icon: Users,
    prompt: "Analyze and discover potential audience segments for this brand.",
    redirectTo: {
      type: "brand",
      tab: "audience",
    },
  },
  {
    title: "Define your audience",
    icon: CircleUserRound,
    prompt: "Help me define a clear target audience persona for this brand.",
    redirectTo: {
      type: "brand",
      tab: "audience",
    },
  },
];

const ChatSuggestions = () => {
  const [, setScrollTo] = useQueryState("scrollTo");
  const [, setTab] = useQueryState("tab");
  const { user } = useUserStore();
  const router = useRouter();
  const { chatOnlyMode, setShowChatAssistant } = useThreadStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const stream = useStreamContext();

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    if (suggestion.redirectTo.type === "link") {
      router.push(suggestion.redirectTo.link!);
    } else if (suggestion.redirectTo.type === "a2i-input") {
      // Scroll to bottom of the page
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } else {
      setScrollTo(suggestion.redirectTo.type);
    }

    if (suggestion.redirectTo.tab) {
      setTab(suggestion.redirectTo.tab);
    }

    if (suggestion.prompt) {
      setShowChatAssistant(true);

      submitOptimisticMessage({
        stream,
        text: suggestion.prompt,
        userId: user!.id,
        chatOnlyMode,
        currentBrandContextId: null,
        currentCampaignId: null,
        currentMoodboardId: null,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        currentSelectedVideoGenerationModelId:
          selectedVideoGenearationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
        activeTeamId: user!.active_team_id!,
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-4 items-center justify-center lg:max-w-4xl">
      {SUGGESTIONS.map((suggestion) => (
        <Button
          onClick={() => handleSuggestionClick(suggestion)}
          key={suggestion.title}
          variant="outline"
          className="flex items-center gap-2 rounded-full h-10 px- bg-gray-100 hover:scale-110 transition-all hover:border-brand-secondary/60 hover:bg-brand-secondary/10 hover:text-brand-secondary  hover:shadow-xl hover:shadow-brand-secondary/20"
        >
          <div className="bg-brand-gradient rounded-full flex items-center justify-center p-1 text-white">
            <suggestion.icon />
          </div>
          <span className="font-normal text-sm">{suggestion.title}</span>
        </Button>
      ))}
    </div>
  );
};

export default ChatSuggestions;
