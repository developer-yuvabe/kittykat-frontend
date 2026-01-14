import React, { useMemo, useState } from "react";
import ChatSuggestionPills from "../../../components/shared/ChatSuggestionsPiils";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/store/brand.store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import BrandSelector from "@/components/chatbot/brands/BrandSelector";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/motion.utils";
import { useQueryState } from "nuqs";
import { useUserStore } from "@/store/user.store";
import { useThreadStore } from "@/store/thread.store";
import { useModelsStore } from "@/store/models.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { auth } from "@/config/firebase.config";

const HeroSection = () => {
  const [, setScrollTo] = useQueryState("scrollTo");
  const [userPrompt, setUserPrompt] = useState("");
  const { user } = useUserStore();
  const { chatOnlyMode, setShowChatAssistant } = useThreadStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const stream = useStreamContext();

  const { selectedBrandId, isBrandsFetched, brands } = useBrandStore();
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  const brandName = useMemo(() => {
    const brand = brands.find((b) => b.id === selectedBrandId);
    return brand ? brand.name : "your brand";
  }, [brands, selectedBrandId]);

  const handleUserPromptSend = async () => {
    setShowChatAssistant(true);
    submitOptimisticMessage({
      stream,
      text: userPrompt.trim(),
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

    setUserPrompt("");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-[calc(100vh-6rem)] flex flex-col gap-y-12 justify-center items-center relative container mx-auto"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-y-4 items-center justify-center max-w-6xl"
      >
        <h1 className="text-lg lg:text-[4rem] font-bold text-center leading-none">
          How can <span className="text-brand-gradient">KittyKat</span> help you
          with{" "}
          <HoverCard
            openDelay={0}
            open={showBrandSelector}
            onOpenChange={setShowBrandSelector}
          >
            <HoverCardTrigger
              onClick={(e) => {
                e.stopPropagation();
                setShowBrandSelector(!showBrandSelector);
              }}
            >
              {isBrandsFetched ? (
                <>
                  <span className="text-brand-gradient underline decoration-brand-secondary/60 decoration-2 underline-offset-12 cursor-pointer inline-block break-after-all">
                    {brandName}
                  </span>{" "}
                </>
              ) : (
                <Skeleton className="inline-block w-48 h-12 rounded-md -mb-3" />
              )}
            </HoverCardTrigger>
            <HoverCardContent
              className="p-0 overflow-y-auto scrollbar"
              side="bottom"
            >
              <BrandSelector
                onBrandSelect={() => {
                  setShowBrandSelector(false);
                }}
                showBrandsAsList
              />
            </HoverCardContent>
          </HoverCard>
          today?
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Describe your vision and let us bring it to life
        </motion.p>
      </motion.div>
      <motion.div
        variants={itemVariants}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="w-full lg:max-w-4xl relative flex items-end border-2 border-border rounded-2xl p-4 shadow-lg shadow-primary/20 transition-all focus-within:border-brand-secondary/80 focus-within:shadow-xl focus-within:shadow-brand-secondary/20"
      >
        <Textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Describe your ad creative..."
          rows={2}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.metaKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (userPrompt.trim()) {
                handleUserPromptSend();
              }
            }
          }}
          className="flex-1 text-foreground placeholder:text-muted-foreground resize-none text-[18px]! leading-relaxed pr-14 shadow-none focus:ring-0 border-0 p-0 focus:outline-none h-28 outline-none ring-0 focus-visible:ring-0 text-xl "
        />
        <Button
          onClick={handleUserPromptSend}
          disabled={!userPrompt.trim()}
          className="absolute right-2 bottom-2 w-11 h-11 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all hover:scale-105 active:scale-95"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </Button>
      </motion.div>
      <ChatSuggestionPills />
      <ChevronDown
        onClick={() => setScrollTo("brand")}
        className="cursor-pointer absolute bottom-4 animate-bounce text-muted-foreground w-6 h-6"
      />
    </motion.div>
  );
};

export default HeroSection;
