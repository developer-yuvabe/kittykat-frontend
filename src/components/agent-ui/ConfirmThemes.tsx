import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";

import { useState } from "react";
import { toast } from "sonner";

import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { CampaignTheme } from "@/types/langgraph.types";

export function ConfirmThemeSelection({
  selectedThemes,
  toolCallId,
  productName,
}: {
  selectedThemes: CampaignTheme[];
  toolCallId: string;
  productName: string;
}) {
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const thread = useStreamContext<
    { messages: Message[] },
    { MetaType: { ui: any | undefined } }
  >();

  const handleConfirmSelection = () => {
    if (selectedThemes.length === 0) {
      setAlertMessage("Please select at least one theme.");
      toast.error("Please select at least one theme.");
      return;
    }

    if (selectedThemes.length > 3) {
      setAlertMessage("Please select at most 3 themes.");
      toast.error("Please select at most 3 themes.");
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
                content: JSON.stringify({ selectedThemes }),
              },
              {
                type: "human",
                content: `I confirm ${selectedThemes.length} theme(s) for my ${productName} campaign.`,
              },
            ],
          },
          goto: "campaignAgent",
        },
      }
    );

    toast.success("Themes successfully confirmed!");
  };

  const handleReiterateSelection: () => void = () => {
    toast("Please review your selections.");

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
                content: JSON.stringify({ selectedThemes }),
              },
              {
                type: "human",
                content: `I want to regenerate my selected themes for the ${productName} campaign.`,
              },
            ],
          },
          goto: "campaignAgent",
        },
      }
    );
  };

  return (
    <Card className="w-[345px] mx-auto border shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle>Confirm Theme Selection</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render selected theme names */}
        {selectedThemes.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              Selected Themes:
            </h4>
            <ul className="text-sm text-gray-800 list-disc list-inside">
              {selectedThemes.map((theme) => (
                <li key={theme.id}>{theme.title}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-4">
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600"
            onClick={handleReiterateSelection}
            disabled={selectedThemes.length === 0}
          >
            Regenerate Themes
          </Button>
          <Button
            className="w-full text-white bg-violet-700 hover:bg-violet-800"
            onClick={handleConfirmSelection}
            disabled={selectedThemes.length === 0 || selectedThemes.length > 3}
          >
            Confirm and continue with {selectedThemes.length} selected theme
            {selectedThemes.length !== 1 ? "s" : ""}
          </Button>
        </div>

        {showAlert && (
          <div className="p-4 text-yellow-800 bg-yellow-100 border border-yellow-300 rounded">
            {alertMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
