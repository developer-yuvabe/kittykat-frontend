import { Button } from "@/components/ui/button";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";

import { toast } from "sonner";

import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { CampaignTheme, MoodBoardItem } from "@/types/langgraph.types";
import ZoomableImage from "../ui/zoomable-image";

export default function MoodBoards(props: {
  moodboards: MoodBoardItem[];
  toolCallId: string;
  selectedThemes: CampaignTheme[];
}) {
  const { toolCallId } = props;
  const { moodboards } = props;
  console.log("Moodboards", moodboards);

  const thread = useStreamContext<
    { messages: Message[] },
    { MetaType: { ui: any | undefined } }
  >();

  const handleGenerateMore = (selectedThemes: CampaignTheme[]) => {
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
                content: `I want to regenerate the mooboards for my selected themes for the  campaign.`,
              },
            ],
          },
          goto: "campaignAgent",
        },
      }
    );
  };

  // const handleContinue = () => {
  //   thread.submit(
  //     {},
  //     {
  //       command: {
  //         update: {
  //           messages: [
  //             {
  //               type: "tool",
  //               tool_call_id: toolCallId,
  //               id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
  //               name: "moodboards",
  //               content: JSON.stringify({ moodboards }),
  //             },
  //             {
  //               type: "human",
  //               content:
  //                 "I like these mood boards. Let's proceed with creating detailed campaign assets.",
  //             },
  //           ],
  //         },
  //         goto: "generalInput",
  //       },
  //     },
  //   );
  // };

  const handleContinue = () => {
    toast.success("Showboard generation started!");
  };
  return (
    <div className="flex flex-col  w-[345px]  gap-4 p-4 overflow-hidden border border-gray-200 shadow-md rounded-xl">
      <h1 className="text-xl font-medium">Campaign Mood Boards</h1>
      <p className="mb-4 text-sm text-gray-600">
        Visual inspiration for your selected campaign themes
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        {moodboards.map((moodboard, index) => (
          <div key={index} className="overflow-hidden border rounded-lg">
            {moodboard.imageUrl && (
              <ZoomableImage
                src={moodboard.imageUrl}
                alt={moodboard.theme_title}
                className="object-contain w-full cursor-pointer h-72"
              />
            )}
            <div className="p-4">
              <h3 className="text-lg font-medium">{moodboard.theme_title}</h3>
              <p className="mt-1 text-sm text-gray-600">
                {moodboard.theme_description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-4">
        <Button
          className="flex-1 text-gray-800 bg-gray-200 hover:bg-gray-300"
          onClick={() => handleGenerateMore(props.selectedThemes)}
        >
          Generate Variations
        </Button>
        {/* <Button
          className="flex-1 text-white bg-blue-600 hover:bg-blue-700"
          onClick={handleContinue}
        >
          Continue to Generate Showboard
        </Button> */}
      </div>
    </div>
  );
}
