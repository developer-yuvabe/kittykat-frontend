import { ContentSection } from "@/components/shared/ContentSection";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import {
  filterAndNormalizeColors,
  getFontColorForBackground,
} from "@/lib/langgraph.utils";
import { Color } from "@/types/langgraph.types";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface BrandTargetAudienceProps {
  targetAudience: string | null | undefined;
}

export const BrandTargetAudience: React.FC<BrandTargetAudienceProps> = ({
  targetAudience,
}) => {
  if (!targetAudience) return null;

  return (
    <ContentSection
      title="Target Audience"
      content={
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{targetAudience}</span>
        </div>
      }
      context={{ targetAudience }}
    />
  );
};
