import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ToolMessage } from "@langchain/langgraph-sdk";
import BrandSelector, { renderBrandData } from "./BrandSection";
import { useThreads } from "@/providers/langgraph/Thread";
import { CardSkeleton } from "../thread/messages/message-skeleton";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { CampaignSection } from "./CampaignSection";
interface ToolResultsPanelProps {
  isLargeScreen: boolean;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean) => void;
  toolMessages: ToolMessage[];
  threadId: string | null;
  setThreadId: (id: string | null) => void;
}

const BrandSection: React.FC<{
  brandingInformation: any;
  setThreadId: (id: string | null) => void;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  clearPinnedItems: () => void;
}> = ({
  brandingInformation,
  setThreadId,
  expandedSections,
  setExpandedSections,
  clearPinnedItems,
}) => {
  if (!brandingInformation)
    return (
      <div className="p-4">
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">
              <div className="flex justify-between">
                <div>No brand found</div>
                <BrandSelector setThreadId={setThreadId} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No brand information is currently available. Start chatting with
              the{" "}
              <span className="font-semibold text-primary">Kittykat agent</span>{" "}
              to onboard your brand.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <div key={`brand-message-${brandingInformation?.static?.name}`}>
        {renderBrandData(
          expandedSections,
          (section) =>
            setExpandedSections((prev) => ({
              ...prev,
              [section]: !prev[section],
            })),
          setThreadId,
          brandingInformation.static,
          brandingInformation.dynamic,
          clearPinnedItems
        )}
      </div>
    </div>
  );
};

const ToolResultsPanel: React.FC<ToolResultsPanelProps> = ({
  isLargeScreen,
  chatHistoryOpen,
  setChatHistoryOpen,
  toolMessages,
  setThreadId,
  threadId,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: boolean;
  }>({ brandOverview: true });
  const { threadsLoading, updateThreadName } = useThreads();
  const { clearPinnedItems } = usePinnedContextStore();
  const stream = useStreamContext();

  const brandingInformation =
    stream?.values?.sources?.brandingInformation ?? null;
  const campaignInfo = stream?.values?.sources?.campaignInformation ?? [
    {
      id: 1,
      name: "Urban Drops",
      concept: "Own the Pavement — Nike Urban Run Drop",
      tagline:
        "Whether it’s sunrise sprints or midnight miles, Nike’s latest gear helps you own every street, every step, every moment.",
      attributes: ["Driven", "Unapologetic", "Sleek", "Grounded", "Electric"],
      targetAudience:
        "Urban athletes aged 18-35, style-conscious and performance-driven. Active on TikTok, Strava, and Instagram. Prioritize aesthetics and gear that matches both form and function — train hard, flex harder.",
      visualStyleReferences: [
        "Nike Tokyo Street Run campaign",
        "Concrete jungle fashion editorials (e.g., Kith, Hypebeast)",
        "Fast & Furious night-race sequences",
      ],
      campaignColors: ["#000000", "#FFFFFF", "#FF0000", "#555555", "#00FFFF"],
      moodboards: [
        {
          prompt: "Cozy autumn vibes with warm colors and natural textures",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaade569a92015ba0fb28/v1",
        },
        {
          prompt: "Modern minimalism with sharp lines and neutral tones",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaad3569a92015ba0fb27/v1",
        },
        {
          prompt: "Vibrant urban street style with bold colors and textures",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaae3569a92015ba0fb29/v1",
        },
        {
          prompt: "Serene beachside retreat with soft blues and sandy tones",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaaf0569a92015ba0fb2a/v1",
        },
      ],
    },
    {
      id: 2,
      name: "City Strides",
      concept: "Conquer the Concrete — Nike City Strides",
      tagline: "Own the streets, push the limits, redefine the run.",
      attributes: ["Bold", "Unstoppable", "Vibrant", "Urban", "Dynamic"],
      targetAudience:
        "Energetic urban runners, thrill-seekers, and trendsetters. Driven by performance and style. Connected through social fitness apps and street culture.",
      visualStyleReferences: [
        "New York Marathon night runs",
        "Streetwear collaborations (e.g., Supreme, Off-White)",
        "Fast-paced action shots and city nightscapes",
      ],
      campaignColors: ["#000000", "#FFFFFF", "#FF0000", "#555555", "#00FFFF"],
      moodboards: [
        {
          prompt: "Cozy autumn vibes with warm colors and natural textures",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaade569a92015ba0fb28/v1",
        },
        {
          prompt: "Modern minimalism with sharp lines and neutral tones",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaad3569a92015ba0fb27/v1",
        },
        {
          prompt: "Vibrant urban street style with bold colors and textures",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaae3569a92015ba0fb29/v1",
        },
        {
          prompt: "Serene beachside retreat with soft blues and sandy tones",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaaf0569a92015ba0fb2a/v1",
        },
      ],
    },
    {
      id: 3,
      name: "Neon Miles",
      concept: "Light Up the Night — Nike Neon Miles",
      tagline: "Step out, stand out, shine bright. Run the night.",
      attributes: [
        "Electrifying",
        "Fearless",
        "High-Energy",
        "Bold",
        "Futuristic",
      ],
      targetAudience:
        "Night runners, tech enthusiasts, and high-energy athletes who live for the spotlight. Connected on social media and fitness platforms.",
      visualStyleReferences: [
        "Tokyo's neon-lit streets",
        "Futuristic cityscapes and high-contrast visuals",
        "Hyper-realistic running shots with intense color saturation",
      ],
      campaignColors: ["#000000", "#FFFFFF", "#FF0000", "#555555", "#00FFFF"],
      moodboards: [
        {
          prompt: "Cozy autumn vibes with warm colors and natural textures",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaade569a92015ba0fb28/v1",
        },
        {
          prompt: "Modern minimalism with sharp lines and neutral tones",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaad3569a92015ba0fb27/v1",
        },
        {
          prompt: "Vibrant urban street style with bold colors and textures",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaae3569a92015ba0fb29/v1",
        },
        {
          prompt: "Serene beachside retreat with soft blues and sandy tones",
          status: "success",
          url: "https://storage.googleapis.com/platform-thumb-img-assets/prod/67efaaafa03f69b2df549b58/67efaaf0569a92015ba0fb2a/v1",
        },
      ],
    },
  ];

  useEffect(() => {
    if (brandingInformation?.static?.brand?.name && threadId) {
      updateThreadName(threadId, brandingInformation?.static?.brand.name);
    }
  }, [brandingInformation, threadId]);

  return (
    <div
      className={`w-2/3 rounded-2xl mx-4 bg-[#f3f4f6] p-8 flex flex-col overflow-auto scrollbar ${
        !isLargeScreen ? "hidden md:flex" : ""
      }`}
    >
      <div className="flex-1">
        {threadsLoading ? (
          <CardSkeleton />
        ) : (
          <>
            <BrandSection
              brandingInformation={brandingInformation}
              setThreadId={setThreadId}
              expandedSections={expandedSections}
              setExpandedSections={setExpandedSections}
              clearPinnedItems={clearPinnedItems}
            />
            {brandingInformation && (
              <CampaignSection
                campaignInfo={campaignInfo}
                setThreadId={setThreadId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ToolResultsPanel;
