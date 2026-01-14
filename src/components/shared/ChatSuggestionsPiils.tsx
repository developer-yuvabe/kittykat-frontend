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
  RefreshCcw,
  Sparkles,
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

export const SUGGESTIONS: Suggestion[] = [
  {
    title: "View brand",
    icon: Palette,
    prompt:
      "Show me an overview of this brand including tone, visuals, and positioning.",
    redirectTo: "brand",
  },
  {
    title: "Create campaign",
    icon: Megaphone,
    prompt:
      "Create a new marketing campaign aligned with this brand’s goals and audience.",
    redirectTo: "campaign",
  },
  {
    title: "Create moodboard",
    icon: Layers,
    prompt:
      "Generate a visual moodboard that represents the brand’s style and identity.",
    redirectTo: "moodboard",
  },
  {
    title: "Generate image",
    icon: Image,
    prompt:
      "Generate high-quality brand visuals for marketing or social media.",
    redirectTo: "concept_visual_generator",
  },
  {
    title: "Generate video",
    icon: Play,
    prompt: "Create a short promotional video concept for this brand.",
    redirectTo: "concept_visual_generator",
  },
  {
    title: "Edit video",
    icon: RefreshCcw,
    prompt: "Modify or enhance an existing video using brand guidelines.",
    redirectTo: "concept_visual_generator",
  },
  {
    title: "Edit image",
    icon: Wand,
    prompt: "Edit an existing image to better match the brand’s look and feel.",
    redirectTo: "concept_visual_generator",
  },
  {
    title: "View gallery",
    icon: GalleryHorizontal,
    prompt: "Show me a gallery of brand assets.",
    redirectTo: "concept_visual_generator",
  },
  {
    title: "Get ideas",
    icon: Sparkles,
    prompt: "Give me creative ideas for campaigns, visuals, or content.",
    redirectTo: "campaign",
  },
  {
    title: "Discover your audience",
    icon: Users,
    prompt: "Analyze and discover potential audience segments for this brand.",
    redirectTo: "brand",
  },
  {
    title: "Define your audience",
    icon: CircleUserRound,
    prompt: "Help me define a clear target audience persona for this brand.",
    redirectTo: "brand",
  },
];

const ChatSuggestions = () => {
  const [, setScrollTo] = useQueryState("scrollTo");
  const { user } = useUserStore();
  const { chatOnlyMode, setShowChatAssistant } = useThreadStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const stream = useStreamContext();

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setShowChatAssistant(true);
    setScrollTo(suggestion.redirectTo);
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
