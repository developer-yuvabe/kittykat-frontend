// ============================================================================
// Drag Overlay Components
// ============================================================================

interface CampaignDragOverlayProps {
  campaignTitle: string;
}

export function CampaignDragOverlay({
  campaignTitle,
}: CampaignDragOverlayProps) {
  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg px-4 py-2 shadow-2xl">
      <span className="text-sm font-medium text-gray-900">{campaignTitle}</span>
    </div>
  );
}
