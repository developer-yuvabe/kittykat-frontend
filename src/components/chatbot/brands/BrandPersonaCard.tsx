import { BrandPersona } from "@/types/persona.types";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { useViewMore } from "./BrandPersonaCarousel";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { useModelsStore } from "@/store/models.store";
import { useThreadStore } from "@/store/thread.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { auth } from "@/config/firebase.config";
import { BrandPersonaImage } from "./BrandPersonaImage";
import { BrandPersonaActions } from "./BrandPersonaActions";
import { BrandPersonaHeader } from "./BrandPersonaHeader";
import { BrandPersonaIdentity } from "./BrandPersonaIdentity";
import { BrandPersonaDetails } from "./BrandPersonaDetails";
import { useDeletePersona } from "@/hooks/usePersona";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";

interface BrandPersonaCardProps {
  persona: BrandPersona;
  onEdit?: (persona: BrandPersona) => void;
  onDuplicate?: (persona: BrandPersona) => void;
  onDelete?: (personaId: string) => void;
  brandId: string;
}

function BrandPersonaCard({
  persona,
  onEdit,
  onDuplicate,
  onDelete,
  brandId,
}: BrandPersonaCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { pinnedItem, addPinnedItem, removePinnedItem } =
    usePinnedContextStore();
  const { viewMore, setViewMore } = useViewMore();
  const { selectedCampaignId, selectedMoodboardId } = useBrandStore();
  const { user } = useUserStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const { chatOnlyMode } = useThreadStore();
  const stream = useStreamContext();
  const { mutate: deletePersona, isPending: isDeleting } = useDeletePersona();

  const hasAdditionalDetails = Boolean(
    (persona.psychographics && persona.psychographics.length > 0) ||
      (persona.pain_points && persona.pain_points.length > 0) ||
      (persona.style_preferences && persona.style_preferences.length > 0) ||
      (persona.visual_direction && persona.visual_direction.length > 0) ||
      (persona.messaging_angles && persona.messaging_angles.length > 0) ||
      (persona.do_guidelines && persona.do_guidelines.length > 0) ||
      (persona.dont_guidelines && persona.dont_guidelines.length > 0)
  );

  const isPinned =
    typeof pinnedItem?.context.data === "object" &&
    pinnedItem?.context.data?.brand_persona_id === persona.id &&
    pinnedItem?.context.data?.brand_id === brandId;

  const handleCopyContext = () => {
    const formatList = (items?: string[]) =>
      items?.map((p) => `• ${p}`).join("\n") || "N/A";

    const contextText = `**${persona.name}**
${persona.summary || ""}

**Identity Snapshot:**
- Age: ${persona.age_range || "N/A"}
- Gender: ${persona.gender || "N/A"}
- Location: ${persona.location_focus || "N/A"}
- Geography: ${persona.target_geography || "N/A"}
- Life Stage: ${persona.life_stage || "N/A"}
- Composition: ${persona.composition_mode || "N/A"}

**Psychographics:**
${formatList(persona.psychographics)}

**Pain Points:**
${formatList(persona.pain_points)}

**Style Preferences:**
${formatList(persona.style_preferences)}

**Visual Direction:**
${formatList(persona.visual_direction)}

**Messaging Angles:**
${formatList(persona.messaging_angles)}

**Do's:**
${formatList(persona.do_guidelines)}

**Don'ts:**
${formatList(persona.dont_guidelines)}`.trim();

    navigator.clipboard.writeText(contextText);
    toast.success("Persona context copied to clipboard");
  };

  const handlePin = () => {
    if (isPinned) {
      removePinnedItem();
      toast.success("Persona unpinned");
    } else {
      addPinnedItem({
        title: persona.name,
        context: {
          data: {
            brand_id: brandId,
            brand_persona_id: persona.id,
          },
        },
      });
      toast.success(`${persona.name} pinned for chat context`);
    }
  };

  const handleChat = async () => {
    if (!user) {
      toast.error("Please sign in to chat with this persona.");
      return;
    }

    const prompt = `Generate a concise, high-quality creative prompt suitable for image generation, ensuring it is fully aligned with the provided brand persona. <kittykat-do-not-render>
  PersonaContext:
  . Focus on tone, messaging angles, visual direction, and do/don'ts.
  ${JSON.stringify(persona, null, 2)}
  </kittykat-do-not-render>`;

    try {
      submitOptimisticMessage({
        stream,
        text: prompt,
        userId: user.id,
        chatOnlyMode,
        currentBrandContextId: brandId,
        currentCampaignId: selectedCampaignId,
        currentMoodboardId: selectedMoodboardId,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        currentSelectedVideoGenerationModelId:
          selectedVideoGenearationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
        activeTeamId: user.active_team_id!,
      });
      toast.success("Sent persona context to chat");
    } catch (err) {
      console.error("Failed to send persona prompt", err);
      toast.error("Could not start chat for this persona");
    }
  };

  const handleDeleteConfirm = () => {
    deletePersona(
      {
        brandId,
        personaId: persona.id,
      },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onDelete?.(persona.id);
          toast.success(`${persona.name} deleted successfully`);
        },
        onError: (error) => {
          toast.error(
            `Failed to delete persona: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        },
      }
    );
  };

  return (
    <Card className="relative overflow-hidden w-full h-[870px] flex flex-col">
      {/* Image Section */}
      <div className="relative">
        <BrandPersonaImage
          imageUrl={persona.image_url}
          name={persona.name}
          isGenerating={persona.image_generation_in_progress ?? false}
        />

        {/* Pin Indicator */}
        {isPinned && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium shadow-lg">
            <Pin className="w-3 h-3 fill-current" />
            Pinned
          </div>
        )}

        {/* Actions - Pin, Chat, and More */}
        <BrandPersonaActions
          isPinned={isPinned}
          onPin={handlePin}
          onChat={handleChat}
          onEdit={() => onEdit?.(persona)}
          onDuplicate={() => onDuplicate?.(persona)}
          onCopyContext={handleCopyContext}
          onDelete={() => setDeleteDialogOpen(true)}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ReusableAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Persona"
        description={`Are you sure you want to delete "${persona.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        danger
      />

      {/* Header */}
      <BrandPersonaHeader name={persona.name} summary={persona.summary} />

      {/* Content - Scrollable */}
      <CardContent className="space-y-4 pt-1 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
        {/* Identity Section - Always Visible */}
        <BrandPersonaIdentity
          ageRange={persona.age_range}
          gender={persona.gender}
          locationFocus={persona.location_focus}
          targetGeography={persona.target_geography}
          lifeStage={persona.life_stage}
          compositionMode={persona.composition_mode}
        />

        {/* Additional Details - Shown when viewMore is true */}
        {viewMore && hasAdditionalDetails && (
          <BrandPersonaDetails
            psychographics={persona.psychographics}
            painPoints={persona.pain_points}
            stylePreferences={persona.style_preferences}
            visualDirection={persona.visual_direction}
            messagingAngles={persona.messaging_angles}
            doGuidelines={persona.do_guidelines}
            dontGuidelines={persona.dont_guidelines}
          />
        )}
      </CardContent>

      {/* View More/Less Button - Fixed at bottom */}
      {hasAdditionalDetails && (
        <div className="px-4  pt-2 border-t flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMore(!viewMore)}
            className="w-full text-primary hover:bg-primary/10"
          >
            {viewMore ? "View Less" : "View More"}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default BrandPersonaCard;
