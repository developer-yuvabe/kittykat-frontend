import { Campaign } from "@/types/gallery.types";
import { Calendar, ChevronDown, Folder } from "lucide-react";

// Campaign Card Component
export const CampaignCard = ({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (campaignId: string) => void;
}) => {
  return (
    <div
      onClick={() => onSelect(campaign.id)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <Folder className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700">
            {campaign.title}
          </h3>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Campaign</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors rotate-[-90deg]" />
        </div>
      </div>
    </div>
  );
};
