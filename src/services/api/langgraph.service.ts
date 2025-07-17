import { StreamContextType } from "@/providers/langgraph/Stream";
import { Message } from "@langchain/langgraph-sdk";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const updateShowboardConfig = async (
  imagesPerTheme: number,
  model: string,
  textModel: string
) => {
  try {
    const response = await axios.post(
      "https://platform-backend-api-dev-547175224231.us-central1.run.app/update-showboard-config",
      {
        no_of_images_per_theme: imagesPerTheme,
        model: model,
        text_model: textModel,
      }
    );
  } catch (error) {
    console.error("Error updating showboard config:", error);
  }
};

export const getShowboardConfig = async () => {
  try {
    const response = await axios.get(
      "https://platform-backend-api-dev-547175224231.us-central1.run.app/get-showboard-config"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching showboard config:", error);
    throw error; // optional: rethrow if you want caller to handle it
  }
};

type SubmitOptions = {
  stream: StreamContextType;
  text: string;
  userId: string;
  currentBrandContextId: string | null;
};

export function submitOptimisticMessage({
  stream,
  text,
  userId,
  currentBrandContextId,
}: SubmitOptions) {
  const newMessage: Message = {
    id: uuidv4(),
    type: "human",
    content: [
      {
        type: "text",
        text,
      },
    ],
  };

  stream.submit(
    {
      messages: [newMessage],
      userId,
      currentBrandContextId,
    },
    {
      streamMode: ["values"],
      optimisticValues: (prev: any) => ({
        ...prev,
        messages: [...(prev.messages ?? []), newMessage],
      }),
    }
  );
}
