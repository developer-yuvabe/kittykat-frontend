import { useEffect } from "react";
import { useA2iStore } from "@/store/a2i.store";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

/**
 * Hook to manage CVG folder selection defaults based on edit context
 * 
 * Logic:
 * - New generation: Default to current campaign folder
 * - Edit flow: Default to source asset's folder
 * - Edit from KK folder (non-admin): Default to campaign folder
 */
export const useFolderSelectionDefaults = (
  sourceAssetFolderId?: string | null,
  isEditMode: boolean = false
) => {
  const { selectedFolderId, setSelectedFolderId } = useA2iStore();
  const { selectedCampaignId, campaigns } = useBrandStore();
  const { user } = useUserStore();

  const isCreativeAdmin = user?.role?.id === UserRoleId.KK_CREATIVE_USER;

  useEffect(() => {
    // Don't override if already set
    if (selectedFolderId) return;

    if (isEditMode && sourceAssetFolderId) {
      // Check if source folder is a KK folder
      const sourceFolder = campaigns.find((c) => c.id === sourceAssetFolderId);
      const isSourceKkFolder = sourceFolder?.is_kk_folder;

      if (isSourceKkFolder && !isCreativeAdmin) {
        // Non-admin editing from KK folder -> fallback to campaign
        if (selectedCampaignId) {
          setSelectedFolderId(selectedCampaignId);
        }
      } else {
        // Use source asset's folder
        setSelectedFolderId(sourceAssetFolderId);
      }
    } else if (selectedCampaignId) {
      // New generation -> use current campaign folder
      setSelectedFolderId(selectedCampaignId);
    }
  }, [
    selectedFolderId,
    sourceAssetFolderId,
    isEditMode,
    selectedCampaignId,
    campaigns,
    isCreativeAdmin,
    setSelectedFolderId,
  ]);

  return { selectedFolderId, setSelectedFolderId };
};
