import { MessagesAnnotation, Annotation } from "@langchain/langgraph";
import {
  RemoveUIMessage,
  UIMessage,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui/server";

export const GenerativeUIAnnotation = Annotation.Root({
  messages: MessagesAnnotation.spec["messages"],
  ui: Annotation<
    UIMessage[],
    UIMessage | RemoveUIMessage | (UIMessage | RemoveUIMessage)[]
  >({ default: () => [], reducer: uiMessageReducer }),
  timestamp: Annotation<number>,
  next: Annotation<"campaignAgent" | "generalInput">(),
});

export type GenerativeUIState = typeof GenerativeUIAnnotation.State;

export type MoodBoardItem = {
  theme_title: string;
  theme_description: string;
  prompts: string[];
  imageUrl?: string;
};

export type CampaignTheme = {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  marketingChannels: string[];
  keyMessages: string[];
};

export type CampaignInfo = {
  productName: string;
  features: string[];
  targetAudience: string;
  brandVoice: string;
  platforms: string[];
  timeline: string;
  successMetrics: string[];
};

export interface FontDetails {
  name: string;
  weights: string[];
}

export interface Color {
  name: string;
  hex: string;
}
