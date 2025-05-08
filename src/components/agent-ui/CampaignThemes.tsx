import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";

import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { CampaignTheme } from "@/types/langgraph.types";

export default function CampaignThemes(props: {
  themes: CampaignTheme[];
  productName: string;
  targetAudience: string;
  brandVoice: string;
  platforms: string[];
  toolCallId: string;
}) {
  const { themes, productName, toolCallId } = props;
  const [selectedThemes, setSelectedThemes] = useState<CampaignTheme[]>([]);

  const thread = useStreamContext<
    { messages: Message[] },
    { MetaType: { ui: any | undefined } }
  >();

  const handleThemeSelect = (theme: CampaignTheme) => {
    setSelectedThemes((prev) => {
      const isSelected = prev.some((t) => t.id === theme.id);
      return isSelected
        ? prev.filter((t) => t.id !== theme.id)
        : [...prev, theme];
    });
  };

  const handleConfirmSelection = () => {
    if (selectedThemes.length === 0) {
      alert("Please select at least one theme");
      return;
    }

    if (selectedThemes.length > 3) {
      alert("Please select at most 3 themes");
      return;
    }

    thread.submit(
      {},
      {
        command: {
          update: {
            messages: [
              {
                type: "tool",
                tool_call_id: toolCallId,
                id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
                name: "select-themes",
                content: JSON.stringify({
                  selectedThemes: selectedThemes, // full objects
                }),
              },
              {
                type: "human",
                content: `I've selected ${selectedThemes.length} theme(s) for my ${productName} campaign.`,
              },
            ],
          },
          goto: "campaignAgent",
        },
      }
    );
  };

  return (
    <div className="flex flex-col w-[345px] gap-4 p-4  overflow-hidden border border-gray-200 shadow-md rounded-xl">
      <h1 className="text-xl font-medium">Campaign Themes for {productName}</h1>
      <p className="mb-4 text-sm text-gray-600">
        Select up to 3 themes to develop further
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`p-4 border rounded-lg ${
              selectedThemes.some((t) => t.id === theme.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id={theme.id}
                checked={selectedThemes.some((t) => t.id === theme.id)}
                onCheckedChange={() => handleThemeSelect(theme)}
              />

              <div className="flex-1">
                <label
                  htmlFor={theme.id}
                  className="block font-medium cursor-pointer"
                >
                  {theme.title}
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  {theme.description}
                </p>

                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500">
                    Key Messages:
                  </p>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    {theme.keyMessages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-500">Channels:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {theme.marketingChannels.map((channel, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 rounded"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        className="w-full mt-4 text-white bg-blue-600 hover:bg-blue-700"
        onClick={handleConfirmSelection}
        disabled={selectedThemes.length === 0 || selectedThemes.length > 3}
      >
        Continue with {selectedThemes.length} selected theme
        {selectedThemes.length !== 1 ? "s" : ""}
      </Button>
    </div>
  );
}
